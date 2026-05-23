import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DuelClient } from "./client.js";
import { DuelAuthError } from "./errors.js";

describe("DuelClient", () => {
  it("requires apiKey", () => {
    assert.throws(() => new DuelClient({ apiKey: "" }), DuelAuthError);
    assert.throws(
      () => new DuelClient({ apiKey: "sk-openai" as string }),
      /Invalid or missing/,
    );
  });

  it("accepts valid apiKey", () => {
    const client = new DuelClient({
      apiKey: "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3",
    });
    assert.equal(client.apiKey.startsWith("duel_"), true);
  });

  it("rejects streaming requests", async () => {
    const client = new DuelClient({
      apiKey: "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3",
    });
    await assert.rejects(
      () =>
        client.chat.completions.create({
          model: "duel-auto",
          messages: [{ role: "user", content: "hi" }],
          stream: true,
        }),
      /Streaming is not supported/,
    );
  });

  it("sends anthropic headers including x-api-key", async () => {
    const key = "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3";
    let capturedHeaders: Record<string, string> | undefined;

    const mockFetch: typeof fetch = async (_url, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return new Response(
        JSON.stringify({
          id: "msg_1",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "ok" }],
          model: "duel-auto",
          stop_reason: "end_turn",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const client = new DuelClient({ apiKey: key, fetch: mockFetch });
    await client.messages.create({
      model: "duel-auto",
      max_tokens: 16,
      messages: [{ role: "user", content: "hi" }],
    });

    assert.equal(capturedHeaders?.["x-api-key"], key);
    assert.equal(capturedHeaders?.["anthropic-version"], "2023-06-01");
    assert.match(capturedHeaders?.Authorization ?? "", /Bearer duel_/);
  });
});
