"""Duel Agents LLM for LlamaIndex."""

import os
from typing import Any, Optional

from llama_index.llms.openai_like import OpenAILike

DEFAULT_API_BASE = "https://duelagents.com/v1"
DEFAULT_MODEL = "duel-auto"


class DuelLLM(OpenAILike):
    """Duel Agents LLM.

    Routes each prompt through the Duel Agents proxy, which runs the request
    against multiple models and bills the cheapest answer that still wins. The
    proxy is OpenAI wire compatible, so this builds on ``OpenAILike``.

    Examples:
        `pip install llama-index-llms-duel`

        ```python
        from llama_index.llms.duel import DuelLLM

        llm = DuelLLM(
            model="duel-auto",
            api_key="duel_<prefix>_<secret>",  # or set DUEL_API_KEY
        )

        response = llm.complete("Explain concurrent agents in one sentence.")
        print(response)
        ```
    """

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        api_base: str = DEFAULT_API_BASE,
        api_key: Optional[str] = None,
        is_chat_model: bool = True,
        **kwargs: Any,
    ) -> None:
        api_base = os.getenv("DUEL_PROXY_URL", api_base)
        api_key = api_key or os.getenv("DUEL_API_KEY")

        super().__init__(
            model=model,
            api_base=api_base,
            api_key=api_key,
            is_chat_model=is_chat_model,
            **kwargs,
        )

    @classmethod
    def class_name(cls) -> str:
        return "DuelLLM"
