"use server";

import { IMetaData } from "@/modules/core";
import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { handleUnknownError } from "@/modules/core/lib/utils.index";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order.management/routes";
import { TOrder } from "@/modules/order.management/schemas/orderSchema";
import { OrderShowPayloadSchema } from "@/modules/order.management/schemas/responsePayloads/OrderShowPayloadSchema";
import { isAxiosError } from "axios";
import { z } from "zod";

export const actionGetOrder = async (
  uuid: string,
): Promise<IMetaData | null | TOrder> => {
  try {
    const client = await authAxiosInstance();
    const response = await client.get(
      ORDER_MANAGEMENT_ROUTES.order.show.path.replace(":orderId", uuid),
    );

    const parsed = ApiResponseSchema(OrderShowPayloadSchema).safeParse(
      response.data,
    );

    if (!parsed.success) {
      throw new Error(`[order-detail-schema] ${z.prettifyError(parsed.error)}`);
    }

    const payload = parsed.data.data.payload;
    if (
      parsed.data.metaData.error ||
      payload === null ||
      payload.order === null
    ) {
      const responseError = parsed.data.metaData.error;
      const errorMessage =
        typeof responseError === "string"
          ? responseError.trim() !== ""
            ? responseError
            : "The order details could not be loaded."
          : responseError
            ? JSON.stringify(responseError)
            : "The order details could not be loaded.";
      return {
        error: errorMessage,
      };
    }
    return payload.order;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error("[order-detail-request] request failed", error.message);
    } else {
      console.error(
        "[order-detail-request] response or request failed",
        error instanceof Error ? error.message : "Unknown order error",
      );
    }
    return handleUnknownError(error);
  }
};
