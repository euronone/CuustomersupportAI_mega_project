"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AGENT_STATUS_LABELS } from "@/lib/constants";
import type { Agent, AgentStatus } from "@/types";
import { Plus, UserPlus } from "lucide-react";

const statusVariant: Record<AgentStatus, BadgeVariant> = {
  available: "success",
  busy: "warning",
  offline: "default",
};

// Mock data
const mockAgents: Agent[] = [
  {
    id: "a-1",
    tenant_id: "demo",
    user_id: "u-1",
    display_name: "Sarah Chen",
    status: "available",
    skills: ["billing", "auth", "onboarding"],
    active_tickets: 3,
    created_at: "",
    updated_at: "",
  },
  {
    id: "a-2",
    tenant_id: "demo",
    user_id: "u-2",
    display_name: "James Kim",
    status: "busy",
    skills: ["api", "integrations", "technical"],
    active_tickets: 5,
    created_at: "",
    updated_at: "",
  },
  {
    id: "a-3",
    tenant_id: "demo",
    user_id: "u-3",
    display_name: "Maria Garcia",
    status: "available",
    skills: ["general", "billing", "product"],
    active_tickets: 2,
    created_at: "",
    updated_at: "",
  },
  {
    id: "a-4",
    tenant_id: "demo",
    user_id: "u-4",
    display_name: "David Park",
    status: "offline",
    skills: ["technical", "infrastructure"],
    active_tickets: 0,
    created_at: "",
    updated_at: "",
  },
];

export default function AgentsPage() {
  return (
    <AppShell role="admin" pageTitle="Agents" userName="Admin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-text-muted">
            {mockAgents.length} agents &middot;{" "}
            {mockAgents.filter((a) => a.status === "available").length} available
          </p>
        </div>
        <Button size="sm">
          <UserPlus size={16} />
          Add Agent
        </Button>
      </div>

      <Card padding="none">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-bg border-b border-border text-xs font-medium text-text-muted uppercase tracking-wider">
          <div className="col-span-4">Agent</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Skills</div>
          <div className="col-span-2">Active Tickets</div>
          <div className="col-span-1"></div>
        </div>

        {mockAgents.map((agent, i) => (
          <div
            key={agent.id}
            className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-bg transition-colors ${
              i < mockAgents.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="col-span-4 flex items-center gap-3">
              <Avatar name={agent.display_name} size="sm" />
              <span className="text-sm font-medium text-text-primary">
                {agent.display_name}
              </span>
            </div>
            <div className="col-span-2">
              <Badge variant={statusVariant[agent.status]}>
                {AGENT_STATUS_LABELS[agent.status]}
              </Badge>
            </div>
            <div className="col-span-3 flex flex-wrap gap-1">
              {agent.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="default">
                  {skill}
                </Badge>
              ))}
            </div>
            <div className="col-span-2 text-sm text-text-muted">
              {agent.active_tickets}
            </div>
            <div className="col-span-1 flex justify-end">
              <Button variant="tertiary" size="sm">
                Edit
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </AppShell>
  );
}
