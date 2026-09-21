"use server";

import { ApiResponse, IMetaData, TURLSearchParams } from "@/modules/core";
import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { extractRemoteErrorFeedback } from "@/modules/core/lib/utils.feedback";
import { handleUnknownError } from "@/modules/core/lib/utils.index";
import {
  TEditProductPayload,
  TProduct,
  TProductIndexPayload,
  TProductStoreFilterOptionPayload,
  TShowProductPayload,
} from "@/modules/product.management";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product.management/config/routes";
import { ProductAuthoringContextPayloadSchema } from "@/modules/product.management/schemas/ProductAuthoringSchema";
import { ProductStoreFilterOptionPayloadSchema } from "@/modules/product.management/schemas/ProductFilterSchema";
import { z } from "zod";

type ProductActionError = IMetaData & {
  details?: unknown;
};

const toProductActionError = (metaData: {
  error?: unknown;
  errorCode?: unknown;
}): ProductActionError => {
  const feedback = extractRemoteErrorFeedback({ metaData });

  return {
    error: feedback?.error ?? "Please fix the highlighted fields.",
    errorCode: feedback?.errorCode,
    details: metaData.error,
  };
};

export const actionGetProducts = async (
  params?: TURLSearchParams,
): Promise<TProductIndexPayload | IMetaData> => {
  try {
    const client = await authAxiosInstance();
    const response = await client.get(
      PRODUCT_MANAGEMENT_ROUTES.product.index.path,
      {
        params,
      },
    );
    const responseData = response.data as ApiResponse<TProductIndexPayload>;
    if (responseData.metaData.error) {
      return { error: responseData.metaData.error };
    }
    return responseData.data.payload;
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionGetProductStoreOptions = async (
  search?: string,
): Promise<TProductStoreFilterOptionPayload | IMetaData> => {
  try {
    const client = await authAxiosInstance();
    const response = await client.get(
      PRODUCT_MANAGEMENT_ROUTES.product.storeOptions.path,
      {
        params: search ? { search } : undefined,
      },
    );

    const parsed = ApiResponseSchema(
      ProductStoreFilterOptionPayloadSchema,
    ).safeParse(response.data);

    if (!parsed.success) {
      throw new Error(
        `Product store-options schema validation failed. ${parsed.error.message}`,
      );
    }

    if (parsed.data.metaData.error || parsed.data.data.payload === null) {
      return {
        error:
          typeof parsed.data.metaData.error === "string"
            ? parsed.data.metaData.error
            : "Unable to load stores.",
      };
    }

    return parsed.data.data.payload;
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionViewProduct = async (
  uuid: string,
): Promise<TShowProductPayload | IMetaData> => {
  const client = await authAxiosInstance();
  try {
    const response = await client.get(
      PRODUCT_MANAGEMENT_ROUTES.product.show.path.replace(":uuid", uuid),
    );
    const responseData = response.data as ApiResponse<TShowProductPayload>;
    if (responseData.metaData.error) {
      return { error: responseData.metaData.error };
    }
    return responseData.data.payload;
  } catch (error) {
    return handleUnknownError(error);
  }
};
export const actionEditProduct = async (
  uuid: string,
): Promise<TEditProductPayload | IMetaData> => {
  const client = await authAxiosInstance();
  try {
    const response = await client.get(
      PRODUCT_MANAGEMENT_ROUTES.product.edit.path.replace(":uuid", uuid),
    );
    const parsed = ApiResponseSchema(
      z
        .object({
          categoryContext: ProductAuthoringContextPayloadSchema.nullable(),
        })
        .passthrough(),
    ).safeParse(response.data);

    if (!parsed.success) {
      throw new Error(
        `Product edit bootstrap schema validation failed [PRODUCT_AUTHORING_SCHEMA] ${z.prettifyError(parsed.error)}`,
      );
    }

    if (parsed.data.metaData.error || parsed.data.data.payload === null) {
      return {
        error:
          typeof parsed.data.metaData.error === "string"
            ? parsed.data.metaData.error
            : "Unable to load the product authoring contract.",
      };
    }

    return parsed.data.data.payload as TEditProductPayload;
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionStoreProducts = async (
  payload: FormData,
): Promise<[] | ProductActionError> => {
  const client = await authAxiosInstance();
  try {
    const response = await client.post(
      PRODUCT_MANAGEMENT_ROUTES.product.store.path,
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    const responseData = response.data as ApiResponse<[]>;

    if (responseData.metaData?.error) {
      return toProductActionError(responseData.metaData);
    }
    return responseData.data.payload;
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionUpdateProductStatus = async (
  uuid: string,
  status: number,
): Promise<TProduct | ProductActionError> => {
  const client = await authAxiosInstance();
  try {
    const response = await client.patch(
      PRODUCT_MANAGEMENT_ROUTES.product.updateStatus.path.replace(
        ":uuid",
        uuid,
      ),
      { status },
    );
    const responseData = response.data as ApiResponse<{ product: TProduct }>;

    if (responseData.metaData?.error) {
      return toProductActionError(responseData.metaData);
    }
    return responseData.data.payload.product;
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionPublishProduct = async (
  uuid: string,
): Promise<TProduct | ProductActionError> => {
  const client = await authAxiosInstance();
  try {
    const response = await client.post(
      PRODUCT_MANAGEMENT_ROUTES.product.publish.path.replace(":uuid", uuid),
    );
    const responseData = response.data as ApiResponse<{ product: TProduct }>;

    if (responseData.metaData?.error) {
      return toProductActionError(responseData.metaData);
    }
    return responseData.data.payload.product;
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionUpdateProducts = async (
  payload: FormData,
  uuid: string,
): Promise<[] | ProductActionError> => {
  const client = await authAxiosInstance();
  try {
    payload.append("_method", "PUT");
    const response = await client.post(
      PRODUCT_MANAGEMENT_ROUTES.product.update.path.replace(":uuid", uuid),
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    const responseData = response.data as ApiResponse<[]>;

    if (responseData.metaData.error) {
      return toProductActionError(responseData.metaData);
    }
    return responseData.data.payload;
  } catch (error) {
    return handleUnknownError(error);
  }
};
