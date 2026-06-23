# @duel-agents/sdk

TypeScript client for the Duel Agents API. Wire compatible with the OpenAI
chat completions and Anthropic messages endpoints, routed through the Duel
proxy so prompts run against multiple models and bill the cheapest answer that
still wins.

## Install

```bash
npm install @duel-agents/sdk
```

## Usage

`apiKey` is required. Create one at
[duelagents.com/dashboard/settings](https://duelagents.com/dashboard/settings).

```ts
import { DuelClient } from "@duel-agents/sdk";

const duel = new DuelClient({ apiKey: process.env.DUEL_API_KEY! });

// OpenAI compatible
const chat = await duel.chat.completions.create({
  model: "duel-auto",
  messages: [{ role: "user", content: "Explain concurrent agents briefly." }],
});

// Anthropic compatible
const msg = await duel.messages.create({
  model: "duel-auto",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

## Options

| Option | Default | Purpose |
|--------|---------|---------|
| `apiKey` | required | Your `duel_*` key. |
| `baseUrl` | `https://duelagents.com/v1` | Proxy base URL. |
| `fetch` | global `fetch` | Inject a custom fetch (tests, proxies). |
| `timeoutMs` | `60000` | Per request timeout. |

## Errors

- `DuelAuthError` on `401`/`403`.
- `DuelApiError` on other non `2xx` responses (carries `status` and `body`).
- Streaming is not supported yet; pass `stream: false` or omit it.

## License

MIT.
