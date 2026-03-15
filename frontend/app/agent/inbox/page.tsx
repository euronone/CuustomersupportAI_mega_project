"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Send,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  Inbox,
  Filter,
} from "lucide-react";

interface InboxMessage {
  id: string;
  content: string;
  sender: "customer" | "ai" | "agent";
  senderName: string;
  time: string;
}

interface InboxChat {
  id: string;
  ticketId: string;
  customer: string;
  lastMessage: string;
  time: string;
  unread: number;
  escalated: boolean;
  status: "unread" | "read";
  messages: InboxMessage[];
}

const mockChats: InboxChat[] = [
  {
    id: "c1",
    ticketId: "t-1",
    customer: "Alex Johnson",
    lastMessage: "I still can't access my dashboard after resetting...",
    time: "2m ago",
    unread: 3,
    escalated: true,
    status: "unread",
    messages: [
      {
        id: "m1",
        content:
          "I can't access my dashboard after password reset. Getting a 403 error.",
        sender: "customer",
        senderName: "Alex Johnson",
        time: "10:32 AM",
      },
      {
        id: "m2",
        content:
          "I understand the issue. A 403 error after password reset typically happens when the session token hasn't been refreshed. Could you try logging out completely and logging back in?",
        sender: "ai",
        senderName: "Euron AI",
        time: "10:32 AM",
      },
      {
        id: "m3",
        content:
          "I tried that already. Still getting the same error. Can I talk to a real person?",
        sender: "customer",
        senderName: "Alex Johnson",
        time: "10:34 AM",
      },
      {
        id: "m4",
        content:
          "I apologize for the inconvenience. Let me connect you with a support agent who can help resolve this directly.",
        sender: "ai",
        senderName: "Euron AI",
        time: "10:34 AM",
      },
    ],
  },
  {
    id: "c2",
    ticketId: "t-2",
    customer: "Maria Santos",
    lastMessage: "How do I export my data to CSV?",
    time: "5m ago",
    unread: 1,
    escalated: false,
    status: "unread",
    messages: [
      {
        id: "m1",
        content: "How do I export my data to CSV?",
        sender: "customer",
        senderName: "Maria Santos",
        time: "10:28 AM",
      },
      {
        id: "m2",
        content:
          "You can export data by going to Settings > Data > Export. Select CSV format and choose the date range. The file will be emailed to your registered address.",
        sender: "ai",
        senderName: "Euron AI",
        time: "10:28 AM",
      },
      {
        id: "m3",
        content:
          "I don't see the Export option in Settings. Is it a paid feature?",
        sender: "customer",
        senderName: "Maria Santos",
        time: "10:30 AM",
      },
    ],
  },
  {
    id: "c3",
    ticketId: "t-3",
    customer: "James Wilson",
    lastMessage: "The payment didn't go through",
    time: "12m ago",
    unread: 0,
    escalated: true,
    status: "read",
    messages: [
      {
        id: "m1",
        content: "My payment failed and I was still charged. Please help!",
        sender: "customer",
        senderName: "James Wilson",
        time: "10:20 AM",
      },
      {
        id: "m2",
        content:
          "I'm sorry to hear about the payment issue. For billing matters, I'll connect you with a support agent who can look into your account directly.",
        sender: "ai",
        senderName: "Euron AI",
        time: "10:20 AM",
      },
    ],
  },
  {
    id: "c4",
    ticketId: "t-4",
    customer: "Priya Sharma",
    lastMessage: "Thank you for the help!",
    time: "18m ago",
    unread: 0,
    escalated: false,
    status: "read",
    messages: [
      {
        id: "m1",
        content: "Can you help me change my subscription plan?",
        sender: "customer",
        senderName: "Priya Sharma",
        time: "10:10 AM",
      },
      {
        id: "m2",
        content:
          "Of course! You can change your plan in Settings > Billing > Change Plan. Would you like me to walk you through it?",
        sender: "ai",
        senderName: "Euron AI",
        time: "10:10 AM",
      },
      {
        id: "m3",
        content: "Thank you for the help!",
        sender: "customer",
        senderName: "Priya Sharma",
        time: "10:15 AM",
      },
    ],
  },
];

