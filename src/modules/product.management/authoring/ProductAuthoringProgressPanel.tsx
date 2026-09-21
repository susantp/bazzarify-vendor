"use client";

import { cn } from "@/lib/utils";
import { ThemedButton } from "@/modules/core/components/server/ThemedButton";
import type {
  TProductDraft,
  TProductDraftStep,
} from "@/modules/product.management";
import type { ProductAuthoringNavigationStep } from "@/modules/product.management/authoring/ProductAuthoringNavigation";
import ProductAuthoringStepper from "@/modules/product.management/authoring/ProductAuthoringStepper";

interface ProductAuthoringProgressPanelProps {
  steps: TProductDraftStep[];
  progress: TProductDraft["workflow"]["progress"];
  currentStep: string;
  onSelectStep?: (stepKey: string) => void;
  navigation?: ProductAuthoringNavigationStep[];
  activeFieldKey?: string | null;
  onSelectField?: (targetId: string, fieldKey: string) => void;
}

export default function ProductAuthoringProgressPanel({
  steps,
  progress,
  currentStep,
  onSelectStep,
  navigation = [],
  activeFieldKey,
  onSelectField,
}: ProductAuthoringProgressPanelProps) {
  const activeStep = steps.find((step) => step.key === currentStep);
  const activeStepNavigation = navigation.find(
    (step) => step.stepKey === currentStep,
  );

  return (
    <aside className="rounded-lg border bg-muted/20 p-4 md:sticky md:top-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Authoring progress</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Step {activeStep?.position ?? 1} of {progress.total_steps} ·{" "}
          {progress.completed_steps} completed · {progress.remaining_steps}{" "}
          remaining
        </p>
      </div>
      <ProductAuthoringStepper
        steps={steps}
        currentStep={currentStep}
        onSelect={onSelectStep}
      />
      {activeStepNavigation && activeStepNavigation.fields.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            In this step
          </p>
          <nav aria-label="Fields in current authoring step">
            <ol className="grid gap-1">
              {activeStepNavigation.fields.map((item) => (
                <li key={item.key}>
                  <ThemedButton
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-auto w-full justify-start px-2 py-1.5 text-left text-sm",
                      activeFieldKey === item.key &&
                        "bg-accent font-medium text-accent-foreground",
                    )}
                    onClick={() => onSelectField?.(item.targetId, item.key)}
                  >
                    {item.label}
                  </ThemedButton>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}
    </aside>
  );
}
