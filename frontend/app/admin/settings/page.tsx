"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Key, Bot, Shield } from "lucide-react";

export default function SettingsPage() {
  const [aiModel, setAiModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState("0.3");
  const [maxTokens, setMaxTokens] = useState("2048");
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  }

  return (
    <AppShell role="admin" pageTitle="Settings" userName="Admin">
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
                { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Fastest)" },
              ]}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
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

            <div className="flex justify-end">
              <Button onClick={handleSave} loading={saving} size="sm">
                <Save size={14} />
                Save Changes
              </Button>
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
                  <span className="text-xs text-text-muted">{key.created}</span>
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
    </AppShell>
  );
}
