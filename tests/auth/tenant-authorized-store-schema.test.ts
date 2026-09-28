import { TenantAuthorizedStoreSchema } from "@/modules/auth/domain/schemas/UserSchema";
import { expect, test } from "bun:test";

test("tenant store projections accept stores without vendor onboarding", () => {
  const result = TenantAuthorizedStoreSchema.safeParse({
    uuid: "00000000-0000-4000-8000-000000000001",
    assigned_vendor_user_uuid: null,
    store_type_uuid: "00000000-0000-4000-8000-000000000002",
    name: "Unassigned tenant store",
    slug: "unassigned-tenant-store",
    category_count: 1,
    product_authoring_ready: false,
    onboarding: null,
  });

  expect(result.success).toBe(true);
});
