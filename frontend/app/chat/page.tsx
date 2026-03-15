"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Send, Bot, UserCircle, Headphones } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { PageLoader } from "@/components/ui/spinner";
import { chatService } from "@/services/chat";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { ChatMessage } from "@/types";

let msgIdCounter = 0;
function createId() {
  return `msg-${++msgIdCounter}-${Date.now()}`;
}

export default function ChatPage() {
  const { user, loading } = useUser("customer");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content:
        "Welcome to Euron Support! I'm your AI assistant. Ask me anything. If I can't help, I'll connect you with a human agent.",
      sender_type: "ai",
      created_at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [aiAttempts, setAiAttempts] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [useApi, setUseApi] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Initialize conversation
  useEffect(() => {
    if (!user) return;
    const id = `conv-${user.id}-${Date.now()}`;
    setConversationId(id);
  }, [user]);

  // WebSocket connection for real-time chat
  const wsUrl = conversationId ? chatService.getWebSocketUrl(conversationId) : "";
  const { isConnected, send: wsSend } = useWebSocket({
    url: wsUrl,
    onMessage: (data: unknown) => {
      const msg = data as { id?: string; content?: string; sender_type?: string; citations?: ChatMessage["citations"] };
      if (msg.content) {
        setMessages((prev) => [
          ...prev,
          {
            id: msg.id || createId(),
            content: msg.content || "",
            sender_type: (msg.sender_type as ChatMessage["sender_type"]) || "ai",
            created_at: new Date().toISOString(),
            citations: msg.citations,
          },
        ]);
        setIsTyping(false);
      }
    },
    reconnect: true,
  });

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      const userMsg: ChatMessage = {
        id: createId(),
        content,
        sender_type: "customer",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      const attempts = aiAttempts + 1;
      setAiAttempts(attempts);

      if (escalated) {
        // Agent mode - mock agent response
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: createId(),
              content: "Thanks for that info. I'm looking into this now.",
              sender_type: "agent",
              created_at: new Date().toISOString(),
            },
          ]);
          setIsTyping(false);
        }, 2000);
        return;
      }

      // Try real API first
      if (useApi && conversationId) {
        try {
          if (isConnected) {
            wsSend({ content, conversation_id: conversationId });
            return;
          }

          const res = await chatService.sendMessage(conversationId, content);
          setMessages((prev) => [
            ...prev,
            {
              id: res.data.id || createId(),
              content: res.data.content,
              sender_type: "ai",
              created_at: new Date().toISOString(),
              citations: res.data.citations,
            },
          ]);
          setIsTyping(false);

          if (attempts >= 3) {
            setTimeout(() => {
              setMessages((prev) => [
                ...prev,
                {
                  id: createId(),
                  content: "It looks like I can't fully resolve this. Would you like to talk to a human agent?",
                  sender_type: "ai",
                  created_at: new Date().toISOString(),
                },
              ]);
            }, 800);
          }
          return;
        } catch {
          setUseApi(false);
        }
      }

      // Fallback to mock responses
      const mockResponses = [
        "Based on our knowledge base, I can help with that. Let me look into it for you.",
        "I found some relevant information. You can resolve this by going to Settings > Account > Reset. Would you like more details?",
        "That's a great question! According to our documentation, this feature is available on the Pro plan.",
        "I understand your concern. Let me check our records for more information.",
      ];

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            content: mockResponses[Math.min(attempts - 1, mockResponses.length - 1)],
            sender_type: "ai",
            created_at: new Date().toISOString(),
            citations:
              attempts <= 2
                ? [{ document_title: "Help Center", chunk_content: "", relevance_score: 0.85 }]
                : [],
          },
        ]);
        setIsTyping(false);
        if (attempts >= 3 && !escalated) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: createId(),
                content: "It looks like I can't fully resolve this. Would you like to talk to a human agent?",
                sender_type: "ai",
                created_at: new Date().toISOString(),
              },
            ]);
          }, 800);
        }
      }, 1500);
    },
    [escalated, aiAttempts, useApi, conversationId, isConnected, wsSend]
  );

  function handleEscalate() {
    setEscalated(true);
    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        content: "Connecting you with a support agent. Your chat history has been shared with them.",
        sender_type: "system" as const,
        created_at: new Date().toISOString(),
      },
    ]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          content: "Hi! I'm Sarah from support. I can see your conversation. How can I help further?",
          sender_type: "agent",
          created_at: new Date().toISOString(),
        },
      ]);
    }, 2000);
  }

  if (loading || !user) return <PageLoader />;

  return (
    <AppShell role="customer" pageTitle="Support Chat" userName={user.display_name}>
      <div className="h-[calc(100vh-10rem)] flex flex-col">
        <Card padding="none" className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center",
                  escalated ? "bg-success/10" : "bg-brand/10"
                )}
              >
                {escalated ? (
                  <Headphones size={18} className="text-success" />
                ) : (
                  <Bot size={18} className="text-brand" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {escalated ? "Live Agent -- Sarah" : "Euron AI Assistant"}
                </h3>
                <span className="text-xs text-success">
                  {isConnected ? "Connected" : "Online"}
                </span>
              </div>
            </div>
            {!escalated && aiAttempts >= 2 && (
              <Button variant="secondary" size="sm" onClick={handleEscalate}>
                <Headphones size={14} />
                Talk to Agent
              </Button>
            )}
            {escalated && <Badge variant="success">Agent Connected</Badge>}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => {
              if (msg.sender_type === "system") {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-xs text-text-muted bg-bg px-3 py-1.5 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                );
              }
              const isUser = msg.sender_type === "customer";
              return (
                <div
                  key={msg.id}
                  className={cn("flex gap-3 max-w-[80%]", isUser ? "ml-auto flex-row-reverse" : "mr-auto")}
                >
                  {msg.sender_type === "ai" && (
                    <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                      <Bot size={14} className="text-brand" />
                    </div>
                  )}
                  {msg.sender_type === "agent" && (
                    <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <Headphones size={14} className="text-success" />
                    </div>
                  )}
                  {isUser && (
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <UserCircle size={14} className="text-text-muted" />
                    </div>
                  )}
                  <div>
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-medium text-text-muted">
                          {msg.sender_type === "ai" ? "Euron AI" : "Sarah (Agent)"}
                        </span>
                        <Badge variant={msg.sender_type === "ai" ? "brand" : "success"}>
                          {msg.sender_type === "ai" ? "AI" : "Agent"}
                        </Badge>
                      </div>
                    )}
                    <div
                      className={cn(
                        "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                        isUser
                          ? "bg-brand text-white rounded-br-md"
                          : "bg-bg border border-border text-text-primary rounded-bl-md"
                      )}
                    >
                      {msg.content}
                    </div>
                    {msg.citations?.map((c, i) => (
                      <span key={i} className="inline-block text-[10px] text-brand bg-brand/5 px-2 py-0.5 rounded mt-1 mr-1">
                        Source: {c.document_title}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex gap-3 mr-auto">
                <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-4 flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder={escalated ? "Message your agent..." : "Describe your issue..."}
              rows={1}
              className="flex-1 resize-none text-sm text-text-primary bg-bg rounded-xl px-4 py-3 border border-border placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 max-h-32 min-h-[44px]"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              className={cn(
                "h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                input.trim() ? "bg-brand text-white hover:bg-brand-hover" : "bg-bg text-text-muted"
              )}
            >
              <Send size={18} />
            </button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
