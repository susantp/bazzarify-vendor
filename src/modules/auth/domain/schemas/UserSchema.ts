import { RoleSchema } from "@/modules/auth/domain/schemas/RoleSchema";
import StoreSchema from "@/modules/vendor/domain/schemas/store";
import { z } from "zod";

export const TenantAuthorizedStoreSchema = StoreSchema.pick({
  uuid: true,
  user_uuid: true,
  store_type_uuid: true,
  name: true,
  slug: true,
  category_count: true,
  product_authoring_ready: true,
  onboarding: true,
}).strip();

export const TenantWorkspaceSchema = z
  .object({
    uuid: z.uuid(),
    name: z.string(),
    slug: z.string(),
    membership_uuid: z.uuid(),
    roles: z.array(z.string()),
    authorized_stores: z.array(TenantAuthorizedStoreSchema),
  })
  .strip();

export const UserSchema = z
  .object({
    uuid: z.uuid(),
    id: z.number().nullable(),
    authType: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    email_verified_at: z.string().nullable(),
    phone_verified_at: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    deleted_at: z.string().nullable(),
  })
  .strip();
export const SessionUserSchema = UserSchema.pick({
  uuid: true,
  authType: true,
  name: true,
  email: true,
  phone: true,
  email_verified_at: true,
  phone_verified_at: true,
})
  .extend({
    current_tenant_uuid: z.uuid().nullable(),
    platform_roles: z.array(z.string()),
    tenants: z.array(TenantWorkspaceSchema),
    authorized_stores: z.array(TenantAuthorizedStoreSchema),
    roles: z.array(
      RoleSchema.pick({
        name: true,
      }),
    ),
  })
  .strip();

export const SessionUserWithToken = SessionUserSchema.extend({
  token: z.string(),
  expiresAt: z.string(),
});
export type TUser = z.infer<typeof UserSchema>;
export type TSessionUser = z.infer<typeof SessionUserSchema>;
export type TSessionUserWithToken = z.infer<typeof SessionUserWithToken>;
