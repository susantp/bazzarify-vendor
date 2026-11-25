"use server";

import {
  StoreDeliveryPolicyMutationPayloadSchema,
  StoreDeliveryPolicyPayloadSchema,
  TenantDeliveryPolicyPayloadSchema,
} from "@/modules/auth/domain/schemas/TenantDeliveryPolicySchema";
import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { isAxiosError } from "axios";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const tenantPath = "tenants/current/delivery-policy";
const storePath = (uuid: string) =>
  `tenants/current/stores/${uuid}/delivery-policy`;

function policyError(status: number, data: unknown) {
  if (status === 409) {
    return {
      errors: {
        form: ["Delivery settings changed. Reload this page and try again."],
      },
    };
  }
  const envelope = ApiResponseSchema(z.null()).safeParse(data);
  const validation = z
    .record(z.string(), z.array(z.string()))
    .safeParse(envelope.success ? envelope.data.metaData.error : null);
  if (status === 422 && validation.success) return { errors: validation.data };
  return null;
}

export async function actionGetTenantDeliveryConfiguration() {
  try {
    const api = await authAxiosInstance();
    const response = await api.get<unknown>(tenantPath);
    const parsed = ApiResponseSchema(TenantDeliveryPolicyPayloadSchema).parse(
      response.data,
    );
    return parsed.metaData.error ? null : parsed.data.payload;
  } catch (error) {
    console.error("[delivery-configuration] tenant read failed", {
      status: isAxiosError(error) ? error.response?.status : undefined,
    });
    return null;
  }
}

export async function actionGetStoreDeliveryConfiguration(uuid: string) {
  if (!z.uuid().safeParse(uuid).success) return null;
  try {
    const api = await authAxiosInstance();
    const response = await api.get<unknown>(storePath(uuid));
    const parsed = ApiResponseSchema(StoreDeliveryPolicyPayloadSchema).parse(
      response.data,
    );
    return parsed.metaData.error ? null : parsed.data.payload;
  } catch (error) {
    console.error("[delivery-configuration] store read failed", {
      status: isAxiosError(error) ? error.response?.status : undefined,
    });
    return null;
  }
}

export async function actionSaveDeliveryConfiguration(
  storeUuid: string | null,
  configuration: Record<string, unknown>,
): Promise<{ version: number } | { errors: Record<string, string[]> }> {
  if (storeUuid !== null && !z.uuid().safeParse(storeUuid).success) {
    return { errors: { form: ["Invalid store."] } };
  }
  try {
    const api = await authAxiosInstance();
    const response = await api.put<unknown>(
      storeUuid ? storePath(storeUuid) : tenantPath,
      storeUuid ? { configuration } : configuration,
      { timeout: 10_000 },
    );
    const rejection = policyError(response.status, response.data);
    if (rejection) return rejection;
    const payload = storeUuid
      ? ApiResponseSchema(StoreDeliveryPolicyMutationPayloadSchema).parse(
          response.data,
        )
      : ApiResponseSchema(TenantDeliveryPolicyPayloadSchema).parse(
          response.data,
        );
    const policy = payload.data.payload?.delivery_policy;
    if (payload.metaData.error || !policy)
      throw new Error("Missing saved policy.");
    const version =
      "version" in policy ? policy.version : policy.configuration?.version;
    if (version === undefined) throw new Error("Missing saved policy version.");
    revalidatePath("/workspace/stores");
    return { version };
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const rejection = policyError(error.response.status, error.response.data);
      if (rejection) return rejection;
    }
    console.error("[delivery-configuration] write failed", {
      status: isAxiosError(error) ? error.response?.status : undefined,
    });
    return { errors: { form: ["Delivery settings could not be saved."] } };
  }
}
