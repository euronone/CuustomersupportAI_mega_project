"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TicketList } from "@/components/tickets/ticket-list";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/spinner";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import {
  Sparkles,
  FileText,
  AlertCircle,
  Ticket as TicketIcon,
  BookOpen,
} from "lucide-react";
import type { Ticket, TicketStatus } from "@/types";

// Mock data — will be replaced by API calls with agent filter
const mockAgentTickets: Ticket[] = [
  {
    id: "t-1",
    tenant_id: "demo",
    customer_id: "c-1",
    conversation_id: "conv-1",
    subject: "Unable to access dashboard after password reset",
    status: "open",
    priority: "high",
    assigned_agent_id: "a-1",
    summary:
      "Customer reset password but getting 403 on dashboard. Tried clearing cache and re-logging.",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
    assigned_agent: {
      id: "a-1",
      tenant_id: "demo",
      user_id: "u-1",
      display_name: "You",
      status: "available",
      skills: ["auth", "billing"],
      active_tickets: 5,
      created_at: "",
      updated_at: "",
    },
  },
  {
    id: "t-2",
    tenant_id: "demo",
    customer_id: "c-2",
    conversation_id: "conv-2",
    subject: "Billing discrepancy on March invoice",
    status: "pending",
    priority: "medium",
    assigned_agent_id: "a-1",
    summary: "Customer charged twice for Pro plan subscription in March.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
    assigned_agent: {
      id: "a-1",
      tenant_id: "demo",
      user_id: "u-1",
      display_name: "You",
      status: "available",
      skills: ["auth", "billing"],
      active_tickets: 5,
      created_at: "",
      updated_at: "",
    },
  },
  {
    id: "t-3",
    tenant_id: "demo",
    customer_id: "c-3",
    conversation_id: "conv-3",
    subject: "Payment failure - not processed but charged",
    status: "open",
    priority: "urgent",
    assigned_agent_id: "a-1",
    summary:
      "Payment failed but customer was still charged. Needs refund investigation.",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    assigned_agent: {
      id: "a-1",
      tenant_id: "demo",
      user_id: "u-1",
      display_name: "You",
      status: "available",
      skills: ["auth", "billing"],
      active_tickets: 5,
      created_at: "",
      updated_at: "",
    },
  },
  {
    id: "t-4",
    tenant_id: "demo",
    customer_id: "c-4",
    conversation_id: "conv-4",
    subject: "Cannot export reports to PDF format",
    status: "open",
    priority: "low",
    assigned_agent_id: "a-1",
    summary:
      "Export button in analytics section does not trigger PDF download.",
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    assigned_agent: {
      id: "a-1",
      tenant_id: "demo",
      user_id: "u-1",
      display_name: "You",
      status: "available",
      skills: ["auth", "billing"],
      active_tickets: 5,
      created_at: "",
      updated_at: "",
    },
  },
  {
    id: "t-5",
    tenant_id: "demo",
    customer_id: "c-5",
    subject: "API rate limiting too aggressive for batch operations",
    status: "resolved",
    priority: "medium",
    assigned_agent_id: "a-1",
    summary:
      "Customer running batch imports hitting rate limit. Resolved by increasing tier limit.",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    assigned_agent: {
      id: "a-1",
      tenant_id: "demo",
      user_id: "u-1",
      display_name: "You",
      status: "available",
      skills: ["auth", "billing"],
      active_tickets: 5,
      created_at: "",
      updated_at: "",
    },
  },
];

