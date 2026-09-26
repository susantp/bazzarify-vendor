"use server";

import {
  TenantMembershipListPayloadSchema,
  TenantMembershipMutationPayloadSchema,
} from "@/modules/auth/domain/schemas/TenantMembershipSchema";
import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const TENANT_MEMBERS_PATH = "/workspace/members";
const TenantInvitationRequestSchema = z.object({
  email: z.email(),
  role: z.enum(["vendor", "tenant-admin", "sales-manager", "operator"]),
  store_uuids: z.array(z.uuid()),
});
const TenantMemberUpdateRequestSchema = TenantInvitationRequestSchema.pick({
  role: true,
  store_uuids: true,
}).extend({
  membership_uuid: z.uuid(),
});

function redirectActionError(): never {
  redirect(`${TENANT_MEMBERS_PATH}?error=save-failed`);
}

function getFormRoleAndStoreUuids(formData: FormData) {
  const role = String(formData.get("role") ?? "");
  return {
    role,
    store_uuids:
      role === "operator"
        ? formData
            .getAll("store_uuids")
            .filter((value): value is string => typeof value === "string")
        : [],
  };
}

function assertMutationSucceeded(data: unknown): void {
  const parsed = ApiResponseSchema(
    TenantMembershipMutationPayloadSchema,
  ).safeParse(data);
  if (
    !parsed.success ||
    parsed.data.metaData.error ||
    !parsed.data.data.payload
  ) {
    console.error("[tenant-members] mutation response contract failed", parsed);
    redirectActionError();
  }
}

export async function actionGetTenantMembers() {
  try {
    const client = await authAxiosInstance();
    const response = await client.get("tenants/current/members");
    const parsed = ApiResponseSchema(
      TenantMembershipListPayloadSchema,
    ).safeParse(response.data);

    if (!parsed.success) {
      console.error(
        "[tenant-members] list response contract failed",
        parsed.error.issues,
      );
      return { error: "The tenant member list could not be read." };
    }

    if (parsed.data.metaData.error || !parsed.data.data.payload) {
      return { error: "The tenant member list could not be read." };
    }

    return parsed.data.data.payload;
  } catch (error) {
    console.error("[tenant-members] list request failed", error);
    return { error: "The tenant member list could not be loaded." };
  }
}

export async function actionInviteTenantMember(
  formData: FormData,
): Promise<void> {
  const request = TenantInvitationRequestSchema.safeParse({
    email: formData.get("email"),
    ...getFormRoleAndStoreUuids(formData),
  });
  if (!request.success) redirectActionError();

  try {
    const client = await authAxiosInstance();
    const response = await client.post("tenants/current/members", request.data);
    assertMutationSucceeded(response.data);
    revalidatePath(TENANT_MEMBERS_PATH);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[tenant-members] invite request failed", error);
    redirectActionError();
  }

  redirect(`${TENANT_MEMBERS_PATH}?updated=invited`);
}

export async function actionUpdateTenantMember(
  formData: FormData,
): Promise<void> {
  const request = TenantMemberUpdateRequestSchema.safeParse({
    membership_uuid: formData.get("membership_uuid"),
    ...getFormRoleAndStoreUuids(formData),
  });
  if (!request.success) redirectActionError();

  const { membership_uuid, ...payload } = request.data;
  try {
    const client = await authAxiosInstance();
    const response = await client.put(
      `tenants/current/members/${membership_uuid}/role`,
      payload,
    );
    assertMutationSucceeded(response.data);
    revalidatePath(TENANT_MEMBERS_PATH);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[tenant-members] update request failed", error);
    redirectActionError();
  }

  redirect(`${TENANT_MEMBERS_PATH}?updated=member`);
}

export async function actionDeactivateTenantMember(
  formData: FormData,
): Promise<void> {
  const membershipUuid = z.uuid().safeParse(formData.get("membership_uuid"));
  if (!membershipUuid.success) redirectActionError();

  try {
    const client = await authAxiosInstance();
    const response = await client.delete(
      `tenants/current/members/${membershipUuid.data}`,
    );
    assertMutationSucceeded(response.data);
    revalidatePath(TENANT_MEMBERS_PATH);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[tenant-members] deactivate request failed", error);
    redirectActionError();
  }

  redirect(`${TENANT_MEMBERS_PATH}?updated=deactivated`);
}
