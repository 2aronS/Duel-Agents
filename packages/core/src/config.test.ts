import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateApiKey,
  requireApiKey,
  buildOpenClawPatch,
  deepMerge,
  getProxyUrl,
  getEnvForTarget,
  checkConnectivity,
} from "./config.js";
import {
  mergeEnvFile,
  patchOpenClawConfig,
  scanEnvConflicts,
  resolveOpenClawConfigPath,
} from "./index.js";
import { mkdtemp, readFile, access, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import JSON5 from "json5";

describe("validateApiKey", () => {
  it("accepts valid duel keys", () => {
    assert.equal(
      validateApiKey("duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3"),
      true,
    );
  });

  it("rejects invalid shapes", () => {
    assert.equal(validateApiKey(""), false);
    assert.equal(validateApiKey("sk-ant-xxx"), false);
    assert.equal(validateApiKey("duel_short_bad"), false);
  });
});

describe("requireApiKey", () => {
  it("throws on invalid key", () => {
    assert.throws(() => requireApiKey("bad"), /Invalid or missing/);
  });
});

describe("buildOpenClawPatch", () => {
  it("includes duel provider", () => {
    const key = "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3";
    const patch = buildOpenClawPatch(key);
    const models = patch.models as Record<string, unknown>;
    const providers = (models.providers ?? {}) as Record<string, unknown>;
    assert.ok(providers.duel);
  });

  it("does not embed raw api key in openclaw.json env block", () => {
    const key = "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3";
    const patch = buildOpenClawPatch(key);
    const env = patch.env as Record<string, string>;
    assert.equal(env.DUEL_API_KEY, undefined);
    assert.match(env.DUEL_PROXY_URL, /duelagents\.com/);
  });
});

describe("deepMerge", () => {
  it("merges nested objects", () => {
    const out = deepMerge(
      { agents: { defaults: { model: { primary: "openai/gpt" } } } },
      { agents: { defaults: { models: { "duel/duel-auto": { alias: "Duel" } } } } },
    );
    assert.equal(
      (out.agents as Record<string, unknown>).defaults &&
        typeof (out.agents as Record<string, unknown>).defaults === "object"
        ? ((out.agents as Record<string, Record<string, unknown>>).defaults
            .model as Record<string, string>).primary
        : null,
      "openai/gpt",
    );
  });
});

describe("mergeEnvFile", () => {
  it("updates existing keys", async () => {
    const dir = await mkdtemp(join(tmpdir(), "duel-env-"));
    const path = join(dir, ".env");
    await mergeEnvFile(path, { DUEL_API_KEY: "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3" });
    await mergeEnvFile(path, { DUEL_API_KEY: "duel_b2c3d4e5_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V4" });
    const body = await readFile(path, "utf8");
    assert.match(body, /DUEL_API_KEY=duel_b2c3d4e5_/);
    assert.equal(body.match(/DUEL_API_KEY=/g)?.length, 1);
  });

  it("replaces export-prefixed keys", async () => {
    const dir = await mkdtemp(join(tmpdir(), "duel-env-"));
    const path = join(dir, ".env");
    await writeFile(path, "export OPENAI_API_KEY=sk-old\n", "utf8");
    await mergeEnvFile(path, {
      OPENAI_API_KEY: "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3",
    });
    const body = await readFile(path, "utf8");
    assert.match(body, /OPENAI_API_KEY=duel_a1b2c3d4_/);
    assert.equal(body.includes("sk-old"), false);
  });
});

describe("scanEnvConflicts", () => {
  it("warns when replacing non-duel provider keys", () => {
    const warnings = scanEnvConflicts(
      "OPENAI_API_KEY=sk-real-openai-key\n",
      { OPENAI_API_KEY: "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3" },
    );
    assert.equal(warnings.length, 1);
  });
});

describe("patchOpenClawConfig", () => {
  it("writes duel provider block", async () => {
    const dir = await mkdtemp(join(tmpdir(), "duel-openclaw-"));
    const path = join(dir, "openclaw.json");
    const key = "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3";

    await patchOpenClawConfig(path, key);
    await patchOpenClawConfig(path, key);

    const body = await readFile(path, "utf8");
    assert.match(body, /duel-auto/);
    assert.match(body, /duelagents\.com\/v1/);
    assert.equal(body.includes(key), false);

    await access(`${path}.bak`);
  });

  it("preserves existing default model on re-install", async () => {
    const dir = await mkdtemp(join(tmpdir(), "duel-openclaw-"));
    const path = join(dir, "openclaw.json");
    const key = "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3";

    await writeFile(
      path,
      JSON.stringify({
        agents: { defaults: { model: { primary: "openai/gpt-4o" } } },
      }),
      "utf8",
    );

    await patchOpenClawConfig(path, key);
    const body = JSON5.parse(await readFile(path, "utf8"));
    assert.equal(body.agents.defaults.model.primary, "openai/gpt-4o");
  });
});

describe("resolveOpenClawConfigPath", () => {
  it("rejects paths outside ~/.openclaw", async () => {
    const outsideDir = await mkdtemp(join(tmpdir(), "duel-outside-openclaw-"));
    const prev = process.env.OPENCLAW_CONFIG_PATH;
    process.env.OPENCLAW_CONFIG_PATH = join(outsideDir, "openclaw.json");
    try {
      assert.throws(() => resolveOpenClawConfigPath(), /must be inside/);
    } finally {
      if (prev === undefined) delete process.env.OPENCLAW_CONFIG_PATH;
      else process.env.OPENCLAW_CONFIG_PATH = prev;
    }
  });
});

describe("getProxyUrl", () => {
  it("strips trailing slash", () => {
    const prev = process.env.DUEL_PROXY_URL;
    process.env.DUEL_PROXY_URL = "https://example.com/v1/";
    try {
      assert.equal(getProxyUrl(), "https://example.com/v1");
    } finally {
      if (prev === undefined) delete process.env.DUEL_PROXY_URL;
      else process.env.DUEL_PROXY_URL = prev;
    }
  });

  it("rejects invalid URLs", () => {
    const prev = process.env.DUEL_PROXY_URL;
    process.env.DUEL_PROXY_URL = "not-a-url";
    try {
      assert.throws(() => getProxyUrl(), /Invalid DUEL_PROXY_URL/);
    } finally {
      if (prev === undefined) delete process.env.DUEL_PROXY_URL;
      else process.env.DUEL_PROXY_URL = prev;
    }
  });
});

describe("getEnvForTarget", () => {
  const key = "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3";
  const proxy = "https://duelagents.com/v1";

  it("maps claude-code to anthropic vars", () => {
    const env = getEnvForTarget("claude-code", key, proxy);
    assert.equal(env.ANTHROPIC_BASE_URL, proxy);
    assert.equal(env.ANTHROPIC_API_KEY, key);
    assert.equal(env.DUEL_API_KEY, key);
  });

  it("maps codex and openai-compat to openai vars", () => {
    for (const target of ["codex", "openai-compat"] as const) {
      const env = getEnvForTarget(target, key, proxy);
      assert.equal(env.OPENAI_BASE_URL, proxy);
      assert.equal(env.OPENAI_API_KEY, key);
    }
  });

  it("maps cursor and openclaw to duel vars", () => {
    for (const target of ["cursor", "openclaw"] as const) {
      const env = getEnvForTarget(target, key, proxy);
      assert.equal(env.DUEL_API_KEY, key);
      assert.equal(env.DUEL_PROXY_URL, proxy);
    }
  });

  it("rejects an invalid key", () => {
    assert.throws(() => getEnvForTarget("codex", "bad", proxy), /Invalid or missing/);
  });
});
