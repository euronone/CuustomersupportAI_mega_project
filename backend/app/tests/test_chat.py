"""Tests for the /api/v1/chat endpoints."""

import pytest
from unittest.mock import patch, AsyncMock

from app.tests.conftest import (
    CUSTOMER_TOKEN,
    TENANT_ID,
    CUSTOMER_USER_ID,
    auth_header,
    NOW_ISO,
)

pytestmark = pytest.mark.asyncio

CONVERSATION_ID = "conv-chat-001"


class TestChatCompletion:

    async def test_chat_completion_success(self, client, mock_supabase, mock_openai):
        ai_msg = {
            "id": "msg-ai-001",
            "conversation_id": CONVERSATION_ID,
            "tenant_id": TENANT_ID,
            "content": "I can help you with that.",
            "sender_type": "ai",
            "metadata": {
                "citations": [
                    {
                        "document_title": "FAQ",
                        "chunk_content": "snippet...",
                        "relevance_score": 0.92,
                    }
                ]
            },
            "created_at": NOW_ISO,
            "updated_at": NOW_ISO,
        }

        with patch("app.services.chat_service.handle_message", new_callable=AsyncMock) as handle_mock:
            handle_mock.return_value = ai_msg

            resp = await client.post(
                "/api/v1/chat/completions",
                json={
                    "conversation_id": CONVERSATION_ID,
                    "content": "How do I reset my password?",
                },
                headers=auth_header(CUSTOMER_TOKEN),
            )

        assert resp.status_code == 200
        body = resp.json()
        assert body["data"]["content"] == "I can help you with that."
        assert body["data"]["sender_type"] == "ai"
        assert len(body["data"]["citations"]) == 1

    async def test_chat_completion_unauthorized(self, client, mock_supabase):
        resp = await client.post(
            "/api/v1/chat/completions",
            json={
                "conversation_id": CONVERSATION_ID,
                "content": "hello",
            },
        )
        assert resp.status_code == 403  # No auth header


class TestChatHistory:

    async def test_get_conversation_history(self, client, mock_supabase):
        messages = [
            {
                "id": "msg-1",
                "conversation_id": CONVERSATION_ID,
                "sender_type": "customer",
                "content": "Hello",
                "created_at": NOW_ISO,
            },
            {
                "id": "msg-2",
                "conversation_id": CONVERSATION_ID,
                "sender_type": "ai",
                "content": "Hi there! How can I help?",
                "created_at": NOW_ISO,
            },
        ]

        with patch("app.services.chat_service.get_conversation_history", new_callable=AsyncMock) as hist_mock:
            hist_mock.return_value = messages

            resp = await client.get(
                f"/api/v1/chat/conversations/{CONVERSATION_ID}/history",
                headers=auth_header(CUSTOMER_TOKEN),
            )

        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 2
        assert len(body["data"]) == 2

    async def test_get_conversation_history_empty(self, client, mock_supabase):
        with patch("app.services.chat_service.get_conversation_history", new_callable=AsyncMock) as hist_mock:
            hist_mock.return_value = []

            resp = await client.get(
                f"/api/v1/chat/conversations/{CONVERSATION_ID}/history",
                headers=auth_header(CUSTOMER_TOKEN),
            )

        assert resp.status_code == 200
        assert resp.json()["total"] == 0
