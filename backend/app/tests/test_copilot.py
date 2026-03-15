"""Tests for the /api/v1/copilot endpoints."""

import pytest
from unittest.mock import patch, AsyncMock

from app.tests.conftest import (
    AGENT_TOKEN,
    CUSTOMER_TOKEN,
    TENANT_ID,
    auth_header,
)

pytestmark = pytest.mark.asyncio

TICKET_ID = "ticket-copilot-001"
CONVERSATION_ID = "conv-copilot-001"


class TestSuggestReply:

    async def test_suggest_reply_success(self, client, mock_supabase, mock_openai):
        with patch("app.services.copilot_service.suggest_reply", new_callable=AsyncMock) as mock_fn:
            mock_fn.return_value = {
                "suggested_reply": "Thank you for reaching out. Let me look into that for you.",
                "confidence": 0.85,
                "sources": ["FAQ", "Billing Guide"],
            }

            resp = await client.post(
                "/api/v1/copilot/suggest-reply",
                json={
                    "ticket_id": TICKET_ID,
                    "conversation_id": CONVERSATION_ID,
                    "context": "Customer asking about refund policy",
                },
                headers=auth_header(AGENT_TOKEN),
            )

        assert resp.status_code == 200
        body = resp.json()
        assert "suggested_reply" in body
        assert body["confidence"] == 0.85
        assert len(body["sources"]) == 2

    async def test_suggest_reply_without_context(self, client, mock_supabase, mock_openai):
        with patch("app.services.copilot_service.suggest_reply", new_callable=AsyncMock) as mock_fn:
            mock_fn.return_value = {
                "suggested_reply": "How can I assist you today?",
                "confidence": 0.6,
                "sources": [],
            }

            resp = await client.post(
                "/api/v1/copilot/suggest-reply",
                json={},
                headers=auth_header(AGENT_TOKEN),
            )

        assert resp.status_code == 200


class TestSummarize:

    async def test_summarize_success(self, client, mock_supabase, mock_openai):
        with patch("app.services.copilot_service.summarize", new_callable=AsyncMock) as mock_fn:
            mock_fn.return_value = {
                "summary": "Customer reported a billing issue with their subscription.",
                "key_points": [
                    "Charged twice for monthly plan",
                    "Requesting refund for duplicate charge",
                ],
            }

            resp = await client.post(
                "/api/v1/copilot/summarize",
                json={
                    "ticket_id": TICKET_ID,
                    "conversation_id": CONVERSATION_ID,
                },
                headers=auth_header(AGENT_TOKEN),
            )

        assert resp.status_code == 200
        body = resp.json()
        assert "summary" in body
        assert len(body["key_points"]) == 2

    async def test_summarize_no_messages(self, client, mock_supabase, mock_openai):
        with patch("app.services.copilot_service.summarize", new_callable=AsyncMock) as mock_fn:
            mock_fn.return_value = {
                "summary": "No messages to summarize.",
                "key_points": [],
            }

            resp = await client.post(
                "/api/v1/copilot/summarize",
                json={},
                headers=auth_header(AGENT_TOKEN),
            )

        assert resp.status_code == 200
        assert resp.json()["key_points"] == []


class TestKBRetrieval:

    async def test_retrieve_kb_success(self, client, mock_supabase, mock_openai):
        with patch("app.services.copilot_service.retrieve_kb_snippets", new_callable=AsyncMock) as mock_fn:
            mock_fn.return_value = [
                {
                    "document_title": "Refund Policy",
                    "content": "Refunds are processed within 5-7 business days...",
                    "relevance_score": 0.95,
                },
                {
                    "document_title": "Billing FAQ",
                    "content": "You can view your billing history...",
                    "relevance_score": 0.82,
                },
            ]

            resp = await client.post(
                "/api/v1/copilot/retrieve-kb",
                json={"query": "refund policy", "top_k": 5},
                headers=auth_header(AGENT_TOKEN),
            )

        assert resp.status_code == 200
        body = resp.json()
        assert len(body["snippets"]) == 2
        assert body["snippets"][0]["relevance_score"] == 0.95

    async def test_retrieve_kb_empty(self, client, mock_supabase, mock_openai):
        with patch("app.services.copilot_service.retrieve_kb_snippets", new_callable=AsyncMock) as mock_fn:
            mock_fn.return_value = []

            resp = await client.post(
                "/api/v1/copilot/retrieve-kb",
                json={"query": "something obscure"},
                headers=auth_header(AGENT_TOKEN),
            )

        assert resp.status_code == 200
        assert resp.json()["snippets"] == []
