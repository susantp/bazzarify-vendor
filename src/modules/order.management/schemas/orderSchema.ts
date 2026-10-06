import { UserSchema } from "@/modules/auth/domain/schemas/UserSchema";
import { z } from "zod";

const StoreSummarySchema = z
  .object({
    uuid: z.uuid(),
    name: z.string(),
    slug: z.string().optional(),
  })
  .strict();

const OrderBuyerSummarySchema = z
  .object({
    name: z.string().nullable(),
    email: z.string().email().nullable(),
    phone: z.string().nullable().optional(),
  })
  .strict();

export const ShippingInformationSchema = z
  .object({
    recipient_name: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    address_line: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    street: z.string().nullable().optional(),
    locality: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    region: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    postal_code: z.string().nullable().optional(),
    zip: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    place_id: z.string().nullable().optional(),
    label: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
  })
  .strict();

const StoreScopedTotalsSchema = z
  .object({
    sub_total: z.number().nonnegative(),
    discount_total: z.number().nonnegative(),
    tax_total: z.number().nonnegative(),
    shipping_total: z.number().nonnegative(),
    grand_total: z.number().nonnegative(),
  })
  .strict();

export const StoreOrderRefundSchema = z
  .object({
    uuid: z.uuid(),
    requested_quantity: z.number().int().positive(),
    amount_minor: z.number().int().nonnegative(),
    status: z.enum(["requested", "approved", "declined", "returned"]),
    reason: z.string(),
    decision_note: z.string().nullable(),
    created_at: z.iso.datetime({ offset: true }).nullable(),
    decision_at: z.iso.datetime({ offset: true }).nullable(),
    returned_at: z.iso.datetime({ offset: true }).nullable(),
    return_receipt_reference: z.string().nullable(),
  })
  .strict();

