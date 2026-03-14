import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { ChatMessage } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { Bot } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  userName?: string;
}

export function MessageBubble({ message, userName = "You" }: MessageBubbleProps) {
  const isUser =
    message.sender_type === "customer" || message.sender_type === "agent";
  const isAI = message.sender_type === "ai" || message.sender_type === "system";

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[80%]",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      {isAI ? (
        <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
          <Bot size={16} className="text-brand" />
        </div>
      ) : (
        <Avatar name={userName} size="sm" />
      )}

      {/* Message content */}
      <div>
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
            isUser
              ? "bg-brand text-white rounded-br-md"
              : "bg-surface border border-border text-text-primary rounded-bl-md"
          )}
        >
          {message.content}
          {message.is_streaming && (
            <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse" />
          )}
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {message.citations.map((c, i) => (
              <div
                key={i}
                className="text-xs text-text-muted bg-bg px-2.5 py-1.5 rounded-lg border border-border"
              >
                <span className="font-medium text-brand">Source:</span>{" "}
                {c.document_title}
              </div>
            ))}
          </div>
        )}

        <p
          className={cn(
            "text-[11px] text-text-muted mt-1",
            isUser ? "text-right" : "text-left"
          )}
        >
          {formatRelativeTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
