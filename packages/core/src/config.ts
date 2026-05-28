export const DEFAULT_PROXY_URL = "https://duelagents.com/v1";
export const DASHBOARD_URL = "https://duelagents.com/dashboard/settings";
export const KEY_DOCS_URL = "https://duelagents.com/dashboard/settings";

/** duel_ + 8-char prefix + _ + 32-char base62 secret */
const API_KEY_PATTERN = /^duel_[0-9a-zA-Z]{8}_[0-9a-zA-Z]{32}$/;

export type InstallTarget =
  | "claude-code"
  | "cursor"
  | "codex"
  | "openclaw"
  | "openai-compat";

export interface ConnectivityResult {
  ok: boolean;
  status: "ok" | "unauthorized" | "unreachable" | "invalid_key";
  message: string;
  httpStatus?: number;
}

export function validateApiKey(plaintext: string | undefined | null): boolean {
  if (!plaintext || typeof plaintext !== "string") return false;
  return API_KEY_PATTERN.test(plaintext.trim());
}

export function requireApiKey(
  input: string | undefined | null,
  label = "DUEL_API_KEY",
): string {
  const trimmed = input?.trim() ?? "";
  if (!validateApiKey(trimmed)) {
    throw new Error(
      `Invalid or missing ${label}. Get a Duel API key at ${DASHBOARD_URL}. Format: duel_<prefix>_<secret>`,
    );
  }
  return trimmed;
}

export function getProxyUrl(): string {
  const fromEnv =
    process.env.DUEL_PROXY_URL?.trim() ||
    process.env.NEXT_PUBLIC_PROXY_URL?.trim();
  const url = fromEnv || DEFAULT_PROXY_URL;
  if (!/^https?:\/\/.+/i.test(url)) {
    throw new Error(
      `Invalid DUEL_PROXY_URL "${url}". Expected an http(s) URL (trailing slashes are stripped automatically).`,
    );
  }
  return url.replace(/\/$/, "");
}

export function getEnvForTarget(
  target: InstallTarget,
  apiKey: string,
  proxyUrl = getProxyUrl(),
): Record<string, string> {
  requireApiKey(apiKey);

  switch (target) {
    case "claude-code":
      return {
        ANTHROPIC_BASE_URL: proxyUrl,
        ANTHROPIC_API_KEY: apiKey,
        DUEL_API_KEY: apiKey,
      };
    case "codex":
    case "openai-compat":
      return {
        OPENAI_BASE_URL: proxyUrl,
        OPENAI_API_KEY: apiKey,
        DUEL_API_KEY: apiKey,
      };
    case "cursor":
      return {
        DUEL_API_KEY: apiKey,
        DUEL_PROXY_URL: proxyUrl,
      };
    case "openclaw":
      return {
        DUEL_API_KEY: apiKey,
        DUEL_PROXY_URL: proxyUrl,
      };
    default:
      return { DUEL_API_KEY: apiKey, DUEL_PROXY_URL: proxyUrl };
  }
}

export function buildOpenClawPatch(
  apiKey: string,
  proxyUrl = getProxyUrl(),
): Record<string, unknown> {
  requireApiKey(apiKey);

  return {
    models: {
      mode: "merge",
      providers: {
        duel: {
          baseUrl: proxyUrl,
          apiKey: "${DUEL_API_KEY}",
          api: "openai-completions",
          models: [
            {
              id: "duel-auto",
              name: "Duel Auto",
              reasoning: false,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 200000,
              maxTokens: 8192,
            },
          ],
        },
      },
    },
    agents: {
      defaults: {
        model: { primary: "duel/duel-auto" },
        models: {
          "duel/duel-auto": { alias: "Duel" },
        },
      },
    },
    env: {
      DUEL_PROXY_URL: proxyUrl,
    },
  };
}

export function deepMerge(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    const existing = out[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      out[key] = deepMerge(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      out[key] = value;
    }
  }

  return out;
}

export async function checkConnectivity(
  apiKey: string,
  proxyUrl = getProxyUrl(),
): Promise<ConnectivityResult> {
  if (!validateApiKey(apiKey)) {
    return {
      ok: false,
      status: "invalid_key",
      message: `Invalid API key format. Get a key at ${DASHBOARD_URL}`,
    };
  }

  const base = proxyUrl.replace(/\/$/, "");
  const attempts: Array<{ path: string; method: "GET" | "HEAD" }> = [
    { path: "/models", method: "GET" },
    { path: "/health", method: "GET" },
    { path: "", method: "HEAD" },
  ];

  let lastError = "";
  let lastStatus: number | undefined;

  for (const attempt of attempts) {
    const url = `${base}${attempt.path}`;
    try {
      const res = await fetch(url, {
        method: attempt.method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15_000),
      });

      lastStatus = res.status;

      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          status: "unauthorized",
          httpStatus: res.status,
          message: `API rejected your key (${res.status}). Create or renew a key at ${DASHBOARD_URL}`,
        };
      }

      if (res.ok) {
        return {
          ok: true,
          status: "ok",
          httpStatus: res.status,
          message: "Duel API is reachable and accepted your key.",
        };
      }

      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    ok: false,
    status: "unreachable",
    httpStatus: lastStatus,
    message: lastError
      ? `Could not reach Duel API at ${base}: ${lastError}`
      : `Could not reach Duel API at ${base}. Check your network or try again later.`,
  };
}
