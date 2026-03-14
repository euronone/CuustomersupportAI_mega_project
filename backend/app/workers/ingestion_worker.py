"""
Async document ingestion worker.

Pipeline: Parse document -> Chunk text -> Generate embeddings -> Store in pgvector

This can be run as a background task or separate worker process.
For MVP, it's called directly after document upload. In production,
it should consume from a Redis queue or SQS.
"""

import uuid
import logging
from datetime import datetime, timezone

from app.core.config import settings
from app.integrations.openai_client import generate_embedding
from app.repositories.knowledge_repo import knowledge_doc_repo, knowledge_chunk_repo

logger = logging.getLogger("euron.ingestion")


def chunk_text(text: str, chunk_size: int | None = None, overlap: int | None = None) -> list[str]:
    """Split text into overlapping chunks."""
    size = chunk_size or settings.CHUNK_SIZE
    ovlp = overlap or settings.CHUNK_OVERLAP

    if len(text) <= size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk.strip())
        start = end - ovlp

    return chunks


def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    try:
        from pypdf import PdfReader
        from io import BytesIO

        reader = PdfReader(BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error("PDF parsing failed", extra={"error": str(e)})
        raise


async def ingest_document(
    document_id: str,
    tenant_id: str,
    content: str,
    title: str = "",
) -> int:
    """
    Full ingestion pipeline for a document.

    1. Update status to 'processing'
    2. Chunk the content
    3. Generate embeddings for each chunk
    4. Store chunks with embeddings in pgvector
    5. Update document status to 'ready' (or 'failed')

    Returns the number of chunks created.
    """
    now = datetime.now(timezone.utc).isoformat()

    # Mark as processing
    knowledge_doc_repo.update(document_id, tenant_id, {
        "status": "processing",
        "updated_at": now,
    })

    try:
        # Chunk the content
        chunks = chunk_text(content)
        logger.info(
            "chunking_complete",
            extra={"document_id": document_id, "chunk_count": len(chunks)},
        )

        # Generate embeddings and prepare records
        chunk_records = []
        for i, chunk_content in enumerate(chunks):
            embedding = await generate_embedding(chunk_content)
            chunk_records.append({
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "document_id": document_id,
                "content": chunk_content,
                "embedding": embedding,
                "chunk_index": i,
                "metadata": {"title": title, "chunk_index": i},
                "created_at": now,
            })

        # Store all chunks
        if chunk_records:
            knowledge_chunk_repo.create_many(chunk_records)

        # Mark as ready
        knowledge_doc_repo.update(document_id, tenant_id, {
            "status": "ready",
            "chunk_count": len(chunk_records),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })

        logger.info(
            "ingestion_complete",
            extra={
                "document_id": document_id,
                "chunks_created": len(chunk_records),
            },
        )

        return len(chunk_records)

    except Exception as e:
        logger.error(
            "ingestion_failed",
            extra={"document_id": document_id, "error": str(e)},
        )
        knowledge_doc_repo.update(document_id, tenant_id, {
            "status": "failed",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        raise
