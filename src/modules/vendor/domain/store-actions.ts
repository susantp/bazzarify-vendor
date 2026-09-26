"use server";

import {
  getAuthUser,
  getSessionUserUUID,
  setAuthUser,
} from "@/modules/auth/data/lib/auth-lib";
import { actionGetUser } from "@/modules/auth/domain/auth-actions";
import StoreCreatePayloadSchema from "@/modules/auth/domain/schemas/payloads/StoreCreatePayloadSchema";
import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { handleRemoteError } from "@/modules/core/lib/utils.index";
import {
  getCookieStore,
  setSelectedTenantUuid,
} from "@/modules/core/lib/utils.session";
import postDataAndValidate from "@/modules/core/utils/postDataAndValidate";
import { formattedIssues } from "@/modules/core/utils/zod.util";
import { BusinessAndEmailFormValues } from "@/modules/guest/config/schemas/set.business.email.form";
import type { TCategory } from "@/modules/product.management";
import { actionGetCategories } from "@/modules/product.management/actions/category";
import {
  StoreOnboardingBulkApplyPreviewSchema,
  StoreOnboardingBulkApplyResultSchema,
  StoreTypeIndexPayloadSchema,
  StoreTypeOptionSchema,
  TStoreOnboardingCategoryOption,
} from "@/modules/vendor/domain/schemas/storeOnboarding";
import { z } from "zod";

export const actionSetBusinessAndEmail = async (
  data: BusinessAndEmailFormValues,
) => {
  try {
    const userUUID = await getSessionUserUUID(await getCookieStore());
    if (!userUUID) {
      throw new Error("no userUUID on action set business: ");
    }
    const authUserRedis = await getAuthUser(userUUID);
    if ("error" in authUserRedis) {
      const msg = "authUser from redis fail: ";
      console.error(msg, authUserRedis.error);
      throw new Error(msg);
    }

    try {
      const response = await postDataAndValidate(
        { module: "vendor", path: `vendor/${authUserRedis.uuid}/stores` },
        data,
        StoreCreatePayloadSchema,
        "Unable to create store.",
      );

      const refreshedUser = await actionGetUser();
      if ("error" in refreshedUser) {
        throw refreshedUser.error;
      }
      const tenant = refreshedUser.tenants.find((workspace) =>
        workspace.authorized_stores.some(
          (store) => store.uuid === response.store.uuid,
        ),
      );
      if (!tenant) {
        throw new Error(
          "The new store was not returned in an active workspace.",
        );
      }

      await setSelectedTenantUuid(tenant.uuid);
      const selectedUser = await actionGetUser();
      if ("error" in selectedUser) {
        throw selectedUser.error;
      }
      await setAuthUser(userUUID, selectedUser);
      return response.store;
    } catch (e) {
      return handleRemoteError(e);
    }
  } catch (e) {
    return handleRemoteError(e);
  }
};

