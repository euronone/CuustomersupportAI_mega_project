"use client";

import { TicketCard } from "./ticket-card";
import type { Ticket, TicketStatus } from "@/types";
import { TICKET_STATUS_LABELS } from "@/lib/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { Ticket as TicketIcon } from "lucide-react";

interface TicketListProps {
  tickets: Ticket[];
  activeFilter: TicketStatus | "all";
  onFilterChange: (filter: TicketStatus | "all") => void;
}

const filters: (TicketStatus | "all")[] = [
  "all",
  "open",
  "pending",
  "resolved",
  "closed",
];

export function TicketList({
  tickets,
  activeFilter,
  onFilterChange,
}: TicketListProps) {
  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-surface border border-border rounded-lg p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeFilter === f
                ? "bg-brand text-white"
                : "text-text-muted hover:text-text-primary hover:bg-bg"
            }`}
          >
            {f === "all" ? "All" : TICKET_STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title="No tickets found"
          description="Tickets created from conversations will appear here."
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
