---
description: Set up Duel Agents routing with your Duel API key
---

# Duel Agents setup

Walk the user through Duel Agents setup:

1. Confirm they have a Duel API key from https://duelagents.com/dashboard/settings
2. Run `npx @duel-agents/install claude-code` or configure `~/.claude/.env`:
   - `ANTHROPIC_BASE_URL=https://duelagents.com/v1`
   - `ANTHROPIC_API_KEY=<their duel_* key>`
3. Run `npx @duel-agents/install doctor` to verify connectivity
4. Remind them: **only Duel API keys work**. Do not use raw Anthropic keys with Duel

If they want to build custom tooling, point them to `@duel-agents/sdk`.
