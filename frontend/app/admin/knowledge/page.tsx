"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  Upload,
  FileText,
  Globe,
  Trash2,
  BookOpen,
  MoreVertical,
} from "lucide-react";
import type { KnowledgeDocument, DocumentStatus } from "@/types";
import { DOCUMENT_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<DocumentStatus, BadgeVariant> = {
  pending: "default",
  processing: "warning",
  ready: "success",
  failed: "error",
};

// Mock data
const mockDocuments: KnowledgeDocument[] = [
  {
    id: "d-1",
    tenant_id: "demo",
    title: "Getting Started Guide",
    source_type: "upload",
    status: "ready",
    version: 3,
    chunk_count: 42,
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "d-2",
    tenant_id: "demo",
    title: "API Documentation v2",
    source_type: "url",
    source_ref: "https://docs.example.com/api",
    status: "ready",
    version: 1,
    chunk_count: 156,
    created_at: new Date(Date.now() - 432000000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "d-3",
    tenant_id: "demo",
    title: "FAQ - Billing & Payments",
    source_type: "upload",
    status: "processing",
    version: 1,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export default function KnowledgeBasePage() {
  const [showUpload, setShowUpload] = useState(false);
  const [documents] = useState(mockDocuments);

  return (
    <AppShell role="admin" pageTitle="Knowledge Base" userName="Admin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-text-muted">
            {documents.length} documents &middot;{" "}
            {documents.reduce((s, d) => s + (d.chunk_count || 0), 0)} chunks
            indexed
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Globe size={16} />
            Ingest URL
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Upload size={16} />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No documents yet"
          description="Upload documents or ingest URLs to build your knowledge base for AI-powered responses."
          action={
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Upload size={16} />
              Upload First Document
            </Button>
          }
        />
      ) : (
        <Card padding="none">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-bg border-b border-border text-xs font-medium text-text-muted uppercase tracking-wider">
            <div className="col-span-5">Document</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Chunks</div>
            <div className="col-span-2">Updated</div>
            <div className="col-span-1"></div>
          </div>

          {documents.map((doc, i) => (
            <div
              key={doc.id}
              className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-bg transition-colors ${
                i < documents.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  {doc.source_type === "url" ? (
                    <Globe size={16} className="text-brand" />
                  ) : (
                    <FileText size={16} className="text-brand" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {doc.title}
                  </p>
                  <p className="text-xs text-text-muted">v{doc.version}</p>
                </div>
              </div>
              <div className="col-span-2">
                <Badge variant={statusVariant[doc.status]}>
                  {DOCUMENT_STATUS_LABELS[doc.status]}
                </Badge>
              </div>
              <div className="col-span-2 text-sm text-text-muted">
                {doc.chunk_count ?? "—"}
              </div>
              <div className="col-span-2 text-sm text-text-muted">
                {formatDate(doc.updated_at)}
              </div>
              <div className="col-span-1 flex justify-end">
                <button className="p-1.5 text-text-muted hover:text-error rounded-md hover:bg-bg transition-colors cursor-pointer">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Upload modal */}
      <Modal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="Upload Document"
      >
        <div className="space-y-4">
          <Input label="Document title" placeholder="e.g. Product FAQ" />
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-primary font-medium">
              Drop a file here or click to browse
            </p>
            <p className="text-xs text-text-muted mt-1">
              PDF, TXT, MD up to 10MB
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowUpload(false)}
            >
              Cancel
            </Button>
            <Button>Upload & Process</Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
