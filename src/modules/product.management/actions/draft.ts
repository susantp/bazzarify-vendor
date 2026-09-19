"use server";

import { ApiResponse, IMetaData } from "@/modules/core";
import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { extractRemoteErrorFeedback } from "@/modules/core/lib/utils.feedback";
import { handleUnknownError } from "@/modules/core/lib/utils.index";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product.management/config/routes";
import {
  ProductDraftIndexPayloadSchema,
  ProductDraftSchema,
  type TProductDraft,
} from "@/modules/product.management/schemas/ProductDraftSchema";
import { z } from "zod";

type DraftPayload = Record<string, unknown>;
type ProductDraftResult = TProductDraft | IMetaData;

const parseDraft = (response: unknown): ProductDraftResult => {
  const parsed = ApiResponseSchema(ProductDraftSchema).safeParse(response);
  if (!parsed.success) {
    throw new Error(
      `Product draft response schema failed: ${parsed.error.message}`,
    );
  }
  if (parsed.data.metaData.error || parsed.data.data.payload === null) {
    return {
      error:
        extractRemoteErrorFeedback(parsed.data)?.error ??
        "Unable to load product draft.",
      errorCode: parsed.data.metaData.errorCode ?? undefined,
    };
  }
  return parsed.data.data.payload;
};

export const actionListProductDrafts = async (): Promise<
  { drafts: TProductDraft[] } | IMetaData
> => {
  try {
    const client = await authAxiosInstance();
    const response = await client.get(
      PRODUCT_MANAGEMENT_ROUTES.productDraft.index.path,
    );
    const parsed = ApiResponseSchema(ProductDraftIndexPayloadSchema).safeParse(
      response.data,
    );
    if (!parsed.success) {
      throw new Error(
        `Product draft list schema failed: ${parsed.error.message}`,
      );
    }
    if (parsed.data.metaData.error || parsed.data.data.payload === null) {
      return {
        error:
          extractRemoteErrorFeedback(parsed.data)?.error ??
          "Unable to load product drafts.",
        errorCode: parsed.data.metaData.errorCode ?? undefined,
      };
    }
    return parsed.data.data.payload;
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionStartProductDraft = async (input: {
  mode: "create" | "edit";
  category_uuid?: string;
  target_product_uuid?: string;
  payload?: DraftPayload;
}): Promise<ProductDraftResult> => {
  try {
    const client = await authAxiosInstance();
    const response = await client.post(
      PRODUCT_MANAGEMENT_ROUTES.productDraft.store.path,
      input,
    );
    return parseDraft(response.data as ApiResponse<TProductDraft>);
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionGetProductDraft = async (
  uuid: string,
): Promise<ProductDraftResult> => {
  try {
    const client = await authAxiosInstance();
    const response = await client.get(
      PRODUCT_MANAGEMENT_ROUTES.productDraft.show.path.replace(":uuid", uuid),
    );
    return parseDraft(response.data as ApiResponse<TProductDraft>);
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionSaveProductDraftStep = async (
  uuid: string,
  stepKey: string,
  expectedVersion: number,
  payload: DraftPayload,
  advance = false,
): Promise<ProductDraftResult> => {
  try {
    const client = await authAxiosInstance();
    const route = PRODUCT_MANAGEMENT_ROUTES.productDraft.saveStep.path
      .replace(":uuid", uuid)
      .replace(":stepKey", encodeURIComponent(stepKey));
    const response = await client.put(route, {
      expected_version: expectedVersion,
      payload,
      advance,
    });
    return parseDraft(response.data as ApiResponse<TProductDraft>);
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionAbandonProductDraft = async (
  uuid: string,
): Promise<IMetaData> => {
  try {
    const client = await authAxiosInstance();
    const response = await client.delete(
      PRODUCT_MANAGEMENT_ROUTES.productDraft.destroy.path.replace(
        ":uuid",
        uuid,
      ),
    );
    const parsed = ApiResponseSchema(z.never()).safeParse(response.data);
    if (!parsed.success || parsed.data.metaData.error) {
      return {
        error:
          extractRemoteErrorFeedback(parsed.success ? parsed.data : undefined)
            ?.error ?? "Unable to abandon product draft.",
        errorCode: parsed.success
          ? (parsed.data.metaData.errorCode ?? undefined)
          : undefined,
      };
    }
    return { error: null, errorCode: undefined };
  } catch (error) {
    return handleUnknownError(error);
  }
};
