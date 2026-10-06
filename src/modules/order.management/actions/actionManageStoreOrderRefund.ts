"use server";

import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { handleUnknownError } from "@/modules/core/lib/utils.index";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order.management/routes";
import { StoreOrderRefundSchema } from "@/modules/order.management/schemas/orderSchema";
import { isAxiosError } from "axios";
import { z } from "zod";

const RefundPayloadSchema = z
  .object({ refund: StoreOrderRefundSchema })
  .strip();

type RefundActionResult =
  | { error: unknown }
  | z.infer<typeof RefundPayloadSchema>;

async function validateResponse(response: {
  data: unknown;
}): Promise<RefundActionResult> {
  const parsed = ApiResponseSchema(RefundPayloadSchema).safeParse(
    response.data,
  );
  if (!parsed.success) {
    return { error: z.prettifyError(parsed.error) };
  }
  if (parsed.data.metaData.error || parsed.data.data.payload === null) {
    return {
      error: parsed.data.metaData.error || "The refund response was empty.",
    };
  }
  return parsed.data.data.payload;
}

export async function actionRequestStoreOrderRefund(
  orderUuid: string,
  allocationUuid: string,
  itemUuid: string,
  quantity: number,
  reason: string,
  idempotencyKey: string,
): Promise<RefundActionResult> {
  try {
    const client = await authAxiosInstance();
    const response = await client.post(
      ORDER_MANAGEMENT_ROUTES.order.itemRefunds.path
        .replace(":orderId", orderUuid)
        .replace(":allocationId", allocationUuid)
        .replace(":itemId", itemUuid),
      { quantity, reason },
      { headers: { "Idempotency-Key": idempotencyKey } },
    );
    return validateResponse(response);
  } catch (error) {
    if (isAxiosError(error)) {
      console.error("[store-order-refund-request]", error.response?.data);
    }
    return handleUnknownError(error);
  }
}

export async function actionDecideStoreOrderRefund(
  orderUuid: string,
  refundUuid: string,
  decision: "approve" | "decline",
  note?: string,
): Promise<RefundActionResult> {
  try {
    const client = await authAxiosInstance();
    const response = await client.patch(
      ORDER_MANAGEMENT_ROUTES.order.refundDecision.path
        .replace(":orderId", orderUuid)
        .replace(":refundId", refundUuid),
      { decision, ...(note ? { note } : {}) },
    );
    return validateResponse(response);
  } catch (error) {
    if (isAxiosError(error)) {
      console.error("[store-order-refund-decision]", error.response?.data);
    }
    return handleUnknownError(error);
  }
}

export async function actionConfirmStoreOrderRefundReturned(
  orderUuid: string,
  refundUuid: string,
  receiptReference: string,
  idempotencyKey: string,
): Promise<RefundActionResult> {
  try {
    const client = await authAxiosInstance();
    const response = await client.post(
      ORDER_MANAGEMENT_ROUTES.order.refundConfirmReturned.path
        .replace(":orderId", orderUuid)
        .replace(":refundId", refundUuid),
      { receipt_reference: receiptReference },
      { headers: { "Idempotency-Key": idempotencyKey } },
    );
    return validateResponse(response);
  } catch (error) {
    if (isAxiosError(error)) {
      console.error("[store-order-refund-return]", error.response?.data);
    }
    return handleUnknownError(error);
  }
}
