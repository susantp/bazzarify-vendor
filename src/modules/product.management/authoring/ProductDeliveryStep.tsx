"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TProductDraft } from "@/modules/product.management";

type DeliveryFields = NonNullable<
  TProductDraft["delivery_authoring"]
>["fields"];
type DeliveryPayload = Record<string, unknown>;

interface ProductDeliveryStepProps {
  authoring: TProductDraft["delivery_authoring"];
  payload: DeliveryPayload;
  validationErrors: Record<string, unknown> | null;
  onChange: (
    field: keyof DeliveryFields,
    value: number | boolean | null,
  ) => void;
}

const sourceLabel = (source: DeliveryFields[keyof DeliveryFields]["source"]) =>
  ({
    product: "Product setting",
    store: "Store policy",
    tenant: "Tenant policy",
    default: "Platform default",
  })[source];

export default function ProductDeliveryStep({
  authoring,
  payload,
  validationErrors,
  onChange,
}: ProductDeliveryStepProps) {
  if (!authoring || authoring.status !== "configured") {
    return (
      <section className="rounded-lg border p-6" role="alert">
        <h2 className="text-lg font-semibold">Delivery setup is required</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask the tenant administrator to configure delivery before this product
          can continue through review.
        </p>
      </section>
    );
  }

  return (
    <section
      className="space-y-5 rounded-lg border p-6"
      aria-labelledby="delivery-step-title"
    >
      <div>
        <h2 id="delivery-step-title" className="text-lg font-semibold">
          Delivery settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Store and tenant values are inherited unless you have permission to
          set a product override.
        </p>
      </div>
      {(Object.keys(authoring.fields) as Array<keyof DeliveryFields>).map(
        (field) => {
          const descriptor = authoring.fields[field];
          const error = validationErrors?.[field];
          const errorMessage = Array.isArray(error)
            ? String(error[0] ?? "")
            : typeof error === "string"
              ? error
              : "";
          const value = Object.prototype.hasOwnProperty.call(payload, field)
            ? payload[field]
            : descriptor.value;
          const inheritedValue = descriptor.effective_value;
          const inputId = `delivery-${field}`;

          return (
            <div key={field} className="grid gap-2">
              <Label htmlFor={inputId}>{descriptor.label}</Label>
              {descriptor.renderer === "boolean-select" ? (
                <select
                  id={inputId}
                  data-authoring-field={field}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  disabled={!descriptor.editable}
                  value={value === null ? "inherit" : value ? "yes" : "no"}
                  onChange={(event) =>
                    onChange(
                      field,
                      event.target.value === "inherit"
                        ? null
                        : event.target.value === "yes",
                    )
                  }
                >
                  <option value="inherit">
                    Inherit (
                    {inheritedValue === null
                      ? "not configured"
                      : inheritedValue
                        ? "eligible"
                        : "not eligible"}
                    )
                  </option>
                  <option value="yes">Eligible</option>
                  <option value="no">Not eligible</option>
                </select>
              ) : (
                <Input
                  id={inputId}
                  data-authoring-field={field}
                  type="number"
                  min={descriptor.min ?? undefined}
                  max={descriptor.max ?? undefined}
                  step={1}
                  disabled={!descriptor.editable}
                  value={typeof value === "number" ? value : ""}
                  placeholder={
                    inheritedValue === null
                      ? "Inherit"
                      : `Inherit (${inheritedValue})`
                  }
                  aria-invalid={Boolean(errorMessage)}
                  onChange={(event) =>
                    onChange(
                      field,
                      event.target.value === ""
                        ? null
                        : event.target.valueAsNumber,
                    )
                  }
                />
              )}
              <p className="text-xs text-muted-foreground">
                {descriptor.editable
                  ? `Current source: ${sourceLabel(descriptor.source)}.`
                  : `Read-only · ${sourceLabel(descriptor.source)}.`}
              </p>
              {errorMessage && (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              )}
            </div>
          );
        },
      )}
    </section>
  );
}
