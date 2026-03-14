import { Card } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";
import { TICKET_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import type { Ticket } from "@/types";
import Link from "next/link";
import { Clock } from "lucide-react";

const statusVariant: Record<string, BadgeVariant> = {
  open: "brand",
  pending: "warning",
  resolved: "success",
  closed: "default",
};

const priorityVariant: Record<string, BadgeVariant> = {
  low: "default",
  medium: "brand",
  high: "warning",
  urgent: "error",
};

interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card
        padding="none"
        className="p-4 hover:border-brand/30 transition-colors cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-text-primary truncate">
              {ticket.subject}
            </h4>
            {ticket.summary && (
              <p className="text-xs text-text-muted mt-1 line-clamp-2">
                {ticket.summary}
              </p>
            )}

            <div className="flex items-center gap-3 mt-3">
              <Badge variant={statusVariant[ticket.status]}>
                {TICKET_STATUS_LABELS[ticket.status]}
              </Badge>
              <Badge variant={priorityVariant[ticket.priority]}>
                {PRIORITY_LABELS[ticket.priority]}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Clock size={12} />
                {formatRelativeTime(ticket.created_at)}
              </span>
            </div>
          </div>

          {ticket.assigned_agent && (
            <Avatar
              name={ticket.assigned_agent.display_name}
              size="sm"
            />
          )}
        </div>
      </Card>
    </Link>
  );
}