export const OrderDeliveryUnitSchema = z
  .object({
    uuid: z.uuid(),
    store_uuid: z.uuid(),
    store_name: z.string().nullable(),
    mode: z.enum(["tenant_managed", "vendor_managed"]),
    status: z.enum([
      "preparing",
      "ready_for_handoff",
      "handed_off",
      "in_transit",
      "partially_delivered",
      "delivered",
      "failed",
      "canceled",
    ]),
    tracking_reference: z.string().nullable(),
    items: z.array(
      z
        .object({
          order_item_uuid: z.uuid(),
          name: z.string().nullable(),
          quantity: z.number().int().nonnegative(),
          prepared: z.number().int().nonnegative(),
          handed_off: z.number().int().nonnegative(),
          delivered: z.number().int().nonnegative(),
          canceled: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    events: z.array(
      z
        .object({
          uuid: z.uuid(),
          type: z.enum([
            "prepared",
            "handed_off",
            "picked_up",
            "in_transit",
            "delivered",
            "failed_attempt",
            "canceled",
            "assigned",
          ]),
          occurred_at: z.iso.datetime({ offset: true }).nullable(),
        })
        .strict(),
    ),
  })
  .strict();

const StoreOrderAllocationSchema = z
  .object({
    uuid: z.uuid(),
    store_uuid: z.uuid(),
    method: z.string().max(32),
    amount_minor: z.number().int().nonnegative(),
    status: z.enum(["pending", "collected"]),
  })
  .strict();

const VariantAttributesSchema = z
  .object({
    uuid: z.uuid().nullable().optional(),
    name: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    size: z.string().nullable().optional(),
  })
  .strict();

const OrderDetailItemSchema = z
  .object({
    uuid: z.uuid(),
    order_uuid: z.uuid(),
    orderable_uuid: z.uuid(),
    sku: z.string(),
    name: z.string(),
    variant_attributes: VariantAttributesSchema.nullable(),
    store_uuid: z.uuid(),
    store: StoreSummarySchema.nullable(),
    qty_ordered: z.number().int().nonnegative(),
    qty_refunded: z.number().int().nonnegative(),
    unit_price: z.number().nonnegative(),
    row_discount: z.number().nonnegative(),
    row_tax: z.number().nonnegative(),
    row_shipping: z.number().nonnegative(),
    row_total: z.number().nonnegative(),
    refund_cases: z.array(StoreOrderRefundSchema),
    refund_policy_enabled: z.boolean(),
    payment_allocation_uuid: z.uuid().nullable(),
    payment_allocation_status: z.enum(["pending", "collected"]).nullable(),
    payment_allocation_method: z.string().max(32).nullable(),
  })
  .strict();

const ScopedOrderSummarySchema = z
  .object({
    item_count: z.number().int().nonnegative(),
    item_quantity: z.number().int().nonnegative(),
    totals: StoreScopedTotalsSchema,
  })
  .strict();

const ScopedOrderDetailSchema = z
  .object({
    uuid: z.uuid(),
    response_scope: z.literal("authorized_stores"),
    order_number: z.string(),
    placed_at: z.iso.datetime({ offset: true }),
    status: z.string().max(32),
    buyer: OrderBuyerSummarySchema.nullable(),
    shipping_information: ShippingInformationSchema.nullable(),
    scoped_summary: ScopedOrderSummarySchema,
    items: z.array(OrderDetailItemSchema),
    payment_allocations: z.array(StoreOrderAllocationSchema),
    delivery_units: z.array(OrderDeliveryUnitSchema),
  })
  .strict();

const FullOrderDetailSchema = z
  .object({
    uuid: z.uuid(),
    response_scope: z.literal("full_order"),
    order_number: z.string(),
    placed_at: z.iso.datetime({ offset: true }),
    status: z.string().max(32),
    buyer: OrderBuyerSummarySchema.nullable(),
    shipping_information: ShippingInformationSchema.nullable(),
    item_count: z.number().int().nonnegative(),
    item_quantity: z.number().int().nonnegative(),
    sub_total: z.number().nonnegative(),
    discount_total: z.number().nonnegative(),
    tax_total: z.number().nonnegative(),
    shipping_total: z.number().nonnegative(),
    grand_total: z.number().nonnegative(),
    payment_status: z.string().max(32).nullable(),
    payment_method: z.string().max(32).nullable(),
    payment_fee: z.number().nonnegative(),
    items: z.array(OrderDetailItemSchema),
    payment_allocations: z.array(StoreOrderAllocationSchema),
    delivery_units: z.array(OrderDeliveryUnitSchema),
  })
  .strict();

export const OrderResponseSchema = z.discriminatedUnion("response_scope", [
  ScopedOrderDetailSchema,
  FullOrderDetailSchema,
]);
export type TOrder = z.infer<typeof OrderResponseSchema>;
export type TOrderItem = z.infer<typeof OrderDetailItemSchema>;
export const OrderItemSchema = z
  .object({
    line_id: z.string().optional(),
    uuid: z.uuid(),
    order_uuid: z.uuid(),
    orderable_uuid: z.uuid(),
    orderable_type: z.string(),
    sku: z.string(),
    name: z.string(),
    variant_attributes: z.string().nullable(),
    qty_ordered: z.number().int().nonnegative(),
    qty_refunded: z.number().int().nonnegative().default(0),
    refund_cases: z.array(StoreOrderRefundSchema).default([]),
    refund_policy_enabled: z.boolean().optional(),
    payment_allocation_uuid: z.uuid().nullable().optional(),
    payment_allocation_status: z
      .enum(["pending", "collected"])
      .nullable()
      .optional(),
    payment_allocation_method: z.literal("cod").nullable().optional(),

    unit_price: z.float64().nonnegative(),
    row_discount: z.float64().nonnegative().default(0),
    row_tax: z.float64().nonnegative().default(0),
    row_shipping: z.float64().nonnegative().default(0),
    row_total: z.float64().nonnegative().nonoptional(),
    created_by_user_uuid: z.uuid().nullable().optional(),
    store_uuid: z.uuid().nullable().optional(),
    store: StoreSummarySchema.nullable().optional(),
    meta: z.record(z.any(), z.string()).nullable(), // JSON column
    created_at: z.iso.datetime().optional(),
    updated_at: z.iso.datetime().optional(),
    deleted_at: z.iso.datetime().nullable().optional(),
  })
  .strict();
export const OrderSchema = z
  .object({
    uuid: z.uuid(),
    buyer_uuid: z.uuid(),
    buyer_type: z.string(),
    buyer: UserSchema.nullable(),
    order_number: z.string(),
    status: z.string().max(32),
    item_count: z.number().int().nonnegative().default(0),
    item_quantity: z.number().int().nonnegative().default(0),
    sub_total: z.float64().nonnegative().default(0),
    discount_total: z.float64().nonnegative().default(0),
    tax_total: z.float64().nonnegative().default(0),
    shipping_total: z.float64().nonnegative().default(0),
    shipping_information: ShippingInformationSchema,
    grand_total: z.float64().nonnegative().default(0),
    payment_status: z.string().max(32),
    payment_method: z.string().max(32),
    payment_fee: z.float64().nonnegative().default(0),
    store_scoped_totals: StoreScopedTotalsSchema.nullable().optional(),
    placed_at: z.iso.datetime(),
    cancelled_at: z.iso.datetime().nullable().optional(),
    completed_at: z.iso.datetime().nullable().optional(),
    status_history: z
      .array(z.record(z.string(), z.unknown()))
      .nullable()
      .optional(),
    status_histories: z
      .array(z.record(z.string(), z.unknown()))
      .nullable()
      .optional(),
    created_at: z.iso.datetime().optional().optional(),
    updated_at: z.iso.datetime().optional().optional(),
    deleted_at: z.iso.datetime().nullable().optional(),
  })
  .extend({
    items: z.array(OrderItemSchema),
    delivery_units: z.array(OrderDeliveryUnitSchema),
  })
  .strict();
export const CartItem = OrderItemSchema.pick({
  line_id: true,
  uuid: true,
  name: true,
  sku: true,
  variant_attributes: true,
  unit_price: true,
  row_discount: true,
  row_tax: true,
  row_shipping: true,
  row_total: true,
  qty_ordered: true,
}).strict();

export const CartMeta = OrderSchema.pick({
  sub_total: true,
  discount_total: true,
  tax_total: true,
  shipping_total: true,
  grand_total: true,
  item_count: true,
  item_quantity: true,
}).strict();

export const Cart = z
  .object({
    items: z.array(CartItem),
    totals: CartMeta,
  })
  .strict()
  .nullable();

export const CartItemToUpdateQuantitySchema = CartItem.pick({
  line_id: true,
  uuid: true,
  variant_attributes: true,
  qty_ordered: true,
});
export const OrderTotalsSchema = OrderSchema.pick({
  sub_total: true,
  discount_total: true,
  tax_total: true,
  shipping_total: true,
  grand_total: true,
  payment_fee: true,
}).strict();
const FullOrderListItemSchema = z
  .object({
    response_scope: z.literal("full_order"),
    uuid: z.uuid(),
    order_number: z.string(),
    placed_at: z.iso.datetime({ offset: true }),
    status: z.string().max(32),
    item_count: z.number().int().nonnegative(),
    item_quantity: z.number().int().nonnegative(),
    grand_total: z.number().nonnegative(),
    payment_method: z.string().max(32).nullable(),
    buyer: OrderBuyerSummarySchema.pick({ name: true, email: true }).nullable(),
  })
  .strict();

const ScopedOrderListItemSchema = z
  .object({
    response_scope: z.literal("authorized_stores"),
    uuid: z.uuid(),
    order_number: z.string(),
    placed_at: z.iso.datetime({ offset: true }),
    status: z.string().max(32),
    scoped_summary: ScopedOrderSummarySchema,
    buyer: OrderBuyerSummarySchema.pick({ name: true, email: true }).nullable(),
  })
  .strict();

export const OrderListItemSchema = z.discriminatedUnion("response_scope", [
  ScopedOrderListItemSchema,
  FullOrderListItemSchema,
]);
export const OrderListSchema = z.array(OrderListItemSchema);
export type TCart = z.infer<typeof Cart>;
export type TCartMeta = z.infer<typeof CartMeta>;
export type TCartItem = z.infer<typeof CartItem>;
export type TCartItemToUpdateQuantity = z.infer<
  typeof CartItemToUpdateQuantitySchema
>;
export type TOrderTotals = z.infer<typeof OrderTotalsSchema>;
export type TOrderListItem = z.infer<typeof OrderListItemSchema>;
export type TOrderList = z.infer<typeof OrderListSchema>;
