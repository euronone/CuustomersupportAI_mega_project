"""Tests for the /api/v1/analytics endpoints."""

import pytest
from unittest.mock import patch

from app.tests.conftest import (
    ADMIN_TOKEN,
    AGENT_TOKEN,
    CUSTOMER_TOKEN,
    TENANT_ID,
    auth_header,
)

pytestmark = pytest.mark.asyncio


class TestDashboardMetrics:

    async def test_dashboard_metrics_success(self, client, mock_supabase):
        with patch("app.services.analytics_service.ticket_repo") as t_repo, \
             patch("app.services.analytics_service.conversation_repo") as c_repo:
            t_repo.count_by_status.side_effect = lambda tid, status: {
                "open": 12,
                "pending": 5,
                "resolved": 30,
                "closed": 20,
            }.get(status, 0)
            c_repo.count_active.return_value = 8

            resp = await client.get(
                "/api/v1/analytics/dashboard",
                headers=auth_header(ADMIN_TOKEN),
            )

        assert resp.status_code == 200
        body = resp.json()
        assert body["total_tickets"] == 67
        assert body["open_tickets"] == 12
        assert body["active_conversations"] == 8
        assert "avg_resolution_time_hours" in body
        assert "csat_score" in body

    async def test_dashboard_metrics_empty(self, client, mock_supabase):
        with patch("app.services.analytics_service.ticket_repo") as t_repo, \
             patch("app.services.analytics_service.conversation_repo") as c_repo:
            t_repo.count_by_status.return_value = 0
            c_repo.count_active.return_value = 0

            resp = await client.get(
                "/api/v1/analytics/dashboard",
                headers=auth_header(ADMIN_TOKEN),
            )

        assert resp.status_code == 200
        assert resp.json()["total_tickets"] == 0

    async def test_dashboard_non_admin_denied(self, client, mock_supabase):
        resp = await client.get(
            "/api/v1/analytics/dashboard",
            headers=auth_header(AGENT_TOKEN),
        )
        assert resp.status_code == 403

    async def test_dashboard_customer_denied(self, client, mock_supabase):
        resp = await client.get(
            "/api/v1/analytics/dashboard",
            headers=auth_header(CUSTOMER_TOKEN),
        )
        assert resp.status_code == 403
