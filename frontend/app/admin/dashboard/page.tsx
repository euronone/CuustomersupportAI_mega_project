"use client";

import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Ticket,
  MessageSquare,
  Clock,
  TrendingUp,
  Users,
  Bot,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Mock data — will be replaced by analytics API
const stats = [
  {
    title: "Open Tickets",
    value: 24,
    icon: Ticket,
    trend: { value: -12, positive: true },
    subtitle: "8 high priority",
  },
  {
    title: "Active Conversations",
    value: 156,
    icon: MessageSquare,
    trend: { value: 8, positive: true },
  },
  {
    title: "Avg Resolution Time",
    value: "4.2h",
    icon: Clock,
    trend: { value: -18, positive: true },
    subtitle: "Down from 5.1h",
  },
  {
    title: "AI Resolution Rate",
    value: "68%",
    icon: Bot,
    trend: { value: 5, positive: true },
    subtitle: "Across all channels",
  },
];

const recentTickets = [
  {
    id: "t-1",
    subject: "Unable to access dashboard",
    status: "open",
    priority: "high",
    agent: "Sarah Chen",
    time: "12m ago",
  },
  {
    id: "t-2",
    subject: "Billing discrepancy",
    status: "pending",
    priority: "medium",
    agent: "Unassigned",
    time: "1h ago",
  },
  {
    id: "t-3",
    subject: "API rate limit questions",
    status: "open",
    priority: "low",
    agent: "James Kim",
    time: "2h ago",
  },
  {
    id: "t-4",
    subject: "Export feature not working",
    status: "resolved",
    priority: "medium",
    agent: "Sarah Chen",
    time: "3h ago",
  },
];

const topAgents = [
  { name: "Sarah Chen", resolved: 34, satisfaction: 4.8 },
  { name: "James Kim", resolved: 28, satisfaction: 4.6 },
  { name: "Maria Garcia", resolved: 22, satisfaction: 4.9 },
];

const statusVariant = {
  open: "brand" as const,
  pending: "warning" as const,
  resolved: "success" as const,
  closed: "default" as const,
};

export default function AdminDashboardPage() {
  return (
    <AppShell role="admin" pageTitle="Dashboard" userName="Admin">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tickets */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader className="px-5 pt-5">
              <CardTitle>Recent Tickets</CardTitle>
              <Badge variant="brand">{recentTickets.length} new</Badge>
            </CardHeader>

            <div>
              {recentTickets.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between px-5 py-3.5 hover:bg-bg transition-colors cursor-pointer ${
                    i < recentTickets.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        t.priority === "high"
                          ? "bg-error"
                          : t.priority === "medium"
                            ? "bg-warning"
                            : "bg-text-muted"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {t.subject}
                      </p>
                      <p className="text-xs text-text-muted">
                        {t.agent} &middot; {t.time}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusVariant[t.status as keyof typeof statusVariant]}>
                    {t.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Top agents */}
        <Card>
          <CardHeader>
            <CardTitle>Top Agents</CardTitle>
          </CardHeader>

          <div className="space-y-4">
            {topAgents.map((agent, i) => (
              <div key={agent.name} className="flex items-center gap-3">
                <span className="text-xs font-medium text-text-muted w-4">
                  {i + 1}
                </span>
                <Avatar name={agent.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {agent.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {agent.resolved} resolved &middot; {agent.satisfaction} CSAT
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
