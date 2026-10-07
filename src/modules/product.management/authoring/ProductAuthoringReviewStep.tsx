"use client";

import type { TProductDraft } from "@/modules/product.management";

type DeliveryFieldKey = keyof NonNullable<
  TProductDraft["delivery_authoring"]
>["fields"];

interface ProductAuthoringReviewStepProps {
  draft: TProductDraft;
}

const labels: Record<string, string> = {
  name: "Product",
  category_uuid: "Category ID",
  base_price: "Base price",
  minimum_order_quantity: "Minimum order quantity",
  preparation_min_working_days: "Minimum preparation days",
  preparation_max_working_days: "Maximum preparation days",
  delivery_eligible: "Delivery eligible override",
  surcharge_per_unit_minor: "Per-item surcharge (minor units)",
};

const displayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "")
    return "Inherited / not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return "Configured";
  return String(value);
};

export default function ProductAuthoringReviewStep({
  draft,
}: ProductAuthoringReviewStepProps) {
  const steps = draft.workflow.steps.filter((step) => step.key !== "review");

  return (
    <section className="space-y-5" aria-labelledby="authoring-review-title">
      <div>
        <h2 id="authoring-review-title" className="text-lg font-semibold">
          Review product draft
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Submitting creates an administrator review ticket. It does not publish
          the product.
        </p>
      </div>
      {steps.map((step) => (
        <section key={step.key} className="rounded-lg border p-4">
          <h3 className="font-medium">{step.label}</h3>
          <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
            {Object.entries(step.payload ?? {}).map(([key, value]) => (
              <div key={`${step.key}:${key}`} className="min-w-0">
                <dt className="text-xs text-muted-foreground">
                  {(step.key === "delivery"
                    ? draft.delivery_authoring?.fields[key as DeliveryFieldKey]
                        ?.label
                    : undefined) ??
                    labels[key] ??
                    key.replaceAll("_", " ")}
                </dt>
                <dd className="break-words text-sm">{displayValue(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </section>
  );
}
