"""
Shared test fixtures for the Euron backend test suite.
Mocks all external services (Supabase, OpenAI/EURI, Redis) so tests
run without network access.
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.security import create_access_token, create_refresh_token, hash_password


# ---------------------------------------------------------------------------
# Constants used across tests
# ---------------------------------------------------------------------------
TENANT_ID = "tenant-test-001"
ADMIN_USER_ID = "user-admin-001"
AGENT_USER_ID = "user-agent-001"
CUSTOMER_USER_ID = "user-customer-001"

ADMIN_EMAIL = "admin@test.com"
AGENT_EMAIL = "agent@test.com"
CUSTOMER_EMAIL = "customer@test.com"

PASSWORD = "SecurePass123!"
PASSWORD_HASH = hash_password(PASSWORD)

NOW_ISO = datetime.now(timezone.utc).isoformat()


def _make_user(user_id: str, email: str, role: str, display_name: str) -> dict:
    return {
        "id": user_id,
        "tenant_id": TENANT_ID,
        "email": email,
        "password_hash": PASSWORD_HASH,
        "display_name": display_name,
        "role": role,
        "created_at": NOW_ISO,
        "updated_at": NOW_ISO,
    }


ADMIN_USER = _make_user(ADMIN_USER_ID, ADMIN_EMAIL, "admin", "Admin User")
AGENT_USER = _make_user(AGENT_USER_ID, AGENT_EMAIL, "agent", "Agent User")
CUSTOMER_USER = _make_user(CUSTOMER_USER_ID, CUSTOMER_EMAIL, "customer", "Customer User")


def _token_data(user: dict) -> dict:
    return {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "tenant_id": user["tenant_id"],
    }


ADMIN_TOKEN = create_access_token(_token_data(ADMIN_USER))
AGENT_TOKEN = create_access_token(_token_data(AGENT_USER))
CUSTOMER_TOKEN = create_access_token(_token_data(CUSTOMER_USER))
ADMIN_REFRESH_TOKEN = create_refresh_token(_token_data(ADMIN_USER))


# ---------------------------------------------------------------------------
# Helpers to build a fluent Supabase mock
# ---------------------------------------------------------------------------

class _FluentResult:
    """Mimics a Supabase PostgREST response object."""

    def __init__(self, data=None, count=None):
        self.data = data if data is not None else []
        self.count = count


class _FluentQuery:
    """
    A chainable mock that simulates the Supabase PostgREST query builder.
    Every chainable method returns *self* so calls like
        .table("x").select("*").eq("a", "b").execute()
    work correctly.  Call ``set_result`` before exercising the code under
    test to control what ``.execute()`` returns.
    """

    def __init__(self, data=None, count=None):
        self._result = _FluentResult(data=data, count=count)

    # --- terminal ---
    def execute(self):
        return self._result

    # --- helpers for tests ---
    def set_result(self, data=None, count=None):
        self._result = _FluentResult(data=data, count=count)
        return self

    # --- chainable stubs ---
    def select(self, *a, **kw):
        return self

    def insert(self, *a, **kw):
        return self

    def update(self, *a, **kw):
        return self

    def delete(self, *a, **kw):
        return self

    def eq(self, *a, **kw):
        return self

    def is_(self, *a, **kw):
        return self

    def order(self, *a, **kw):
        return self

    def range(self, *a, **kw):
        return self

    def limit(self, *a, **kw):
        return self


class _MockSupabase:
    """
    A lightweight mock for the Supabase ``Client``.
    Each call to ``.table(name)`` returns a fresh ``_FluentQuery`` stored
    in ``self.tables[name]``, so tests can prepare per-table results:

        mock_sb.tables["users"].set_result(data=[...])
    """

    def __init__(self):
        self.tables: dict[str, _FluentQuery] = {}
        self._rpc_results: dict[str, _FluentResult] = {}

    def table(self, name: str) -> _FluentQuery:
        if name not in self.tables:
            self.tables[name] = _FluentQuery()
        return self.tables[name]

    def rpc(self, fn_name: str, params: dict | None = None) -> _FluentQuery:
        q = _FluentQuery()
        if fn_name in self._rpc_results:
            q._result = self._rpc_results[fn_name]
        return q

    def set_rpc_result(self, fn_name: str, data=None):
        self._rpc_results[fn_name] = _FluentResult(data=data)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def mock_supabase():
    """Patch ``get_supabase`` so no real Supabase connection is made."""
    sb = _MockSupabase()
    with patch("app.integrations.supabase_client.get_supabase", return_value=sb):
        # Also patch the singleton reference used by repos that import at module level
        with patch("app.integrations.supabase_client._client", sb):
            yield sb


@pytest.fixture()
def mock_redis():
    """Patch Redis so no real connection is made."""
    redis_mock = AsyncMock()
    redis_mock.get = AsyncMock(return_value=None)
    redis_mock.set = AsyncMock()
    redis_mock.delete = AsyncMock()
    redis_mock.ping = AsyncMock()
    with patch("app.integrations.redis_client.get_redis", AsyncMock(return_value=redis_mock)):
        with patch("app.integrations.redis_client._pool", redis_mock):
            yield redis_mock


@pytest.fixture()
def mock_openai():
    """Patch EURI / OpenAI client functions used by RAG and copilot."""
    with patch("app.integrations.openai_client.chat_completion", new_callable=AsyncMock) as chat_mock, \
         patch("app.integrations.openai_client.generate_embedding", new_callable=AsyncMock) as embed_mock:
        chat_mock.return_value = "This is an AI-generated response."
        embed_mock.return_value = [0.1] * 1536  # Fake embedding vector
        yield {"chat_completion": chat_mock, "generate_embedding": embed_mock}


@pytest_asyncio.fixture()
async def client(mock_supabase, mock_redis):
    """
    An httpx ``AsyncClient`` wired to the FastAPI app.
    ``mock_supabase`` and ``mock_redis`` are activated automatically.
    """
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def auth_header(token: str) -> dict:
    """Return an Authorization header dict for the given JWT."""
    return {"Authorization": f"Bearer {token}"}
