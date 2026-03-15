import { api } from "@/lib/api";
import type { ApiResponse, DashboardMetrics } from "@/types";

export const analyticsService = {
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    return api.get("/analytics/dashboard");
  },
};
