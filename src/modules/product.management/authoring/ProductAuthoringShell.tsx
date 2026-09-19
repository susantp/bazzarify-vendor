"use client";

import BackLinkButton from "@/modules/core/components/server/BackLinkButton";
import PageContainer from "@/modules/core/components/server/PageContainer";
import type { TProductDraft } from "@/modules/product.management";
import CompletedStepSummary from "@/modules/product.management/authoring/CompletedStepSummary";
import ProductAuthoringFooter from "@/modules/product.management/authoring/ProductAuthoringFooter";
import ProductAuthoringStepper from "@/modules/product.management/authoring/ProductAuthoringStepper";
import { ReactNode } from "react";

interface ProductAuthoringShellProps {
  draft: TProductDraft;
  children: ReactNode;
  onBack: () => void;
  onEditSetup: () => void;
  onSave: () => void;
  onContinue: () => void;
  onSelectStep?: (stepKey: string) => void;
  canContinue: boolean;
  isPending: boolean;
  savedLabel?: string;
  setupSummary?: Array<{ label: string; value: string }>;
}

export default function ProductAuthoringShell({
  draft,
  children,
  onBack,
  onEditSetup,
  onSave,
  onContinue,
  onSelectStep,
  canContinue,
  isPending,
  savedLabel,
  setupSummary = [],
}: ProductAuthoringShellProps) {
  const currentStep = draft.workflow.steps.find(
    (step) => step.key === draft.current_step,
  );

  return (
    <PageContainer
      pageTitle="Product authoring"
      actionSlot={<BackLinkButton href="/products" label="Back to Products" />}
    >
      <ProductAuthoringStepper
        steps={draft.workflow.steps}
        currentStep={draft.current_step}
        onSelect={onSelectStep}
      />
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
    </PageContainer>
  );
}
