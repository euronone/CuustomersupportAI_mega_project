"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    // Redirect based on stored user role
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const role = user.role;
      if (role === "admin") {
        router.replace("/admin/dashboard");
      } else if (role === "agent") {
        router.replace("/agent/dashboard");
      } else {
        router.replace("/chat");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="animate-pulse text-text-muted text-sm">Loading...</div>
    </div>
  );
}
