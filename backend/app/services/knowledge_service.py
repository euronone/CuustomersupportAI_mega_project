import uuid
import logging
from datetime import datetime, timezone

from app.repositories.knowledge_repo import knowledge_doc_repo, knowledge_chunk_repo
from app.core.exceptions import NotFoundException

logger = logging.getLogger("euron.knowledge")


def list_documents(tenant_id: str) -> tuple[list[dict], int]:
    return knowledge_doc_repo.list(tenant_id)


def get_document(doc_id: str, tenant_id: str) -> dict:
    doc = knowledge_doc_repo.get_by_id(doc_id, tenant_id)
    if not doc:
        raise NotFoundException("Document", doc_id)
    return doc


def create_document(tenant_id: str, title: str, source_type: str, source_ref: str | None = None) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return knowledge_doc_repo.create({
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "title": title,
        "source_type": source_type,
        "source_ref": source_ref,
        "status": "pending",
        "version": 1,
        "created_at": now,
        "updated_at": now,
    })


def delete_document(doc_id: str, tenant_id: str) -> None:
    get_document(doc_id, tenant_id)
    knowledge_chunk_repo.delete_by_document(doc_id, tenant_id)
    knowledge_doc_repo.soft_delete(doc_id, tenant_id)
    logger.info("document_deleted", extra={"doc_id": doc_id, "tenant_id": tenant_id})
