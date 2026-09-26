import type { TSessionUser } from "@/modules/auth/domain/schemas/UserSchema";
import { getWorkspaceCapabilities } from "@/modules/auth/domain/workspace-capabilities";
import { expect, test } from "bun:test";

function sessionUser({
  currentTenantUuid = null,
  platformRoles = [],
  roles = [],
}: {
  currentTenantUuid?: string | null;
  platformRoles?: string[];
  roles?: string[];
} = {}): TSessionUser {
  return {
    uuid: "00000000-0000-4000-8000-000000000001",
    authType: "vendor",
    name: "Example User",
    email: "user@example.test",
    phone: null,
    email_verified_at: null,
    phone_verified_at: null,
    current_tenant_uuid: currentTenantUuid,
    platform_roles: platformRoles,
    tenants: [],
    authorized_stores: [],
    roles: roles.map((name) => ({ name })),
  };
}

test("platform authority is active only in the platform workspace", () => {
  const platformAdmin = getWorkspaceCapabilities(
    sessionUser({ platformRoles: ["admin"] }),
  );
  const tenantAdmin = getWorkspaceCapabilities(
    sessionUser({
      currentTenantUuid: "00000000-0000-4000-8000-000000000002",
      platformRoles: ["super-admin"],
      roles: ["tenant-admin"],
    }),
  );

  expect(platformAdmin.workspace).toBe("platform");
  expect(platformAdmin.canReviewProducts).toBe(true);
  expect(tenantAdmin.workspace).toBe("tenant");
  expect(tenantAdmin.canReviewProducts).toBe(false);
  expect(tenantAdmin.canManageTenantMembers).toBe(true);
});

test("tenant staff can read scoped operational pages without vendor writes", () => {
  for (const role of ["tenant-admin", "sales-manager", "operator"]) {
    const capabilities = getWorkspaceCapabilities(
      sessionUser({
        currentTenantUuid: "00000000-0000-4000-8000-000000000002",
        roles: [role],
      }),
    );

    expect(capabilities.canViewDashboard).toBe(true);
    expect(capabilities.canViewProducts).toBe(true);
    expect(capabilities.canViewOrders).toBe(true);
    expect(capabilities.canWriteProducts).toBe(false);
    expect(capabilities.canImportProducts).toBe(false);
    expect(capabilities.canFulfillOrders).toBe(false);
    expect(capabilities.canReviewProducts).toBe(false);
  }
});

test("vendor workspace keeps owned-store authoring and fulfillment capabilities", () => {
  const capabilities = getWorkspaceCapabilities(
    sessionUser({
      currentTenantUuid: "00000000-0000-4000-8000-000000000002",
      roles: ["vendor"],
    }),
  );

  expect(capabilities.canWriteProducts).toBe(true);
  expect(capabilities.canImportProducts).toBe(true);
  expect(capabilities.canFulfillOrders).toBe(true);
  expect(capabilities.canReviewProducts).toBe(false);
  expect(capabilities.canManageTenantMembers).toBe(false);
});

test("unselected accounts receive no operational or platform capabilities", () => {
  const capabilities = getWorkspaceCapabilities(sessionUser());

  expect(capabilities.workspace).toBe("unselected");
  expect(capabilities.canViewDashboard).toBe(false);
  expect(capabilities.canViewProducts).toBe(false);
  expect(capabilities.canViewOrders).toBe(false);
  expect(capabilities.canReviewProducts).toBe(false);
});
