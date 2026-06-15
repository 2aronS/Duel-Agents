# Duel Agents

<img width="1344" height="576" alt="banner" src="https://github.com/user-attachments/assets/24e6abbe-1c7b-41cb-9d1c-a971c9a93534" />

**Use, extend, and ship with Duel Agents**: the IDE-native routing layer that runs prompts against multiple models and picks the cheapest answer that still wins.

This repo is the official integration package for [duelagents.com](https://duelagents.com).

## $DUEL Token

**$DUEL** is the tokenized equity of Duel Agents on Base (launched on Clanker launchpad) buy it by swapping ETH for the token on any Base DEX like Uniswap.

CA: 0x734636e5d8885f50df75edbd766184b733174b07

## Star History

<a href="https://www.star-history.com/?repos=2aronS%2FDuel-Agents&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=2aronS/Duel-Agents&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=2aronS/Duel-Agents&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=2aronS/Duel-Agents&type=date&legend=top-left" />
 </picture>
</a>

## Requirements

Every tool in this repo routes LLM traffic through **`https://duelagents.com/v1`** with a **Duel API key** (`duel_<prefix>_<secret>`).

You cannot use raw Anthropic or OpenAI keys with these integrations. Get a key from the dashboard:

**https://duelagents.com/dashboard/settings** (subscribe → create API key)

## Quick start

```bash
# 1. Get your key from the dashboard, then:
export DUEL_API_KEY=duel_yourprefix_yoursecret

# 2. Install for your tools
npx @duel-agents/install all

# 3. Verify
npx @duel-agents/install doctor
```

## Install per tool

| Tool | Command |
|------|---------|
| Claude Code | `npx @duel-agents/install claude-code` |
| Cursor | `npx @duel-agents/install cursor` |
| Codex CLI | `npx @duel-agents/install codex` |
| OpenClaw | `npx @duel-agents/install openclaw` |
| All | `npx @duel-agents/install all` |

### Claude Code plugin

```bash
git clone https://github.com/2aronS/Duel-Agents.git
cd duel-agents
claude plugin install ./integrations/claude-plugin
npx @duel-agents/install claude-code
```

Use `/duel-agents:setup` in Claude Code for guided setup.

### Cursor

The installer copies a skill to `.cursor/skills/duel-agents/` and writes `DUEL_API_KEY` to your project `.env`.

You still need to set **Settings → Models → Override OpenAI Base URL** to `https://duelagents.com/v1` with your Duel key. See [templates/cursor-models.override.md](templates/cursor-models.override.md).

### Codex CLI

Writes `OPENAI_BASE_URL` and `OPENAI_API_KEY` (your Duel key) to `.env`. Restart Codex after install.

### OpenClaw

Patches `~/.openclaw/openclaw.json` with a `duel` provider and sets default model to `duel/duel-auto`. Telegram/Discord channels are unchanged. Only the model backend switches to Duel.

```bash
npx @duel-agents/install openclaw
openclaw config validate
```

Reference config: [templates/openclaw.duel.json5](templates/openclaw.duel.json5)

## Build on top

Use `@duel-agents/sdk` in your apps, agents, and scripts. **`apiKey` is required.**

```bash
npm install @duel-agents/sdk
```

```ts
import { DuelClient } from "@duel-agents/sdk";

const duel = new DuelClient({
  apiKey: process.env.DUEL_API_KEY!, // required (from dashboard)
});

// OpenAI-compatible
const chat = await duel.chat.completions.create({
  model: "duel-auto",
  messages: [{ role: "user", content: "Explain concurrent agents briefly." }],
});

// Anthropic-compatible
const msg = await duel.messages.create({
  model: "duel-auto",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

Hermes Agent, Venice, and any OpenAI-compatible client can use the same pattern:

```bash
OPENAI_BASE_URL=https://duelagents.com/v1
OPENAI_API_KEY=duel_yourprefix_yoursecret
```

## LangChain and LlamaIndex

Duel is OpenAI wire compatible, so it works with the major Python frameworks.

### Official packages

```bash
pip install langchain-duel        # LangChain
pip install llama-index-llms-duel # LlamaIndex
```

```python
from langchain_duel import ChatDuel

llm = ChatDuel(model="duel-auto")  # reads DUEL_API_KEY
llm.invoke("Explain concurrent agents in one sentence.")
```

```python
from llama_index.llms.duel import DuelLLM

llm = DuelLLM(model="duel-auto")   # reads DUEL_API_KEY
llm.complete("Explain concurrent agents in one sentence.")
```

Source for both lives in [`python/`](python/). They default to `duel-auto`
routing and the `https://duelagents.com/v1` proxy.

### Without the packages

Any LangChain or LlamaIndex OpenAI client works by pointing at the proxy:

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="duel-auto",
    base_url="https://duelagents.com/v1",
    api_key="duel_yourprefix_yoursecret",
)
```

## Configuration

| Variable | Purpose |
|----------|---------|
| `DUEL_API_KEY` | Your Duel API key (required) |
| `DUEL_AGENTS_API_KEY` | Alias accepted by the installer |
| `DUEL_PROXY_URL` | Override proxy URL (staging only) |
| `OPENCLAW_CONFIG_PATH` | Custom OpenClaw config path |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Invalid API key format` | Key must be `duel_` + 8 chars + `_` + 32 chars. Create one at the dashboard. |
| `401` from doctor | Key revoked or subscription inactive. Create a new key on billing/settings. |
| `Could not reach Duel API` | The proxy at `duelagents.com/v1` must be running. Key format can still be valid; retry later. |
| OpenClaw won't start | Run `openclaw config validate` after install; restore from `openclaw.json.bak` if needed. |
| Cursor still uses OpenAI | Confirm model override URL and that the API key field is your `duel_*` key. |
| Skill copy failed after npm install | Re-run `npm run build` in the repo, or reinstall `@duel-agents/install`. Skills ship inside the package. |

## Repo map

```
packages/core     @duel-agents/core    validation, env maps, connectivity
packages/cli      @duel-agents/install installer CLI
packages/sdk      @duel-agents/sdk     TypeScript API client
integrations/     Claude plugin, Cursor skill, OpenClaw skill
python/           langchain-duel, llama-index-llms-duel
templates/        Example env and config files
```

## Development

```bash
npm install
npm run build
npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
