import { api } from "@/lib/api";
import type { Agent, ApiResponse, PaginatedResponse } from "@/types";

interface AIConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
}

interface UpdateAgentData {
  status?: string;
  skills?: string[];
  display_name?: string;
}

export const adminService = {
  async listAgents(): Promise<PaginatedResponse<Agent>> {
    return api.get("/admin/agents");
  },

  async updateAgent(
    id: string,
    data: UpdateAgentData
  ): Promise<ApiResponse<Agent>> {
    return api.patch(`/admin/agents/${id}`, data);
  },

  async getAIConfig(): Promise<ApiResponse<AIConfig>> {
    return api.get("/admin/config/ai");
  },

  async updateAIConfig(data: Partial<AIConfig>): Promise<ApiResponse<AIConfig>> {
    return api.patch("/admin/config/ai", data);
  },
};
