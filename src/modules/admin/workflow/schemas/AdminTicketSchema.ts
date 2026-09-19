import { z } from "zod";

const AdminTicketParticipantSchema = z.object({
  uuid: z.uuid(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});

const AdminTicketCommentSchema = z.object({
  uuid: z.uuid(),
  body: z.string(),
  visibility: z.string(),
  author_user_uuid: z.uuid(),
  created_at: z.string().nullable(),
});

export const AdminTicketSchema = z.object({
  uuid: z.uuid(),
  type: z.string().min(1),
  status: z.enum([
    "open",
    "in_review",
    "changes_requested",
    "approved",
    "closed",
    "cancelled",
  ]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  subject_type: z.string().min(1),
  subject_uuid: z.uuid(),
  requester: AdminTicketParticipantSchema.nullable(),
  store: AdminTicketParticipantSchema.pick({
    uuid: true,
    name: true,
  }).nullable(),
  assignee: AdminTicketParticipantSchema.nullable().optional(),
  title: z.string(),
  description: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  submitted_at: z.string().nullable(),
  due_at: z.string().nullable(),
  resolved_at: z.string().nullable(),
  created_at: z.string().nullable(),
  comments: z.array(AdminTicketCommentSchema).default([]),
});

export const AdminTicketListPayloadSchema = z.object({
  tickets: z.array(AdminTicketSchema),
  pagination: z.object({
    current_page: z.number().int().positive(),
    per_page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    last_page: z.number().int().positive(),
  }),
});

export type TAdminTicket = z.infer<typeof AdminTicketSchema>;
export type TAdminTicketListPayload = z.infer<
  typeof AdminTicketListPayloadSchema
>;
