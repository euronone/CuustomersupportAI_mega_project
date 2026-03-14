"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Mock data — will be replaced by API
const ticket = {
  id: "t-1",
  subject: "Unable to access dashboard after password reset",
  status: "open",
  priority: "high",
  customer: { display_name: "Alex Johnson", email: "alex@example.com" },
  assigned_agent: { display_name: "Sarah Chen" },
  summary:
    "Customer reset their password but is now getting a 403 error when trying to access the main dashboard. They have tried clearing cookies and using incognito mode.",
  created_at: new Date(Date.now() - 3600000).toISOString(),
  messages: [
    {
      id: "m1",
      sender_type: "customer" as const,
      sender_name: "Alex Johnson",
      content:
        "I just reset my password and now I can't access the dashboard. I get a 403 error every time I try.",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "m2",
      sender_type: "ai" as const,
      sender_name: "Euron AI",
      content:
        "I understand the frustration. A 403 error after password reset typically happens when the session token hasn't been refreshed. Could you try logging out completely and logging back in with your new password?",
      created_at: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      id: "m3",
      sender_type: "customer" as const,
      sender_name: "Alex Johnson",
      content:
        "I tried that already. Same error. I also tried clearing cookies and using an incognito window.",
      created_at: new Date(Date.now() - 3000000).toISOString(),
    },
  ],
};

export default function TicketDetailPage() {
  const [reply, setReply] = useState("");

  return (
    <AppShell role="user" pageTitle="Ticket Detail" userName="Demo User">
      {/* Back link */}
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
              <h2 className="text-lg font-semibold text-text-primary">
                {ticket.subject}
              </h2>
              <Badge variant="brand">Open</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Created 1 hour ago
              </span>
              <Badge variant="warning">High priority</Badge>
            </div>
          </Card>

          {/* AI Summary */}
          <Card className="bg-blue-50/50 border-brand/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-brand" />
              <span className="text-sm font-semibold text-brand">
                AI Summary
              </span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed">
              {ticket.summary}
            </p>
          </Card>

          {/* Messages */}
          <Card padding="none">
            <div className="p-4 border-b border-border">
              <CardTitle>Conversation</CardTitle>
            </div>
            <div className="p-4 space-y-4">
              {ticket.messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <Avatar name={msg.sender_name} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {msg.sender_name}
                      </span>
                      {msg.sender_type === "ai" && (
                        <Badge variant="brand">AI</Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-primary mt-1 leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply box */}
            <div className="p-4 border-t border-border">
              <Textarea
                placeholder="Write a reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="flex items-center justify-between mt-3">
                <Button variant="secondary" size="sm">
                  <Sparkles size={14} />
                  Suggest Reply
                </Button>
                <Button size="sm" disabled={!reply.trim()}>
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
              <div>
                <dt className="text-text-muted">Customer</dt>
                <dd className="font-medium mt-0.5">
                  {ticket.customer.display_name}
                </dd>
                <dd className="text-xs text-text-muted">
                  {ticket.customer.email}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Assigned to</dt>
                <dd className="flex items-center gap-2 mt-0.5">
                  <Avatar
                    name={ticket.assigned_agent.display_name}
                    size="sm"
                  />
                  <span className="font-medium">
                    {ticket.assigned_agent.display_name}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Status</dt>
                <dd className="mt-0.5">
                  <Badge variant="brand">Open</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Priority</dt>
                <dd className="mt-0.5">
                  <Badge variant="warning">High</Badge>
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full">
                Assign to me
              </Button>
              <Button variant="secondary" size="sm" className="w-full">
                Mark as Resolved
              </Button>
              <Button variant="tertiary" size="sm" className="w-full">
                Close Ticket
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
