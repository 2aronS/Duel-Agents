import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateApiKey,
  requireApiKey,
  buildOpenClawPatch,
  deepMerge,
  getProxyUrl,
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

