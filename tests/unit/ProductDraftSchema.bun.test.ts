import { ProductDraftSchema } from "@/modules/product.management/schemas/ProductDraftSchema";
import { expect, test } from "bun:test";

const emptySteps = [
  "setup",
  "category_details",
  "options",
  "delivery",
  "media",
  "review",
].map((key, index) => ({
  key,
  label: key,
  position: index + 1,
  status: index === 0 ? "available" : "locked",
  payload: null,
  validation_errors: null,
  saved_at: null,
  completed_at: null,
  lock_reason: null,
}));

const authoringField = (renderer: "integer-input" | "boolean-select") => ({
  label: "Delivery setting",
  renderer,
  value: null,
  effective_value: 0,
  source: "tenant",
  editable: false,
  min: 0,
  max: 2,
});

const draft = (deliveryAuthoring: unknown) => ({
  uuid: "00000000-0000-4000-8000-000000000001",
  mode: "create",
  status: "in_progress",
  current_step: "setup",
  version: 1,
  category_uuid: null,
  target_product_uuid: null,
  last_saved_at: null,
  workflow: {
    version: "product-authoring-workflow.v2",
    current_step: "setup",
    steps: emptySteps,
    progress: { total_steps: 6, completed_steps: 0, remaining_steps: 6 },
    actions: { save: true, review: false, commit: false, abandon: true },
  },
  delivery_authoring: deliveryAuthoring,
  reviews: [],
  media: [],
});

test("accepts the finite delivery authoring contract and historical v1 null", () => {
  const fields = {
    preparation_min_working_days: authoringField("integer-input"),
    preparation_max_working_days: authoringField("integer-input"),
    delivery_eligible: authoringField("boolean-select"),
    surcharge_per_unit_minor: authoringField("integer-input"),
  };

  expect(
    ProductDraftSchema.parse(draft({ status: "configured", fields }))
      .delivery_authoring?.fields.delivery_eligible.renderer,
  ).toBe("boolean-select");
  expect(ProductDraftSchema.parse(draft(null)).delivery_authoring).toBeNull();
});

test("rejects unsupported delivery authoring renderer keys", () => {
  const fields = {
    preparation_min_working_days: authoringField("integer-input"),
    preparation_max_working_days: authoringField("integer-input"),
    delivery_eligible: authoringField("boolean-select"),
    surcharge_per_unit_minor: authoringField("integer-input"),
  };

  expect(
    ProductDraftSchema.safeParse(
      draft({
        status: "configured",
        fields: {
          ...fields,
          delivery_eligible: {
            ...fields.delivery_eligible,
            renderer: "executable",
          },
        },
      }),
    ).success,
  ).toBe(false);
});
