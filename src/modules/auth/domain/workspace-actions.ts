"use server";

import {
  getAuthUser,
  getSessionUserUUID,
  setAuthUser,
} from "@/modules/auth/data/lib/auth-lib";
import { actionGetUser } from "@/modules/auth/domain/auth-actions";
import ApiResponseSchema from "@/modules/core/domain/schemas/ApiResponse";
import { authAxiosInstance } from "@/modules/core/lib/utils.axios";
import { handleRemoteError } from "@/modules/core/lib/utils.index";
import {
  getCookieStore,
  setSelectedTenantUuid,
} from "@/modules/core/lib/utils.session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const TenantCurrentSchema = z.object({
  tenant: z.object({ uuid: z.uuid() }),
});
const TenantInvitationsSchema = z.object({
  invitations: z.array(
    z.object({
      membership_uuid: z.uuid(),
      tenant: z.object({
        uuid: z.uuid(),
        name: z.string(),
        slug: z.string(),
      }),
      invited_at: z.string().nullable(),
    }),
  ),
});
const TenantInvitationAcceptedSchema = z.object({
  membership_uuid: z.uuid(),
  tenant_uuid: z.uuid(),
  status: z.literal("active"),
});

export async function actionGetTenantInvitations() {
  try {
    const client = await authAxiosInstance();
    const response = await client.get("tenants/invitations/mine");
    const parsed = ApiResponseSchema(TenantInvitationsSchema).safeParse(
      response.data,
    );
    if (!parsed.success || parsed.data.metaData.error) {
      return [];
    }
    return parsed.data.data.payload?.invitations ?? [];
  } catch (error) {
    console.error("Unable to load tenant invitations:", error);
    return [];
  }
}

function isPlatformWorkspaceAvailable(roles: string[]): boolean {
  return roles.some((role) => role === "admin" || role === "super-admin");
}

export async function actionSelectWorkspace(formData: FormData): Promise<void> {
  const userUuid = await getSessionUserUUID(await getCookieStore());
  if (!userUuid) {
    redirect("/login");
  }

  const user = await getAuthUser(userUuid);
  if (!user || "error" in user) {
    redirect("/login");
  }

  const selected = formData.get("tenant_uuid");
  if (selected === "platform") {
    if (!isPlatformWorkspaceAvailable(user.platform_roles)) {
      redirect("/workspace?error=invalid-workspace");
    }
    await setSelectedTenantUuid(null);
    revalidatePath("/", "layout");
    redirect("/");
  }

  if (typeof selected !== "string" || !z.uuid().safeParse(selected).success) {
    redirect("/workspace?error=invalid-workspace");
  }

  if (!user.tenants.some((tenant) => tenant.uuid === selected)) {
    redirect("/workspace?error=invalid-workspace");
  }

  await setSelectedTenantUuid(selected);
  try {
    const client = await authAxiosInstance();
    const response = await client.get("tenants/current");
    const parsed = ApiResponseSchema(TenantCurrentSchema).safeParse(
      response.data,
    );
    if (
      !parsed.success ||
      parsed.data.metaData.error ||
      parsed.data.data.payload?.tenant.uuid !== selected
    ) {
      await setSelectedTenantUuid(null);
      redirect("/workspace?error=membership-unavailable");
    }
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    await setSelectedTenantUuid(null);
    console.error("Tenant workspace selection failed:", error);
    handleRemoteError(error);
    redirect("/workspace?error=membership-unavailable");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function actionAcceptTenantInvitation(
  formData: FormData,
): Promise<void> {
  const membershipUuid = formData.get("membership_uuid");
  if (
    typeof membershipUuid !== "string" ||
    !z.uuid().safeParse(membershipUuid).success
  ) {
    redirect("/workspace?error=invalid-invitation");
  }

  const userUuid = await getSessionUserUUID(await getCookieStore());
  if (!userUuid) {
    redirect("/login");
  }

  try {
    const client = await authAxiosInstance();
    const response = await client.post(
      `tenants/invitations/${membershipUuid}/accept`,
    );
    const parsed = ApiResponseSchema(TenantInvitationAcceptedSchema).safeParse(
      response.data,
    );
    if (!parsed.success) {
      redirect("/workspace?error=invitation-unavailable");
    }
    const accepted = parsed.data.data.payload;
    if (
      !accepted ||
      parsed.data.metaData.error ||
      accepted.membership_uuid !== membershipUuid
    ) {
      redirect("/workspace?error=invitation-unavailable");
    }

    await setSelectedTenantUuid(accepted.tenant_uuid);
    const selectedUser = await actionGetUser();
    if ("error" in selectedUser) {
      await setSelectedTenantUuid(null);
      redirect("/workspace?error=membership-unavailable");
    }
    await setAuthUser(userUuid, selectedUser);
    revalidatePath("/", "layout");
    redirect("/");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("Tenant invitation acceptance failed:", error);
    redirect("/workspace?error=invitation-unavailable");
  }
}
