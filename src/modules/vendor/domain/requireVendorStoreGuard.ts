import "server-only";

import {
  getAuthUser,
  getSessionUserUUID,
} from "@/modules/auth/data/lib/auth-lib";
import {
  getVendorStore,
  hasPlatformAdministratorRole,
} from "@/modules/auth/domain/workspace";
import { getCookieStore } from "@/modules/core/lib/utils.session";
import { isStoreProductAuthoringReady } from "@/modules/vendor/domain/schemas/store";
import {
  buildStoreRemediationPath,
  buildStoreRequirementPath,
} from "@/modules/vendor/domain/storeRequirementNavigation";
import { redirect } from "next/navigation";

export async function requireVendorStoreGuard(returnTo: string): Promise<void> {
  const userUUID = await getSessionUserUUID(await getCookieStore());
  if (!userUUID) {
    return;
  }

  const authUser = await getAuthUser(userUUID);
  if (!authUser || "error" in authUser) {
    return;
  }

  if (hasPlatformAdministratorRole(authUser)) {
    return;
  }

  if (!authUser.current_tenant_uuid && authUser.tenants.length > 0) {
    redirect("/workspace");
  }

  const store = getVendorStore(authUser);
  if (!store) {
    redirect(buildStoreRequirementPath(returnTo));
  }

  if (!isStoreProductAuthoringReady(store)) {
    redirect(buildStoreRemediationPath(returnTo));
  }
}