export const actionGetStoreTypeOptions = async () => {
  try {
    const instance = await authAxiosInstance();
    if (!instance) {
      throw new Error("Authentication error.");
    }

    const response = await instance.get("vendor/store-types");
    const parsed = ApiResponseSchema(StoreTypeIndexPayloadSchema).safeParse(
      response.data,
    );

    if (!parsed.success) {
      console.log(
        "schema validation error on store type options:",
        formattedIssues(parsed.error.issues),
      );
      throw new Error("Store type options schema validation failed.");
    }

    if (parsed.data.metaData.error || parsed.data.data.payload === null) {
      throw new Error(
        typeof parsed.data.metaData.error === "string"
          ? parsed.data.metaData.error
          : "Unable to load store type options.",
      );
    }

    return parsed.data.data.payload.store_types;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const actionGetAdminStoreOnboardingStoreTypes = async () => {
  try {
    const instance = await authAxiosInstance();
    const response = await instance.get(
      "vendor/admin/store-onboarding/store-types",
    );
    const parsed = ApiResponseSchema(StoreTypeIndexPayloadSchema).safeParse(
      response.data,
    );

    if (!parsed.success) {
      throw new Error("Admin store onboarding schema validation failed.");
    }

    if (parsed.data.metaData.error || parsed.data.data.payload === null) {
      throw new Error(
        typeof parsed.data.metaData.error === "string"
          ? parsed.data.metaData.error
          : "Unable to load onboarding store types.",
      );
    }

    return parsed.data.data.payload.store_types;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const actionUpdateAdminStoreOnboardingSet = async ({
  storeTypeUuid,
  name,
  description,
  categoryUuids,
}: {
  storeTypeUuid: string;
  name?: string;
  description?: string | null;
  categoryUuids: string[];
}) => {
  try {
    const instance = await authAxiosInstance();
    const response = await instance.put(
      `vendor/admin/store-onboarding/store-types/${storeTypeUuid}`,
      {
        name,
        description,
        category_uuids: categoryUuids,
      },
    );
    const parsed = ApiResponseSchema(
      z.object({
        store_type: StoreTypeOptionSchema,
      }),
    ).safeParse(response.data);

    if (!parsed.success) {
      throw new Error("Admin onboarding update schema validation failed.");
    }

    if (parsed.data.metaData.error || parsed.data.data.payload === null) {
      throw new Error(
        typeof parsed.data.metaData.error === "string"
          ? parsed.data.metaData.error
          : "Unable to update onboarding set.",
      );
    }

    return parsed.data.data.payload.store_type;
  } catch (error) {
    return handleRemoteError(error);
  }
};

const toStoreOnboardingCategoryOption = (
  category: TCategory,
): TStoreOnboardingCategoryOption => ({
  uuid: category.uuid,
  name: category.name,
  slug: category.slug,
  is_sellable: category.is_sellable,
});

export const actionSearchAdminSellableCategories = async ({
  search,
  page = 1,
}: {
  search: string;
  page?: number;
}) => {
  const response = await actionGetCategories({
    filter: {
      sellable: true,
      ...(search.trim() ? { name: search.trim() } : {}),
    },
    perPage: "20",
    page,
    sort: "name",
  });

  if ("error" in response) {
    return response;
  }

  return {
    categories: response.categories.data.map(toStoreOnboardingCategoryOption),
    currentPage: Number(response.categories.current_page ?? page),
    hasNextPage: Boolean(response.categories.next_page_url),
  };
};

export const actionPreviewAdminStoreOnboardingBulkApply = async (
  storeTypeUuid: string,
) => {
  try {
    const instance = await authAxiosInstance();
    const response = await instance.get(
      `vendor/admin/store-onboarding/store-types/${storeTypeUuid}/bulk-apply-preview`,
    );
    const parsed = ApiResponseSchema(
      z.object({
        preview: StoreOnboardingBulkApplyPreviewSchema,
      }),
    ).safeParse(response.data);

    if (!parsed.success) {
      throw new Error(
        "Admin onboarding bulk preview schema validation failed.",
      );
    }

    if (parsed.data.metaData.error || parsed.data.data.payload === null) {
      throw new Error(
        typeof parsed.data.metaData.error === "string"
          ? parsed.data.metaData.error
          : "Unable to preview onboarding bulk apply.",
      );
    }

    return parsed.data.data.payload.preview;
  } catch (error) {
    return handleRemoteError(error);
  }
};

export const actionApplyAdminStoreOnboardingBulk = async (
  storeTypeUuid: string,
) => {
  try {
    const instance = await authAxiosInstance();
    const response = await instance.post(
      `vendor/admin/store-onboarding/store-types/${storeTypeUuid}/bulk-apply`,
    );
    const parsed = ApiResponseSchema(
      z.object({
        result: StoreOnboardingBulkApplyResultSchema,
      }),
    ).safeParse(response.data);

    if (!parsed.success) {
      throw new Error("Admin onboarding bulk apply schema validation failed.");
    }

    if (parsed.data.metaData.error || parsed.data.data.payload === null) {
      throw new Error(
        typeof parsed.data.metaData.error === "string"
          ? parsed.data.metaData.error
          : "Unable to apply onboarding defaults to stores.",
      );
    }

    return parsed.data.data.payload.result;
  } catch (error) {
    return handleRemoteError(error);
  }
};
