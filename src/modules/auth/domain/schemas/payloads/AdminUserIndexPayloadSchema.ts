import { ServerDataTableMetaSchema } from "@/modules/core/domain/schemas/ServerDataTableMeta";
import { SimplePaginatedSchema } from "@/modules/product.management/schemas/SimplePaginated";
import { StoreOnboardingSchema } from "@/modules/vendor/domain/schemas/store";
import { z } from "zod";

export const AdminUserStoreSummarySchema = z
  .object({
    uuid: z.uuid(),
    name: z.string().nullable(),
    category_count: z.number().int().nonnegative(),
    store_type_name: z.string().nullable().optional(),
    onboarding: StoreOnboardingSchema.nullable().optional(),
  })
  .strip();

export const AdminUserListItemSchema = z
  .object({
    uuid: z.uuid(),
    authType: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    created_at: z.string().nullable(),
    roles: z.array(z.string()),
    has_store: z.boolean(),
    onboarding: StoreOnboardingSchema.nullable().optional(),
    store_status: z.enum(["no_store", "needs_categories", "ready"]),
    store: AdminUserStoreSummarySchema.nullable(),
  })
  .strip();

export const AdminUserIndexPayloadSchema = z
  .object({
    users: SimplePaginatedSchema(AdminUserListItemSchema),
    table: ServerDataTableMetaSchema,
  })
  .strip();

export type TAdminUserListItem = z.infer<typeof AdminUserListItemSchema>;
export type TAdminUserIndexPayload = z.infer<
  typeof AdminUserIndexPayloadSchema
>;
