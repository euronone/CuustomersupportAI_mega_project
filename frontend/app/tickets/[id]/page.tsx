"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Spinner, PageLoader } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { ticketService } from "@/services/tickets";
import { formatRelativeTime } from "@/lib/utils";
import { TICKET_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import type { Ticket, TicketStatus, TicketPriority } from "@/types";

interface TicketMessage {
  id: string;
  sender_type: "customer" | "agent" | "ai" | "system";
  sender_name?: string;
  content: string;
  created_at: string;
}

const statusBadgeVariant: Record<TicketStatus, "brand" | "warning" | "success" | "default"> = {
  open: "brand",
  pending: "warning",
  resolved: "success",
  closed: "default",
};

const priorityBadgeVariant: Record<TicketPriority, "default" | "warning" | "error" | "brand"> = {
  low: "default",
  medium: "brand",
  high: "warning",
  urgent: "error",
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestedReply, setSuggestedReply] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ticketService.get(ticketId);
      setTicket(res.data);

      // Fetch messages
      try {
        const msgRes = await ticketService.getMessages(ticketId);
        setMessages(msgRes.data || []);
      } catch {
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) fetchTicket();
  }, [ticketId, fetchTicket]);

  const handleSendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      await ticketService.addMessage(ticketId, reply);
      setReply("");
      setSuggestedReply(null);
      await fetchTicket();
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSending(false);
    }
  };

  const handleSuggestReply = async () => {
    setSuggesting(true);
    try {
      const { api } = await import("@/lib/api");
      const res = await api.post<{ data: { suggested_reply: string } }>("/copilot/suggest-reply", {
        ticket_id: ticketId,
      });
      setSuggestedReply(res.data.suggested_reply);
      setReply(res.data.suggested_reply);
    } catch {
      setSuggestedReply("Unable to generate suggestion at this time.");
    } finally {
      setSuggesting(false);
    }
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (updating) return;
    setUpdating(true);
    try {
      await ticketService.update(ticketId, { status });
      await fetchTicket();
    } catch (err) {
      console.error("Failed to update ticket:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (userLoading) return <PageLoader />;

  const role = user?.role || "customer";

  if (loading) {
    return (
      <AppShell role={role} pageTitle="Ticket Detail" userName={user?.display_name || "User"}>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  if (error || !ticket) {
    return (
      <AppShell role={role} pageTitle="Ticket Detail" userName={user?.display_name || "User"}>
        <EmptyState
          icon={AlertTriangle}
          title="Ticket not found"
          description={error || "The requested ticket could not be loaded."}
          action={{ label: "Back to Tickets", onClick: () => router.push("/tickets") }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell role={role} pageTitle="Ticket Detail" userName={user?.display_name || "User"}>
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-text-primary">{ticket.subject}</h2>
              <Badge variant={statusBadgeVariant[ticket.status]}>
                {TICKET_STATUS_LABELS[ticket.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Created {formatRelativeTime(ticket.created_at)}
              </span>
              <Badge variant={priorityBadgeVariant[ticket.priority]}>
                {PRIORITY_LABELS[ticket.priority]} priority
              </Badge>
            </div>
          </Card>

          {/* AI Summary */}
          {ticket.summary && (
            <Card className="bg-blue-50/50 border-brand/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-brand" />
                <span className="text-sm font-semibold text-brand">AI Summary</span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">{ticket.summary}</p>
            </Card>
          )}

          {/* Messages */}
          <Card padding="none">
            <div className="p-4 border-b border-border">
              <CardTitle>Conversation</CardTitle>
            </div>
            <div className="p-4 space-y-4">
              {messages.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <Avatar name={msg.sender_name || msg.sender_type} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {msg.sender_name || msg.sender_type}
                        </span>
                        {msg.sender_type === "ai" && <Badge variant="brand">AI</Badge>}
                        {msg.sender_type === "agent" && <Badge variant="success">Agent</Badge>}
                        <span className="text-xs text-text-muted">
                          {formatRelativeTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary mt-1 leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply box */}
            <div className="p-4 border-t border-border">
              {suggestedReply && (
                <div className="mb-3 p-3 bg-blue-50/50 border border-brand/20 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles size={12} className="text-brand" />
                    <span className="text-xs font-medium text-brand">AI Suggested Reply</span>
                  </div>
                  <p className="text-sm text-text-primary">{suggestedReply}</p>
                </div>
              )}
              <Textarea
                placeholder="Write a reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="flex items-center justify-between mt-3">
                {(role === "agent" || role === "admin") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSuggestReply}
                    loading={suggesting}
                    disabled={suggesting}
                  >
                    <Sparkles size={14} />
                    Suggest Reply
                  </Button>
                )}
                {role === "customer" && <div />}
                <Button
                  size="sm"
                  disabled={!reply.trim() || sending}
                  loading={sending}
                  onClick={handleSendReply}
                >
                  <Send size={14} />
                  Send Reply
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <dl className="space-y-3 text-sm">
              {ticket.customer && (
                <div>
                  <dt className="text-text-muted">Customer</dt>
                  <dd className="font-medium mt-0.5">{ticket.customer.display_name}</dd>
                  <dd className="text-xs text-text-muted">{ticket.customer.email}</dd>
                </div>
              )}
              {ticket.assigned_agent && (
                <div>
                  <dt className="text-text-muted">Assigned to</dt>
                  <dd className="flex items-center gap-2 mt-0.5">
                    <Avatar name={ticket.assigned_agent.display_name} size="sm" />
                    <span className="font-medium">{ticket.assigned_agent.display_name}</span>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-text-muted">Status</dt>
                <dd className="mt-0.5">
                  <Badge variant={statusBadgeVariant[ticket.status]}>
                    {TICKET_STATUS_LABELS[ticket.status]}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Priority</dt>
                <dd className="mt-0.5">
                  <Badge variant={priorityBadgeVariant[ticket.priority]}>
                    {PRIORITY_LABELS[ticket.priority]}
                  </Badge>
                </dd>
              </div>
              {ticket.sla_due_at && (
                <div>
                  <dt className="text-text-muted">SLA Due</dt>
                  <dd className="mt-0.5 text-sm">{formatRelativeTime(ticket.sla_due_at)}</dd>
                </div>
              )}
            </dl>
          </Card>

          {(role === "agent" || role === "admin") && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {ticket.status === "open" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleUpdateStatus("pending")}
                    disabled={updating}
                  >
                    Mark as Pending
                  </Button>
                )}
                {(ticket.status === "open" || ticket.status === "pending") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleUpdateStatus("resolved")}
                    disabled={updating}
                  >
                    <CheckCircle size={14} />
                    Mark as Resolved
                  </Button>
                )}
                {ticket.status !== "closed" && (
                  <Button
                    variant="tertiary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleUpdateStatus("closed")}
                    disabled={updating}
                  >
                    <XCircle size={14} />
                    Close Ticket
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