export default function AgentTicketsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copilotTicketId, setCopilotTicketId] = useState<string | null>(null);
  const [copilotAction, setCopilotAction] = useState<
    "suggest" | "summarize" | null
  >(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading agent tickets
    // In production, fetch from /tickets?assigned_agent_id=me
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const agentName = user?.display_name || "Agent";

  const filteredTickets =
    filter === "all"
      ? mockAgentTickets
      : mockAgentTickets.filter((t) => t.status === filter);

  const handleCopilotAction = useCallback(
    async (ticketId: string, action: "suggest" | "summarize") => {
      setCopilotTicketId(ticketId);
      setCopilotAction(action);
      setCopilotLoading(true);
      setCopilotResult(null);

      try {
        // In production, call copilotService.suggestReply or copilotService.summarize
        // Simulating API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const ticket = mockAgentTickets.find((t) => t.id === ticketId);
        if (action === "suggest") {
          setCopilotResult(
            `Based on the knowledge base, here is a suggested reply for "${ticket?.subject}":\n\nDear customer, thank you for reaching out. I've reviewed your case and would like to help resolve this. Could you please provide the following details so I can investigate further:\n\n1. Your account email address\n2. The exact error message you are seeing\n3. When the issue first started\n\nThis will help me diagnose and resolve the issue promptly.`
          );
        } else {
          setCopilotResult(
            `Summary for "${ticket?.subject}":\n\nThe customer is experiencing an issue related to ${ticket?.summary || "their account"}. Priority: ${ticket?.priority}. Current status: ${ticket?.status}.\n\nKey points:\n- Issue reported ${ticket?.created_at ? "recently" : "unknown time"}\n- ${ticket?.priority === "urgent" || ticket?.priority === "high" ? "Requires immediate attention" : "Standard resolution timeline"}\n- Customer communication has been professional`
          );
        }
      } catch {
        setCopilotResult("Failed to generate response. Please try again.");
      } finally {
        setCopilotLoading(false);
      }
    },
    []
  );

  const closeCopilotPanel = useCallback(() => {
    setCopilotTicketId(null);
    setCopilotAction(null);
    setCopilotResult(null);
    setCopilotLoading(false);
  }, []);

  if (authLoading || loading) {
    return (
      <AppShell role="agent" pageTitle="My Tickets" userName={agentName}>
        <PageLoader />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell role="agent" pageTitle="My Tickets" userName={agentName}>
        <EmptyState
          icon={AlertCircle}
          title="Failed to load tickets"
          description={error}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell role="agent" pageTitle="My Tickets" userName={agentName}>
      {/* Header with count and copilot actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-text-muted">
            {mockAgentTickets.length} tickets assigned to you
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main ticket list */}
        <div className={copilotTicketId ? "flex-1 min-w-0" : "w-full"}>
          <TicketList
            tickets={filteredTickets}
            activeFilter={filter}
            onFilterChange={setFilter}
          />

          {/* Copilot action buttons per ticket */}
          {filteredTickets.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Copilot Actions
              </h3>
              <div className="space-y-2">
                {filteredTickets.map((ticket) => (
                  <div
                    key={`copilot-${ticket.id}`}
                    className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-text-muted">
                        {ticket.id}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleCopilotAction(ticket.id, "suggest")
                        }
                        disabled={
                          copilotLoading && copilotTicketId === ticket.id
                        }
                      >
                        <Sparkles size={14} />
                        Suggest Reply
                      </Button>
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() =>
                          handleCopilotAction(ticket.id, "summarize")
                        }
                        disabled={
                          copilotLoading && copilotTicketId === ticket.id
                        }
                      >
                        <FileText size={14} />
                        Summarize
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Copilot result panel */}
        {copilotTicketId && (
          <div className="w-96 shrink-0">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center">
                    {copilotAction === "suggest" ? (
                      <Sparkles size={16} className="text-brand" />
                    ) : (
                      <FileText size={16} className="text-brand" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {copilotAction === "suggest"
                        ? "Suggested Reply"
                        : "Ticket Summary"}
                    </h3>
                    <p className="text-xs text-text-muted">AI Copilot</p>
                  </div>
                </div>
                <button
                  onClick={closeCopilotPanel}
                  className="text-text-muted hover:text-text-primary text-sm cursor-pointer"
                >
                  Close
                </button>
              </div>

              {copilotLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Spinner size="md" />
                  <p className="text-sm text-text-muted mt-3">
                    {copilotAction === "suggest"
                      ? "Generating suggested reply..."
                      : "Generating summary..."}
                  </p>
                </div>
              ) : copilotResult ? (
                <div>
                  <div className="bg-bg rounded-lg p-4 mb-4">
                    <p className="text-sm text-text-primary whitespace-pre-line leading-relaxed">
                      {copilotResult}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {copilotAction === "suggest" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          // In production, copy to reply box or open ticket
                          navigator.clipboard?.writeText(copilotResult);
                        }}
                      >
                        Copy Reply
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        handleCopilotAction(copilotTicketId, copilotAction!)
                      }
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* KB retrieval section */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={14} className="text-brand" />
                  <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                    Related KB Articles
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-md bg-bg">
                    <p className="text-xs font-medium text-brand">
                      Password Reset Troubleshooting
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Steps to resolve common 403 errors after reset
                    </p>
                  </div>
                  <div className="p-2.5 rounded-md bg-bg">
                    <p className="text-xs font-medium text-brand">
                      Account Access FAQ
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Common account access issues and solutions
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