type StatusFilter = "all" | "unread";

export default function AgentInboxPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string>(mockChats[0].id);
  const [reply, setReply] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading inbox data
    // In production, fetch from conversations API
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const agentName = user?.display_name || "Agent";

  const filteredChats =
    statusFilter === "all"
      ? mockChats
      : mockChats.filter((c) => c.status === "unread");

  const activeChat = mockChats.find((c) => c.id === selectedChat);

  function handleSendReply() {
    if (!reply.trim()) return;
    // In production, send via API: POST /tickets/{ticketId}/messages
    setReply("");
  }

  if (authLoading || loading) {
    return (
      <AppShell role="agent" pageTitle="Inbox" userName={agentName}>
        <PageLoader />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell role="agent" pageTitle="Inbox" userName={agentName}>
        <EmptyState
          icon={AlertCircle}
          title="Failed to load inbox"
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
    <AppShell role="agent" pageTitle="Inbox" userName={agentName}>
      {/* Status filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-text-muted" />
          <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
            {(["all", "unread"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === f
                    ? "bg-brand text-white"
                    : "text-text-muted hover:text-text-primary hover:bg-bg"
                }`}
              >
                {f === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-text-muted">
          {filteredChats.length} conversation{filteredChats.length !== 1 ? "s" : ""}
        </p>
      </div>

      {filteredChats.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No conversations"
          description={
            statusFilter === "unread"
              ? "You have no unread conversations. Switch to All to see all conversations."
              : "No conversations have been assigned to you yet."
          }
        />
      ) : (
        <div className="flex gap-4 h-[calc(100vh-12rem)]">
          {/* Chat list */}
          <Card padding="none" className="w-80 shrink-0 flex flex-col">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-text-primary">
                Conversations
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {filteredChats.length} active
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 border-b border-border text-left transition-colors cursor-pointer",
                    selectedChat === chat.id
                      ? "bg-brand/5 border-l-2 border-l-brand"
                      : "hover:bg-bg"
                  )}
                >
                  <Avatar name={chat.customer} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-text-primary truncate">
                        {chat.customer}
                      </span>
                      {chat.escalated && (
                        <AlertCircle
                          size={12}
                          className="text-error shrink-0"
                        />
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {chat.lastMessage}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-text-muted">
                      {chat.time}
                    </span>
                    {chat.unread > 0 && (
                      <span className="h-4 w-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Chat view */}
          {activeChat ? (
            <Card padding="none" className="flex-1 flex flex-col">
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar name={activeChat.customer} size="sm" />
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {activeChat.customer}
                    </h3>
                    <span className="text-xs text-text-muted">
                      Ticket: {activeChat.ticketId}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {activeChat.escalated && (
                    <Badge variant="error">Escalated to you</Badge>
                  )}
                  <Badge variant="brand">Active</Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {activeChat.messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    {msg.sender === "ai" ? (
                      <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                        <Bot size={14} className="text-brand" />
                      </div>
                    ) : msg.sender === "agent" ? (
                      <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                        <User size={14} className="text-success" />
                      </div>
                    ) : (
                      <Avatar name={msg.senderName} size="sm" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary">
                          {msg.senderName}
                        </span>
                        {msg.sender === "ai" && (
                          <Badge variant="brand">AI</Badge>
                        )}
                        {msg.sender === "agent" && (
                          <Badge variant="success">You</Badge>
                        )}
                        <span className="text-[11px] text-text-muted">
                          {msg.time}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              <div className="border-t border-border p-4">
                <Textarea
                  placeholder="Type your reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="mb-3"
                />
                <div className="flex items-center justify-between">
                  <Button variant="secondary" size="sm">
                    <Sparkles size={14} />
                    AI Suggest
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendReply}
                    disabled={!reply.trim()}
                  >
                    <Send size={14} />
                    Send Reply
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <p className="text-sm text-text-muted">
                Select a conversation to start replying
              </p>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
