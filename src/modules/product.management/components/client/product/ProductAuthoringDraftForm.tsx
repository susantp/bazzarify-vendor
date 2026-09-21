"use client";

import type {
  ProductAuthoringController,
  TCategory,
  TCategoryIndexPayload,
  TProductDraft,
} from "@/modules/product.management";
import { getProductAuthoringNavigation } from "@/modules/product.management/authoring/ProductAuthoringNavigation";
import ProductAuthoringShell from "@/modules/product.management/authoring/ProductAuthoringShell";
import {
  ProductAuthoringStep,
  ProductAuthoringStepContent,
} from "@/modules/product.management/components/client/product/ProductAuthoringForm";
import useProductDraft from "@/modules/product.management/hooks/useProductDraft";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface ProductAuthoringDraftFormProps {
  categoryIndexPayload: TCategoryIndexPayload;
  controller: ProductAuthoringController;
  mode: "create" | "update";
  targetProductUuid?: string;
}

const getString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const getStepPayload = (
  draft: TProductDraft,
  stepKey: string,
): Record<string, unknown> | null =>
  draft.workflow.steps.find((step) => step.key === stepKey)?.payload ?? null;

const findCategoryName = (
  categories: TCategory[],
  uuid: string | null,
): string | null => {
  if (!uuid) {
    return null;
  }

  for (const category of categories) {
    if (category.uuid === uuid) {
      return category.name;
    }

    const nested = findCategoryName(category.children ?? [], uuid);
    if (nested) {
      return nested;
    }
  }

  return null;
};

export default function ProductAuthoringDraftForm({
  categoryIndexPayload,
  controller,
  mode,
  targetProductUuid,
}: ProductAuthoringDraftFormProps) {
  const router = useRouter();
  const draftController = useProductDraft();
  const draftMode = mode === "update" ? "edit" : "create";
  const [selectedStep, setSelectedStep] = useState<ProductAuthoringStep | null>(
    null,
  );
  const resumeAttempted = useRef(false);
  const { draft, removeMedia, resumeDraft, uploadMedia } = draftController;
  const activeStep =
    selectedStep ??
    (draft?.current_step as ProductAuthoringStep | undefined) ??
    "setup";

  useEffect(() => {
    if (resumeAttempted.current) {
      return;
    }

    resumeAttempted.current = true;
    void resumeDraft(draftMode, targetProductUuid);
  }, [draftMode, resumeDraft, targetProductUuid]);

  const setupPayload = (): Record<string, unknown> => ({
    ...controller.basicState.productForm,
    category_uuid: controller.categoryState.committedCategory?.uuid,
  });

  const stepPayload = (stepKey: string): Record<string, unknown> => {
    if (stepKey === "setup") {
      return setupPayload();
    }
    if (stepKey === "category_details") {
      return {
        specifications: controller.specificationState.specificationValues,
      };
    }
    if (stepKey === "options") {
      return {
        has_customer_selectable_options:
          controller.optionModeState.hasCustomerSelectableOptions,
        variants: Object.fromEntries(
          Object.entries(controller.variantState.variantData).map(
            ([key, variant]) => [
              key,
              {
                name: variant.name,
                sku: variant.sku,
                stock: variant.stock,
                price: variant.price,
                available: variant.available,
              },
            ],
          ),
        ),
      };
    }
    return {};
  };

  const handleSave = async (advance: boolean) => {
    const payload = stepPayload(activeStep);
    if (!draft) {
      const started = await draftController.startDraft(
        {
          mode: draftMode,
          target_product_uuid: targetProductUuid,
          category_uuid: getString(payload.category_uuid) || undefined,
          payload,
        },
        advance,
      );
      if (started) {
        setSelectedStep(started.current_step as ProductAuthoringStep);
      }
      return;
    }

    const saved = await draftController.saveStep(activeStep, payload, advance);
    if (saved && advance) {
      setSelectedStep(
        (saved.current_step as ProductAuthoringStep) || activeStep,
      );
    }
  };

  const uploadDraftMedia = useCallback(
    async (file: File) => Boolean((await uploadMedia(file))?.media),
    [uploadMedia],
  );
  const removeDraftMedia = useCallback(
    async (mediaUuid: string) => Boolean(await removeMedia(mediaUuid)),
    [removeMedia],
  );

  if (!draft) {
    return (
      <ProductAuthoringShellFallback
        categoryIndexPayload={categoryIndexPayload}
        controller={controller}
        mode={mode}
        isPending={draftController.isPending}
        savedLabel={draftController.savedLabel}
        onSave={() => void handleSave(false)}
        onContinue={() => void handleSave(true)}
        onBack={() => router.push("/products")}
      />
    );
  }

  const currentStep = draft.workflow.steps.find(
    (step) => step.key === activeStep,
  );
  const setup = getStepPayload(draft, "setup");
  const categoryName = findCategoryName(
    categoryIndexPayload.categories.data,
    draft.category_uuid,
  );
  const setupSummary = [
    { label: "Product", value: getString(setup?.name) },
    {
      label: "Category",
      value:
        controller.categoryState.committedCategory?.name ??
        categoryName ??
        "Selected",
    },
  ];
  const navigation = getProductAuthoringNavigation(controller, mode);
  return (
    <ProductAuthoringShell
      draft={draft}
      currentStep={activeStep}
      onBack={() => {
        const previous = draft.workflow.steps
          .filter((step) => step.position < (currentStep?.position ?? 1))
          .filter((step) => step.status !== "locked")
          .at(-1);
        if (previous) {
          setSelectedStep(previous.key as ProductAuthoringStep);
        } else {
          router.push("/products");
        }
      }}
      onEditSetup={() => setSelectedStep("setup")}
      onSave={() => void handleSave(false)}
      onContinue={() => void handleSave(true)}
      onSelectStep={(stepKey) => {
        const step = draft.workflow.steps.find(
          (candidate) => candidate.key === stepKey,
        );
        if (step && step.status !== "locked") {
          setSelectedStep(stepKey as ProductAuthoringStep);
        }
      }}
      canContinue={
        currentStep?.key !== "review" && currentStep?.status !== "locked"
      }
      isPending={draftController.isPending}
      savedLabel={draftController.savedLabel}
      setupSummary={setupSummary}
      navigation={navigation}
    >
      <ProductAuthoringStepContent
        categoryIndexPayload={categoryIndexPayload}
        controller={controller}
        mode={mode}
        activeStep={activeStep}
        showSubmit={false}
        draftMedia={draft.media}
        onUploadDraftMedia={uploadDraftMedia}
        onRemoveDraftMedia={removeDraftMedia}
      />
    </ProductAuthoringShell>
  );
}

