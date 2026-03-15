"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface StoredUser {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "agent" | "customer";
  tenant_id: string;
}

export function useUser(requiredRole?: "admin" | "agent" | "customer") {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const stored = localStorage.getItem("user");

    if (!token || !stored) {
      router.replace("/login");
      return;
    }

    try {
      const parsed = JSON.parse(stored) as StoredUser;
      // If a required role is set, redirect if mismatch
      if (requiredRole && parsed.role !== requiredRole) {
        if (parsed.role === "admin") router.replace("/admin/dashboard");
        else if (parsed.role === "agent") router.replace("/agent/dashboard");
        else router.replace("/chat");
        return;
      }
      setUser(parsed);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router, requiredRole]);

  return { user, loading };
}
