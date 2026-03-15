"""Tests for the /api/v1/auth endpoints."""

import pytest
from unittest.mock import patch, MagicMock

from app.tests.conftest import (
    ADMIN_USER,
    AGENT_USER,
    CUSTOMER_USER,
    ADMIN_TOKEN,
    AGENT_TOKEN,
    CUSTOMER_TOKEN,
    ADMIN_REFRESH_TOKEN,
    ADMIN_EMAIL,
    AGENT_EMAIL,
    CUSTOMER_EMAIL,
    PASSWORD,
    TENANT_ID,
    auth_header,
)

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# Signup
# ---------------------------------------------------------------------------

class TestSignup:

    async def test_signup_customer_success(self, client, mock_supabase):
        mock_supabase.table("tenants").set_result(data=[{"id": "t1"}])
        mock_supabase.table("users").set_result(data=[{
            "id": "new-id",
            "tenant_id": "t1",
            "email": "new@test.com",
            "display_name": "New User",
            "role": "customer",
            "created_at": "2025-01-01T00:00:00Z",
            "updated_at": "2025-01-01T00:00:00Z",
        }])
        mock_supabase.table("customers").set_result(data=[{"id": "c1"}])

        # user_repo.get_by_email should return None (no existing user)
        with patch("app.routes.auth.user_repo") as repo_mock:
            repo_mock.get_by_email.return_value = None
            repo_mock.create.return_value = {"id": "new-id"}

            resp = await client.post("/api/v1/auth/signup", json={
                "email": "new@test.com",
                "password": "StrongP@ss1",
                "display_name": "New User",
                "role": "customer",
            })

        assert resp.status_code == 201
        body = resp.json()
        assert body["message"] == "Account created successfully"
        assert body["role"] == "customer"

    async def test_signup_admin_success(self, client, mock_supabase):
        mock_supabase.table("tenants").set_result(data=[{"id": "t1"}])
        mock_supabase.table("users").set_result(data=[{
            "id": "new-admin",
            "tenant_id": "t1",
            "email": "admin-new@test.com",
            "display_name": "Admin New",
            "role": "admin",
        }])

        with patch("app.routes.auth.user_repo") as repo_mock:
            repo_mock.get_by_email.return_value = None
            repo_mock.create.return_value = {"id": "new-admin"}

            resp = await client.post("/api/v1/auth/signup", json={
                "email": "admin-new@test.com",
                "password": "StrongP@ss1",
                "display_name": "Admin New",
                "role": "admin",
            })

        assert resp.status_code == 201
        assert resp.json()["role"] == "admin"

    async def test_signup_agent_success(self, client, mock_supabase):
        mock_supabase.table("tenants").set_result(data=[{"id": "t1"}])
        mock_supabase.table("users").set_result(data=[{
            "id": "new-agent",
            "tenant_id": "t1",
            "email": "agent-new@test.com",
            "display_name": "Agent New",
            "role": "agent",
        }])
        mock_supabase.table("agents").set_result(data=[{"id": "a1"}])

        with patch("app.routes.auth.user_repo") as repo_mock:
            repo_mock.get_by_email.return_value = None
            repo_mock.create.return_value = {"id": "new-agent"}

            resp = await client.post("/api/v1/auth/signup", json={
                "email": "agent-new@test.com",
                "password": "StrongP@ss1",
                "display_name": "Agent New",
                "role": "agent",
            })

        assert resp.status_code == 201
        assert resp.json()["role"] == "agent"

    async def test_signup_duplicate_email(self, client, mock_supabase):
        with patch("app.routes.auth.user_repo") as repo_mock:
            repo_mock.get_by_email.return_value = CUSTOMER_USER

            resp = await client.post("/api/v1/auth/signup", json={
                "email": CUSTOMER_EMAIL,
                "password": "StrongP@ss1",
                "display_name": "Dup",
                "role": "customer",
            })

        assert resp.status_code == 409
        assert "already registered" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class TestLogin:

    async def test_login_success(self, client, mock_supabase):
        with patch("app.routes.auth.user_repo") as repo_mock:
            repo_mock.get_by_email.return_value = ADMIN_USER

            resp = await client.post("/api/v1/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": PASSWORD,
            })

        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["user"]["email"] == ADMIN_EMAIL
        assert body["user"]["role"] == "admin"

    async def test_login_invalid_email(self, client, mock_supabase):
        with patch("app.routes.auth.user_repo") as repo_mock:
            repo_mock.get_by_email.return_value = None

            resp = await client.post("/api/v1/auth/login", json={
                "email": "nonexistent@test.com",
                "password": PASSWORD,
            })

        assert resp.status_code == 401
        assert "Invalid email or password" in resp.json()["detail"]

    async def test_login_wrong_password(self, client, mock_supabase):
        with patch("app.routes.auth.user_repo") as repo_mock:
            repo_mock.get_by_email.return_value = ADMIN_USER

            resp = await client.post("/api/v1/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": "WrongPassword!",
            })

        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Token Refresh
# ---------------------------------------------------------------------------

class TestRefresh:

    async def test_refresh_success(self, client, mock_supabase):
        with patch("app.routes.auth.user_repo") as repo_mock:
            repo_mock.get_by_id.return_value = ADMIN_USER

            resp = await client.post("/api/v1/auth/refresh", json={
                "refresh_token": ADMIN_REFRESH_TOKEN,
            })

        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body

    async def test_refresh_with_access_token_fails(self, client, mock_supabase):
        """Using an access token (no type=refresh) should fail."""
        resp = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": ADMIN_TOKEN,
        })
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

class TestGetMe:

    async def test_get_me_success(self, client, mock_supabase):
        with patch("app.routes.auth.user_repo") as repo_mock:
            repo_mock.get_by_id.return_value = ADMIN_USER

            resp = await client.get(
                "/api/v1/auth/me",
                headers=auth_header(ADMIN_TOKEN),
            )

        assert resp.status_code == 200
        body = resp.json()
        assert body["data"]["email"] == ADMIN_EMAIL

    async def test_get_me_user_not_found(self, client, mock_supabase):
        with patch("app.routes.auth.user_repo") as repo_mock:
            repo_mock.get_by_id.return_value = None

            resp = await client.get(
                "/api/v1/auth/me",
                headers=auth_header(ADMIN_TOKEN),
            )

        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Unauthorized access
# ---------------------------------------------------------------------------

class TestUnauthorized:

    async def test_no_token(self, client, mock_supabase):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code == 403  # HTTPBearer returns 403 when no credentials

    async def test_invalid_token(self, client, mock_supabase):
        resp = await client.get(
            "/api/v1/auth/me",
            headers=auth_header("invalid.jwt.token"),
        )
        assert resp.status_code == 401
