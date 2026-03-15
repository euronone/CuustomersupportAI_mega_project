"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TicketList } from "@/components/tickets/ticket-list";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useUser } from "@/hooks/useUser";
import { useTickets } from "@/hooks/useTickets";
import { ticketService } from "@/services/tickets";
import { PageLoader } from "@/components/ui/spinner";
import type { TicketStatus, TicketPriority } from "@/types";
import { Plus, Ticket } from "lucide-react";

export default function TicketsPage() {
  const { user, loading: userLoading } = useUser();
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const { tickets, total, loading, error, refetch } = useTickets({
    status: filter === "all" ? undefined : filter,
  });
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const router = useRouter();

  const handleCreate = useCallback(async () => {
    if (!subject.trim() || creating) return;
    setCreating(true);
    try {
      await ticketService.create({
        subject,
        customer_id: user?.id || "",
        priority,
      });
      setShowCreate(false);
      setSubject("");
      setDescription("");
      setPriority("medium");
      refetch();
    } catch (err) {
      console.error("Failed to create ticket:", err);
    } finally {
      setCreating(false);
    }
  }, [subject, priority, user, creating, refetch]);

  if (userLoading) return <PageLoader />;

  const role = user?.role || "customer";

  return (
    <AppShell role={role} pageTitle="Tickets" userName={user?.display_name || "User"}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-text-muted">
            {total} total ticket{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Ticket
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState
          icon={Ticket}
          title="Failed to load tickets"
          description={error}
          action={{ label: "Retry", onClick: refetch }}
        />
      ) : tickets.length === 0 && filter === "all" ? (
        <EmptyState
          icon={Ticket}
          title="No tickets yet"
          description="Create your first support ticket to get help."
          action={{ label: "Create Ticket", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <TicketList
          tickets={tickets}
          activeFilter={filter}
          onFilterChange={setFilter}
        />
      )}

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Ticket"
      >
        <div className="space-y-4">
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Briefly describe your issue"
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide more details about your issue"
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "urgent", label: "Urgent" },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={creating}
              disabled={!subject.trim() || creating}
            >
              Create Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
