"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import {
  Inbox,
  CheckCircle,
  Clock,
  Ticket,
  AlertCircle,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import type { DashboardMetrics } from "@/types";

// Mock data for agent-specific stats — will be replaced by API
const mockAgentStats = {
  assigned_tickets: 8,
  open_tickets: 5,
  resolved_today: 12,
  avg_response_time_minutes: 2.1,
};

const recentAssignedTickets = [
  {
    id: "t-1",
    subject: "Unable to access dashboard after password reset",
    status: "open" as const,
    priority: "high" as const,
    customer: "Alex Johnson",
    time: "12m ago",
    conversation_id: "c-1",
  },
  {
    id: "t-2",
    subject: "Billing discrepancy on March invoice",
    status: "pending" as const,
    priority: "medium" as const,
    customer: "Maria Santos",
    time: "1h ago",
    conversation_id: "c-2",
  },
  {
    id: "t-3",
    subject: "Payment failure - not processed",
    status: "open" as const,
    priority: "urgent" as const,
    customer: "James Wilson",
    time: "2h ago",
    conversation_id: "c-3",
  },
  {
    id: "t-4",
    subject: "Cannot export reports to PDF format",
    status: "open" as const,
    priority: "low" as const,
    customer: "Priya Sharma",
    time: "3h ago",
    conversation_id: "c-4",
  },
  {
    id: "t-5",
    subject: "API rate limiting too aggressive",
    status: "resolved" as const,
    priority: "medium" as const,
    customer: "David Park",
    time: "4h ago",
    conversation_id: "c-5",
  },
];

const statusVariant = {
  open: "brand" as const,
  pending: "warning" as const,
  resolved: "success" as const,
  closed: "default" as const,
};

const priorityIndicator: Record<string, string> = {
  urgent: "bg-error",
  high: "bg-error",
  medium: "bg-warning",
  low: "bg-text-muted",
};

export default function AgentDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading agent dashboard data
    // In production, fetch from /analytics/dashboard and /tickets?assigned_to=me
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const agentName = user?.display_name || "Agent";

  if (authLoading || loading) {
    return (
      <AppShell role="agent" pageTitle="Dashboard" userName={agentName}>
        <PageLoader />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell role="agent" pageTitle="Dashboard" userName={agentName}>
        <EmptyState
          icon={AlertCircle}
          title="Failed to load dashboard"
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

  const stats = [
    {
      title: "Assigned Tickets",
      value: mockAgentStats.assigned_tickets,
      icon: Ticket,
      subtitle: "Total assigned to you",
    },
    {
      title: "Open Tickets",
      value: mockAgentStats.open_tickets,
      icon: Inbox,
      subtitle: "Awaiting resolution",
    },
    {
      title: "Resolved Today",
      value: mockAgentStats.resolved_today,
      icon: CheckCircle,
      trend: { value: 20, positive: true },
    },
    {
      title: "Avg Response",
      value: `${mockAgentStats.avg_response_time_minutes}m`,
      icon: Clock,
      subtitle: "First response time",
    },
  ];

  return (
    <AppShell role="agent" pageTitle="Dashboard" userName={agentName}>
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent assigned tickets */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader className="px-5 pt-5">
              <CardTitle>Recent Assigned Tickets</CardTitle>
              <Badge variant="brand">
                {recentAssignedTickets.filter((t) => t.status === "open").length}{" "}
                open
              </Badge>
            </CardHeader>

            {recentAssignedTickets.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={Ticket}
                  title="No assigned tickets"
                  description="You have no tickets assigned to you at this time."
                />
              </div>
            ) : (
              <div>
                {recentAssignedTickets.map((t, i) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className={`flex items-center justify-between px-5 py-3.5 hover:bg-bg transition-colors ${
                      i < recentAssignedTickets.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          priorityIndicator[t.priority]
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {t.subject}
                        </p>
                        <p className="text-xs text-text-muted">
                          {t.customer} &middot; {t.time}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        statusVariant[t.status as keyof typeof statusVariant]
                      }
                    >
                      {t.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>

            <div className="space-y-3">
              <Link href="/agent/inbox">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={16} />
                    View Inbox
                  </span>
                  <ArrowRight size={14} />
                </Button>
              </Link>

              <Link href="/agent/tickets">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Ticket size={16} />
                    View All Tickets
                  </span>
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Pending escalations summary */}
          <Card>
            <CardHeader>
              <CardTitle>Escalations</CardTitle>
              <Badge variant="error">2</Badge>
            </CardHeader>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50/50 border border-error/20">
                <AlertCircle
                  size={18}
                  className="text-error mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Alex Johnson - Dashboard access
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    AI could not resolve. Waiting 5 minutes.
                  </p>
                  <Link
                    href="/agent/inbox"
                    className="text-xs text-brand font-medium mt-1 inline-block hover:text-brand-hover"
                  >
                    Take over chat
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50/50 border border-error/20">
                <AlertCircle
                  size={18}
                  className="text-error mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    James Wilson - Payment failure
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Customer requested human agent. Waiting 3 minutes.
                  </p>
                  <Link
                    href="/agent/inbox"
                    className="text-xs text-brand font-medium mt-1 inline-block hover:text-brand-hover"
                  >
                    Take over chat
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
