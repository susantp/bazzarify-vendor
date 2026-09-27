"use server";

import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { handleUnknownError } from "@/modules/core/lib/utils.index";
import {
  DASHBOARD_WINDOWS,
  DashboardSummaryPayloadSchema,
  type DashboardWindow,
  type TDashboardSummary,
} from "@/modules/dashboard/schemas/dashboard-summary-schema";
import { isAxiosError } from "axios";

type DashboardResult =
  | TDashboardSummary
  | { error: string; errorCode?: number };

const isValidWindow = (value: string): value is DashboardWindow =>
  (DASHBOARD_WINDOWS as readonly string[]).includes(value);

export const actionGetDashboardSummary = async (
  window: string = "7d",
  storeUuid?: string,
): Promise<DashboardResult> => {
  const safeWindow: DashboardWindow = isValidWindow(window) ? window : "7d";

  try {
    const client = await authAxiosInstance();
    const searchParams = new URLSearchParams({ window: safeWindow });
    if (storeUuid) searchParams.set("store_uuid", storeUuid);
    const response = await client.get(
      `/dashboard/summary?${searchParams.toString()}`,
    );

    const parsed = ApiResponseSchema(DashboardSummaryPayloadSchema).safeParse(
      response.data,
    );

    if (!parsed.success) {
      console.log(
        "[dashboard-summary] schema validation failed",
        parsed.error.issues,
      );
      return { error: "Dashboard summary schema validation failed." };
    }

    if (parsed.data.metaData.error || parsed.data.data.payload === null) {
      return {
        error:
          typeof parsed.data.metaData.error === "string"
            ? parsed.data.metaData.error
            : "Unable to load dashboard summary.",
        errorCode: parsed.data.metaData.errorCode ?? undefined,
      };
    }

    return parsed.data.data.payload.summary;
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("error fetch dashboard summary: ", error?.response?.data);
    } else {
      console.log("error fetch dashboard summary: ", error);
    }
    return handleUnknownError(error) as { error: string; errorCode?: number };
  }
};
