"use client";

import type {
  ProductAuthoringController,
  TCategory,
  TCategoryIndexPayload,
  TProductDraft,
} from "@/modules/product.management";
import { getProductAuthoringNavigation } from "@/modules/product.management/authoring/ProductAuthoringNavigation";
import ProductAuthoringReviewStep from "@/modules/product.management/authoring/ProductAuthoringReviewStep";
import ProductAuthoringShell from "@/modules/product.management/authoring/ProductAuthoringShell";
import ProductDeliveryStep from "@/modules/product.management/authoring/ProductDeliveryStep";
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

const findCategoryPath = (
  categories: TCategory[],
  uuid: string | null,
  path: TCategory[] = [],
): TCategory[] | null => {
  if (!uuid) return null;
  for (const category of categories) {
    const nextPath = [...path, category];
    if (category.uuid === uuid) return nextPath;
    const nested = findCategoryPath(category.children ?? [], uuid, nextPath);
    if (nested) return nested;
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
  const [deliveryPayload, setDeliveryPayload] = useState<
    Record<string, unknown>
  >({});
  const resumeAttempted = useRef(false);
  const restoredDraftUuid = useRef<string | null>(null);
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

  useEffect(() => {
    if (!draft || restoredDraftUuid.current === draft.uuid) return;
    restoredDraftUuid.current = draft.uuid;
    setDeliveryPayload(getStepPayload(draft, "delivery") ?? {});
    const setup = getStepPayload(draft, "setup") ?? {};
    const categoryUuid = getString(setup.category_uuid) || draft.category_uuid;
    void controller
      .restoreDraft({
        setup,
        categoryDetails: getStepPayload(draft, "category_details") ?? {},
        options: getStepPayload(draft, "options") ?? {},
        categoryPath:
          findCategoryPath(
            categoryIndexPayload.categories.data,
            categoryUuid,
          ) ?? [],
      })
      .catch((error: unknown) => {
        console.error("[product-draft] resume hydration failed", error);
      });
  }, [categoryIndexPayload.categories.data, controller, draft]);

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
        variant_selections: controller.selectorState.variantSelections,
        columns: controller.variantState.columns,
      };
    }
    if (stepKey === "delivery") {
      return deliveryPayload;
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
  const handleContinue = async () => {
    if (activeStep === "review" && draft) {
      const submitted = await draftController.submitForReview();
      if (submitted) setSelectedStep("review");
      return;
    }
    await handleSave(true);
  };

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
      onContinue={() => void handleContinue()}
      onSelectStep={(stepKey) => {
        const step = draft.workflow.steps.find(
          (candidate) => candidate.key === stepKey,
        );
        if (step && step.status !== "locked") {
          setSelectedStep(stepKey as ProductAuthoringStep);
        }
      }}
      canContinue={
        currentStep?.status !== "locked" &&
        ["in_progress", "ready_for_review", "changes_requested"].includes(
          draft.status,
        )
      }
      continueLabel={
        activeStep === "review"
          ? draft.status === "submitted_for_review" ||
            draft.status === "in_review"
            ? "Submitted for review"
            : "Submit for review"
          : undefined
      }
      isPending={draftController.isPending}
      savedLabel={draftController.savedLabel}
      setupSummary={setupSummary}
      navigation={navigation}
    >
      {activeStep === "delivery" ? (
        <ProductDeliveryStep
          authoring={draft.delivery_authoring}
          payload={deliveryPayload}
          validationErrors={currentStep?.validation_errors ?? null}
          onChange={(field, value) =>
            setDeliveryPayload((current) => ({ ...current, [field]: value }))
          }
        />
      ) : activeStep === "review" ? (
        <ProductAuthoringReviewStep draft={draft} />
      ) : (
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
      )}
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
          version: "product-authoring-workflow.v2",
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
            ...[
              { key: "category_details", label: "Category details" },
              { key: "options", label: "Options and inventory" },
              { key: "delivery", label: "Delivery settings" },
              { key: "media", label: "Images and media" },
              { key: "review", label: "Review" },
            ].map(({ key, label }, index) => ({
              key,
              label,
              position: index + 2,
              status: "locked" as const,
              payload: null,
              validation_errors: null,
              saved_at: null,
              completed_at: null,
              lock_reason: "Save the setup first.",
            })),
          ],
          progress: { total_steps: 6, completed_steps: 0, remaining_steps: 6 },
          actions: { save: true, review: false, commit: false, abandon: true },
        },
        reviews: [],
        media: [],
        delivery_authoring: null,
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
