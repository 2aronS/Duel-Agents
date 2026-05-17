import {
  DEFAULT_PROXY_URL,
  requireApiKey,
  validateApiKey,
} from "@duel-agents/core";
import { DuelApiError, DuelAuthError } from "./errors.js";

export interface DuelClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionCreateParams {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string | null;
  }>;
}

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | Array<{ type: string; text?: string }>;
}

export interface MessagesCreateParams {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
}

export interface MessagesResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string | null;
}

export class DuelClient {
  readonly apiKey: string;
  readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(opts: DuelClientOptions) {
    if (!opts?.apiKey) {
      throw new DuelAuthError(
        "apiKey is required. Get a Duel API key at https://duelagents.com/dashboard/settings",
      );
    }
    this.apiKey = requireApiKey(opts.apiKey);
    this.baseUrl = (opts.baseUrl ?? DEFAULT_PROXY_URL).replace(/\/$/, "");
    this.fetchFn = opts.fetch ?? fetch;

    this.chat = {
      completions: {
        create: (params: ChatCompletionCreateParams) =>
          this.createChatCompletion(params),
      },
    };

    this.messages = {
      create: (params: MessagesCreateParams) => this.createMessage(params),
    };
  }

  readonly chat: {
    completions: {
      create: (params: ChatCompletionCreateParams) => Promise<ChatCompletion>;
    };
  };

  readonly messages: {
    create: (params: MessagesCreateParams) => Promise<MessagesResponse>;
  };

  async createChatCompletion(
    params: ChatCompletionCreateParams,
  ): Promise<ChatCompletion> {
    if (params.stream) {
      throw new DuelApiError(
        "Streaming is not supported yet. Call with stream: false or omit stream.",
        400,
        null,
      );
    }
    return this.request<ChatCompletion>("/chat/completions", params, "openai");
  }

  async createMessage(params: MessagesCreateParams): Promise<MessagesResponse> {
    return this.request<MessagesResponse>("/messages", params, "anthropic");
  }

  private async request<T>(
    path: string,
    body: unknown,
    protocol: "openai" | "anthropic",
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    if (protocol === "anthropic") {
      headers["anthropic-version"] = "2023-06-01";
    }

    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (res.status === 401 || res.status === 403) {
      throw new DuelAuthError(
        `Duel API rejected your key (${res.status}). Check DUEL_API_KEY at https://duelagents.com/dashboard/settings`,
        res.status,
      );
    }

    if (!res.ok) {
      throw new DuelApiError(
        `Duel API error ${res.status}`,
        res.status,
        parsed,
      );
    }

    return parsed as T;
  }
}

export { validateApiKey, requireApiKey, DEFAULT_PROXY_URL } from "@duel-agents/core";
export { DuelError, DuelAuthError, DuelApiError } from "./errors.js";
