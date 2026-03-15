"""Tests for the /api/v1/admin endpoints."""

import pytest
from unittest.mock import patch

from app.tests.conftest import (
    ADMIN_TOKEN,
    AGENT_TOKEN,
    CUSTOMER_TOKEN,
    TENANT_ID,
    auth_header,
    NOW_ISO,
)

pytestmark = pytest.mark.asyncio

AGENT_ID = "agent-rec-001"

SAMPLE_AGENT = {
    "id": AGENT_ID,
    "tenant_id": TENANT_ID,
    "user_id": "user-agent-001",
    "display_name": "Agent Smith",
    "status": "available",
    "skills": ["billing", "technical"],
    "active_tickets": 3,
    "created_at": NOW_ISO,
    "updated_at": NOW_ISO,
}


class TestListAgents:

    async def test_list_agents_admin(self, client, mock_supabase):
        with patch("app.routes.admin.agent_repo") as repo:
            repo.list_all.return_value = [SAMPLE_AGENT]

            resp = await client.get(
                "/api/v1/admin/agents",
                headers=auth_header(ADMIN_TOKEN),
            )

        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert body["data"][0]["display_name"] == "Agent Smith"

    async def test_list_agents_non_admin_denied(self, client, mock_supabase):
        resp = await client.get(
            "/api/v1/admin/agents",
            headers=auth_header(AGENT_TOKEN),
        )
        assert resp.status_code == 403

    async def test_list_agents_customer_denied(self, client, mock_supabase):
        resp = await client.get(
            "/api/v1/admin/agents",
            headers=auth_header(CUSTOMER_TOKEN),
        )
        assert resp.status_code == 403


class TestUpdateAgent:

    async def test_update_agent_status(self, client, mock_supabase):
        updated_agent = {**SAMPLE_AGENT, "status": "busy"}

        with patch("app.routes.admin.agent_repo") as repo:
            repo.update.return_value = updated_agent

            resp = await client.patch(
                f"/api/v1/admin/agents/{AGENT_ID}",
                json={"status": "busy"},
                headers=auth_header(ADMIN_TOKEN),
            )

        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "busy"

    async def test_update_agent_skills(self, client, mock_supabase):
        updated_agent = {**SAMPLE_AGENT, "skills": ["billing", "technical", "general"]}

        with patch("app.routes.admin.agent_repo") as repo:
            repo.update.return_value = updated_agent

            resp = await client.patch(
                f"/api/v1/admin/agents/{AGENT_ID}",
                json={"skills": ["billing", "technical", "general"]},
                headers=auth_header(ADMIN_TOKEN),
            )

        assert resp.status_code == 200
        assert "general" in resp.json()["data"]["skills"]

    async def test_update_agent_non_admin_denied(self, client, mock_supabase):
        resp = await client.patch(
            f"/api/v1/admin/agents/{AGENT_ID}",
            json={"status": "offline"},
            headers=auth_header(AGENT_TOKEN),
        )
        assert resp.status_code == 403


class TestAIConfig:

    async def test_get_ai_config(self, client, mock_supabase):
        resp = await client.get(
            "/api/v1/admin/config/ai",
            headers=auth_header(ADMIN_TOKEN),
        )

        assert resp.status_code == 200
        body = resp.json()
        assert "model" in body
        assert "temperature" in body
        assert "max_tokens" in body
        assert "embedding_model" in body
        assert "rag_top_k" in body

    async def test_get_ai_config_non_admin_denied(self, client, mock_supabase):
        resp = await client.get(
            "/api/v1/admin/config/ai",
            headers=auth_header(CUSTOMER_TOKEN),
        )
        assert resp.status_code == 403

    async def test_update_ai_config(self, client, mock_supabase):
        resp = await client.patch(
            "/api/v1/admin/config/ai",
            json={
                "model": "gpt-4o",
                "temperature": 0.5,
                "max_tokens": 4096,
            },
            headers=auth_header(ADMIN_TOKEN),
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["model"] == "gpt-4o"
        assert body["temperature"] == 0.5
        assert body["max_tokens"] == 4096

    async def test_update_ai_config_partial(self, client, mock_supabase):
        resp = await client.patch(
            "/api/v1/admin/config/ai",
            json={"temperature": 0.7},
            headers=auth_header(ADMIN_TOKEN),
        )

        assert resp.status_code == 200
        assert resp.json()["temperature"] == 0.7

    async def test_update_ai_config_non_admin_denied(self, client, mock_supabase):
        resp = await client.patch(
            "/api/v1/admin/config/ai",
            json={"model": "gpt-4o"},
            headers=auth_header(AGENT_TOKEN),
        )
        assert resp.status_code == 403
