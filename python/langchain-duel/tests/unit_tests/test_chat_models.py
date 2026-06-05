"""Unit tests for ChatDuel.

Runs the LangChain standard chat-model unit suite plus Duel-specific defaults.
"""

from typing import Type

from langchain_tests.unit_tests import ChatModelUnitTests

from langchain_duel import ChatDuel
from langchain_duel.chat_models import DEFAULT_MODEL, DUEL_API_BASE

_TEST_KEY = "duel_testpref_" + "a" * 32


class TestChatDuelUnit(ChatModelUnitTests):
    @property
    def chat_model_class(self) -> Type[ChatDuel]:
        return ChatDuel

    @property
    def chat_model_params(self) -> dict:
        return {"model": "duel-auto", "api_key": _TEST_KEY}


def test_defaults_to_duel_auto() -> None:
    llm = ChatDuel(api_key=_TEST_KEY)
    assert llm.model_name == DEFAULT_MODEL


def test_defaults_to_duel_proxy() -> None:
    llm = ChatDuel(api_key=_TEST_KEY)
    assert llm.openai_api_base == DUEL_API_BASE


def test_reads_key_from_env(monkeypatch) -> None:
    monkeypatch.setenv("DUEL_API_KEY", _TEST_KEY)
    llm = ChatDuel()
    assert llm.openai_api_key is not None


def test_llm_type() -> None:
    llm = ChatDuel(api_key=_TEST_KEY)
    assert llm._llm_type == "duel-chat"
