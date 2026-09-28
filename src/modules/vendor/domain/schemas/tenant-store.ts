import StoreSchema from "@/modules/vendor/domain/schemas/store";
import { z } from "zod";

const AssignedVendorSchema = z
  .object({
    uuid: z.uuid(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  })
  .strict();

export const TenantStoreSummarySchema = z
  .object({
    uuid: z.uuid(),
    name: z.string(),
    slug: z.string(),
    store_type_uuid: z.uuid().nullable(),
    assigned_vendor: AssignedVendorSchema.nullable(),
  })
  .strict();

export const TenantStoreListPayloadSchema = z
  .object({ stores: z.array(TenantStoreSummarySchema) })
  .strict();

export const TenantStoreMutationPayloadSchema = z
  .object({ store: StoreSchema })
  .strict();

const OnboardingCategorySchema = z
  .object({
    uuid: z.uuid(),
    id: z.number().int(),
    name: z.string(),
    slug: z.string(),
    parent_id: z.number().int().nullable(),
  })
  .strict();

export const AvailableStoreTypeSchema = z
  .object({
    uuid: z.uuid(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    onboarding_category_set: z
      .object({
        uuid: z.uuid(),
        name: z.string(),
        description: z.string().nullable(),
        categories: z.array(OnboardingCategorySchema),
      })
      .strict(),
  })
  .strict();

export const AvailableStoreTypesPayloadSchema = z
  .object({ store_types: z.array(AvailableStoreTypeSchema) })
  .strict();

export const TenantStoreCreateRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    store_type_uuid: z.uuid(),
    email: z.email(),
    phone: z.string().trim().min(1),
  })
  .strict();

export type TTenantStoreSummary = z.infer<typeof TenantStoreSummarySchema>;
export type TAvailableStoreType = z.infer<typeof AvailableStoreTypeSchema>;
