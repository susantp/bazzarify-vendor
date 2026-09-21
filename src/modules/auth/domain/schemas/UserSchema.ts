import { RoleSchema } from "@/modules/auth/domain/schemas/RoleSchema";
import StoreSchema from "@/modules/vendor/domain/schemas/store";
import { z } from "zod";

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
    store: StoreSchema.nullable(),
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
