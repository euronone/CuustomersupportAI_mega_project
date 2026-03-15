"""Tests for the /api/v1/knowledge endpoints."""

import pytest
from unittest.mock import patch

from app.tests.conftest import (
    ADMIN_TOKEN,
    AGENT_TOKEN,
    CUSTOMER_TOKEN,
    TENANT_ID,
    auth_header,
    NOW_ISO,
)

pytestmark = pytest.mark.asyncio

DOC_ID = "doc-001"

SAMPLE_DOC = {
    "id": DOC_ID,
    "tenant_id": TENANT_ID,
    "title": "Getting Started Guide",
    "source_type": "upload",
    "source_ref": "getting-started.pdf",
    "status": "pending",
    "version": 1,
    "chunk_count": None,
    "created_at": NOW_ISO,
    "updated_at": NOW_ISO,
}


class TestListDocuments:

    async def test_list_documents_success(self, client, mock_supabase):
        with patch("app.services.knowledge_service.knowledge_doc_repo") as repo:
            repo.list.return_value = ([SAMPLE_DOC], 1)

            resp = await client.get(
                "/api/v1/knowledge/documents",
                headers=auth_header(ADMIN_TOKEN),
            )

        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert body["data"][0]["title"] == "Getting Started Guide"

    async def test_list_documents_empty(self, client, mock_supabase):
        with patch("app.services.knowledge_service.knowledge_doc_repo") as repo:
            repo.list.return_value = ([], 0)

            resp = await client.get(
                "/api/v1/knowledge/documents",
                headers=auth_header(CUSTOMER_TOKEN),
            )

        assert resp.status_code == 200
        assert resp.json()["total"] == 0


class TestUploadDocument:

    async def test_upload_document_success(self, client, mock_supabase):
        with patch("app.services.knowledge_service.knowledge_doc_repo") as repo:
            repo.create.return_value = SAMPLE_DOC

            resp = await client.post(
                "/api/v1/knowledge/documents",
                data={"title": "Getting Started Guide"},
                files={"file": ("getting-started.pdf", b"fake pdf content", "application/pdf")},
                headers=auth_header(ADMIN_TOKEN),
            )

        assert resp.status_code == 201
        assert resp.json()["data"]["status"] == "pending"

    async def test_upload_document_agent_allowed(self, client, mock_supabase):
        with patch("app.services.knowledge_service.knowledge_doc_repo") as repo:
            repo.create.return_value = SAMPLE_DOC

            resp = await client.post(
                "/api/v1/knowledge/documents",
                data={"title": "Agent Doc"},
                files={"file": ("doc.pdf", b"data", "application/pdf")},
                headers=auth_header(AGENT_TOKEN),
            )

        assert resp.status_code == 201

    async def test_upload_document_customer_denied(self, client, mock_supabase):
        resp = await client.post(
            "/api/v1/knowledge/documents",
            data={"title": "Denied"},
            files={"file": ("doc.pdf", b"data", "application/pdf")},
            headers=auth_header(CUSTOMER_TOKEN),
        )
        assert resp.status_code == 403


class TestDeleteDocument:

    async def test_delete_document_success(self, client, mock_supabase):
        with patch("app.services.knowledge_service.knowledge_doc_repo") as doc_repo, \
             patch("app.services.knowledge_service.knowledge_chunk_repo") as chunk_repo:
            doc_repo.get_by_id.return_value = SAMPLE_DOC
            doc_repo.update.return_value = SAMPLE_DOC
            chunk_repo.delete_by_document.return_value = None

            resp = await client.delete(
                f"/api/v1/knowledge/documents/{DOC_ID}",
                headers=auth_header(ADMIN_TOKEN),
            )

        assert resp.status_code == 204

    async def test_delete_document_not_found(self, client, mock_supabase):
        with patch("app.services.knowledge_service.knowledge_doc_repo") as doc_repo:
            doc_repo.get_by_id.return_value = None

            resp = await client.delete(
                "/api/v1/knowledge/documents/nonexistent",
                headers=auth_header(ADMIN_TOKEN),
            )

        assert resp.status_code == 404

    async def test_delete_document_non_admin_denied(self, client, mock_supabase):
        resp = await client.delete(
            f"/api/v1/knowledge/documents/{DOC_ID}",
            headers=auth_header(AGENT_TOKEN),
        )
        assert resp.status_code == 403


class TestListCollections:

    async def test_list_collections_returns_empty(self, client, mock_supabase):
        resp = await client.get(
            "/api/v1/knowledge/collections",
            headers=auth_header(ADMIN_TOKEN),
        )
        assert resp.status_code == 200
        assert resp.json()["total"] == 0
