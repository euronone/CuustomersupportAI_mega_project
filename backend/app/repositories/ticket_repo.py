from __future__ import annotations
from typing import Optional
from app.integrations.supabase_client import get_supabase


class TicketRepository:
    def __init__(self):
        self.table = "tickets"

    def get_by_id(self, ticket_id: str, tenant_id: str) -> Optional[dict]:
        result = (
            get_supabase()
            .table(self.table)
            .select("*")
            .eq("id", ticket_id)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def list(
        self,
        tenant_id: str,
        status: Optional[str] = None,
        assigned_agent_id: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[dict], int]:
        query = (
            get_supabase()
            .table(self.table)
            .select("*", count="exact")
            .eq("tenant_id", tenant_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
        )
        if status:
            query = query.eq("status", status)
        if assigned_agent_id:
            query = query.eq("assigned_agent_id", assigned_agent_id)

        result = query.execute()
        return result.data, result.count or 0

    def create(self, data: dict) -> dict:
        result = get_supabase().table(self.table).insert(data).execute()
        return result.data[0]

    def update(self, ticket_id: str, tenant_id: str, data: dict) -> dict:
        result = (
            get_supabase()
            .table(self.table)
            .update(data)
            .eq("id", ticket_id)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        return result.data[0]

    def count_by_status(self, tenant_id: str, status: str) -> int:
        result = (
            get_supabase()
            .table(self.table)
            .select("id", count="exact")
            .eq("tenant_id", tenant_id)
            .eq("status", status)
            .execute()
        )
        return result.count or 0


ticket_repo = TicketRepository()
