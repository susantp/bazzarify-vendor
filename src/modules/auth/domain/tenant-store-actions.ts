"use server";

import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import {
  AvailableStoreTypesPayloadSchema,
  TenantStoreCreateRequestSchema,
  TenantStoreListPayloadSchema,
  TenantStoreMutationPayloadSchema,
} from "@/modules/vendor/domain/schemas/tenant-store";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const TENANT_STORES_PATH = "/workspace/stores";

export async function actionGetTenantStorePageData() {
  try {
    const client = await authAxiosInstance();
    const [storesResponse, typesResponse] = await Promise.all([
      client.get("vendor/tenants/current/stores"),
      client.get("vendor/store-types"),
    ]);
    const stores = ApiResponseSchema(TenantStoreListPayloadSchema).safeParse(
      storesResponse.data,
    );
    const types = ApiResponseSchema(AvailableStoreTypesPayloadSchema).safeParse(
      typesResponse.data,
    );

    if (
      !stores.success ||
      stores.data.metaData.error ||
      !stores.data.data.payload ||
      !types.success ||
      types.data.metaData.error ||
      !types.data.data.payload
    ) {
      console.error("[tenant-stores] page response contract failed", {
        stores: stores.success ? null : stores.error.issues,
        types: types.success ? null : types.error.issues,
      });
      return { error: "Tenant stores could not be loaded." } as const;
    }

    return {
      stores: stores.data.data.payload.stores,
      storeTypes: types.data.data.payload.store_types,
    } as const;
  } catch (error) {
    console.error("[tenant-stores] page request failed", error);
    return { error: "Tenant stores could not be loaded." } as const;
  }
}

export async function actionCreateTenantStore(
  formData: FormData,
): Promise<void> {
  const request = TenantStoreCreateRequestSchema.safeParse({
    name: formData.get("name"),
    store_type_uuid: formData.get("store_type_uuid"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!request.success) redirect(`${TENANT_STORES_PATH}?error=invalid`);

  try {
    const client = await authAxiosInstance();
    const response = await client.post(
      "vendor/tenants/current/stores",
      request.data,
    );
    const parsed = ApiResponseSchema(
      TenantStoreMutationPayloadSchema,
    ).safeParse(response.data);
    if (
      !parsed.success ||
      parsed.data.metaData.error ||
      !parsed.data.data.payload
    ) {
      console.error("[tenant-stores] create response contract failed", parsed);
      redirect(`${TENANT_STORES_PATH}?error=save-failed`);
    }
    revalidatePath(TENANT_STORES_PATH);
    revalidatePath("/workspace/members");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[tenant-stores] create request failed", error);
    redirect(`${TENANT_STORES_PATH}?error=save-failed`);
  }

  redirect(`${TENANT_STORES_PATH}?updated=created`);
}
