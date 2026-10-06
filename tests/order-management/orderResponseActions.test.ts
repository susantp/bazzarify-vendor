import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";

let responseData: unknown;
const get = mock(async () => ({ data: responseData }));

mock.module("@/modules/core/lib/utils.axios", () => ({
  authAxiosInstance: async () => ({ get }),
}));

const { actionGetOrder } =
  await import("@/modules/order.management/actions/actionGetOrder");
const { actionGetOrders } =
  await import("@/modules/order.management/actions/actionGetOrders");

const envelope = (payload: unknown, error: unknown = null) => ({
  data: { message: "", payload },
  metaData: { error, errorCode: null },
});

const scopedOrder = {
  uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1702",
  response_scope: "authorized_stores",
  order_number: "ORD-1",
  placed_at: "2026-10-05T12:00:00+05:45",
  status: "confirmed",
  buyer: null,
  shipping_information: { latitude: 27.7172, longitude: 85.324 },
  scoped_summary: {
    item_count: 0,
    item_quantity: 0,
    totals: {
      sub_total: 0,
      discount_total: 0,
      tax_total: 0,
      shipping_total: 0,
      grand_total: 0,
    },
  },
  items: [],
  payment_allocations: [],
  delivery_units: [],
};

const { scoped_summary, ...baseOrder } = scopedOrder;
void scoped_summary;
const fullOrder = {
  ...baseOrder,
  response_scope: "full_order",
  item_count: 0,
  item_quantity: 0,
  sub_total: 0,
  discount_total: 0,
  tax_total: 0,
  shipping_total: 0,
  grand_total: 0,
  payment_status: "pending",
  payment_method: "cod",
  payment_fee: 0,
};
const scopedListRow = {
  uuid: scopedOrder.uuid,
  response_scope: "authorized_stores",
  order_number: scopedOrder.order_number,
  placed_at: scopedOrder.placed_at,
  status: scopedOrder.status,
  buyer: null,
  scoped_summary,
};
const fullListRow = {
  uuid: scopedOrder.uuid,
  response_scope: "full_order",
  order_number: scopedOrder.order_number,
  placed_at: scopedOrder.placed_at,
  status: scopedOrder.status,
  item_count: 0,
  item_quantity: 0,
  grand_total: 0,
  payment_method: "cod",
  buyer: null,
};
const listPayload = (row: unknown) => ({
  orders: {
    current_page: 1,
    current_page_url: "/orders?page=1",
    data: [row],
    first_page_url: "/orders?page=1",
    from: 1,
    next_page_url: null,
    path: "/orders",
    per_page: 15,
    prev_page_url: null,
    to: 1,
  },
  table: {
    search: { queryKey: "search", placeholder: "Search orders" },
    filters: [],
  },
});

afterEach(() => {
  get.mockClear();
});

describe("order response actions", () => {
  it("returns valid scoped and full order responses", async () => {
    responseData = envelope({ order: scopedOrder });
    expect(await actionGetOrder(scopedOrder.uuid)).toMatchObject(scopedOrder);

    responseData = envelope({ order: fullOrder });
    expect(await actionGetOrder(scopedOrder.uuid)).toMatchObject({
      uuid: fullOrder.uuid,
      response_scope: "full_order",
      grand_total: 0,
    });
  });

  it("returns useful feedback for null and blank-error order responses", async () => {
    responseData = envelope(null, "   ");
    expect(await actionGetOrder(scopedOrder.uuid)).toEqual({
      error: "The order details could not be loaded.",
    });

    responseData = envelope({ order: null }, "");
    expect(await actionGetOrder(scopedOrder.uuid)).toEqual({
      error: "The order details could not be loaded.",
    });
  });

  it("preserves backend errors and rejects malformed success without logging payloads", async () => {
    responseData = envelope(null, "Order access denied.");
    expect(await actionGetOrder(scopedOrder.uuid)).toEqual({
      error: "Order access denied.",
    });

    const privateMarker = "PRIVATE_RESPONSE_MARKER";
    responseData = {
      ...envelope({ order: { ...scopedOrder, private_field: privateMarker } }),
      private_marker: privateMarker,
    };
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    const result = await actionGetOrder(scopedOrder.uuid);

    expect(result).toMatchObject({
      error: expect.stringContaining("[order-detail-schema]"),
    });
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(privateMarker);
    errorSpy.mockRestore();
  });

  it("returns nonempty fallback feedback for a null order list payload", async () => {
    responseData = envelope(null, " ");
    expect(await actionGetOrders()).toEqual({
      error: "Unable to fetch orders.",
    });
  });

  it("returns full and scoped list success and preserves backend errors", async () => {
    responseData = envelope(listPayload(scopedListRow));
    expect(await actionGetOrders()).toMatchObject({
      orders: { data: [{ response_scope: "authorized_stores" }] },
    });

    responseData = envelope(listPayload(fullListRow));
    expect(await actionGetOrders()).toMatchObject({
      orders: { data: [{ response_scope: "full_order", grand_total: 0 }] },
    });

    responseData = envelope(null, "Order list unavailable.");
    expect(await actionGetOrders()).toEqual({
      error: "Order list unavailable.",
    });

    responseData = envelope({
      orders: null,
      table: {
        search: { queryKey: "search", placeholder: "Search orders" },
        filters: [],
      },
    });
    expect(await actionGetOrders()).toMatchObject({ orders: null });
  });

  it("rejects malformed list success without logging private response values", async () => {
    const privateMarker = "PRIVATE_LIST_RESPONSE_MARKER";
    responseData = envelope(
      listPayload({ ...scopedListRow, private_field: privateMarker }),
    );
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    const result = await actionGetOrders();

    expect(result).toMatchObject({
      error: expect.stringContaining("[order-list-schema]"),
    });
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(privateMarker);
    errorSpy.mockRestore();
  });
});
