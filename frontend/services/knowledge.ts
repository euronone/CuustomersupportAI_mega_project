import { api } from "@/lib/api";
import type {
  KnowledgeDocument,
  KnowledgeCollection,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

export const knowledgeService = {
  async listDocuments(): Promise<PaginatedResponse<KnowledgeDocument>> {
    return api.get("/knowledge/documents");
  },

  async uploadDocument(
    title: string,
    file: File
  ): Promise<ApiResponse<KnowledgeDocument>> {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);
    return api.upload("/knowledge/documents", formData);
  },

  async deleteDocument(id: string): Promise<void> {
    return api.delete(`/knowledge/documents/${id}`);
  },

  async ingestUrl(url: string): Promise<ApiResponse<KnowledgeDocument>> {
    return api.post("/knowledge/ingest-url", { url });
  },

  async listCollections(): Promise<PaginatedResponse<KnowledgeCollection>> {
    return api.get("/knowledge/collections");
  },

  async createCollection(
    name: string,
    description?: string
  ): Promise<ApiResponse<KnowledgeCollection>> {
    return api.post("/knowledge/collections", { name, description });
  },
};
