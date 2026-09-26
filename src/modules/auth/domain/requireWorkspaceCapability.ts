import "server-only";

import {
  getAuthUser,
  getSessionUserUUID,
} from "@/modules/auth/data/lib/auth-lib";
import type { TSessionUser } from "@/modules/auth/domain/schemas/UserSchema";
import { getVendorStore } from "@/modules/auth/domain/workspace";
import {
  getWorkspaceCapabilities,
  type WorkspaceCapabilities,
} from "@/modules/auth/domain/workspace-capabilities";
import { getCookieStore } from "@/modules/core/lib/utils.session";
import { isStoreProductAuthoringReady } from "@/modules/vendor/domain/schemas/store";
import {
  buildStoreRemediationPath,
  buildStoreRequirementPath,
} from "@/modules/vendor/domain/storeRequirementNavigation";
import { redirect } from "next/navigation";

type WorkspaceCapability = keyof Pick<
  WorkspaceCapabilities,
  | "canViewProducts"
  | "canWriteProducts"
  | "canImportProducts"
  | "canViewOrders"
  | "canReviewProducts"
  | "canManageTenantMembers"
  | "canManagePlatformUsers"
  | "canManagePlatformVendors"
>;

export async function requireWorkspaceCapability(
  capability: WorkspaceCapability,
  returnTo: string,
): Promise<TSessionUser> {
  const userUuid = await getSessionUserUUID(await getCookieStore());
  if (!userUuid) {
    redirect("/login");
  }

  const user = await getAuthUser(userUuid);
  if (!user || "error" in user) {
    redirect("/login");
  }

  const capabilities = getWorkspaceCapabilities(user);
  if (!capabilities[capability]) {
    redirect("/");
  }

  if (
    capability === "canWriteProducts" &&
    capabilities.workspace === "tenant" &&
    capabilities.isVendorIdentity
  ) {
    const store = getVendorStore(user);
    if (!store) {
      redirect(buildStoreRequirementPath(returnTo));
    }

    if (!isStoreProductAuthoringReady(store)) {
      redirect(buildStoreRemediationPath(returnTo));
    }
  }

  return user;
}
