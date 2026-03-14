import { api } from "@/lib/api";
import type { ChatMessage, ApiResponse, PaginatedResponse } from "@/types";

export const chatService = {
  async getHistory(
    conversationId: string
  ): Promise<PaginatedResponse<ChatMessage>> {
    return api.get(`/chat/conversations/${conversationId}/history`);
  },

  async sendMessage(
    conversationId: string,
    content: string
  ): Promise<ApiResponse<ChatMessage>> {
    return api.post("/chat/completions", {
      conversation_id: conversationId,
      content,
    });
  },

  getWebSocketUrl(conversationId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    return `${baseUrl}/api/v1/ws/chat/${conversationId}`;
  },
};
