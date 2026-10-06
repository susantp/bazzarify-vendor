"use server";

import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { handleUnknownError } from "@/modules/core/lib/utils.index";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order.management/routes";
import { isAxiosError } from "axios";
import { z } from "zod";

const DeliveryEventResultSchema = z.object({
  delivery_unit: z.object({ uuid: z.uuid() }),
});

export type DeliveryEventType =
  | "prepared"
  | "handed_off"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed_attempt"
  | "canceled";

export async function actionRecordDeliveryEvent(
  orderUuid: string,
  unitUuid: string,
  type: DeliveryEventType,
  idempotencyKey: string,
  orderItemUuid?: string,
  quantity?: number,
) {
  try {
    const client = await authAxiosInstance();
    const response = await client.post(
      ORDER_MANAGEMENT_ROUTES.order.deliveryEvent.path
        .replace(":orderId", orderUuid)
        .replace(":unitId", unitUuid),
      {
        type,
        idempotency_key: idempotencyKey,
        ...(orderItemUuid ? { order_item_uuid: orderItemUuid } : {}),
        ...(quantity !== undefined ? { quantity } : {}),
      },
    );
    const parsed = ApiResponseSchema(DeliveryEventResultSchema).safeParse(
      response.data,
    );
    if (
      !parsed.success ||
      parsed.data.metaData.error ||
      parsed.data.data.payload === null
    ) {
      return {
        error: parsed.success
          ? parsed.data.metaData.error || "The delivery response was empty."
          : z.prettifyError(parsed.error),
      };
    }

    return parsed.data.data.payload;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error("[delivery-event] request failed", error.response?.data);
    }
    return handleUnknownError(error);
  }
}
