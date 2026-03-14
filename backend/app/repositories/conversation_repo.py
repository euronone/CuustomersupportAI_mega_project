from __future__ import annotations
from typing import Optional
from app.integrations.supabase_client import get_supabase


class ConversationRepository:
    def __init__(self):
        self.table = "conversations"

    def get_by_id(self, conversation_id: str, tenant_id: str) -> Optional[dict]:
        result = (
            get_supabase()
            .table(self.table)
            .select("*")
            .eq("id", conversation_id)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def list(
        self,
        tenant_id: str,
        status: Optional[str] = None,
        customer_id: Optional[str] = None,
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
        if customer_id:
            query = query.eq("customer_id", customer_id)

        result = query.execute()
        return result.data, result.count or 0

    def create(self, data: dict) -> dict:
        result = get_supabase().table(self.table).insert(data).execute()
        return result.data[0]

    def update(self, conversation_id: str, tenant_id: str, data: dict) -> dict:
        result = (
            get_supabase()
            .table(self.table)
            .update(data)
            .eq("id", conversation_id)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        return result.data[0]

    def count_active(self, tenant_id: str) -> int:
        result = (
            get_supabase()
            .table(self.table)
            .select("id", count="exact")
            .eq("tenant_id", tenant_id)
            .eq("status", "open")
            .execute()
        )
        return result.count or 0


conversation_repo = ConversationRepository()
