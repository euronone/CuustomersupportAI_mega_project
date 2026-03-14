"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Ticket,
  HelpCircle,
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const userNav: NavItem[] = [
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "Help Center", href: "/help", icon: HelpCircle },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Knowledge Base", href: "/admin/knowledge", icon: BookOpen },
  { label: "Agents", href: "/admin/agents", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  role: "admin" | "user";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = role === "admin" ? [...adminNav, ...userNav] : userNav;

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-surface border-r border-border transition-all duration-150",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
          E
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-text-primary">
            {APP_NAME}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {role === "admin" && !collapsed && (
          <p className="px-3 mb-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Admin
          </p>
        )}
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isUserSection = userNav.some((u) => u.href === item.href);

          return (
            <span key={item.href}>
              {role === "admin" &&
                isUserSection &&
                item.href === userNav[0].href &&
                !collapsed && (
                  <p className="px-3 mt-4 mb-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Support
                  </p>
                )}
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100",
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-text-muted hover:bg-bg hover:text-text-primary"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </span>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-text-muted hover:bg-bg hover:text-text-primary transition-colors cursor-pointer"
        >
          <ChevronLeft
            size={20}
            className={cn(
              "shrink-0 transition-transform duration-150",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-text-muted hover:bg-bg hover:text-error transition-colors cursor-pointer"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
