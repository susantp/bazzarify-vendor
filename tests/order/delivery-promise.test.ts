import { DeliveryPromiseSchema } from "@/modules/order.management/schemas/deliverySchema";
import formatDeliveryPromise from "@/modules/order.management/utils/formatDeliveryPromise";
import { describe, expect, it } from "bun:test";

const promise = {
  estimate_from: "2026-12-01",
  estimate_to: "2026-12-03",
  timezone: "Asia/Kathmandu",
};

describe("delivery promise contract and display", () => {
  it("accepts the finite public date window and rejects private or invalid data", () => {
    expect(DeliveryPromiseSchema.safeParse(promise).success).toBe(true);
    expect(
      DeliveryPromiseSchema.safeParse({ ...promise, amount_minor: 320 })
        .success,
    ).toBe(false);
    expect(
      DeliveryPromiseSchema.safeParse({
        ...promise,
        estimate_from: "2026-02-30",
      }).success,
    ).toBe(false);
  });

  it("formats date-only values without shifting the calendar day", () => {
    expect(formatDeliveryPromise(promise)).toBe(
      "Estimated delivery: Dec 1, 2026 – Dec 3, 2026 (Asia/Kathmandu)",
    );
  });
});
