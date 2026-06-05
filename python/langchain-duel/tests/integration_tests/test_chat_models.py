"""Integration tests for ChatDuel.

These hit the live Duel proxy and require a real ``DUEL_API_KEY`` with an active
subscription. They are skipped automatically when the key is absent.
"""

import os
from typing import Type

import pytest
from langchain_tests.integration_tests import ChatModelIntegrationTests

from langchain_duel import ChatDuel

pytestmark = pytest.mark.skipif(
    not os.getenv("DUEL_API_KEY"),
    reason="DUEL_API_KEY not set; skipping live integration tests.",
)


class TestChatDuelIntegration(ChatModelIntegrationTests):
    @property
    def chat_model_class(self) -> Type[ChatDuel]:
        return ChatDuel

    @property
    def chat_model_params(self) -> dict:
        return {"model": "duel-auto"}
