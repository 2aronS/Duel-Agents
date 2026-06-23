# Contributing to Duel Agents

Thank you for helping improve the Duel Agents integration repo.

## Development setup

```bash
git clone https://github.com/2aronS/Duel-Agents.git
cd Duel-Agents
npm install
npm run build
npm test
```

Run a single package while iterating:

```bash
npm test -w @duel-agents/core
npm run typecheck -w @duel-agents/sdk
```

## Project layout

| Path | Purpose |
|------|---------|
| `packages/core` | API key validation, env maps, OpenClaw config patch |
| `packages/cli` | `@duel-agents/install` command |
| `packages/sdk` | `@duel-agents/sdk` TypeScript client |
| `integrations/` | Claude plugin, Cursor skill, OpenClaw skill |
| `python/` | `langchain-duel` and `llama-index-llms-duel` packages |
| `templates/` | Example env and config files per tool |

## Rules

- **Every integration must use a Duel API key.** Do not add docs or code paths that bypass `duelagents.com/v1` with raw provider keys.
- Keep dependencies minimal.
- Add tests for core logic changes.
- Run `npm run build && npm test` before opening a PR.

## Manual verification checklist

Before releasing:

- [ ] `DUEL_API_KEY=duel_… npx @duel-agents/install doctor` (format + live auth)
- [ ] `npx @duel-agents/install claude-code` (updates `~/.claude/.env`)
- [ ] `npx @duel-agents/install cursor` (copies skill + project `.env`)
- [ ] `npx @duel-agents/install codex` (writes OpenAI-compat env)
- [ ] `npx @duel-agents/install openclaw` (patches `~/.openclaw/openclaw.json`, `openclaw config validate` passes)
- [ ] Claude plugin loads: `claude plugin install ./integrations/claude-plugin`
- [ ] SDK: `new DuelClient({ apiKey })` throws without key

## Publishing

Tag `v*` to trigger the release workflow (requires `NPM_TOKEN` secret):

```bash
npm version patch --workspaces
git tag v0.1.1
git push origin v0.1.1
```
