from __future__ import annotations
from typing import Optional
from app.integrations.supabase_client import get_supabase


class KnowledgeDocumentRepository:
    def __init__(self):
        self.table = "knowledge_documents"

    def get_by_id(self, doc_id: str, tenant_id: str) -> Optional[dict]:
        result = (
            get_supabase()
            .table(self.table)
            .select("*")
            .eq("id", doc_id)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def list(self, tenant_id: str, limit: int = 50, offset: int = 0) -> tuple[list[dict], int]:
        result = (
            get_supabase()
            .table(self.table)
            .select("*", count="exact")
            .eq("tenant_id", tenant_id)
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data, result.count or 0

    def create(self, data: dict) -> dict:
        result = get_supabase().table(self.table).insert(data).execute()
        return result.data[0]

    def update(self, doc_id: str, tenant_id: str, data: dict) -> dict:
        result = (
            get_supabase()
            .table(self.table)
            .update(data)
            .eq("id", doc_id)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        return result.data[0]

    def soft_delete(self, doc_id: str, tenant_id: str) -> None:
        from datetime import datetime, timezone
        self.update(doc_id, tenant_id, {"deleted_at": datetime.now(timezone.utc).isoformat()})


class KnowledgeChunkRepository:
    def __init__(self):
        self.table = "knowledge_chunks"

    def create_many(self, chunks: list[dict]) -> list[dict]:
        result = get_supabase().table(self.table).insert(chunks).execute()
        return result.data

    def delete_by_document(self, document_id: str, tenant_id: str) -> None:
        get_supabase().table(self.table).delete().eq(
            "document_id", document_id
        ).eq("tenant_id", tenant_id).execute()

    def search_similar(self, tenant_id: str, embedding: list[float], top_k: int = 5) -> list[dict]:
        """
        Calls a Supabase RPC function for vector similarity search.
        Requires a PostgreSQL function: match_knowledge_chunks(query_embedding, match_count, tenant_id)
        """
        result = get_supabase().rpc(
            "match_knowledge_chunks",
            {
                "query_embedding": embedding,
                "match_count": top_k,
                "p_tenant_id": tenant_id,
            },
        ).execute()
        return result.data


knowledge_doc_repo = KnowledgeDocumentRepository()
knowledge_chunk_repo = KnowledgeChunkRepository()
