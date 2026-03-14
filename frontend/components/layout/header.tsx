"use client";

import { Avatar } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  userName?: string;
  userAvatar?: string;
}

export function Header({
  title,
  userName = "User",
  userAvatar,
}: HeaderProps) {
  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-text-primary">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <button className="text-text-muted hover:text-text-primary transition-colors p-2 rounded-lg hover:bg-bg cursor-pointer">
          <Search size={20} />
        </button>

        {/* Notifications */}
        <button className="relative text-text-muted hover:text-text-primary transition-colors p-2 rounded-lg hover:bg-bg cursor-pointer">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <Avatar name={userName} src={userAvatar} size="sm" />
          <span className="text-sm font-medium text-text-primary hidden sm:block">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
