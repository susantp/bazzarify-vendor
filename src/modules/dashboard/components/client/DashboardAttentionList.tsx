"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { dashboardActionHref } from "@/modules/dashboard/domain/dashboard-action-href";
import type {
  TDashboardAttentionItem,
  TDashboardAttentionSeverity,
} from "@/modules/dashboard/schemas/dashboard-summary-schema";
import { AlertTriangle, CircleAlert, Info } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  items: readonly TDashboardAttentionItem[];
  title: string;
};

const SEVERITY_STYLES: Record<
  TDashboardAttentionSeverity,
  { wrap: string; icon: ReactNode }
> = {
  error: {
    wrap: "border-destructive/30 bg-destructive/5 text-destructive",
    icon: <CircleAlert className="size-4" aria-hidden />,
  },
  warn: {
    wrap: "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300",
    icon: <AlertTriangle className="size-4" aria-hidden />,
  },
  info: {
    wrap: "border-sidebar-selected/30 bg-sidebar-selected/5 text-foreground",
    icon: <Info className="size-4" aria-hidden />,
  },
};

export default function DashboardAttentionList({ items, title }: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item) => {
            const style = SEVERITY_STYLES[item.severity];
            const href = item.action ? dashboardActionHref(item.action) : null;
            const content = (
              <>
                <span className="flex items-start gap-2">
                  <span className="mt-0.5">{style.icon}</span>
                  <span>{item.message}</span>
                </span>
                {typeof item.count === "number" && item.count > 1 && (
                  <span className="bg-background/80 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums">
                    {item.count}
                  </span>
                )}
              </>
            );
            return (
              <li key={item.key}>
                {href ? (
                  <Link
                    href={href}
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-sidebar-selected/10 hover:text-sidebar-foreground",
                      style.wrap,
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm",
                      style.wrap,
                    )}
                  >
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
