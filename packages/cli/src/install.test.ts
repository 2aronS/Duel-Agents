import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateApiKey } from "@duel-agents/core";
import { resolveApiKeyFromEnv, resolveIntegrationPath } from "./install.js";

describe("resolveApiKeyFromEnv", () => {
  it("reads DUEL_API_KEY", () => {
    const prev = process.env.DUEL_API_KEY;
    process.env.DUEL_API_KEY =
      "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3";
    assert.equal(
      resolveApiKeyFromEnv(),
      "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3",
    );
    if (prev === undefined) delete process.env.DUEL_API_KEY;
    else process.env.DUEL_API_KEY = prev;
  });
});

describe("validateApiKey in CLI context", () => {
  it("rejects anthropic keys", () => {
    assert.equal(validateApiKey("sk-ant-api03-xxx"), false);
  });
});

describe("resolveIntegrationPath", () => {
  it("finds cursor skill in monorepo or bundled package", () => {
    const path = resolveIntegrationPath("cursor", "skills", "duel-agents");
    assert.match(path, /integrations[\\/]cursor[\\/]skills[\\/]duel-agents$/);
  });
});
