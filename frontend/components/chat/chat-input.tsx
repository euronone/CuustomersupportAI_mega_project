"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 p-4 bg-surface border-t border-border"
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none text-sm text-text-primary bg-bg rounded-xl px-4 py-3",
          "border border-border placeholder:text-text-muted",
          "focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20",
          "max-h-32 min-h-[44px]",
          "disabled:opacity-50"
        )}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className={cn(
          "h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer",
          value.trim()
            ? "bg-brand text-white hover:bg-brand-hover"
            : "bg-bg text-text-muted"
        )}
      >
        <Send size={18} />
      </button>
    </form>
  );
}
