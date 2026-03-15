"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner, PageLoader } from "@/components/ui/spinner";
import { useUser } from "@/hooks/useUser";
import { knowledgeService } from "@/services/knowledge";
import {
  Upload,
  FileText,
  Globe,
  Trash2,
  BookOpen,
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

export default function KnowledgeBasePage() {
  const { user, loading: userLoading } = useUser("admin");
  const [showUpload, setShowUpload] = useState(false);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [ingestingUrl, setIngestingUrl] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const res = await knowledgeService.listDocuments();
      setDocuments((res as { data: KnowledgeDocument[] }).data || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function handleUpload() {
    if (!title.trim() || !file || uploading) return;
    setUploading(true);
    try {
      await knowledgeService.uploadDocument(title, file);
      setShowUpload(false);
      setTitle("");
      setFile(null);
      fetchDocuments();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleIngestUrl() {
    if (!urlInput.trim() || ingestingUrl) return;
    setIngestingUrl(true);
    try {
      await knowledgeService.ingestUrl(urlInput);
      setShowUrlModal(false);
      setUrlInput("");
      fetchDocuments();
    } catch (err) {
      console.error("URL ingestion failed:", err);
    } finally {
      setIngestingUrl(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await knowledgeService.deleteDocument(id);
      fetchDocuments();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  if (userLoading) return <PageLoader />;

  return (
    <AppShell role="admin" pageTitle="Knowledge Base" userName={user?.display_name || "Admin"}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-text-muted">
            {documents.length} documents &middot;{" "}
            {documents.reduce((s, d) => s + (d.chunk_count || 0), 0)} chunks indexed
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowUrlModal(true)}>
            <Globe size={16} />
            Ingest URL
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Upload size={16} />
            Upload Document
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No documents yet"
          description="Upload documents or ingest URLs to build your knowledge base for AI-powered responses."
          action={{ label: "Upload First Document", onClick: () => setShowUpload(true) }}
        />
      ) : (
        <Card padding="none">
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
                  <p className="text-sm font-medium text-text-primary truncate">{doc.title}</p>
                  <p className="text-xs text-text-muted">v{doc.version}</p>
                </div>
              </div>
              <div className="col-span-2">
                <Badge variant={statusVariant[doc.status]}>
                  {DOCUMENT_STATUS_LABELS[doc.status]}
                </Badge>
              </div>
              <div className="col-span-2 text-sm text-text-muted">{doc.chunk_count ?? "--"}</div>
              <div className="col-span-2 text-sm text-text-muted">{formatDate(doc.updated_at)}</div>
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 text-text-muted hover:text-error rounded-md hover:bg-bg transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Upload modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Document">
        <div className="space-y-4">
          <Input
            label="Document title"
            placeholder="e.g. Product FAQ"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-brand/30 transition-colors"
          >
            <Upload size={32} className="mx-auto text-text-muted mb-3" />
            {file ? (
              <p className="text-sm text-text-primary font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-sm text-text-primary font-medium">
                  Drop a file here or click to browse
                </p>
                <p className="text-xs text-text-muted mt-1">PDF, TXT, MD up to 10MB</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} loading={uploading} disabled={!title.trim() || !file}>
              Upload & Process
            </Button>
          </div>
        </div>
      </Modal>

      {/* URL Ingest modal */}
      <Modal isOpen={showUrlModal} onClose={() => setShowUrlModal(false)} title="Ingest from URL">
        <div className="space-y-4">
          <Input
            label="URL"
            placeholder="https://docs.example.com/article"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowUrlModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleIngestUrl}
              loading={ingestingUrl}
              disabled={!urlInput.trim()}
            >
              Ingest
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
