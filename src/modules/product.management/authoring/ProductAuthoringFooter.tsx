"use client";

import { ThemedButton } from "@/modules/core/components/server/ThemedButton";

interface ProductAuthoringFooterProps {
  currentPosition: number;
  totalSteps: number;
  completedSteps: number;
  remainingSteps: number;
  isPending: boolean;
  savedLabel?: string;
  canGoBack: boolean;
  canContinue: boolean;
  onBack: () => void;
  onSave: () => void;
  onContinue: () => void;
}

export default function ProductAuthoringFooter({
  currentPosition,
  totalSteps,
  completedSteps,
  remainingSteps,
  isPending,
  savedLabel,
  canGoBack,
  canContinue,
  onBack,
  onSave,
  onContinue,
}: ProductAuthoringFooterProps) {
  return (
    <footer className="sticky bottom-0 z-10 mt-8 border-t bg-background/95 py-4 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          <p>
            Step {currentPosition} of {totalSteps} · {completedSteps} completed
            · {remainingSteps} remaining
          </p>
          {savedLabel && <p className="text-xs">{savedLabel}</p>}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <ThemedButton
            type="button"
            variant="ghost"
            disabled={!canGoBack || isPending}
            onClick={onBack}
          >
            Back
          </ThemedButton>
          <ThemedButton
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onSave}
          >
            {isPending ? "Saving..." : "Save draft"}
          </ThemedButton>
          <ThemedButton
            type="button"
            disabled={!canContinue || isPending}
            onClick={onContinue}
          >
            {isPending ? "Saving..." : "Save and continue"}
          </ThemedButton>
        </div>
      </div>
    </footer>
  );
}