function ProductAuthoringShellFallback({
  categoryIndexPayload,
  controller,
  mode,
  isPending,
  savedLabel,
  onSave,
  onContinue,
  onBack,
}: ProductAuthoringDraftFormProps & {
  isPending: boolean;
  savedLabel?: string;
  onSave: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const draftMode = mode === "update" ? "edit" : "create";
  const navigation = getProductAuthoringNavigation(controller, mode);

  return (
    <ProductAuthoringShell
      draft={{
        uuid: "00000000-0000-0000-0000-000000000000",
        mode: draftMode,
        status: "in_progress",
        current_step: "setup",
        version: 1,
        category_uuid: null,
        target_product_uuid: null,
        last_saved_at: null,
        workflow: {
          version: "product-authoring-workflow.v1",
          current_step: "setup",
          steps: [
            {
              key: "setup",
              label: "Basic information and category",
              position: 1,
              status: "available",
              payload: null,
              validation_errors: null,
              saved_at: null,
              completed_at: null,
              lock_reason: null,
            },
            ...["category_details", "options", "media", "review"].map(
              (key, index) => ({
                key,
                label: key,
                position: index + 2,
                status: "locked" as const,
                payload: null,
                validation_errors: null,
                saved_at: null,
                completed_at: null,
                lock_reason: "Save the setup first.",
              }),
            ),
          ],
          progress: { total_steps: 5, completed_steps: 0, remaining_steps: 5 },
          actions: { save: true, review: false, commit: false, abandon: true },
        },
        reviews: [],
        media: [],
      }}
      onBack={onBack}
      onEditSetup={() => undefined}
      onSave={onSave}
      onContinue={onContinue}
      canContinue
      isPending={isPending}
      savedLabel={savedLabel}
      navigation={navigation}
    >
      <ProductAuthoringStepContent
        categoryIndexPayload={categoryIndexPayload}
        controller={controller}
        mode={mode}
        activeStep="setup"
        showSubmit={false}
      />
    </ProductAuthoringShell>
  );
}
