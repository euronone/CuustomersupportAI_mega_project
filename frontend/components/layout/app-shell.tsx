"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface AppShellProps {
  children: React.ReactNode;
  role: "admin" | "user";
  pageTitle: string;
  userName?: string;
}

export function AppShell({
  children,
  role,
  pageTitle,
  userName,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar role={role} />

      <div className="flex flex-col flex-1 min-w-0">
        <Header title={pageTitle} userName={userName} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-content mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
