import type { TSessionUser } from "@/modules/auth/domain/schemas/UserSchema";

type WorkspaceKind = "platform" | "tenant" | "unselected";

export type WorkspaceCapabilities = {
  workspace: WorkspaceKind;
  canViewDashboard: boolean;
  canViewProducts: boolean;
  canWriteProducts: boolean;
  canImportProducts: boolean;
  canViewOrders: boolean;
  canFulfillOrders: boolean;
  canReviewProducts: boolean;
  canManageTenantMembers: boolean;
  canManagePlatformCatalog: boolean;
  canManagePlatformUsers: boolean;
  canManagePlatformVendors: boolean;
  isVendorIdentity: boolean;
};

const PLATFORM_ADMIN_ROLES = new Set(["admin", "super-admin"]);
const TENANT_OPERATIONAL_ROLES = new Set([
  "tenant-admin",
  "sales-manager",
  "operator",
  "vendor",
]);

export function getWorkspaceCapabilities(
  user: TSessionUser,
): WorkspaceCapabilities {
  const isTenantWorkspace = user.current_tenant_uuid !== null;
  const tenantRoles = new Set(user.roles.map((role) => role.name));
  const platformRoles = new Set(user.platform_roles);
  const isPlatformWorkspace =
    !isTenantWorkspace &&
    user.platform_roles.some((role) => PLATFORM_ADMIN_ROLES.has(role));
  const isPlatformSuperAdmin =
    isPlatformWorkspace && platformRoles.has("super-admin");
  const isPlatformAdmin =
    isPlatformWorkspace &&
    user.platform_roles.some((role) => PLATFORM_ADMIN_ROLES.has(role));
  const isVendorIdentity = isTenantWorkspace
    ? tenantRoles.has("vendor")
    : platformRoles.has("vendor");
  const hasTenantOperationalRole = [...tenantRoles].some((role) =>
    TENANT_OPERATIONAL_ROLES.has(role),
  );
  const canUseOperationalWorkspace =
    isTenantWorkspace && hasTenantOperationalRole;

  return {
    workspace: isPlatformWorkspace
      ? "platform"
      : canUseOperationalWorkspace
        ? "tenant"
        : "unselected",
    canViewDashboard: isPlatformAdmin || canUseOperationalWorkspace,
    canViewProducts: isPlatformAdmin || canUseOperationalWorkspace,
    canWriteProducts:
      isPlatformAdmin || (isTenantWorkspace && tenantRoles.has("vendor")),
    canImportProducts:
      isPlatformAdmin || (isTenantWorkspace && tenantRoles.has("vendor")),
    canViewOrders: isPlatformAdmin || canUseOperationalWorkspace,
    canFulfillOrders:
      isPlatformSuperAdmin || (isTenantWorkspace && tenantRoles.has("vendor")),
    canReviewProducts: isPlatformAdmin,
    canManageTenantMembers:
      isTenantWorkspace && tenantRoles.has("tenant-admin"),
    canManagePlatformCatalog: isPlatformAdmin,
    canManagePlatformUsers: isPlatformSuperAdmin,
    canManagePlatformVendors: isPlatformSuperAdmin,
    isVendorIdentity,
  };
}
