import { expect, test } from "bun:test";

import { dashboardActionHref } from "@/modules/dashboard/domain/dashboard-action-href";

test("dashboard order actions resolve to vendor order pages", () => {
  expect(
    dashboardActionHref({
      label: "View orders",
      destination: "orders.index",
      resource_uuid: null,
    }),
  ).toBe("/orders?filter%5Bstatus%5D=confirmed");
  expect(
    dashboardActionHref({
      label: "View order",
      destination: "orders.show",
      resource_uuid: "00000000-0000-4000-8000-000000000001",
    }),
  ).toBe("/orders/00000000-0000-4000-8000-000000000001");
});

test("resource actions without an identifier render as non-links", () => {
  expect(
    dashboardActionHref({
      label: "View order",
      destination: "orders.show",
      resource_uuid: null,
    }),
  ).toBeNull();
});
