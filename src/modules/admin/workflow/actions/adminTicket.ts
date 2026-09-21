"use server";

import { ADMIN_WORKFLOW_ROUTES } from "@/modules/admin/workflow/config/routes";
import {
  AdminTicketListPayloadSchema,
  AdminTicketSchema,
  type TAdminTicket,
  type TAdminTicketListPayload,
} from "@/modules/admin/workflow/schemas/AdminTicketSchema";
import { IMetaData } from "@/modules/core";
import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { extractRemoteErrorFeedback } from "@/modules/core/lib/utils.feedback";
import { handleUnknownError } from "@/modules/core/lib/utils.index";

type TicketResult = TAdminTicket | IMetaData;

const parseTicket = (response: unknown): TicketResult => {
  const parsed = ApiResponseSchema(AdminTicketSchema).safeParse(response);
  if (!parsed.success) {
    throw new Error(
      `Admin ticket response schema failed: ${parsed.error.message}`,
    );
  }
  if (parsed.data.metaData.error || parsed.data.data.payload === null) {
    return {
      error:
        extractRemoteErrorFeedback(parsed.data)?.error ??
        "Unable to load the admin ticket.",
      errorCode: parsed.data.metaData.errorCode ?? undefined,
    };
  }
  return parsed.data.data.payload;
};

export const actionListAdminTickets = async (
  filters: Record<string, string> = {},
): Promise<TAdminTicketListPayload | IMetaData> => {
  try {
    const client = await authAxiosInstance();
    const response = await client.get(
      ADMIN_WORKFLOW_ROUTES.adminTicket.index.path,
      { params: filters },
    );
    const parsed = ApiResponseSchema(AdminTicketListPayloadSchema).safeParse(
      response.data,
    );
    if (!parsed.success) {
      throw new Error(
        `Admin ticket list schema failed: ${parsed.error.message}`,
      );
    }
    if (parsed.data.metaData.error || parsed.data.data.payload === null) {
      return {
        error:
          extractRemoteErrorFeedback(parsed.data)?.error ??
          "Unable to load admin tickets.",
        errorCode: parsed.data.metaData.errorCode ?? undefined,
      };
    }
    return parsed.data.data.payload;
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionGetAdminTicket = async (
  uuid: string,
): Promise<TicketResult> => {
  try {
    const client = await authAxiosInstance();
    const response = await client.get(
      ADMIN_WORKFLOW_ROUTES.adminTicket.show.path.replace(":uuid", uuid),
    );
    return parseTicket(response.data);
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionUpdateAdminTicket = async ({
  uuid,
  status,
  priority,
}: {
  uuid: string;
  status?: TAdminTicket["status"];
  priority?: TAdminTicket["priority"];
}): Promise<TicketResult> => {
  try {
    const client = await authAxiosInstance();
    const response = await client.patch(
      ADMIN_WORKFLOW_ROUTES.adminTicket.update.path.replace(":uuid", uuid),
      { status, priority },
    );
    return parseTicket(response.data);
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionAddAdminTicketComment = async ({
  uuid,
  body,
  visibility = "internal",
}: {
  uuid: string;
  body: string;
  visibility?: string;
}): Promise<TicketResult> => {
  try {
    const client = await authAxiosInstance();
    const response = await client.post(
      ADMIN_WORKFLOW_ROUTES.adminTicket.comments.path.replace(":uuid", uuid),
      { body, visibility },
    );
    return parseTicket(response.data);
  } catch (error) {
    return handleUnknownError(error);
  }
};
