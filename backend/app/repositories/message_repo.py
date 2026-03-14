from __future__ import annotations
from app.integrations.supabase_client import get_supabase


class MessageRepository:
    def __init__(self):
        self.table = "messages"

    def list_by_conversation(
        self,
        conversation_id: str,
        tenant_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        result = (
            get_supabase()
            .table(self.table)
            .select("*")
            .eq("conversation_id", conversation_id)
            .eq("tenant_id", tenant_id)
            .order("created_at", desc=False)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data

    def create(self, data: dict) -> dict:
        result = get_supabase().table(self.table).insert(data).execute()
        return result.data[0]


message_repo = MessageRepository()
