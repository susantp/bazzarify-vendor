import { z } from "zod";

export const VENDOR_ONBOARDING_STATES = [
  "identity_verification_pending",
  "store_setup_pending",
  "awaiting_store_assignment",
  "remediation_required",
  "ready",
] as const;

export const VENDOR_ONBOARDING_ACTIONS = [
  "verify_identity",
  "create_store",
  "await_store_assignment",
  "restore_category_authority",
  "none",
] as const;

const ActionSchema = z
  .object({
    label: z.string(),
    href: z.string(),
  })
  .strip();

const NextActionSchema = z
  .object({
    kind: z.enum(VENDOR_ONBOARDING_ACTIONS),
    severity: z.enum(["warning", "info"]),
    title: z.string(),
    description: z.string(),
    action: ActionSchema,
  })
  .strip();

const StatusStepSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    state: z.enum(["complete", "current", "locked"]),
  })
  .strip();

const TaskSchema = z
  .object({
    key: z.string(),
    title: z.string(),
    state: z.enum(["required"]),
    due_at: z.string().nullable(),
    action: ActionSchema,
  })
  .strip();

const RecentActivitySchema = z
  .object({
    key: z.string(),
    label: z.string(),
    state: z.string(),
    at: z.string().nullable(),
  })
  .strip();

const VendorSchema = z
  .object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    store_name: z.string().nullable(),
  })
  .strip();

const OnboardingSchema = z
  .object({
    uuid: z.string().uuid().nullable(),
    state: z.enum(VENDOR_ONBOARDING_STATES),
    next_action: z.enum(VENDOR_ONBOARDING_ACTIONS),
    product_authoring_ready: z.boolean(),
  })
  .strip();

const ProgressSchema = z
  .object({
    completed_steps: z.number().int().nonnegative(),
    total_steps: z.number().int().positive(),
    percentage: z.number().int().min(0).max(100),
    estimated_remaining_steps: z.number().int().nonnegative(),
  })
  .strip();

const OnboardingSurfaceSchema = z
  .object({
    mode: z.literal("onboarding"),
    vendor: VendorSchema,
    onboarding: OnboardingSchema,
    progress: ProgressSchema,
    next_action: NextActionSchema,
    status: z.array(StatusStepSchema),
    tasks: z.array(TaskSchema),
    recent_activity: z.array(RecentActivitySchema),
  })
  .strip();

const DashboardSurfaceSchema = z
  .object({
    mode: z.literal("dashboard"),
    redirect_to: z.string(),
  })
  .strip();

export const VendorOnboardingSurfaceSchema = z.discriminatedUnion("mode", [
  OnboardingSurfaceSchema,
  DashboardSurfaceSchema,
]);

export const VendorOnboardingSurfacePayloadSchema = z
  .object({
    surface: VendorOnboardingSurfaceSchema,
  })
  .strip();

export type TVendorOnboardingSurface = z.infer<
  typeof VendorOnboardingSurfaceSchema
>;
export type TOnboardingSurface = z.infer<typeof OnboardingSurfaceSchema>;
