import { expect, test } from "bun:test";

import { DashboardSummaryPayloadSchema } from "@/modules/dashboard/schemas/dashboard-summary-schema";

const validPayload = {
  summary: {
    period: {
      window: "7d",
      from: "2026-09-20T00:00:00+00:00",
      to: "2026-09-26T23:59:59+00:00",
    },
    surface: {
      version: 1,
      scope: {
        kind: "platform",
        label: "Platform",
        tenant_uuid: null,
        store_uuids: [],
      },
      heading: "Platform overview",
      description: "Platform-wide marketplace activity.",
      period_choices: [{ value: "7d", label: "Last 7 days" }],
      sections: [
        {
          key: "performance-kpis",
          type: "kpi-grid",
          title: "Performance",
          actions: [],
          items: [
            {
              key: "orders",
              label: "Orders",
              value: 4,
              format: "number",
              trend: {
                delta_pct: 2,
                positive_direction: "up",
                sparkline: [2, 4],
              },
              icon: "shopping-bag",
            },
          ],
        },
        {
          key: "recent-activity",
          type: "recent-activity",
          title: "Recent activity",
          empty_message: "No activity in this window yet.",
          actions: [],
          items: [
            {
              key: "order-00000000-0000-4000-8000-000000000001",
              kind: "order",
              at: "2026-09-26T10:00:00+00:00",
              label: "Order #1",
              amount: 20,
              action: {
                label: "View order",
                destination: "orders.show",
                resource_uuid: "00000000-0000-4000-8000-000000000001",
              },
            },
          ],
        },
      ],
    },
  },
};

test("accepts a finite versioned surface and its internal action descriptors", () => {
  expect(DashboardSummaryPayloadSchema.safeParse(validPayload).success).toBe(
    true,
  );
});

test("rejects unknown section types", () => {
  const payload = structuredClone(validPayload);
  Reflect.set(payload.summary.surface.sections[0], "type", "arbitrary-html");

  expect(DashboardSummaryPayloadSchema.safeParse(payload).success).toBe(false);
});

test("rejects unknown icon keys", () => {
  const payload = structuredClone(validPayload);
  Reflect.set(
    payload.summary.surface.sections[0].items[0],
    "icon",
    "external-icon",
  );

  expect(DashboardSummaryPayloadSchema.safeParse(payload).success).toBe(false);
});

test("rejects arbitrary action destinations", () => {
  const payload = structuredClone(validPayload);
  const section = payload.summary.surface.sections[1] as unknown as {
    items: Array<{ action: Record<string, unknown> }>;
  };
  Reflect.set(section.items[0].action, "destination", "https://example.test");

  expect(DashboardSummaryPayloadSchema.safeParse(payload).success).toBe(false);
});
