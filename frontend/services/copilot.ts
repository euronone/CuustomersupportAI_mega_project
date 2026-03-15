import { api } from "@/lib/api";
import type { ApiResponse, SuggestedReply, TicketSummary, KBSnippet } from "@/types";

export const copilotService = {
  async suggestReply(
    ticketId: string,
    conversationId: string
  ): Promise<ApiResponse<SuggestedReply>> {
    return api.post("/copilot/suggest-reply", {
      ticket_id: ticketId,
      conversation_id: conversationId,
    });
  },

  async summarize(
    ticketId: string,
    conversationId: string
  ): Promise<ApiResponse<TicketSummary>> {
    return api.post("/copilot/summarize", {
      ticket_id: ticketId,
      conversation_id: conversationId,
    });
  },

  async retrieveKB(query: string): Promise<ApiResponse<KBSnippet[]>> {
    return api.post("/copilot/retrieve-kb", { query });
  },
};
