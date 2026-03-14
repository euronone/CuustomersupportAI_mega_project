"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Ticket, PaginatedResponse, TicketStatus } from "@/types";

interface UseTicketsOptions {
  status?: TicketStatus;
  page?: number;
}

export function useTickets(options: UseTicketsOptions = {}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {};
      if (options.status) params.status = options.status;
      if (options.page) params.page = String(options.page);

      const res = await api.get<PaginatedResponse<Ticket>>("/tickets", params);
      setTickets(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [options.status, options.page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, total, loading, error, refetch: fetchTickets };
}
