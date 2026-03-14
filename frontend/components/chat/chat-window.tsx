"use client";

import { useRef, useEffect } from "react";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import type { ChatMessage } from "@/types";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface ChatWindowProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isConnected: boolean;
  isTyping?: boolean;
  userName?: string;
}

export function ChatWindow({
  messages,
  onSend,
  isConnected,
  isTyping,
  userName,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full bg-bg rounded-lg border border-border overflow-hidden">
      {/* Connection status */}
      {!isConnected && (
        <div className="px-4 py-2 bg-warning/10 text-warning text-xs font-medium text-center">
          Reconnecting...
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Start a conversation"
            description="Send a message to get help from our AI assistant."
          />
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} userName={userName} />
          ))
        )}

        {isTyping && (
          <div className="flex gap-3 mr-auto">
            <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} disabled={!isConnected} />
    </div>
  );
}
