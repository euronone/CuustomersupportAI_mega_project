"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { APP_NAME, API_BASE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Shield, Headphones, User } from "lucide-react";

const roles = [
  {
    value: "customer",
    label: "Customer",
    description: "Get support for your queries",
    icon: User,
  },
  {
    value: "agent",
    label: "Agent",
    description: "Handle customer support tickets",
    icon: Headphones,
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manage platform and team",
    icon: Shield,
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState("customer");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            display_name: displayName,
            role,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || data?.message || "Registration failed");
      }

      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-xl mb-3">
            E
          </div>
          <h1 className="text-2xl font-bold text-text-primary">{APP_NAME}</h1>
          <p className="text-sm text-text-muted mt-1">Create your account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                I am signing up as
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all duration-150 cursor-pointer",
                      role === r.value
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-border text-text-muted hover:border-brand/30 hover:bg-bg"
                    )}
                  >
                    <r.icon size={20} />
                    <span className="text-xs font-semibold">{r.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-1.5 text-center">
                {roles.find((r) => r.value === role)?.description}
              </p>
            </div>

            <Input
              label="Full name"
              type="text"
              placeholder={
                role === "customer"
                  ? "Your name"
                  : role === "agent"
                    ? "Agent name"
                    : "Admin name"
              }
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />

            {error && (
              <p className="text-sm text-error bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Create {role} account
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted mt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-brand hover:text-brand-hover font-medium"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
