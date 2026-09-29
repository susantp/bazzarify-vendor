"use server";

import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { handleUnknownError } from "@/modules/core/lib/utils.index";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order.management/routes";
import { DeliveryUnitQueuePayloadSchema } from "@/modules/order.management/schemas/deliverySchema";
import { isAxiosError } from "axios";
import { z } from "zod";

const DeliveryRunPayloadSchema = z.object({
  delivery_run: z.object({ uuid: z.uuid() }),
});

function parseMutation(responseData: unknown) {
  const parsed = ApiResponseSchema(DeliveryRunPayloadSchema).safeParse(
    responseData,
  );
  if (
    !parsed.success ||
    parsed.data.metaData.error ||
    parsed.data.data.payload === null
  ) {
    return {
      error: parsed.success
        ? parsed.data.metaData.error ||
          "The delivery operation returned no result."
        : z.prettifyError(parsed.error),
    };
  }
  return parsed.data.data.payload;
}

export async function actionGetDeliveryQueue() {
  try {
    const client = await authAxiosInstance();
    const response = await client.get(
      ORDER_MANAGEMENT_ROUTES.order.deliveryQueue.path,
    );
    const parsed = ApiResponseSchema(DeliveryUnitQueuePayloadSchema).safeParse(
      response.data,
    );
    if (
      !parsed.success ||
      parsed.data.metaData.error ||
      !parsed.data.data.payload
    ) {
      console.error("[delivery-queue] response contract failed", parsed);
      return { error: "The delivery queue could not be loaded." };
    }
    return parsed.data.data.payload;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error("[delivery-queue] request failed", error.response?.data);
    }
    return handleUnknownError(error);
  }
}

export async function actionCreateDeliveryRun(input: {
  unit_uuids: string[];
  assigned_user_uuid: string;
  tracking_reference?: string;
  idempotency_key: string;
}) {
  try {
    const client = await authAxiosInstance();
    const response = await client.post(
      ORDER_MANAGEMENT_ROUTES.order.deliveryRuns.path,
      input,
    );
    return parseMutation(response.data);
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(
        "[delivery-run-create] request failed",
        error.response?.data,
      );
      return {
        error:
          error.response?.data?.metaData?.error ||
          "The shared delivery run could not be assigned.",
      };
    }
    return handleUnknownError(error);
  }
}

export async function actionReassignDeliveryRun(input: {
  run_uuid: string;
  assigned_user_uuid: string;
  idempotency_key: string;
}) {
  try {
    const client = await authAxiosInstance();
    const response = await client.put(
      ORDER_MANAGEMENT_ROUTES.order.deliveryRunAssignment.path.replace(
        ":runId",
        input.run_uuid,
      ),
      {
        assigned_user_uuid: input.assigned_user_uuid,
        idempotency_key: input.idempotency_key,
      },
    );
    return parseMutation(response.data);
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(
        "[delivery-run-reassign] request failed",
        error.response?.data,
      );
      return {
        error:
          error.response?.data?.metaData?.error ||
          "The shared delivery run could not be reassigned.",
      };
    }
    return handleUnknownError(error);
  }
}
