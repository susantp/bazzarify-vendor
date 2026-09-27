"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Sparkline from "@/modules/dashboard/components/client/Sparkline";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export type KpiFormat = "number" | "currency";

type Props = {
  label: string;
  kpi: { value: number; deltaPct: number | null; sparkline: number[] };
  format?: KpiFormat;
  icon?: ReactNode;
  invertDelta?: boolean;
};

const numberFormatter = new Intl.NumberFormat("en-IN");
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "NPR",
  maximumFractionDigits: 0,
});

const formatValue = (value: number, format: KpiFormat): string =>
  format === "currency"
    ? currencyFormatter.format(value)
    : numberFormatter.format(value);

const formatDelta = (deltaPct: number | null): string => {
  if (deltaPct === null) return "—";
  const abs = Math.abs(deltaPct);
  const sign = deltaPct > 0 ? "+" : deltaPct < 0 ? "-" : "";
  return `${sign}${abs.toFixed(abs < 10 ? 2 : 1)}%`;
};

export default function DashboardKpiTile({
  label,
  kpi,
  format = "number",
  icon,
  invertDelta = false,
}: Props) {
  const delta = kpi.deltaPct;
  const goodDirection = invertDelta ? -1 : 1;
  const tone =
    delta === null || delta === 0
      ? "neutral"
      : delta * goodDirection > 0
        ? "up"
        : "down";

  const toneClasses: Record<typeof tone, string> = {
    up: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    down: "bg-destructive/10 text-destructive",
    neutral: "bg-muted text-muted-foreground",
  };

  const ArrowIcon =
    tone === "up"
      ? ArrowUpRight
      : tone === "down"
        ? ArrowDownRight
        : ArrowRight;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {label}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="text-2xl font-semibold tabular-nums">
            {formatValue(kpi.value, format)}
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              toneClasses[tone],
            )}
            aria-label={`Change vs. previous window: ${formatDelta(delta)}`}
          >
            <ArrowIcon className="size-3.5" aria-hidden />
            <span>{formatDelta(delta)}</span>
          </div>
        </div>
        <Sparkline data={kpi.sparkline} width={180} height={36} />
      </CardContent>
    </Card>
  );
}
