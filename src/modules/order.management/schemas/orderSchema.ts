import { UserSchema } from "@/modules/auth/domain/schemas/UserSchema";
import { z } from "zod";

const StoreSummarySchema = z
  .object({
    uuid: z.uuid(),
    name: z.string(),
    slug: z.string().optional(),
  })
  .strip();

const StoreScopedTotalsSchema = z
  .object({
    sub_total: z.float64().nonnegative().default(0),
    discount_total: z.float64().nonnegative().default(0),
    tax_total: z.float64().nonnegative().default(0),
    shipping_total: z.float64().nonnegative().default(0),
    grand_total: z.float64().nonnegative().default(0),
  })
  .strip();

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

export const ShippingInformationSchema = z
  .object({
    zip: z.string(),
    city: z.string(),
    name: z.string(),
    phone: z.string(),
    address: z.string(),
    country: z.string(),
  })
  .strict();
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
    qty_canceled: z.number().int().nonnegative().default(0),
    qty_shipped: z.number().int().nonnegative().default(0),
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
export const OrderListItemSchema = OrderSchema.pick({
  uuid: true,
  order_number: true,
  placed_at: true,
  status: true,
  grand_total: true,
  buyer_uuid: true,
  buyer_type: true,
}).extend({
  shipping_total: z.number().nonnegative().optional(),
  payment_method: z.string().max(32).optional(),
  item_count: z.number().int().nonnegative().optional(),
  item_quantity: z.number().int().nonnegative().optional(),
  items_count: z.number().int().nonnegative().nullable().optional(),
  visible_items_count: z.number().int().nonnegative().nullable().optional(),
  visible_item_quantity: z.number().int().nonnegative().nullable().optional(),
  visible_grand_total: z.number().nonnegative().nullable().optional(),
  buyer: z
    .object({
      name: z.string().nullable().optional(),
      email: z.string().email().nullable().optional(),
    })
    .nullable()
    .optional(),
});
export const OrderListSchema = z.array(OrderListItemSchema);
export type TOrder = z.infer<typeof OrderSchema>;
export type TOrderItem = z.infer<typeof OrderItemSchema>;
export type TCart = z.infer<typeof Cart>;
export type TCartMeta = z.infer<typeof CartMeta>;
export type TCartItem = z.infer<typeof CartItem>;
export type TCartItemToUpdateQuantity = z.infer<
  typeof CartItemToUpdateQuantitySchema
>;
export type TOrderTotals = z.infer<typeof OrderTotalsSchema>;
export type TOrderListItem = z.infer<typeof OrderListItemSchema>;
export type TOrderList = z.infer<typeof OrderListSchema>;
