# LlamaIndex Llms Integration: Duel Agents

[Duel Agents](https://duelagents.com) routes each prompt against multiple
models and bills the cheapest answer that still wins, behind an
OpenAI-compatible proxy.

## Installation

```bash
pip install llama-index-llms-duel
```

Create an API key at
[duelagents.com/dashboard/settings](https://duelagents.com/dashboard/settings)
(an active subscription is required) and set it:

```bash
export DUEL_API_KEY="duel_<prefix>_<secret>"
```

## Usage

```python
from llama_index.llms.duel import DuelLLM

llm = DuelLLM(model="duel-auto")

resp = llm.complete("Explain concurrent agents in one sentence.")
print(resp)
```

Chat:

```python
from llama_index.core.llms import ChatMessage

messages = [
    ChatMessage(role="system", content="You answer concisely."),
    ChatMessage(role="user", content="What is model routing?"),
]
print(llm.chat(messages))
```

`duel-auto` lets Duel pick the model. You can also pass a specific model name
(for example `gpt-4o-mini` or `claude-3-5-haiku-latest`) to route to that
provider.

## License

MIT
