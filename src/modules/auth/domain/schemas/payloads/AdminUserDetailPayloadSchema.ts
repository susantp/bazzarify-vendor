import StoreSchema, {
  StoreOnboardingSchema,
} from "@/modules/vendor/domain/schemas/store";
import { z } from "zod";

export const AdminUserDetailSchema = z
  .object({
    uuid: z.uuid(),
    authType: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    email_verified_at: z.string().nullable(),
    phone_verified_at: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    roles: z.array(z.string()),
    has_store: z.boolean(),
    onboarding: StoreOnboardingSchema.nullable().optional(),
    store_status: z.enum(["no_store", "needs_categories", "ready"]),
    store: StoreSchema.extend({
      store_type_name: z.string().nullable().optional(),
      category_count: z.number().int().nonnegative().optional(),
      product_authoring_ready: z.boolean().optional(),
    }).nullable(),
  })
  .strip();

export const AdminUserDetailPayloadSchema = z
  .object({
    user: AdminUserDetailSchema,
  })
  .strip();

export type TAdminUserDetail = z.infer<typeof AdminUserDetailSchema>;
export type TAdminUserDetailPayload = z.infer<
  typeof AdminUserDetailPayloadSchema
>;
