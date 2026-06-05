"""Duel Agents chat model for LangChain."""

from __future__ import annotations

import os
from typing import Any

from langchain_openai import ChatOpenAI
from pydantic import model_validator

DUEL_API_BASE = "https://duelagents.com/v1"
DEFAULT_MODEL = "duel-auto"


class ChatDuel(ChatOpenAI):
    """Duel Agents chat model.

    Routes prompts through the Duel Agents proxy, which runs the request against
    multiple models and bills the cheapest answer that still wins. The proxy is
    wire compatible with the OpenAI chat completions API, so this class builds on
    :class:`~langchain_openai.ChatOpenAI` and only changes the defaults.

    Setup:
        Install ``langchain-duel`` and set ``DUEL_API_KEY`` (create a key at
        https://duelagents.com/dashboard/settings).

        .. code-block:: bash

            pip install -U langchain-duel
            export DUEL_API_KEY="duel_<prefix>_<secret>"

    Key init args:
        model: str
            Model routed by Duel. Defaults to ``"duel-auto"`` (auto routing).
        api_key: Optional[str]
            Duel API key. Falls back to the ``DUEL_API_KEY`` env var.
        base_url: Optional[str]
            Proxy URL. Falls back to ``DUEL_PROXY_URL`` then the public proxy.

    Example:
        .. code-block:: python

            from langchain_duel import ChatDuel

            llm = ChatDuel(model="duel-auto", temperature=0)
            llm.invoke("Explain concurrent agents in one sentence.")
    """

    @property
    def lc_secrets(self) -> dict[str, str]:
        return {"openai_api_key": "DUEL_API_KEY"}

    @property
    def _llm_type(self) -> str:
        return "duel-chat"

    @classmethod
    def is_lc_serializable(cls) -> bool:
        # Third-party namespaces are not registered with the LangChain loader,
        # so the model is not round-trip serializable.
        return False

    @model_validator(mode="before")
    @classmethod
    def _set_duel_defaults(cls, values: Any) -> Any:
        if not isinstance(values, dict):
            return values

        values.setdefault("model", DEFAULT_MODEL)
        values.setdefault(
            "base_url", os.getenv("DUEL_PROXY_URL", DUEL_API_BASE)
        )

        has_key = any(
            values.get(field)
            for field in ("api_key", "openai_api_key")
        )
        if not has_key:
            env_key = os.getenv("DUEL_API_KEY")
            if env_key:
                values["api_key"] = env_key

        return values
