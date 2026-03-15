"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { AGENT_STATUS_LABELS } from "@/lib/constants";
import type { Agent, AgentStatus } from "@/types";
import { UserPlus, Users, AlertCircle, Save, X } from "lucide-react";
import { api } from "@/lib/api";

const statusVariant: Record<AgentStatus, BadgeVariant> = {
  available: "success",
  busy: "warning",
  offline: "default",
};

type StatusFilter = "all" | AgentStatus;

const statusFilterOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Agents" },
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "offline", label: "Offline" },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Edit modal state
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [editStatus, setEditStatus] = useState<AgentStatus>("available");
  const [editSkills, setEditSkills] = useState("");
  const [editMaxTickets, setEditMaxTickets] = useState("5");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ data: Agent[] }>("/admin/agents");
      setAgents(data.data);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to load agents";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const filteredAgents =
    statusFilter === "all"
      ? agents
      : agents.filter((a) => a.status === statusFilter);

  function openEditModal(agent: Agent) {
    setEditAgent(agent);
    setEditStatus(agent.status);
    setEditSkills(agent.skills.join(", "));
    setEditMaxTickets("5");
    setSaveError(null);
    setSaveSuccess(false);
  }

  function closeEditModal() {
    setEditAgent(null);
    setSaveError(null);
    setSaveSuccess(false);
  }

  async function handleSaveAgent() {
    if (!editAgent) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const skillsArray = editSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await api.patch(`/admin/agents/${editAgent.id}`, {
        status: editStatus,
        skills: skillsArray,
        max_concurrent_tickets: parseInt(editMaxTickets, 10),
      });

      // Update local state
      setAgents((prev) =>
        prev.map((a) =>
          a.id === editAgent.id
            ? { ...a, status: editStatus, skills: skillsArray }
            : a
        )
      );
      setSaveSuccess(true);
      setTimeout(() => {
        closeEditModal();
      }, 800);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to update agent";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  const availableCount = agents.filter(
    (a) => a.status === "available"
  ).length;

  return (
    <AppShell role="admin" pageTitle="Agents" userName="Admin">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-text-muted">
              {agents.length} agents &middot; {availableCount} available
            </p>
          </div>
          <Select
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-40 h-9 text-xs"
          />
        </div>
        <Button size="sm">
          <UserPlus size={16} />
          Add Agent
        </Button>
      </div>

      {/* Loading state */}
      {loading && <PageLoader />}

      {/* Error state */}
      {!loading && error && (
        <EmptyState
          icon={AlertCircle}
          title="Unable to load agents"
          description={error}
          action={
            <Button size="sm" onClick={fetchAgents}>
              Try Again
            </Button>
          }
        />
      )}

      {/* Empty state */}
      {!loading && !error && agents.length === 0 && (
        <EmptyState
          icon={Users}
          title="No agents yet"
          description="Add agents to your team to start assigning and managing support tickets."
          action={
            <Button size="sm">
              <UserPlus size={16} />
              Add First Agent
            </Button>
          }
        />
      )}

      {/* Filtered empty */}
      {!loading &&
        !error &&
        agents.length > 0 &&
        filteredAgents.length === 0 && (
          <EmptyState
            icon={Users}
            title="No matching agents"
            description={`No agents found with status "${statusFilter}". Try a different filter.`}
          />
        )}

      {/* Agent table */}
      {!loading && !error && filteredAgents.length > 0 && (
        <Card padding="none">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-bg border-b border-border text-xs font-medium text-text-muted uppercase tracking-wider">
            <div className="col-span-4">Agent</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Skills</div>
            <div className="col-span-2">Active Tickets</div>
            <div className="col-span-1"></div>
          </div>

          {filteredAgents.map((agent, i) => (
            <div
              key={agent.id}
              className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-bg transition-colors ${
                i < filteredAgents.length - 1
                  ? "border-b border-border"
                  : ""
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
                {agent.skills.length > 3 && (
                  <Badge variant="default">
                    +{agent.skills.length - 3}
                  </Badge>
                )}
              </div>
              <div className="col-span-2 text-sm text-text-muted">
                {agent.active_tickets}
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => openEditModal(agent)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Edit Agent Modal */}
      <Modal
        open={editAgent !== null}
        onClose={closeEditModal}
        title="Edit Agent"
      >
        {editAgent && (
          <div className="space-y-4">
            {/* Agent info header */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <Avatar name={editAgent.display_name} size="sm" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {editAgent.display_name}
                </p>
                <p className="text-xs text-text-muted">ID: {editAgent.id}</p>
              </div>
            </div>

            <Select
              label="Status"
              value={editStatus}
              onChange={(e) =>
                setEditStatus(e.target.value as AgentStatus)
              }
              options={[
                { value: "available", label: "Available" },
                { value: "busy", label: "Busy" },
                { value: "offline", label: "Offline" },
              ]}
            />

            <Input
              label="Skills (comma-separated)"
              value={editSkills}
              onChange={(e) => setEditSkills(e.target.value)}
              placeholder="e.g. billing, technical, onboarding"
            />

            <Input
              label="Max Concurrent Tickets"
              type="number"
              min="1"
              max="20"
              value={editMaxTickets}
              onChange={(e) => setEditMaxTickets(e.target.value)}
            />

            {/* Feedback messages */}
            {saveError && (
              <div className="flex items-center gap-2 text-xs text-error bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle size={14} />
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 text-xs text-success bg-green-50 px-3 py-2 rounded-lg">
                <Save size={14} />
                Agent updated successfully
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button onClick={handleSaveAgent} loading={saving}>
                <Save size={14} />
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
