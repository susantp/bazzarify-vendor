import type { TSessionUser } from "@/modules/auth/domain/schemas/UserSchema";

type TenantWorkspace = TSessionUser["tenants"][number];

export const DEFAULT_NEUTRAL_TENANT_CONTEXT_HOSTS = [
  "localhost",
  "127.0.0.1",
  "local-ne.larashops.local",
  "vendor.larashops.local",
  "admin.larashops.local",
  "vendor.bazarify.local",
  "admin.bazarify.local",
  "vendor.bazzarify.local",
  "admin.bazzarify.local",
  "vendor.bazarify.com.np",
  "admin.bazarify.com.np",
] as const;

export function isNeutralTenantContextHost(
  host: string,
  neutralHosts: readonly string[],
): boolean {
  const normalizedHost = host.toLowerCase().replace(/\.$/, "");
  return (
    normalizedHost !== "" &&
    neutralHosts.some(
      (neutralHost) =>
        neutralHost.toLowerCase().replace(/\.$/, "") === normalizedHost,
    )
  );
}

export function resolveTenantWorkspaceForHost(
  tenants: TenantWorkspace[],
  host: string,
): TenantWorkspace | null {
  const normalizedHost = host.toLowerCase().replace(/\.$/, "");
  if (
    !normalizedHost ||
    isNeutralTenantContextHost(
      normalizedHost,
      DEFAULT_NEUTRAL_TENANT_CONTEXT_HOSTS,
    )
  ) {
    return null;
  }

  return (
    tenants.find((tenant) =>
      tenant.domains.some((domain) => domain.toLowerCase() === normalizedHost),
    ) ?? null
  );
}
