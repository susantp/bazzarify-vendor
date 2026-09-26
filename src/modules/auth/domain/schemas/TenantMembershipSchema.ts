import { z } from "zod";

export const TenantMembershipSchema = z
  .object({
    uuid: z.uuid(),
    status: z.enum(["invited", "active", "inactive"]),
    invited_by_uuid: z.uuid().nullable(),
    activated_at: z.string().nullable(),
    user: z
      .object({
        uuid: z.uuid(),
        name: z.string().nullable(),
        email: z.string().nullable(),
      })
      .strict(),
    roles: z.array(z.string()),
    store_uuids: z.array(z.uuid()),
  })
  .strict();

export const TenantMembershipListPayloadSchema = z
  .object({
    memberships: z.array(TenantMembershipSchema),
  })
  .strict();

export const TenantMembershipMutationPayloadSchema = z
  .object({
    membership_uuid: z.uuid(),
    tenant_uuid: z.uuid().optional(),
    status: z.string().optional(),
    user_uuid: z.uuid().optional(),
  })
  .strict();

export type TTenantMembership = z.infer<typeof TenantMembershipSchema>;
