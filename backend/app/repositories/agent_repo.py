from __future__ import annotations
from typing import Optional
from app.integrations.supabase_client import get_supabase


class AgentRepository:
    def __init__(self):
        self.table = "agents"

    def get_by_id(self, agent_id: str, tenant_id: str) -> Optional[dict]:
        result = (
            get_supabase()
            .table(self.table)
            .select("*")
            .eq("id", agent_id)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def list_all(self, tenant_id: str, status: Optional[str] = None) -> list[dict]:
        query = (
            get_supabase()
            .table(self.table)
            .select("*")
            .eq("tenant_id", tenant_id)
            .order("display_name")
        )
        if status:
            query = query.eq("status", status)
        result = query.execute()
        return result.data

    def update(self, agent_id: str, tenant_id: str, data: dict) -> dict:
        result = (
            get_supabase()
            .table(self.table)
            .update(data)
            .eq("id", agent_id)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        return result.data[0]

    def get_available(self, tenant_id: str) -> list[dict]:
        """Get agents that are available for assignment."""
        result = (
            get_supabase()
            .table(self.table)
            .select("*")
            .eq("tenant_id", tenant_id)
            .eq("status", "available")
            .order("active_tickets")
            .execute()
        )
        return result.data


agent_repo = AgentRepository()
