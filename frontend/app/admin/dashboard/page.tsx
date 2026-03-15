"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Spinner, PageLoader } from "@/components/ui/spinner";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import {
  Ticket,
  MessageSquare,
  Clock,
  Bot,
} from "lucide-react";
import type { DashboardMetrics, Ticket as TicketType } from "@/types";

const statusVariant = {
  open: "brand" as const,
  pending: "warning" as const,
  resolved: "success" as const,
  closed: "default" as const,
};

export default function AdminDashboardPage() {
  const { user, loading: userLoading } = useUser("admin");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [metricsRes, ticketsRes] = await Promise.allSettled([
          api.get<{ data: DashboardMetrics }>("/analytics/dashboard"),
          api.get<{ data: TicketType[]; total: number }>("/tickets"),
        ]);

        if (metricsRes.status === "fulfilled") {
          setMetrics(metricsRes.value.data);
        }
        if (ticketsRes.status === "fulfilled") {
          setRecentTickets((ticketsRes.value.data || []).slice(0, 5));
        }
      } catch {
        // Use fallback data
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (userLoading) return <PageLoader />;

  const stats = [
    {
      title: "Open Tickets",
      value: metrics?.open_tickets ?? 0,
      icon: Ticket,
      subtitle: `${metrics?.total_tickets ?? 0} total`,
    },
    {
      title: "Active Conversations",
      value: metrics?.active_conversations ?? 0,
      icon: MessageSquare,
    },
    {
      title: "Avg Resolution Time",
      value: metrics?.avg_resolution_time_hours
        ? `${metrics.avg_resolution_time_hours.toFixed(1)}h`
        : "N/A",
      icon: Clock,
      subtitle: `${metrics?.resolved_today ?? 0} resolved today`,
    },
    {
      title: "AI Resolution Rate",
      value: metrics?.ai_resolution_rate
        ? `${(metrics.ai_resolution_rate * 100).toFixed(0)}%`
        : "N/A",
      icon: Bot,
      subtitle: metrics?.csat_score ? `CSAT: ${metrics.csat_score.toFixed(1)}` : undefined,
    },
  ];

  return (
    <AppShell role="admin" pageTitle="Dashboard" userName={user?.display_name || "Admin"}>
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <div className="col-span-4 flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          stats.map((stat) => <StatCard key={stat.title} {...stat} />)
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tickets */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader className="px-5 pt-5">
              <CardTitle>Recent Tickets</CardTitle>
              {recentTickets.length > 0 && (
                <Badge variant="brand">{recentTickets.length} recent</Badge>
              )}
            </CardHeader>

            {recentTickets.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">No tickets found</p>
            ) : (
              <div>
                {recentTickets.map((t, i) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between px-5 py-3.5 hover:bg-bg transition-colors cursor-pointer ${
                      i < recentTickets.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          t.priority === "high" || t.priority === "urgent"
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
                          {t.assigned_agent?.display_name || "Unassigned"} &middot;{" "}
                          {formatRelativeTime(t.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Summary card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Total Tickets</span>
              <span className="text-sm font-semibold text-text-primary">
                {metrics?.total_tickets ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Resolved Today</span>
              <span className="text-sm font-semibold text-text-primary">
                {metrics?.resolved_today ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">CSAT Score</span>
              <span className="text-sm font-semibold text-text-primary">
                {metrics?.csat_score?.toFixed(1) ?? "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">AI Resolution</span>
              <span className="text-sm font-semibold text-text-primary">
                {metrics?.ai_resolution_rate
                  ? `${(metrics.ai_resolution_rate * 100).toFixed(0)}%`
                  : "N/A"}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
