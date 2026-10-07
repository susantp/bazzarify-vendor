import {
  ProductDeliveryPermissionsMutationPayloadSchema,
  StoreDeliveryPolicyMutationPayloadSchema,
} from "@/modules/auth/domain/schemas/TenantDeliveryPolicySchema";
import { TenantMembershipListPayloadSchema } from "@/modules/auth/domain/schemas/TenantMembershipSchema";
import { describe, expect, it } from "bun:test";

describe("tenant delivery policy contracts", () => {
  it("parses tenant membership delivery grants from the API", () => {
    const membership = {
      uuid: "123e4567-e89b-42d3-a456-426614174000",
      status: "active",
      invited_by_uuid: null,
      activated_at: null,
      user: {
        uuid: "123e4567-e89b-42d3-a456-426614174001",
        name: "Vendor",
        email: "vendor@example.test",
      },
      roles: ["vendor"],
      store_uuids: ["123e4567-e89b-42d3-a456-426614174002"],
      delivery_execution_enabled: false,
      product_delivery_configuration_enabled: true,
      product_delivery_fee_configuration_enabled: false,
    };

    expect(
      TenantMembershipListPayloadSchema.safeParse({
        memberships: [membership],
      }).success,
    ).toBe(true);
    expect(
      TenantMembershipListPayloadSchema.safeParse({
        memberships: [
          {
            ...membership,
            product_delivery_fee_configuration_enabled: undefined,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("parses mode-only and configuration store updates and named vendor grants", () => {
    expect(
      StoreDeliveryPolicyMutationPayloadSchema.safeParse({
        delivery_policy: {
          store_uuid: "123e4567-e89b-42d3-a456-426614174000",
          mode: "tenant_managed",
          updated_by_user_uuid: "123e4567-e89b-42d3-a456-426614174001",
        },
      }).success,
    ).toBe(true);
    expect(
      StoreDeliveryPolicyMutationPayloadSchema.safeParse({
        delivery_policy: {
          store_uuid: "123e4567-e89b-42d3-a456-426614174000",
          mode: "tenant_managed",
          updated_by_user_uuid: "123e4567-e89b-42d3-a456-426614174001",
          configuration: {
            version: 1,
            configuration: {
              timezone: null,
              working_days: null,
              cutoff_local_time: null,
              preparation_min_working_days: null,
              preparation_max_working_days: null,
              service_area_rules: null,
              max_product_surcharge_minor: null,
              vendor_product_configuration_enabled: null,
              vendor_fee_configuration_enabled: null,
            },
            updated_at: null,
            updated_by_user_uuid: null,
            last_changed_fields: ["max_product_surcharge_minor"],
          },
        },
      }).success,
    ).toBe(true);
    expect(
      ProductDeliveryPermissionsMutationPayloadSchema.safeParse({
        membership_uuid: "123e4567-e89b-42d3-a456-426614174000",
        product_configuration_enabled: true,
        fee_configuration_enabled: false,
      }).success,
    ).toBe(true);
  });
});
