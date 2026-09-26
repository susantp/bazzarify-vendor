"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TDashboardTopStore } from "@/modules/dashboard/schemas/dashboard-summary-schema";
import { Store } from "lucide-react";

type Props = {
  stores: readonly TDashboardTopStore[];
  title: string;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "NPR",
  maximumFractionDigits: 0,
});

export default function DashboardTopStores({ stores, title }: Props) {
  if (stores.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {stores.map((store) => (
            <li
              key={store.uuid}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <Store className="text-muted-foreground size-4" aria-hidden />
                <span className="font-medium">{store.name}</span>
              </span>
              <span className="text-muted-foreground flex items-center gap-4 tabular-nums">
                <span>{store.products} products</span>
                <span>{currencyFormatter.format(store.revenue)}</span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
