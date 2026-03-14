import { api } from "@/lib/api";
import type {
  Ticket,
  PaginatedResponse,
  ApiResponse,
  TicketStatus,
  TicketPriority,
} from "@/types";

interface CreateTicketData {
  subject: string;
  conversation_id?: string;
  customer_id: string;
  priority?: TicketPriority;
}

interface UpdateTicketData {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_agent_id?: string;
}

export const ticketService = {
  async list(params?: {
    status?: TicketStatus;
    cursor?: string;
  }): Promise<PaginatedResponse<Ticket>> {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.cursor) queryParams.cursor = params.cursor;
    return api.get("/tickets", queryParams);
  },

  async get(id: string): Promise<ApiResponse<Ticket>> {
    return api.get(`/tickets/${id}`);
  },

  async create(data: CreateTicketData): Promise<ApiResponse<Ticket>> {
    return api.post("/tickets", data);
  },

  async update(
    id: string,
    data: UpdateTicketData
  ): Promise<ApiResponse<Ticket>> {
    return api.patch(`/tickets/${id}`, data);
  },

  async addMessage(
    ticketId: string,
    content: string
  ): Promise<ApiResponse<{ id: string }>> {
    return api.post(`/tickets/${ticketId}/messages`, { content });
  },
};
