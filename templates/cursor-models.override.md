# Cursor — Duel Agents model override

Duel Agents routes Cursor through the Duel proxy. You **must** use a Duel API key (`duel_*`), not an OpenAI or Anthropic key.

## Automated setup

```bash
export DUEL_API_KEY=duel_yourprefix_yoursecret
npx @duel-agents/install cursor
```

This writes `DUEL_API_KEY` to your project `.env` and copies the Duel skill to `.cursor/skills/duel-agents/`.

## Manual UI steps

1. Open **Cursor → Settings → Models**
2. Enable **Override OpenAI Base URL**
3. Set base URL to: `https://api.duel-agents.com/v1`
4. Set API key to your Duel key from https://duelagents.com/dashboard/settings
5. Reload the window

## Verify

```bash
npx @duel-agents/install doctor
```
