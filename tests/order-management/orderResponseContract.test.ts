import {
  OrderListItemSchema,
  OrderResponseSchema,
} from "@/modules/order.management/schemas/orderSchema";
import { describe, expect, it } from "bun:test";

const scopedSummary = {
  item_count: 1,
  item_quantity: 3,
  totals: {
    sub_total: 30,
    discount_total: 0,
    tax_total: 0,
    shipping_total: 0,
    grand_total: 30,
  },
};

const sharedItem = {
  uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1701",
  order_uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1702",
  orderable_uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1703",
  sku: "SKU-1",
  name: "Widget",
  variant_attributes: {
    uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1706",
    name: "Blue",
    sku: "SKU-1-BLUE",
    color: "blue",
    size: "M",
  },
  store_uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1704",
  store: {
    uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1704",
    name: "Store A",
    slug: "store-a",
  },
  qty_ordered: 3,
  qty_refunded: 0,
  unit_price: 10,
  row_discount: 0,
  row_tax: 0,
  row_shipping: 0,
  row_total: 30,
  refund_cases: [],
  refund_policy_enabled: false,
  payment_allocation_uuid: null,
  payment_allocation_status: null,
  payment_allocation_method: null,
};

describe("order response scope contracts", () => {
  it("accepts a strict authorized-store detail with object variant attributes", () => {
    const parsed = OrderResponseSchema.safeParse({
      uuid: sharedItem.order_uuid,
      response_scope: "authorized_stores",
      order_number: "ORD-1",
      placed_at: "2026-10-05T12:00:00+05:45",
      status: "confirmed",
      buyer: {
        name: "Buyer",
        email: "buyer@example.test",
        phone: "9800000000",
      },
      shipping_information: null,
      scoped_summary: scopedSummary,
      items: [sharedItem],
      payment_allocations: [
        {
          uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1705",
          store_uuid: sharedItem.store_uuid,
          method: "cod",
          amount_minor: 3000,
          status: "pending",
        },
      ],
      delivery_units: [],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects global totals and unknown nested model fields in scoped detail", () => {
    const scopedDetail = (overrides: Record<string, unknown> = {}) => ({
      uuid: sharedItem.order_uuid,
      response_scope: "authorized_stores",
      order_number: "ORD-1",
      placed_at: "2026-10-05T12:00:00+05:45",
      status: "confirmed",
      buyer: null,
      shipping_information: null,
      scoped_summary: scopedSummary,
      items: [sharedItem],
      payment_allocations: [],
      delivery_units: [],
      ...overrides,
    });

    for (const [field, value] of Object.entries({
      item_count: 1,
      item_quantity: 3,
      sub_total: 30,
      discount_total: 0,
      tax_total: 0,
      shipping_total: 0,
      grand_total: 30,
      payment_status: "paid",
      payment_method: "cod",
      payment_fee: 2,
    })) {
      expect(
        OrderResponseSchema.safeParse(scopedDetail({ [field]: value })).success,
      ).toBe(false);
    }
    expect(
      OrderResponseSchema.safeParse(
        scopedDetail({
          items: [{ ...sharedItem, commerce_snapshot: { secret: true } }],
        }),
      ).success,
    ).toBe(false);

    expect(
      OrderResponseSchema.safeParse(
        scopedDetail({
          items: [
            {
              ...sharedItem,
              variant_attributes: {
                ...sharedItem.variant_attributes,
                internal_reference: "AUDIT_PRIVATE_SCALAR",
              },
            },
          ],
        }),
      ).success,
    ).toBe(false);

    expect(
      OrderResponseSchema.safeParse(
        scopedDetail({
          items: [
            { ...sharedItem, variant_attributes: { color: { name: "Blue" } } },
          ],
        }),
      ).success,
    ).toBe(false);
  });

  it("accepts only finite nullable coordinates and typed variant leaves", () => {
    const base = {
      uuid: sharedItem.order_uuid,
      response_scope: "authorized_stores" as const,
      order_number: "ORD-1",
      placed_at: "2026-10-05T12:00:00+05:45",
      status: "confirmed",
      buyer: null,
      shipping_information: { latitude: 27.7172, longitude: null },
      scoped_summary: scopedSummary,
      items: [sharedItem],
      payment_allocations: [],
      delivery_units: [],
    };

    expect(OrderResponseSchema.safeParse(base).success).toBe(true);
    expect(
      OrderResponseSchema.safeParse({
        ...base,
        shipping_information: { latitude: Number.POSITIVE_INFINITY },
      }).success,
    ).toBe(false);
    expect(
      OrderResponseSchema.safeParse({
        ...base,
        shipping_information: { longitude: Number.NaN },
      }).success,
    ).toBe(false);

    const invalidVariants = [
      { uuid: "invalid-uuid" },
      { name: false },
      { sku: 12 },
      { color: { label: "blue" } },
      { size: ["M"] },
    ];
    for (const invalid of invalidVariants) {
      const item = { ...sharedItem, variant_attributes: invalid };
      expect(
        OrderResponseSchema.safeParse({ ...base, items: [item] }).success,
      ).toBe(false);
    }
    expect(
      OrderResponseSchema.safeParse({
        ...base,
        items: [
          {
            ...sharedItem,
            variant_attributes: { uuid: null, name: null, color: "Blue" },
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects forbidden private keys independently at each nested detail leaf", () => {
    const scopedDetail = (
      item: Record<string, unknown> = sharedItem,
      overrides: Record<string, unknown> = {},
    ) => ({
      uuid: sharedItem.order_uuid,
      response_scope: "authorized_stores",
      order_number: "ORD-1",
      placed_at: "2026-10-05T12:00:00+05:45",
      status: "confirmed",
      buyer: null,
      shipping_information: null,
      scoped_summary: scopedSummary,
      items: [item],
      payment_allocations: [],
      delivery_units: [],
      ...overrides,
    });
    const privateLeaves = [
      { buyer: { name: "Buyer", email: null, private_phone: "hidden" } },
      {
        shipping_information: {
          city: "Kathmandu",
          private_address_id: "hidden",
        },
      },
      {
        items: [
          {
            ...sharedItem,
            store: { ...sharedItem.store, tenant_uuid: "hidden" },
          },
        ],
      },
      {
        items: [
          {
            ...sharedItem,
            variant_attributes: { color: "blue", private_key: "hidden" },
          },
        ],
      },
      {
        items: [
          {
            ...sharedItem,
            refund_cases: [
              {
                uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1705",
                requested_quantity: 1,
                amount_minor: 1,
                status: "returned",
                reason: "ok",
                decision_note: null,
                created_at: null,
                decision_at: null,
                returned_at: null,
                return_receipt_reference: null,
                tenant_uuid: "hidden",
              },
            ],
          },
        ],
      },
      {
        payment_allocations: [
          {
            uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1705",
            store_uuid: sharedItem.store_uuid,
            method: "cod",
            amount_minor: 1,
            status: "pending",
            tenant_uuid: "hidden",
          },
        ],
      },
      {
        delivery_units: [
          {
            uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1705",
            store_uuid: sharedItem.store_uuid,
            store_name: "A",
            mode: "tenant_managed",
            status: "preparing",
            tracking_reference: null,
            items: [
              {
                order_item_uuid: sharedItem.uuid,
                name: "Widget",
                quantity: 1,
                prepared: 0,
                handed_off: 0,
                delivered: 0,
                canceled: 0,
                cost: 3,
              },
            ],
            events: [],
          },
        ],
      },
      {
        delivery_units: [
          {
            uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1705",
            store_uuid: sharedItem.store_uuid,
            store_name: "A",
            mode: "tenant_managed",
            status: "preparing",
            tracking_reference: null,
            items: [],
            events: [
              {
                uuid: "2b29c5f6-e11a-4f9b-a95a-f37fca0f1706",
                type: "prepared",
                occurred_at: null,
                details: { private: true },
              },
            ],
          },
        ],
      },
    ];
    for (const privateFields of privateLeaves) {
      expect(
        OrderResponseSchema.safeParse(scopedDetail(sharedItem, privateFields))
          .success,
      ).toBe(false);
    }
  });

  it("accepts full-order details and rejects a missing scoped summary", () => {
    const full = {
      uuid: sharedItem.order_uuid,
      response_scope: "full_order",
      order_number: "ORD-1",
      placed_at: "2026-10-05T12:00:00+05:45",
      status: "confirmed",
      buyer: {
        name: "Buyer",
        email: "buyer@example.test",
        phone: "9800000000",
      },
      shipping_information: { recipient_name: "Buyer", city: "Kathmandu" },
      item_count: 1,
      item_quantity: 3,
      sub_total: 30,
      discount_total: 0,
      tax_total: 0,
      shipping_total: 0,
      grand_total: 30,
      payment_status: "pending",
      payment_method: "cod",
      payment_fee: 0,
      items: [sharedItem],
      payment_allocations: [],
      delivery_units: [],
    };

    expect(OrderResponseSchema.safeParse(full).success).toBe(true);
    expect(
      OrderResponseSchema.safeParse({
        ...full,
        response_scope: "authorized_stores",
        scoped_summary: undefined,
      }).success,
    ).toBe(false);
  });

  it("requires each list row to follow its scope-specific allowlist", () => {
    const scopedRow = {
      response_scope: "authorized_stores",
      uuid: sharedItem.order_uuid,
      order_number: "ORD-1",
      placed_at: "2026-10-05T12:00:00+05:45",
      status: "confirmed",
      scoped_summary: scopedSummary,
      buyer: null,
    };

    expect(OrderListItemSchema.safeParse(scopedRow).success).toBe(true);
    expect(
      OrderListItemSchema.safeParse({ ...scopedRow, grand_total: 999 }).success,
    ).toBe(false);
    for (const [field, value] of Object.entries({
      item_count: 1,
      item_quantity: 1,
      grand_total: 1,
      payment_method: "cod",
      payment_status: "paid",
      payment_fee: 1,
    })) {
      expect(
        OrderListItemSchema.safeParse({ ...scopedRow, [field]: value }).success,
      ).toBe(false);
    }
    expect(
      OrderListItemSchema.safeParse({
        ...scopedRow,
        buyer: { name: "Buyer", email: null, phone: "private" },
      }).success,
    ).toBe(false);
  });
});
