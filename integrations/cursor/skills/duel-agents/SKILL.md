---
name: duel-agents
description: >-
  Use Duel Agents model routing in Cursor. Requires a Duel API key from
  duelagents.com. Triggers on duel, duel agents, model routing, openclaw.
---

# Duel Agents (Cursor)

Duel Agents routes IDE prompts through `https://duelagents.com/v1` using your **Duel API key**. You must subscribe and create a key at https://duelagents.com/dashboard/settings.

## Quick setup

```bash
export DUEL_API_KEY=duel_yourprefix_yoursecret
npx @duel-agents/install cursor
npx @duel-agents/install doctor
```

## Cursor model override

1. **Settings → Models**
2. Enable **Override OpenAI Base URL**
3. Base URL: `https://duelagents.com/v1`
4. API key: your `duel_*` key (not an OpenAI key)

## SDK for custom tools

```ts
import { DuelClient } from "@duel-agents/sdk";

const duel = new DuelClient({ apiKey: process.env.DUEL_API_KEY! });
```

Docs: https://github.com/2aronS/Duel-Agents
