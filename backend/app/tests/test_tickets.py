"""Tests for the /api/v1/tickets endpoints."""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone

from app.tests.conftest import (
    CUSTOMER_TOKEN,
    AGENT_TOKEN,
    TENANT_ID,
    CUSTOMER_USER_ID,
    auth_header,
    NOW_ISO,
)

pytestmark = pytest.mark.asyncio

TICKET_ID = "ticket-001"
CONVERSATION_ID = "conv-001"

SAMPLE_TICKET = {
    "id": TICKET_ID,
    "tenant_id": TENANT_ID,
    "customer_id": CUSTOMER_USER_ID,
    "conversation_id": CONVERSATION_ID,
    "subject": "Need help with billing",
    "status": "open",
    "priority": "medium",
    "assigned_agent_id": None,
    "sla_due_at": None,
    "summary": None,
    "created_at": NOW_ISO,
    "updated_at": NOW_ISO,
    "closed_at": None,
}


class TestCreateTicket:

    async def test_create_ticket_success(self, client, mock_supabase):
        with patch("app.services.ticket_service.ticket_repo") as t_repo, \
             patch("app.services.ticket_service.agent_repo") as a_repo:
            a_repo.get_available.return_value = []
            t_repo.create.return_value = SAMPLE_TICKET

            resp = await client.post(
                "/api/v1/tickets",
                json={
                    "subject": "Need help with billing",
                    "customer_id": CUSTOMER_USER_ID,
                    "priority": "medium",
                },
                headers=auth_header(CUSTOMER_TOKEN),
            )

        assert resp.status_code == 201
        body = resp.json()
        assert body["data"]["subject"] == "Need help with billing"
        assert body["data"]["status"] == "open"


class TestListTickets:

    async def test_list_tickets_success(self, client, mock_supabase):
        with patch("app.services.ticket_service.ticket_repo") as t_repo:
            t_repo.list.return_value = ([SAMPLE_TICKET], 1)

            resp = await client.get(
                "/api/v1/tickets",
                headers=auth_header(CUSTOMER_TOKEN),
            )

        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert len(body["data"]) == 1

    async def test_list_tickets_empty(self, client, mock_supabase):
        with patch("app.services.ticket_service.ticket_repo") as t_repo:
            t_repo.list.return_value = ([], 0)

            resp = await client.get(
                "/api/v1/tickets",
                headers=auth_header(CUSTOMER_TOKEN),
            )

        assert resp.status_code == 200
        assert resp.json()["total"] == 0


class TestGetTicket:

    async def test_get_ticket_success(self, client, mock_supabase):
        with patch("app.services.ticket_service.ticket_repo") as t_repo:
            t_repo.get_by_id.return_value = SAMPLE_TICKET

            resp = await client.get(
                f"/api/v1/tickets/{TICKET_ID}",
                headers=auth_header(CUSTOMER_TOKEN),
            )

        assert resp.status_code == 200
        assert resp.json()["data"]["id"] == TICKET_ID

    async def test_get_ticket_not_found(self, client, mock_supabase):
        with patch("app.services.ticket_service.ticket_repo") as t_repo:
            t_repo.get_by_id.return_value = None

            resp = await client.get(
                "/api/v1/tickets/nonexistent",
                headers=auth_header(CUSTOMER_TOKEN),
            )

        assert resp.status_code == 404


class TestUpdateTicket:

    async def test_update_ticket_status(self, client, mock_supabase):
        updated = {**SAMPLE_TICKET, "status": "resolved"}

        with patch("app.services.ticket_service.ticket_repo") as t_repo:
            t_repo.get_by_id.return_value = SAMPLE_TICKET
            t_repo.update.return_value = updated

            resp = await client.patch(
                f"/api/v1/tickets/{TICKET_ID}",
                json={"status": "resolved"},
                headers=auth_header(AGENT_TOKEN),
            )

        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "resolved"

    async def test_update_ticket_not_found(self, client, mock_supabase):
        with patch("app.services.ticket_service.ticket_repo") as t_repo:
            t_repo.get_by_id.return_value = None

            resp = await client.patch(
                "/api/v1/tickets/nonexistent",
                json={"status": "closed"},
                headers=auth_header(AGENT_TOKEN),
            )

        assert resp.status_code == 404


class TestTicketMessages:

    async def test_add_message_to_ticket(self, client, mock_supabase):
        msg_data = {
            "id": "msg-001",
            "tenant_id": TENANT_ID,
            "conversation_id": CONVERSATION_ID,
            "sender_type": "agent",
            "sender_id": "user-agent-001",
            "channel": "chat",
            "content": "Hello, how can I help?",
            "content_type": "text",
            "created_at": NOW_ISO,
            "updated_at": NOW_ISO,
        }

        with patch("app.services.ticket_service.ticket_repo") as t_repo, \
             patch("app.routes.tickets.message_repo") as m_repo:
            t_repo.get_by_id.return_value = SAMPLE_TICKET
            m_repo.create.return_value = msg_data

            resp = await client.post(
                f"/api/v1/tickets/{TICKET_ID}/messages",
                json={"content": "Hello, how can I help?"},
                headers=auth_header(AGENT_TOKEN),
            )

        assert resp.status_code == 201
        assert resp.json()["data"]["content"] == "Hello, how can I help?"

    async def test_add_message_ticket_not_found(self, client, mock_supabase):
        with patch("app.services.ticket_service.ticket_repo") as t_repo:
            t_repo.get_by_id.return_value = None

            resp = await client.post(
                "/api/v1/tickets/nonexistent/messages",
                json={"content": "test"},
                headers=auth_header(AGENT_TOKEN),
            )

        assert resp.status_code == 404
