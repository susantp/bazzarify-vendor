"use client";

import DashboardKpiTile from "@/modules/dashboard/components/client/DashboardKpiTile";
import type { TDashboardKpiItem } from "@/modules/dashboard/schemas/dashboard-summary-schema";
import {
  Building,
  FileSpreadsheet,
  PackageOpen,
  PackagePlus,
  ReceiptText,
  ShoppingBag,
  Store as StoreIcon,
  Users,
  Wallet,
} from "lucide-react";

type Props = {
  items: readonly TDashboardKpiItem[];
};

const KPI_ICONS = {
  "shopping-bag": ShoppingBag,
  wallet: Wallet,
  "receipt-text": ReceiptText,
  "package-open": PackageOpen,
  "package-plus": PackagePlus,
  "file-spreadsheet": FileSpreadsheet,
  building: Building,
  store: StoreIcon,
  users: Users,
} as const;

export default function DashboardKpiGrid({ items }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => {
        const Icon = KPI_ICONS[item.icon];

        return (
          <DashboardKpiTile
            key={item.key}
            label={item.label}
            kpi={{
              value: item.value,
              deltaPct: item.trend.delta_pct,
              sparkline: item.trend.sparkline,
            }}
            format={item.format}
            icon={<Icon className="size-4" aria-hidden />}
            invertDelta={item.trend.positive_direction === "down"}
          />
        );
      })}
    </div>
  );
}
