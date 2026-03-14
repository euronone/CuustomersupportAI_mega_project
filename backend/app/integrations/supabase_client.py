from supabase import create_client, Client
from app.core.config import settings

_client: Client | None = None


def get_supabase() -> Client:
    """Get or create the Supabase client singleton."""
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _client


def get_supabase_anon() -> Client:
    """Get Supabase client with anon key (for RLS-scoped operations)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
