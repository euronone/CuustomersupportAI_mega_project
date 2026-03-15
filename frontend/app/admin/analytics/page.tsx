"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BarChart3,
  TrendingUp,
  Bot,
  Clock,
  CheckCircle,
  Ticket,
  Star,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import type { DashboardMetrics } from "@/types";

type TimeRange = "7d" | "30d" | "90d";

const timeRangeLabels: Record<TimeRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ data: DashboardMetrics }>(
        "/analytics/dashboard",
        { range: timeRange }
      );
      setMetrics(data.data);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to load analytics data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const stats = metrics
    ? [
        {
          title: "Total Tickets",
          value: metrics.total_tickets.toLocaleString(),
          icon: Ticket,
          subtitle: `${metrics.active_conversations} active conversations`,
        },
        {
          title: "Open Tickets",
          value: metrics.open_tickets,
          icon: AlertCircle,
          trend: undefined,
        },
        {
          title: "Resolved Today",
          value: metrics.resolved_today,
          icon: CheckCircle,
          trend: undefined,
        },
        {
          title: "Avg Resolution Time",
          value: `${metrics.avg_resolution_time_hours.toFixed(1)}h`,
          icon: Clock,
          subtitle: `${metrics.avg_first_response_minutes.toFixed(0)}m first response`,
        },
        {
          title: "CSAT Score",
          value: `${metrics.csat_score.toFixed(1)}/5`,
          icon: Star,
          trend: undefined,
        },
        {
          title: "AI Resolution Rate",
          value: `${(metrics.ai_resolution_rate * 100).toFixed(0)}%`,
          icon: Bot,
          trend: undefined,
        },
      ]
    : [];

  // Placeholder data for chart sections (would be replaced with real chart data)
  const ticketTrendData = [
    { label: "Mon", value: 32 },
    { label: "Tue", value: 45 },
    { label: "Wed", value: 38 },
    { label: "Thu", value: 52 },
    { label: "Fri", value: 41 },
    { label: "Sat", value: 18 },
    { label: "Sun", value: 12 },
  ];

  const statusDistribution = [
    { label: "Open", value: metrics?.open_tickets ?? 24, color: "#0A66C2" },
    { label: "Pending", value: 18, color: "#B45309" },
    { label: "Resolved", value: metrics?.resolved_today ?? 42, color: "#057642" },
    { label: "Closed", value: 86, color: "#6B7280" },
  ];

  const maxTrendValue = Math.max(...ticketTrendData.map((d) => d.value));

  return (
    <AppShell role="admin" pageTitle="Analytics" userName="Admin">
      {/* Time range filter */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-muted">
          Showing data for {timeRangeLabels[timeRange]}
        </p>
        <div className="flex gap-1 bg-bg rounded-lg p-1">
          {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 cursor-pointer ${
                timeRange === range
                  ? "bg-surface text-text-primary shadow-sm border border-border"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && <PageLoader />}

      {/* Error state */}
      {!loading && error && (
        <EmptyState
          icon={AlertCircle}
          title="Unable to load analytics"
          description={error}
          action={
            <Button size="sm" onClick={fetchMetrics}>
              Try Again
            </Button>
          }
        />
      )}

      {/* Content */}
      {!loading && !error && metrics && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart placeholder - Ticket Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Trends</CardTitle>
                <Badge variant="brand">Weekly</Badge>
              </CardHeader>

              <div className="space-y-3">
                {ticketTrendData.map((day) => (
                  <div key={day.label} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-text-muted w-8">
                      {day.label}
                    </span>
                    <div className="flex-1 h-7 bg-bg rounded overflow-hidden">
                      <div
                        className="h-full bg-brand/80 rounded flex items-center justify-end pr-2 transition-all duration-300"
                        style={{
                          width: `${(day.value / maxTrendValue) * 100}%`,
                        }}
                      >
                        <span className="text-[10px] text-white font-semibold">
                          {day.value}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-text-muted mt-4">
                Chart visualization -- integrate with a charting library for full
                interactivity
              </p>
            </Card>

            {/* Pie chart placeholder - Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>

              {/* Simple visual representation */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative h-40 w-40">
                  {/* Placeholder circle */}
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {(() => {
                      const total = statusDistribution.reduce(
                        (s, d) => s + d.value,
                        0
                      );
                      let offset = 0;
                      return statusDistribution.map((segment) => {
                        const pct = (segment.value / total) * 100;
                        const dashArray = `${pct * 2.51327} ${251.327}`;
                        const dashOffset = -offset * 2.51327;
                        offset += pct;
                        return (
                          <circle
                            key={segment.label}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="20"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-bold text-text-primary">
                        {statusDistribution.reduce((s, d) => s + d.value, 0)}
                      </p>
                      <p className="text-[10px] text-text-muted">Total</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-3">
                {statusDistribution.map((segment) => (
                  <div key={segment.label} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-xs text-text-muted">
                      {segment.label}
                    </span>
                    <span className="text-xs font-medium text-text-primary ml-auto">
                      {segment.value}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-text-muted mt-4">
                Chart visualization -- integrate with a charting library for full
                interactivity
              </p>
            </Card>
          </div>
        </>
      )}

      {/* Empty state - no data */}
      {!loading && !error && !metrics && (
        <EmptyState
          icon={BarChart3}
          title="No analytics data"
          description="Analytics data will appear here once tickets and conversations are created."
        />
      )}
    </AppShell>
  );
}
