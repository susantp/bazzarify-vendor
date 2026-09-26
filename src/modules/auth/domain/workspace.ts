import { TSessionUser } from "@/modules/auth/domain/schemas/UserSchema";

const PLATFORM_ROLES = new Set(["admin", "super-admin"]);

export function getInitialTenantUuid(user: TSessionUser): string | null {
  if (user.platform_roles.some((role) => PLATFORM_ROLES.has(role))) {
    return null;
  }

  return user.tenants.length === 1 ? user.tenants[0].uuid : null;
}

export function getVendorStore(user: TSessionUser) {
  const isVendor = user.roles.some((role) => role.name === "vendor");
  if (!isVendor || user.authorized_stores.length !== 1) {
    return null;
  }

  return user.authorized_stores[0];
}

export function hasPlatformAdministratorRole(user: TSessionUser): boolean {
  return user.platform_roles.some((role) => PLATFORM_ROLES.has(role));
}
