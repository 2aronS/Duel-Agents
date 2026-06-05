# langchain-duel

This package connects [Duel Agents](https://duelagents.com) to LangChain.

Duel Agents routes each prompt against multiple models and bills the cheapest
answer that still wins. The proxy is OpenAI wire compatible, so `ChatDuel`
builds on `langchain-openai` and just points at the Duel proxy with sensible
defaults.

## Installation

```bash
pip install -U langchain-duel
```

Set your Duel API key (create one at
[duelagents.com/dashboard/settings](https://duelagents.com/dashboard/settings)):

```bash
export DUEL_API_KEY="duel_<prefix>_<secret>"
```

## Chat models

```python
from langchain_duel import ChatDuel

llm = ChatDuel(model="duel-auto", temperature=0)
print(llm.invoke("Explain concurrent agents in one sentence.").content)
```

`duel-auto` lets the router pick the model. You can also pass a specific model
name (for example `gpt-4o-mini` or `claude-3-5-haiku-latest`) and Duel will
route to that provider.

### Streaming

```python
for chunk in llm.stream("Write a haiku about routing."):
    print(chunk.content, end="", flush=True)
```

### Configuration

| Argument | Env var | Default |
|----------|---------|---------|
| `api_key` | `DUEL_API_KEY` | required |
| `base_url` | `DUEL_PROXY_URL` | `https://duelagents.com/v1` |
| `model` | - | `duel-auto` |

## License

MIT
