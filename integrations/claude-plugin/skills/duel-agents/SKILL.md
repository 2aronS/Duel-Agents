---
name: duel-agents
description: >-
  Configure and use Duel Agents model routing in Claude Code. Requires a Duel
  API key from duelagents.com — routes all LLM traffic through api.duel-agents.com.
---

# Duel Agents

Duel Agents runs your prompts against multiple models and picks the cheapest answer that still passes quality checks. Every request must use your **Duel API key** — never substitute a direct Anthropic or OpenAI key.

## Setup

1. Subscribe and create an API key at https://duelagents.com/dashboard/settings
2. Run: `npx @duel-agents/install claude-code`
3. Or set manually in `~/.claude/.env`:

```bash
ANTHROPIC_BASE_URL=https://api.duel-agents.com/v1
ANTHROPIC_API_KEY=duel_yourprefix_yoursecret
```

4. Restart Claude Code

## Verify

```bash
npx @duel-agents/install doctor
```

## Build on top

Use `@duel-agents/sdk` in your own tools — always pass `apiKey` from your Duel dashboard.

```ts
import { DuelClient } from "@duel-agents/sdk";

const duel = new DuelClient({ apiKey: process.env.DUEL_API_KEY! });
await duel.chat.completions.create({
  model: "duel-auto",
  messages: [{ role: "user", content: "Hello" }],
});
```

Repository: https://github.com/2aronS/Duel-Agents
