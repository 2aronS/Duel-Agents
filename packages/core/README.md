# @duel-agents/core

Shared config and helpers for the Duel Agents integrations. Used by
[`@duel-agents/install`](../cli) and [`@duel-agents/sdk`](../sdk).

## Install

```bash
npm install @duel-agents/core
```

## What it does

- Validate Duel API keys (`duel_<prefix>_<secret>`).
- Resolve the proxy URL from `DUEL_PROXY_URL`, falling back to the public proxy.
- Build per-target env maps (Claude Code, Cursor, Codex, OpenClaw, openai-compat).
- Patch `~/.openclaw/openclaw.json` without overwriting an existing default model.
- Check live connectivity to the Duel API.

## Key exports

| Export | Purpose |
|--------|---------|
| `validateApiKey(key)` | Returns `true` for a well formed `duel_*` key. |
| `requireApiKey(key, label?)` | Returns the trimmed key or throws. |
| `getProxyUrl()` | Resolved proxy URL with the trailing slash stripped. |
| `getEnvForTarget(target, key, proxyUrl?)` | Env vars for a given install target. |
| `buildOpenClawPatch(key, proxyUrl?)` | OpenClaw provider patch (no raw key in `env`). |
| `deepMerge(base, patch)` | Recursive object merge used for config patching. |
| `checkConnectivity(key, proxyUrl?)` | `Promise<ConnectivityResult>` against the live API. |

## Example

```ts
import { getEnvForTarget, validateApiKey } from "@duel-agents/core";

if (validateApiKey(key)) {
  const env = getEnvForTarget("codex", key);
  // { OPENAI_BASE_URL, OPENAI_API_KEY, DUEL_API_KEY }
}
```

## License

MIT.
