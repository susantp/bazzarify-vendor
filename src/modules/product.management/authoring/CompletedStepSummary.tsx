"use client";

import { ThemedButton } from "@/modules/core/components/server/ThemedButton";

interface CompletedStepSummaryProps {
  title: string;
  values: Array<{ label: string; value: string }>;
  onEdit: () => void;
}

export default function CompletedStepSummary({
  title,
  values,
  onEdit,
}: CompletedStepSummaryProps) {
  return (
    <section
      className="mb-6 rounded-lg border bg-muted/20 p-4"
      aria-label={`${title} summary`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title} complete</h2>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
            {values.map((item) => (
              <div key={item.label}>
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="font-medium">{item.value || "Not provided"}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ThemedButton type="button" variant="outline" onClick={onEdit}>
          Edit setup
        </ThemedButton>
      </div>
    </section>
  );
}
