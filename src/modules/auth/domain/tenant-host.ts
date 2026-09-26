import type { TSessionUser } from "@/modules/auth/domain/schemas/UserSchema";

type TenantWorkspace = TSessionUser["tenants"][number];

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
  if (!normalizedHost) return null;

  return (
    tenants.find((tenant) =>
      tenant.domains.some((domain) => domain.toLowerCase() === normalizedHost),
    ) ?? null
  );
}
