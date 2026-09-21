"use server";

import { ApiResponse, IMetaData, TURLSearchParams } from "@/modules/core";
import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { handleUnknownError } from "@/modules/core/lib/utils.index";
import { getValidationFeedback } from "@/modules/core/lib/utils.validationFeedback";
import {
  TCategoryAuthoringContextPayload,
  TCategoryIndexPayload,
  TSpecificationsIndexPayload,
} from "@/modules/product.management";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product.management/config/routes";
import { ProductAuthoringContextPayloadSchema } from "@/modules/product.management/schemas/ProductAuthoringSchema";
import { z } from "zod";

export async function actionGetCategories(
  params?: TURLSearchParams,
): Promise<TCategoryIndexPayload | IMetaData> {
  const instance = await authAxiosInstance();
  try {
    const response = await instance.get(
      PRODUCT_MANAGEMENT_ROUTES.category.index.path,
      {
        params: {
          ...params,
        },
      },
    );
    const responseData = response.data as ApiResponse<TCategoryIndexPayload>;
    if (responseData.metaData.error) {
      return { error: responseData.metaData.error };
    }
    return responseData.data.payload;
  } catch (error) {
    return handleUnknownError(error);
  }
}

export const actionCreateCategory = async (body: object) => {
  try {
    const response = await (
      await authAxiosInstance()
    ).post(PRODUCT_MANAGEMENT_ROUTES.category.create.path, body);
    return response.data;
  } catch (error) {
    return getValidationFeedback(error, "Please fix the highlighted fields.");
  }
};

export const actionViewCategory = async (slug: string) => {
  try {
    const response = await (
      await authAxiosInstance()
    ).get(PRODUCT_MANAGEMENT_ROUTES.category.show.path.replace(":slug", slug));
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const actionViewCategorySpecifications = async (
  slug: string,
): Promise<TSpecificationsIndexPayload | IMetaData> => {
  try {
    const response = await (
      await authAxiosInstance()
    ).get(
      PRODUCT_MANAGEMENT_ROUTES.category.showSpecifications.path.replace(
        ":slug",
        slug,
      ),
    );
    const responseData =
      response.data as ApiResponse<TSpecificationsIndexPayload>;
    if (responseData.metaData.error) {
      return { error: responseData.metaData.error };
    }
    return responseData.data.payload;
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionViewCategoryAuthoringContext = async (
  slug: string,
): Promise<TCategoryAuthoringContextPayload | IMetaData> => {
  try {
    const response = await (
      await authAxiosInstance()
    ).get(
      PRODUCT_MANAGEMENT_ROUTES.category.viewParentRecursive.path.replace(
        ":slug",
        slug,
      ),
    );
    const parsed = ApiResponseSchema(
      ProductAuthoringContextPayloadSchema,
    ).safeParse(response.data);

    if (!parsed.success) {
      throw new Error(
        `Category authoring context schema validation failed [PRODUCT_AUTHORING_SCHEMA] ${z.prettifyError(parsed.error)}`,
      );
    }

    if (parsed.data.metaData.error || parsed.data.data.payload === null) {
      return {
        error:
          typeof parsed.data.metaData.error === "string"
            ? parsed.data.metaData.error
            : "Unable to load the category authoring contract.",
      };
    }

    return parsed.data.data.payload as TCategoryAuthoringContextPayload;
  } catch (error) {
    return handleUnknownError(error);
  }
};

export const actionUpdateCategory = async (slug: string, body: object) => {
  try {
    const response = await (
      await authAxiosInstance()
    ).patch(
      PRODUCT_MANAGEMENT_ROUTES.category.update.path.replace(":slug", slug),
      body,
    );
    return response.data;
  } catch (error) {
    return getValidationFeedback(error, "Please fix the highlighted fields.");
  }
};

export const actionUploadCategoryIcon = async (
  slug: string,
  body: FormData,
) => {
  try {
    const response = await (
      await authAxiosInstance()
    ).post(
      PRODUCT_MANAGEMENT_ROUTES.category.icon.path.replace(":slug", slug),
      body,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error) {
    return getValidationFeedback(error, "Please fix the highlighted fields.");
  }
};
