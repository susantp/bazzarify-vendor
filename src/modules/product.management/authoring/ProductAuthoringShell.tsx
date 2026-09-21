"use client";

import BackLinkButton from "@/modules/core/components/server/BackLinkButton";
import PageContainer from "@/modules/core/components/server/PageContainer";
import type { TProductDraft } from "@/modules/product.management";
import CompletedStepSummary from "@/modules/product.management/authoring/CompletedStepSummary";
import ProductAuthoringFooter from "@/modules/product.management/authoring/ProductAuthoringFooter";
import type { ProductAuthoringNavigationStep } from "@/modules/product.management/authoring/ProductAuthoringNavigation";
import ProductAuthoringProgressPanel from "@/modules/product.management/authoring/ProductAuthoringProgressPanel";
import { FocusEvent, ReactNode, useState } from "react";

interface ProductAuthoringShellProps {
  draft: TProductDraft;
  children: ReactNode;
  onBack: () => void;
  onEditSetup: () => void;
  onSave: () => void;
  onContinue: () => void;
  onSelectStep?: (stepKey: string) => void;
  currentStep?: string;
  canContinue: boolean;
  isPending: boolean;
  savedLabel?: string;
  setupSummary?: Array<{ label: string; value: string }>;
  navigation?: ProductAuthoringNavigationStep[];
}

export default function ProductAuthoringShell({
  draft,
  children,
  onBack,
  onEditSetup,
  onSave,
  onContinue,
  onSelectStep,
  currentStep: selectedStep,
  canContinue,
  isPending,
  savedLabel,
  setupSummary = [],
  navigation = [],
}: ProductAuthoringShellProps) {
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const currentStepKey = selectedStep ?? draft.current_step;
  const currentStep = draft.workflow.steps.find(
    (step) => step.key === currentStepKey,
  );
  const handleFieldFocus = (event: FocusEvent<HTMLDivElement>) => {
    const fieldElement = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-authoring-field]",
    );
    const fieldKey = fieldElement?.dataset.authoringField;
    if (fieldKey) {
      setActiveFieldKey(fieldKey);
    }
  };
  const handleSelectField = (targetId: string, fieldKey: string) => {
    setActiveFieldKey(fieldKey);
    const target = document.getElementById(targetId);
    target?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    if (target instanceof HTMLElement) {
      target.focus({ preventScroll: true });
    }
  };
  const handleSelectStep = (stepKey: string) => {
    setActiveFieldKey(null);
    onSelectStep?.(stepKey);
  };

  return (
    <PageContainer
      pageTitle="Product authoring"
      actionSlot={<BackLinkButton href="/products" label="Back to Products" />}
    >
      <div className="mt-6 grid gap-8 md:grid-cols-[16rem_minmax(0,1fr)] md:items-start">
        <ProductAuthoringProgressPanel
          steps={draft.workflow.steps}
          progress={draft.workflow.progress}
          currentStep={currentStepKey}
          onSelectStep={handleSelectStep}
          navigation={navigation}
          activeFieldKey={activeFieldKey}
          onSelectField={handleSelectField}
        />

        <div className="min-w-0" onFocusCapture={handleFieldFocus}>
          {draft.workflow.steps.some(
            (step) => step.key === "setup" && step.status === "complete",
          ) && (
            <CompletedStepSummary
              title="Setup"
              values={setupSummary}
              onEdit={onEditSetup}
            />
          )}
          <section aria-labelledby="current-authoring-step">
            <h1 id="current-authoring-step" className="sr-only">
              {currentStep?.label ?? "Product authoring step"}
            </h1>
            {children}
          </section>
          <ProductAuthoringFooter
            currentPosition={currentStep?.position ?? 1}
            totalSteps={draft.workflow.progress.total_steps}
            completedSteps={draft.workflow.progress.completed_steps}
            remainingSteps={draft.workflow.progress.remaining_steps}
            isPending={isPending}
            savedLabel={savedLabel}
            canGoBack={Boolean(onBack)}
            canContinue={canContinue}
            onBack={onBack}
            onSave={onSave}
            onContinue={onContinue}
          />
        </div>
      </div>
    </PageContainer>
  );
}
