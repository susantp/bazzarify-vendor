import { StoreOrderRefundSchema } from "@/modules/order.management/schemas/orderSchema";
import { describe, expect, it } from "bun:test";

const refundCase = {
  uuid: "123e4567-e89b-42d3-a456-426614174000",
  requested_quantity: 1,
  amount_minor: 1250,
  status: "requested",
  reason: "Item arrived damaged",
  decision_note: null,
  created_at: "2026-09-28T12:00:00.000Z",
  decision_at: null,
  returned_at: null,
  return_receipt_reference: null,
};

describe("StoreOrderRefundSchema", () => {
  it("accepts the vendor/admin refund projection", () => {
    expect(StoreOrderRefundSchema.safeParse(refundCase).success).toBe(true);
  });

  it("rejects unknown statuses, fractional amounts, and leaked fields", () => {
    expect(
      StoreOrderRefundSchema.safeParse({ ...refundCase, status: "pending" })
        .success,
    ).toBe(false);
    expect(
      StoreOrderRefundSchema.safeParse({ ...refundCase, amount_minor: 1.25 })
        .success,
    ).toBe(false);
    expect(
      StoreOrderRefundSchema.safeParse({
        ...refundCase,
        collection_transaction_uuid: "123e4567-e89b-42d3-a456-426614174001",
      }).success,
    ).toBe(false);
  });
});
