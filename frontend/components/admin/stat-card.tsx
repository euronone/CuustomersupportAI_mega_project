import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
}

export function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-muted mt-1">{subtitle}</p>
          )}
          {trend && (
            <p
              className={`text-xs font-medium mt-1 ${
                trend.positive ? "text-success" : "text-error"
              }`}
            >
              {trend.positive ? "+" : ""}
              {trend.value}% vs last week
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-brand" />
        </div>
      </div>
    </Card>
  );
}
