import { Card, CardContent } from "@/components/ui/card";
import DashboardAttentionList from "@/modules/dashboard/components/client/DashboardAttentionList";
import DashboardKpiGrid from "@/modules/dashboard/components/client/DashboardKpiGrid";
import DashboardRecentActivity from "@/modules/dashboard/components/client/DashboardRecentActivity";
import DashboardTopStores from "@/modules/dashboard/components/client/DashboardTopStores";
import type { TDashboardSurface } from "@/modules/dashboard/schemas/dashboard-summary-schema";

type Props = {
  surface: TDashboardSurface;
};

export default function DashboardSurfaceRenderer({ surface }: Props) {
  return (
    <div className="space-y-4">
      {surface.sections.map((section) => {
        switch (section.type) {
          case "kpi-grid":
            return (
              <section key={section.key} aria-label={section.title}>
                <h2 className="sr-only">{section.title}</h2>
                <DashboardKpiGrid items={section.items} />
              </section>
            );
          case "attention":
            return (
              <section key={section.key} aria-label={section.title}>
                <DashboardAttentionList
                  title={section.title}
                  items={section.items}
                />
              </section>
            );
          case "recent-activity":
            return (
              <section key={section.key} aria-label={section.title}>
                <DashboardRecentActivity
                  title={section.title}
                  items={section.items}
                  emptyMessage={section.empty_message}
                />
              </section>
            );
          case "tenant-status":
            return (
              <section key={section.key} aria-label={section.title}>
                <h2 className="mb-3 text-base font-semibold">
                  {section.title}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item) => (
                    <Card key={item.key}>
                      <CardContent className="flex items-center justify-between p-4">
                        <span className="text-muted-foreground text-sm">
                          {item.label}
                        </span>
                        <span className="text-xl font-semibold tabular-nums">
                          {item.count}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          case "top-stores":
            return (
              <section key={section.key} aria-label={section.title}>
                <DashboardTopStores
                  title={section.title}
                  stores={section.items}
                />
              </section>
            );
          case "empty-guidance":
            return (
              <Card key={section.key}>
                <CardContent className="p-4">
                  <h2 className="font-semibold">{section.title}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            );
        }
      })}
    </div>
  );
}
