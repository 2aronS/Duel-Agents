from llama_index.core.base.llms.base import BaseLLM
from llama_index.llms.duel import DuelLLM
from llama_index.llms.duel.base import DEFAULT_API_BASE, DEFAULT_MODEL

_TEST_KEY = "duel_testpref_" + "a" * 32


def test_embedding_class() -> None:
    names_of_base_classes = [b.__name__ for b in DuelLLM.__mro__]
    assert BaseLLM.__name__ in names_of_base_classes


def test_class_name() -> None:
    assert DuelLLM.class_name() == "DuelLLM"


def test_defaults() -> None:
    llm = DuelLLM(api_key=_TEST_KEY)
    assert llm.model == DEFAULT_MODEL
    assert llm.api_base == DEFAULT_API_BASE
    assert llm.is_chat_model is True


def test_reads_key_from_env(monkeypatch) -> None:
    monkeypatch.setenv("DUEL_API_KEY", _TEST_KEY)
    llm = DuelLLM()
    assert llm.api_key == _TEST_KEY
