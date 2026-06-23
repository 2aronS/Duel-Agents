import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DuelClient } from "./client.js";
import { DuelApiError, DuelAuthError } from "./errors.js";

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

  it("posts chat completions to /chat/completions", async () => {
    const key = "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3";
    let capturedUrl = "";
    let capturedBody: unknown;

    const mockFetch: typeof fetch = async (url, init) => {
      capturedUrl = String(url);
      capturedBody = init?.body ? JSON.parse(String(init.body)) : null;
      return new Response(
        JSON.stringify({
          id: "chatcmpl_1",
          object: "chat.completion",
          created: 0,
          model: "duel-auto",
          choices: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const client = new DuelClient({ apiKey: key, fetch: mockFetch });
    const res = await client.chat.completions.create({
      model: "duel-auto",
      messages: [{ role: "user", content: "hi" }],
    });

    assert.match(capturedUrl, /\/chat\/completions$/);
    assert.equal((capturedBody as { model: string }).model, "duel-auto");
    assert.equal(res.id, "chatcmpl_1");
  });

  it("throws DuelApiError on a 500 response", async () => {
    const key = "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3";
    const mockFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ error: "boom" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });

    const client = new DuelClient({ apiKey: key, fetch: mockFetch });
    await assert.rejects(
      () =>
        client.chat.completions.create({
          model: "duel-auto",
          messages: [{ role: "user", content: "hi" }],
        }),
      (err: unknown) => {
        assert.ok(err instanceof DuelApiError);
        assert.equal((err as DuelApiError).status, 500);
        return true;
      },
    );
  });

  it("throws DuelAuthError on a 401 response", async () => {
    const key = "duel_a1b2c3d4_f8gA0hN1k2L3m4N5o6P7q8R9s0T1u2V3";
    const mockFetch: typeof fetch = async () =>
      new Response("", { status: 401 });

    const client = new DuelClient({ apiKey: key, fetch: mockFetch });
    await assert.rejects(
      () =>
        client.chat.completions.create({
          model: "duel-auto",
          messages: [{ role: "user", content: "hi" }],
        }),
      DuelAuthError,
    );
  });
});
