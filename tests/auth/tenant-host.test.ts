import {
  isNeutralTenantContextHost,
  resolveTenantWorkspaceForHost,
} from "@/modules/auth/domain/tenant-host";
import { describe, expect, it } from "bun:test";

describe("resolveTenantWorkspaceForHost", () => {
  const tenantA = {
    uuid: "1c98dd76-9c61-4dc4-9207-0a756ea213d9",
    name: "Tenant A",
    slug: "tenant-a",
    domains: ["tenant-a.bazzarify.local"],
    membership_uuid: "343d2dad-3400-4c18-89e8-871a9c9c29bf",
    roles: ["tenant-admin"],
    authorized_stores: [],
  };

  it("matches a normalized request host to its tenant domain", () => {
    expect(
      resolveTenantWorkspaceForHost([tenantA], "Tenant-A.Bazzarify.Local."),
    ).toEqual(tenantA);
  });

  it("does not infer a tenant from a platform or unknown host", () => {
    expect(
      resolveTenantWorkspaceForHost([tenantA], "vendor.bazzarify.local"),
    ).toBeNull();
    expect(
      resolveTenantWorkspaceForHost([tenantA], "unknown.bazzarify.local"),
    ).toBeNull();
  });
});

describe("isNeutralTenantContextHost", () => {
  const neutralHosts = ["vendor.bazzarify.local", "local-ne.larashops.local"];

  it("keeps explicit tenant selection on configured platform hosts", () => {
    expect(
      isNeutralTenantContextHost("Vendor.Bazzarify.Local.", neutralHosts),
    ).toBe(true);
  });

  it("lets tenant and custom hosts resolve from the backend host registry", () => {
    expect(
      isNeutralTenantContextHost("tenant-a.bazzarify.local", neutralHosts),
    ).toBe(false);
    expect(isNeutralTenantContextHost("shop.example.com", neutralHosts)).toBe(
      false,
    );
  });
});
