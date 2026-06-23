# @duel-agents/install

One command to route Claude Code, Cursor, Codex CLI, and OpenClaw through
Duel Agents.

## Usage

```bash
export DUEL_API_KEY=duel_yourprefix_yoursecret

npx @duel-agents/install all          # every supported tool
npx @duel-agents/install claude-code  # one tool
npx @duel-agents/install doctor       # verify key format + live auth
```

## Targets

| Target | Effect |
|--------|--------|
| `claude-code` | Writes `~/.claude/.env` (Anthropic compatible). |
| `cursor` | Writes project `.env` and copies the Duel skill. |
| `codex` | Writes project `.env` (OpenAI compatible). |
| `openclaw` | Patches `~/.openclaw/openclaw.json`, key in `~/.openclaw/.env`. |
| `all` | Runs every target, then `doctor`. |

## Environment

- `DUEL_API_KEY` or `DUEL_AGENTS_API_KEY`: your Duel API key (required).
- `DUEL_PROXY_URL`: override the proxy URL (staging only).
- `OPENCLAW_CONFIG_PATH`: custom OpenClaw config path (must be inside `~/.openclaw`).

## License

MIT.
