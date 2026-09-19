import { z } from "zod";

const ProductDraftStepStatusSchema = z.enum([
  "locked",
  "available",
  "in_progress",
  "complete",
  "invalid",
]);

const ProductDraftStepSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  position: z.number().int().positive(),
  status: ProductDraftStepStatusSchema,
  payload: z.record(z.string(), z.unknown()).nullable(),
  validation_errors: z.record(z.string(), z.unknown()).nullable(),
  saved_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  lock_reason: z.string().nullable(),
});

const ProductDraftWorkflowSchema = z.object({
  version: z.string().min(1),
  current_step: z.string().min(1),
  steps: z.array(ProductDraftStepSchema),
  progress: z.object({
    total_steps: z.number().int().nonnegative(),
    completed_steps: z.number().int().nonnegative(),
    remaining_steps: z.number().int().nonnegative(),
  }),
  actions: z.object({
    save: z.boolean(),
    review: z.boolean(),
    commit: z.boolean(),
    abandon: z.boolean(),
  }),
});

export const ProductDraftSchema = z.object({
  uuid: z.uuid(),
  mode: z.enum(["create", "edit"]),
  status: z.enum([
    "in_progress",
    "ready_for_review",
    "submitted_for_review",
    "in_review",
    "changes_requested",
    "committing",
    "committed",
    "abandoned",
    "expired",
    "conflicted",
  ]),
  current_step: z.string().min(1),
  version: z.number().int().positive(),
  category_uuid: z.uuid().nullable(),
  target_product_uuid: z.uuid().nullable(),
  last_saved_at: z.string().nullable(),
  workflow: ProductDraftWorkflowSchema,
  reviews: z
    .array(
      z.object({
        uuid: z.uuid(),
        state: z.enum(["in_review", "changes_requested"]),
        comment: z.string().nullable(),
        reviewer_user_uuid: z.uuid(),
        created_at: z.string().nullable(),
      }),
    )
    .default([]),
});

export const ProductDraftIndexPayloadSchema = z.object({
  drafts: z.array(ProductDraftSchema),
});

export type TProductDraft = z.infer<typeof ProductDraftSchema>;
export type TProductDraftStep = z.infer<typeof ProductDraftStepSchema>;
