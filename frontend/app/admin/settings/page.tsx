"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Save,
  Key,
  Bot,
  Shield,
  Settings,
  AlertCircle,
  CheckCircle,
  Mail,
} from "lucide-react";
import { api } from "@/lib/api";
import { APP_NAME } from "@/lib/constants";

interface AIConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
}

export default function SettingsPage() {
  // AI config state
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState("0.3");
  const [maxTokens, setMaxTokens] = useState("2048");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful customer support assistant for Euron. Answer questions based on the knowledge base. Be concise, professional, and accurate."
  );

  // General settings
  const [supportEmail, setSupportEmail] = useState("support@euron.ai");

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ data: AIConfig }>("/admin/config/ai");
      const config = data.data;
      setAiConfig(config);
      setAiModel(config.model);
      setTemperature(String(config.temperature));
      setMaxTokens(String(config.max_tokens));
      setSystemPrompt(config.system_prompt);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to load AI configuration";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  async function handleSaveAIConfig() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        model: aiModel,
        temperature: parseFloat(temperature),
        max_tokens: parseInt(maxTokens, 10),
        system_prompt: systemPrompt,
      };

      await api.patch("/admin/config/ai", payload);
      setAiConfig(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to save configuration";
      setSaveError(message);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  }

  const tempValue = parseFloat(temperature);

  return (
    <AppShell role="admin" pageTitle="Settings" userName="Admin">
      {/* Loading state */}
      {loading && <PageLoader />}

      {/* Error state */}
      {!loading && error && (
        <EmptyState
          icon={AlertCircle}
          title="Unable to load settings"
          description={error}
          action={
            <Button size="sm" onClick={fetchConfig}>
              Try Again
            </Button>
          }
        />
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="space-y-6 max-w-2xl">
          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-brand" />
                <CardTitle>EURI AI Configuration</CardTitle>
              </div>
            </CardHeader>

            <div className="space-y-4">
              <Select
                label="Model"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                options={[
                  { value: "gpt-4o-mini", label: "GPT-4o Mini (Recommended)" },
                  { value: "gpt-4o", label: "GPT-4o" },
                  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
                  {
                    value: "gpt-3.5-turbo",
                    label: "GPT-3.5 Turbo (Fastest)",
                  },
                ]}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="w-full">
                  <label
                    htmlFor="temperature-slider"
                    className="block text-sm font-medium text-text-primary mb-1.5"
                  >
                    Temperature
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="temperature-slider"
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="flex-1 h-2 bg-bg rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                    <span className="text-sm font-medium text-text-primary w-8 text-right">
                      {isNaN(tempValue) ? "0.0" : tempValue.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Lower values produce more focused responses
                  </p>
                </div>

                <Input
                  label="Max Tokens"
                  type="number"
                  min="256"
                  max="8192"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
              </div>

              {/* System Prompt */}
              <div className="w-full">
                <label
                  htmlFor="system-prompt"
                  className="block text-sm font-medium text-text-primary mb-1.5"
                >
                  System Prompt
                </label>
                <textarea
                  id="system-prompt"
                  rows={4}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Enter the system prompt for the AI assistant..."
                  className="w-full px-3.5 py-3 text-sm text-text-primary bg-surface border border-input-border rounded-lg placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors duration-150 resize-y min-h-[100px]"
                />
                <p className="text-xs text-text-muted mt-1">
                  This prompt sets the behavior and context for the AI assistant
                  across all conversations.
                </p>
              </div>

              {/* Feedback messages */}
              {saveError && (
                <div className="flex items-center gap-2 text-xs text-error bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle size={14} />
                  {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="flex items-center gap-2 text-xs text-success bg-green-50 px-3 py-2 rounded-lg">
                  <CheckCircle size={14} />
                  AI configuration saved successfully
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAIConfig}
                  loading={saving}
                  size="sm"
                >
                  <Save size={14} />
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>

          {/* General Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-brand" />
                <CardTitle>General Settings</CardTitle>
              </div>
            </CardHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Application Name
                  </p>
                  <p className="text-xs text-text-muted">
                    Displayed across the platform
                  </p>
                </div>
                <Badge variant="brand">{APP_NAME}</Badge>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={16} className="text-text-muted shrink-0" />
                <Input
                  label="Support Email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@example.com"
                  type="email"
                />
              </div>
            </div>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key size={18} className="text-brand" />
                <CardTitle>API Keys</CardTitle>
              </div>
              <Button size="sm" variant="secondary">
                Generate Key
              </Button>
            </CardHeader>

            <div className="space-y-3">
              {[
                {
                  name: "Production Key",
                  prefix: "esk_prod_***...a4f2",
                  created: "Feb 12, 2026",
                },
                {
                  name: "Development Key",
                  prefix: "esk_dev_***...b8c1",
                  created: "Jan 28, 2026",
                },
              ].map((key) => (
                <div
                  key={key.name}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {key.name}
                    </p>
                    <p className="text-xs text-text-muted font-mono">
                      {key.prefix}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-muted">
                      {key.created}
                    </span>
                    <Button variant="tertiary" size="sm">
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-brand" />
                <CardTitle>Security</CardTitle>
              </div>
            </CardHeader>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Rate Limiting
                  </p>
                  <p className="text-xs text-text-muted">
                    Limit API requests per minute
                  </p>
                </div>
                <Badge variant="success">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    PII Detection
                  </p>
                  <p className="text-xs text-text-muted">
                    Automatically mask sensitive data in conversations
                  </p>
                </div>
                <Badge variant="success">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Audit Logging
                  </p>
                  <p className="text-xs text-text-muted">
                    Track all admin actions
                  </p>
                </div>
                <Badge variant="success">Enabled</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
