"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, FileText, HelpCircle } from "lucide-react";

// Mock data — will be replaced by KB API
const collections = [
  {
    id: "1",
    name: "Getting Started",
    description: "Learn the basics of using the platform",
    icon: BookOpen,
    articleCount: 12,
  },
  {
    id: "2",
    name: "Account & Billing",
    description: "Manage your account, subscriptions, and invoices",
    icon: FileText,
    articleCount: 8,
  },
  {
    id: "3",
    name: "Troubleshooting",
    description: "Common issues and how to resolve them",
    icon: HelpCircle,
    articleCount: 15,
  },
];

const popularArticles = [
  {
    id: "a1",
    title: "How to reset your password",
    collection: "Account & Billing",
    views: 1240,
  },
  {
    id: "a2",
    title: "Setting up your first knowledge base",
    collection: "Getting Started",
    views: 980,
  },
  {
    id: "a3",
    title: "Understanding ticket priorities",
    collection: "Getting Started",
    views: 756,
  },
  {
    id: "a4",
    title: "Connecting your CRM integration",
    collection: "Getting Started",
    views: 543,
  },
];

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");

  return (
    <AppShell role="user" pageTitle="Help Center" userName="Demo User">
      {/* Search hero */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          How can we help you?
        </h2>
        <p className="text-sm text-text-muted mb-6">
          Search our knowledge base or browse by topic
        </p>
        <div className="max-w-lg mx-auto relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 text-sm text-text-primary bg-surface border border-border rounded-xl placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors"
          />
        </div>
      </div>

      {/* Collections grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {collections.map((col) => (
          <Card
            key={col.id}
            className="hover:border-brand/30 transition-colors cursor-pointer"
          >
            <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center mb-3">
              <col.icon size={20} className="text-brand" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              {col.name}
            </h3>
            <p className="text-xs text-text-muted mb-3">{col.description}</p>
            <span className="text-xs text-text-muted">
              {col.articleCount} articles
            </span>
          </Card>
        ))}
      </div>

      {/* Popular articles */}
      <h3 className="text-base font-semibold text-text-primary mb-4">
        Popular articles
      </h3>
      <Card padding="none">
        {popularArticles.map((article, i) => (
          <div
            key={article.id}
            className={`flex items-center justify-between px-5 py-3.5 hover:bg-bg transition-colors cursor-pointer ${
              i < popularArticles.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div>
              <h4 className="text-sm font-medium text-text-primary">
                {article.title}
              </h4>
              <span className="text-xs text-text-muted">
                {article.collection}
              </span>
            </div>
            <Badge variant="default">{article.views} views</Badge>
          </div>
        ))}
      </Card>
    </AppShell>
  );
}
