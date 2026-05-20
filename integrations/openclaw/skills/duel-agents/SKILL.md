---
name: duel-agents
description: >-
  OpenClaw integration for Duel Agents routing. Requires DUEL_API_KEY from
  duelagents.com dashboard.
---

# Duel Agents (OpenClaw)

Route OpenClaw agents through Duel Agents. Telegram, Discord, and other channels keep working — only the **model backend** changes.

## Install

```bash
export DUEL_API_KEY=duel_yourprefix_yoursecret
npx @duel-agents/install openclaw
openclaw config validate
```

Default model after install: `duel/duel-auto`

## Manual config

See `templates/openclaw.duel.json5` in the repo root. Merge into `~/.openclaw/openclaw.json`.

**Important:** Use `${DUEL_API_KEY}` in the provider config and set `DUEL_API_KEY` in the `env` section — never paste a raw OpenAI or Anthropic provider key for Duel routing.

## Verify

```bash
npx @duel-agents/install doctor
```
