import { z } from "zod";

export const DeliveryUnitSummarySchema = z
  .object({
    uuid: z.uuid(),
    order_uuid: z.uuid(),
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
    assigned_user_uuid: z.uuid().nullable(),
    delivery_run_uuid: z.uuid().nullable(),
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
          quantity: z.number().int().nonnegative().nullable(),
          occurred_at: z.iso.datetime({ offset: true }).nullable(),
        })
        .strict(),
    ),
  })
  .strict();

export const DeliveryUnitQueuePayloadSchema = z
  .object({ delivery_units: z.array(DeliveryUnitSummarySchema) })
  .strict();

export type TDeliveryUnitSummary = z.infer<typeof DeliveryUnitSummarySchema>;
