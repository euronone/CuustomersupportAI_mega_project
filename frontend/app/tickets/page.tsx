"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TicketList } from "@/components/tickets/ticket-list";
import { Button } from "@/components/ui/button";
import type { Ticket, TicketStatus } from "@/types";
import { Plus } from "lucide-react";

// Mock data — will be replaced by API calls
const mockTickets: Ticket[] = [
  {
    id: "t-1",
    tenant_id: "demo",
    customer_id: "c-1",
    subject: "Unable to access dashboard after password reset",
    status: "open",
    priority: "high",
    assigned_agent_id: "a-1",
    summary:
      "Customer reset their password but is now getting a 403 error when trying to access the main dashboard.",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
    assigned_agent: {
      id: "a-1",
      tenant_id: "demo",
      user_id: "u-1",
      display_name: "Sarah Chen",
      status: "available",
      skills: ["auth", "billing"],
      active_tickets: 3,
      created_at: "",
      updated_at: "",
    },
  },
  {
    id: "t-2",
    tenant_id: "demo",
    customer_id: "c-2",
    subject: "Billing discrepancy on March invoice",
    status: "pending",
    priority: "medium",
    summary: "Customer was charged twice for the Pro plan subscription.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: "t-3",
    tenant_id: "demo",
    customer_id: "c-3",
    subject: "Feature request: Export reports to PDF",
    status: "resolved",
    priority: "low",
    summary: "Customer would like the ability to export analytics reports as PDF files.",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function TicketsPage() {
  const [filter, setFilter] = useState<TicketStatus | "all">("all");

  const filteredTickets =
    filter === "all"
      ? mockTickets
      : mockTickets.filter((t) => t.status === filter);

  return (
    <AppShell role="user" pageTitle="Tickets" userName="Demo User">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-text-muted">
            {mockTickets.length} total tickets
          </p>
        </div>
        <Button size="sm">
          <Plus size={16} />
          New Ticket
        </Button>
      </div>

      <TicketList
        tickets={filteredTickets}
        activeFilter={filter}
        onFilterChange={setFilter}
      />
    </AppShell>
  );
}
