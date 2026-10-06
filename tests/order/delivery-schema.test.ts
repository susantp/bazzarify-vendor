import { DeliveryUnitQueuePayloadSchema } from "@/modules/order.management/schemas/deliverySchema";
import { describe, expect, it } from "bun:test";

const deliveryUnit = {
  uuid: "123e4567-e89b-42d3-a456-426614174000",
  order_uuid: "123e4567-e89b-42d3-a456-426614174001",
  store_uuid: "123e4567-e89b-42d3-a456-426614174002",
  store_name: "North store",
  mode: "tenant_managed",
  status: "preparing",
  assigned_user_uuid: null,
  delivery_run_uuid: null,
  tracking_reference: null,
  items: [
    {
      order_item_uuid: "123e4567-e89b-42d3-a456-426614174003",
      name: "Rice",
      quantity: 3,
      prepared: 0,
      handed_off: 0,
      delivered: 0,
      canceled: 0,
    },
  ],
  events: [],
};

describe("DeliveryUnitQueuePayloadSchema", () => {
  it("accepts the typed tenant delivery queue projection", () => {
    expect(
      DeliveryUnitQueuePayloadSchema.safeParse({
        delivery_units: [deliveryUnit],
      }).success,
    ).toBe(true);
  });

  it("rejects internal delivery-event fields in the client projection", () => {
    expect(
      DeliveryUnitQueuePayloadSchema.safeParse({
        delivery_units: [
          {
            ...deliveryUnit,
            events: [
              {
                uuid: "123e4567-e89b-42d3-a456-426614174004",
                type: "prepared",
                quantity: 1,
                occurred_at: "2026-09-29T00:00:00+00:00",
                details: { secret: "internal" },
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });
});
