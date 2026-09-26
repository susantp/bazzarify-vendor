import type { TDashboardAction } from "@/modules/dashboard/schemas/dashboard-summary-schema";

export function dashboardActionHref(action: TDashboardAction): string | null {
  switch (action.destination) {
    case "onboarding":
      return "/settings/store-onboarding";
    case "imports.index":
      return "/products/imports";
    case "products.index":
      return "/products?status=draft";
    case "orders.index":
      return "/orders?filter%5Bstatus%5D=confirmed";
    case "orders.show":
      return action.resource_uuid
        ? `/orders/${encodeURIComponent(action.resource_uuid)}`
        : null;
    case "products.show":
      return action.resource_uuid
        ? `/products/${encodeURIComponent(action.resource_uuid)}/view`
        : null;
    case "imports.show":
      return action.resource_uuid
        ? `/products/imports/${encodeURIComponent(action.resource_uuid)}`
        : null;
  }
}
