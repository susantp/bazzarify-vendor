"use client";

import { cn } from "@/lib/utils";
import { ThemedButton } from "@/modules/core/components/server/ThemedButton";
import type { TProductDraftStep } from "@/modules/product.management";

interface ProductAuthoringStepperProps {
  steps: TProductDraftStep[];
  currentStep: string;
  onSelect?: (stepKey: string) => void;
}

export default function ProductAuthoringStepper({
  steps,
  currentStep,
  onSelect,
}: ProductAuthoringStepperProps) {
  return (
    <nav aria-label="Product authoring progress" className="mb-6">
      <ol className="grid gap-2 md:grid-cols-5">
        {steps.map((step) => {
          const isCurrent = step.key === currentStep;
          const isLocked = step.status === "locked";
          const isComplete = step.status === "complete";

          return (
            <li key={step.key}>
              <ThemedButton
                type="button"
                variant={isCurrent ? "default" : "outline"}
                className={cn(
                  "h-auto w-full justify-start px-3 py-2 text-left",
                  isComplete && "border-green-600 text-green-700",
                )}
                disabled={isLocked || !onSelect}
                onClick={() => onSelect?.(step.key)}
                title={
                  isLocked
                    ? (step.lock_reason ?? "Complete the previous step first.")
                    : undefined
                }
              >
                <span className="flex flex-col items-start gap-0.5">
                  <span className="text-xs">Step {step.position}</span>
                  <span className="text-sm">{step.label}</span>
                  <span className="text-xs opacity-80">
                    {isLocked
                      ? "Locked"
                      : isComplete
                        ? "Complete"
                        : isCurrent
                          ? "Current"
                          : "Available"}
                  </span>
                </span>
              </ThemedButton>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
