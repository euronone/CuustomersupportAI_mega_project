from fastapi import APIRouter, Depends, UploadFile, File, Form

from app.schemas.knowledge import (
    KnowledgeDocumentResponse,
    CollectionResponse,
    CreateCollectionRequest,
    IngestUrlRequest,
)
from app.schemas.common import ApiResponse, PaginatedResponse
from app.core.security import get_current_user, require_role
from app.services import knowledge_service

router = APIRouter()


@router.get("/documents", response_model=PaginatedResponse[KnowledgeDocumentResponse])
async def list_documents(current_user: dict = Depends(get_current_user)):
    docs, total = knowledge_service.list_documents(current_user["tenant_id"])
    return PaginatedResponse(data=docs, total=total)


@router.post(
    "/documents",
    response_model=ApiResponse[KnowledgeDocumentResponse],
    status_code=201,
)
async def upload_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role("admin", "agent")),
):
    # Create document record (status=pending)
    doc = knowledge_service.create_document(
        tenant_id=current_user["tenant_id"],
        title=title,
        source_type="upload",
        source_ref=file.filename,
    )

    # TODO: Save file to S3, then trigger async ingestion worker
    # For now, the document stays in "pending" status until the worker processes it

    return ApiResponse(data=doc)


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(
    doc_id: str,
    current_user: dict = Depends(require_role("admin")),
):
    knowledge_service.delete_document(doc_id, current_user["tenant_id"])


@router.post(
    "/ingest-url",
    response_model=ApiResponse[KnowledgeDocumentResponse],
    status_code=201,
)
async def ingest_url(
    body: IngestUrlRequest,
    current_user: dict = Depends(require_role("admin", "agent")),
):
    doc = knowledge_service.create_document(
        tenant_id=current_user["tenant_id"],
        title=body.url,
        source_type="url",
        source_ref=body.url,
    )
    # TODO: Trigger async URL scraping + ingestion worker
    return ApiResponse(data=doc)


@router.get("/collections", response_model=PaginatedResponse[CollectionResponse])
async def list_collections(current_user: dict = Depends(get_current_user)):
    # TODO: Implement collection repository
    return PaginatedResponse(data=[], total=0)


@router.post(
    "/collections",
    response_model=ApiResponse[CollectionResponse],
    status_code=201,
)
async def create_collection(
    body: CreateCollectionRequest,
    current_user: dict = Depends(require_role("admin")),
):
    # TODO: Implement collection creation
    return ApiResponse(data={"id": "", "tenant_id": "", "name": body.name, "created_at": ""})
