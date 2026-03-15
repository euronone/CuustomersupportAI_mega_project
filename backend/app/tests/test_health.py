"""Tests for the /health endpoint."""

import pytest

from app.tests.conftest import auth_header, ADMIN_TOKEN

pytestmark = pytest.mark.asyncio


class TestHealthCheck:

    async def test_health_returns_ok(self, client, mock_supabase):
        resp = await client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert body["service"] == "euron-api"

    async def test_health_no_auth_required(self, client, mock_supabase):
        """Health endpoint should be accessible without authentication."""
        resp = await client.get("/health")
        assert resp.status_code == 200
