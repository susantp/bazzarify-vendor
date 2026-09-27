import { z } from "zod";

export const DASHBOARD_WINDOWS = ["7d", "30d", "90d"] as const;
export type DashboardWindow = (typeof DASHBOARD_WINDOWS)[number];

export const DashboardScopeSchema = z.enum(["platform", "tenant", "store"]);
export type DashboardScope = z.infer<typeof DashboardScopeSchema>;

const KpiKeySchema = z.enum([
  "orders",
  "revenue",
  "revenue-per-order",
  "active-products",
  "draft-products",
  "imports",
  "tenants",
  "stores",
  "users",
]);
const KpiFormatSchema = z.enum(["number", "currency"]);
const KpiIconSchema = z.enum([
  "shopping-bag",
  "wallet",
  "receipt-text",
  "package-open",
  "package-plus",
  "file-spreadsheet",
  "building",
  "store",
  "users",
]);

const DashboardActionSchema = z
  .object({
    label: z.string(),
    destination: z.enum([
      "onboarding",
      "imports.index",
      "products.index",
      "orders.index",
      "orders.show",
      "products.show",
      "imports.show",
    ]),
    resource_uuid: z.string().uuid().nullable(),
  })
  .strict();

const SectionBase = {
  key: z.string().min(1),
  title: z.string(),
  actions: z.array(DashboardActionSchema),
} as const;

const KpiItemSchema = z
  .object({
    key: KpiKeySchema,
    label: z.string(),
    value: z.number(),
    format: KpiFormatSchema,
    trend: z
      .object({
        delta_pct: z.number().nullable(),
        positive_direction: z.enum(["up", "down"]),
        sparkline: z.array(z.number()),
      })
      .strict(),
    icon: KpiIconSchema,
  })
  .strict();

const AttentionItemSchema = z
  .object({
    key: z.string().min(1),
    severity: z.enum(["error", "warn", "info"]),
    message: z.string(),
    count: z.number().int().nonnegative().nullable(),
    action: DashboardActionSchema.nullable(),
  })
  .strict();

const RecentActivityItemSchema = z
  .object({
    key: z.string().min(1),
    kind: z.enum(["order", "product", "import"]),
    at: z.string(),
    label: z.string(),
    amount: z.number().nullable(),
    action: DashboardActionSchema.nullable(),
  })
  .strict();

const TenantStatusItemSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    count: z.number().int().nonnegative(),
  })
  .strict();

const TopStoreSchema = z
  .object({
    uuid: z.string().uuid(),
    name: z.string(),
    products: z.number().int().nonnegative(),
    revenue: z.number(),
  })
  .strict();

const DashboardSectionSchema = z.discriminatedUnion("type", [
  z
    .object({
      ...SectionBase,
      type: z.literal("kpi-grid"),
      items: z.array(KpiItemSchema),
    })
    .strict(),
  z
    .object({
      ...SectionBase,
      type: z.literal("attention"),
      items: z.array(AttentionItemSchema),
    })
    .strict(),
  z
    .object({
      ...SectionBase,
      type: z.literal("recent-activity"),
      empty_message: z.string(),
      items: z.array(RecentActivityItemSchema),
    })
    .strict(),
  z
    .object({
      ...SectionBase,
      type: z.literal("tenant-status"),
      items: z.array(TenantStatusItemSchema),
    })
    .strict(),
  z
    .object({
      ...SectionBase,
      type: z.literal("top-stores"),
      items: z.array(TopStoreSchema),
    })
    .strict(),
  z
    .object({
      ...SectionBase,
      type: z.literal("empty-guidance"),
      description: z.string(),
    })
    .strict(),
]);

const DashboardSurfaceSchema = z
  .object({
    version: z.literal(1),
    scope: z
      .object({
        kind: DashboardScopeSchema,
        label: z.string(),
        tenant_uuid: z.string().uuid().nullable(),
        store_uuids: z.array(z.string().uuid()),
      })
      .strict(),
    heading: z.string(),
    description: z.string(),
    period_choices: z
      .array(
        z
          .object({ value: z.enum(DASHBOARD_WINDOWS), label: z.string() })
          .strict(),
      )
      .min(1),
    sections: z.array(DashboardSectionSchema),
  })
  .strict();

export const DashboardSummarySchema = z
  .object({
    period: z
      .object({
        window: z.enum(DASHBOARD_WINDOWS),
        from: z.string(),
        to: z.string(),
      })
      .strict(),
    surface: DashboardSurfaceSchema,
  })
  .strict();

export type TDashboardSummary = z.infer<typeof DashboardSummarySchema>;
export type TDashboardSurface = z.infer<typeof DashboardSurfaceSchema>;
export type TDashboardSection = z.infer<typeof DashboardSectionSchema>;
export type TDashboardKpiItem = z.infer<typeof KpiItemSchema>;
export type TDashboardAction = z.infer<typeof DashboardActionSchema>;
export type TDashboardAttentionItem = z.infer<typeof AttentionItemSchema>;
export type TDashboardRecentItem = z.infer<typeof RecentActivityItemSchema>;
export type TDashboardTopStore = z.infer<typeof TopStoreSchema>;
export type TDashboardAttentionSeverity = "error" | "warn" | "info";

export const DashboardSummaryPayloadSchema = z
  .object({ summary: DashboardSummarySchema })
  .strict();

export type TDashboardSummaryPayload = z.infer<
  typeof DashboardSummaryPayloadSchema
>;
