import { z } from "zod";

const DeliveryServiceAreaRuleSchema = z
  .object({
    key: z.string(),
    country: z.string().length(2),
    region: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    postal_code: z.string().nullable().optional(),
    base_fee_minor: z.number().int().nonnegative(),
    free_base_fee_threshold_minor: z
      .number()
      .int()
      .nonnegative()
      .nullable()
      .optional(),
    transit_min_working_days: z.number().int().nonnegative(),
    transit_max_working_days: z.number().int().nonnegative(),
  })
  .strict();

const StoreDeliveryConfigurationSchema = z
  .object({
    timezone: z.string().nullable(),
    working_days: z.array(z.number().int().min(1).max(7)).nullable(),
    cutoff_local_time: z.string().nullable(),
    preparation_min_working_days: z.number().int().nullable(),
    preparation_max_working_days: z.number().int().nullable(),
    service_area_rules: z.array(DeliveryServiceAreaRuleSchema).nullable(),
    max_product_surcharge_minor: z.number().int().nullable(),
    vendor_product_configuration_enabled: z.boolean().nullable(),
    vendor_fee_configuration_enabled: z.boolean().nullable(),
  })
  .strict();

const StoreDeliveryPolicyProjectionSchema = z
  .object({
    version: z.number().int().positive(),
    configuration: StoreDeliveryConfigurationSchema,
    updated_at: z.string().nullable(),
    updated_by_user_uuid: z.uuid().nullable(),
    last_changed_fields: z.array(z.string()),
  })
  .strict();

export const StoreDeliveryPolicyMutationPayloadSchema = z
  .object({
    delivery_policy: z
      .object({
        store_uuid: z.uuid(),
        mode: z.enum(["tenant_managed", "vendor_managed"]),
        updated_by_user_uuid: z.uuid(),
        configuration: StoreDeliveryPolicyProjectionSchema.optional(),
      })
      .strict(),
  })
  .strict();

export const ProductDeliveryPermissionsMutationPayloadSchema = z
  .object({
    membership_uuid: z.uuid(),
    product_configuration_enabled: z.boolean(),
    fee_configuration_enabled: z.boolean(),
  })
  .strict();
