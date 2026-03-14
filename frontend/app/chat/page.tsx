"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ChatWindow } from "@/components/chat/chat-window";
import type { ChatMessage } from "@/types";

// Temporary mock — will be replaced by WebSocket hook
let msgIdCounter = 0;
function createId() {
  return `msg-${++msgIdCounter}-${Date.now()}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = useCallback((content: string) => {
    const userMsg: ChatMessage = {
      id: createId(),
      content,
      sender_type: "customer",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: createId(),
        content:
          "Thank you for your message. I'm looking into this for you. This is a demo response — the backend will power real AI responses via RAG and OpenAI.",
        sender_type: "ai",
        created_at: new Date().toISOString(),
        citations: [
          {
            document_title: "Getting Started Guide",
            chunk_content: "Welcome to Euron...",
            relevance_score: 0.92,
          },
        ],
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  }, []);

  return (
    <AppShell role="user" pageTitle="Chat" userName="Demo User">
      <div className="h-[calc(100vh-10rem)]">
        <ChatWindow
          messages={messages}
          onSend={handleSend}
          isConnected={true}
          isTyping={isTyping}
          userName="Demo User"
        />
      </div>
    </AppShell>
  );
}
