"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import BackLinkButton from "@/modules/core/components/server/BackLinkButton";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { ThemedButton } from "@/modules/core/components/server/ThemedButton";
import type {
  ProductAuthoringController,
  TCategoryIndexPayload,
} from "@/modules/product.management";
import CategoryDropdown from "@/modules/product.management/ui/CategoryDropdown";
import ImageUploader from "@/modules/product.management/ui/ImageUploader";
import OptionlessSkuEditor from "@/modules/product.management/ui/OptionlessSkuEditor";
import ProductCard from "@/modules/product.management/ui/ProductCard";
import ProductDetail from "@/modules/product.management/ui/ProductDetail";
import ProductVariant from "@/modules/product.management/ui/ProductVariant";
import UnavailableAuthoringFields from "@/modules/product.management/ui/UnavailableAuthoringFields";
import {
  isAuthoringFieldVisible,
  type ProductAuthoringMode,
} from "@/modules/product.management/utils/productAuthoringRenderer";
import {
  getSubmissionFieldError,
  hasSubmissionFieldPrefix,
} from "@/modules/product.management/utils/productSubmissionFeedback";

interface ProductAuthoringFormProps {
  categoryIndexPayload: TCategoryIndexPayload;
  controller: ProductAuthoringController;
  mode: ProductAuthoringMode;
}

export default function ProductAuthoringForm({
  categoryIndexPayload,
  controller,
  mode,
}: ProductAuthoringFormProps) {
  const { authoringSchema, basicState, categoryState, submissionState } =
    controller;
  const feedback = submissionState.feedback;
  const categoryError = getSubmissionFieldError(feedback, "category");
  const imagesError =
    getSubmissionFieldError(feedback, "images") ||
    (hasSubmissionFieldPrefix(feedback, "images")
      ? feedback?.fieldErrors.images?.[0]
      : undefined);
  const variantsError = hasSubmissionFieldPrefix(feedback, "variants");
  const supportsField = (fieldKey: string) =>
    isAuthoringFieldVisible(authoringSchema, fieldKey, mode);

  return (
    <PageContainer
      pageTitle={mode === "create" ? "Create Products" : "Edit Product"}
      actionSlot={<BackLinkButton href="/products" label="Back to Products" />}
    >
      <BasicInformationSection
        basicState={basicState}
        feedback={feedback}
        authoringSchema={authoringSchema}
        mode={mode}
        supportsBasePrice={supportsField("base_price")}
        supportsMinimumOrderQuantity={supportsField("minimum_order_quantity")}
      />
      <CategorySection
        categoryIndexPayload={categoryIndexPayload}
        categoryState={categoryState}
        mode={mode}
        categoryError={categoryError}
      />
      {authoringSchema && (
        <UnavailableAuthoringFields
          fields={authoringSchema.unavailable_fields}
        />
      )}
      {categoryState.committedCategory && !authoringSchema && (
        <p
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          The category authoring contract is unavailable. Refresh the page or
          contact an administrator{" "}
          {mode === "create"
            ? "before creating a product."
            : "before editing this product."}
        </p>
      )}
      {categoryState.committedCategory && authoringSchema && (
        <>
          {supportsField("images") && (
            <MediaSection
              controller={controller}
              mode={mode}
              imagesError={imagesError}
            />
          )}
          {supportsField("specifications") && (
            <SpecificationsSection
              controller={controller}
              feedback={feedback}
              mode={mode}
            />
          )}
          {supportsField("variants") && (
            <OptionsSection
              controller={controller}
              feedback={feedback}
              mode={mode}
              supportsCustomerOptions={supportsField("variants.attribute")}
              variantsError={variantsError}
            />
          )}
          <SubmitSection submissionState={submissionState} />
        </>
      )}
    </PageContainer>
  );
}

interface BasicInformationSectionProps {
  basicState: ProductAuthoringController["basicState"];
  feedback: ProductAuthoringController["submissionState"]["feedback"];
  authoringSchema: ProductAuthoringController["authoringSchema"];
  mode: ProductAuthoringMode;
  supportsBasePrice: boolean;
  supportsMinimumOrderQuantity: boolean;
}

function BasicInformationSection({
  basicState,
  feedback,
  authoringSchema,
  mode,
  supportsBasePrice,
  supportsMinimumOrderQuantity,
}: BasicInformationSectionProps) {
  const nameError = getSubmissionFieldError(feedback, "name");
  const basePriceError = getSubmissionFieldError(feedback, "base_price");
  const minimumOrderQuantityError = getSubmissionFieldError(
    feedback,
    "minimum_order_quantity",
  );
  const skuError = getSubmissionFieldError(feedback, "sku");
  const basicInfoError = Boolean(
    nameError ||
    basePriceError ||
    minimumOrderQuantityError ||
    skuError ||
    getSubmissionFieldError(feedback, "description") ||
    getSubmissionFieldError(feedback, "highlights") ||
    getSubmissionFieldError(feedback, "box_items"),
  );

  return (
    <ProductCard
      title="Basic Information"
      className={basicInfoError ? "border-destructive" : undefined}
    >
      <div className="w-full max-w-6xl flex-col items-center space-y-4">
        <Label htmlFor="name">Name</Label>
        <Input
          value={basicState.productForm.name}
          onChange={basicState.onProductFormInputChange}
          name="name"
          className={cn(
            "focus-visible:ring-primary",
            nameError && "border-destructive",
          )}
          type="text"
          id="name"
          placeholder="Ex. Nikon Coolpix A300 Digital Camera"
        />
        {nameError && <p className="text-sm text-destructive">{nameError}</p>}
        {supportsBasePrice && (
          <>
            <Label>Base Price</Label>
            <Input
              value={basicState.productForm.base_price}
              onChange={basicState.onProductFormInputChange}
              className={cn(
                "focus-visible:ring-primary",
                basePriceError && "border-destructive",
              )}
              type="number"
              id="base_price"
              placeholder="base price"
              name="base_price"
            />
            {basePriceError && (
              <p className="text-sm text-destructive">{basePriceError}</p>
            )}
          </>
        )}
        {supportsMinimumOrderQuantity && (
          <>
            <Label htmlFor="minimum_order_quantity">
              Minimum order quantity
            </Label>
            <Input
              value={basicState.productForm.minimum_order_quantity}
              onChange={basicState.onProductFormInputChange}
              className={cn(
                "focus-visible:ring-primary",
                minimumOrderQuantityError && "border-destructive",
              )}
              type="number"
              min={1}
              id="minimum_order_quantity"
              placeholder="minimum quantity per order"
              name="minimum_order_quantity"
            />
            {minimumOrderQuantityError && (
              <p className="text-sm text-destructive">
                {minimumOrderQuantityError}
              </p>
            )}
          </>
        )}
        <Label htmlFor="name">SKU</Label>
        <Input
          disabled={mode === "update"}
          value={basicState.productForm.sku}
          onChange={basicState.onProductFormInputChange}
          name="sku"
          className={cn(
            "focus-visible:ring-primary",
            skuError && "border-destructive",
          )}
          type="text"
          id="sku"
          placeholder={
            mode === "create" ? "min 8 character alphabets or number" : "NCADC"
          }
        />
        {skuError && <p className="text-sm text-destructive">{skuError}</p>}
        <ProductDetail
          productForm={basicState.productForm}
          onChange={basicState.onProductFormInputChange}
          feedback={feedback}
          authoringSchema={authoringSchema}
        />
      </div>
    </ProductCard>
  );
}

interface CategorySectionProps {
  categoryIndexPayload: TCategoryIndexPayload;
  categoryState: ProductAuthoringController["categoryState"];
  mode: ProductAuthoringMode;
  categoryError?: string;
}

function CategorySection({
  categoryIndexPayload,
  categoryState,
  mode,
  categoryError,
}: CategorySectionProps) {
  const rootCategories = categoryIndexPayload.categories.data;

  return (
    <ProductCard
      title="Category"
      className={categoryError ? "border-destructive" : undefined}
    >
      <CategoryDropdown
        selectedCategories={categoryState.selectedCategories}
        committedCategories={categoryState.committedCategories}
        open={categoryState.showDropdown}
        onOpenChangeAction={categoryState.handleShowDropdownChange}
        rootCategories={rootCategories.filter((category) =>
          category.name
            .toLowerCase()
            .includes(categoryState.filters.root.toLowerCase()),
        )}
        subCategories={categoryState.subCategories.filter((category) =>
          category.name
            .toLowerCase()
            .includes(categoryState.filters.sub.toLowerCase()),
        )}
        subChildCategories={categoryState.subChildCategories.filter(
          (category) =>
            category.name
              .toLowerCase()
              .includes(categoryState.filters.subchild.toLowerCase()),
        )}
        onClickRoot={categoryState.handleClickRoot}
        onClickSub={categoryState.handleClickSub}
        onClickSubChild={categoryState.handleClickSubChild}
        onCommitSelectedCategory={categoryState.handleCommitSelectedCategory}
        onFilterChange={categoryState.updateFilter}
        invalid={Boolean(categoryError)}
        errorMessage={categoryError}
        {...(mode === "update"
          ? {
              categoryChangeLocked: categoryState.categoryChangeLocked,
              lockedSelectionMessage:
                "Category changes are unavailable in edit. Create a new product if you need a different category.",
            }
          : {})}
      />
      {mode === "update" && (
        <p className="pt-2 text-sm text-muted-foreground">
          Category reassignment is currently unavailable while editing an
          existing product.
        </p>
      )}
    </ProductCard>
  );
}

interface MediaSectionProps {
  controller: ProductAuthoringController;
  mode: ProductAuthoringMode;
  imagesError?: string;
}

function MediaSection({ controller, mode, imagesError }: MediaSectionProps) {
  const { mediaState } = controller;

  return (
    <ProductCard
      title="Product Images"
      className={imagesError ? "border-destructive" : undefined}
      tooltip={{
        trigger: { type: "icon" },
        texts: [
          "This is the main image of your product page. Maximum 8 images can be uploaded.",
          "Image size between 330x330 and 5000x5000 px. Max file size: 3 MB.",
          "Obscene image is strictly prohibited.",
        ],
      }}
    >
      {mode === "update" && (
        <p className="mb-3 text-sm text-muted-foreground">
          Existing product image removals are staged locally and only apply
          after you save this product.
        </p>
      )}
      <ImageUploader
        onImageSelect={mediaState.handleProductImageUpload}
        initialImages={mediaState.existingProductImages}
        {...(mode === "update"
          ? {
              onRemoveExisting: async (url: string) =>
                await mediaState.handleRemoveExistingProductImage!(url),
              onExistingListChange: (urls: string[]) =>
                mediaState.handleExistingProductImagesChange(urls),
            }
          : {})}
        invalid={Boolean(imagesError)}
        errorMessage={imagesError}
      />
      {mode === "update" && mediaState.hasPendingExistingImageRemovals && (
        <p className="mt-3 text-sm text-amber-700">
          Pending product image removals will apply when you save.
        </p>
      )}
    </ProductCard>
  );
}

interface SpecificationsSectionProps {
  controller: ProductAuthoringController;
  feedback: ProductAuthoringController["submissionState"]["feedback"];
  mode: ProductAuthoringMode;
}

function SpecificationsSection({
  controller,
  feedback,
  mode,
}: SpecificationsSectionProps) {
  const { specificationState } = controller;
  const hasErrors = specificationState.categorySpecifications.some(
    (specification) =>
      Boolean(
        getSubmissionFieldError(
          feedback,
          `specifications.${specification.key}`,
        ),
      ),
  );

  if (specificationState.categorySpecifications.length === 0) {
    return null;
  }

  return (
    <ProductCard
      title={mode === "create" ? "Specifications" : "Product Specifications"}
      className={hasErrors ? "border-destructive" : undefined}
    >
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        {specificationState.categorySpecifications.map((specification) => {
          const fieldError = getSubmissionFieldError(
            feedback,
            `specifications.${specification.key}`,
          );
          const inputId = `specification-value-${specification.key}`;

          return (
            <div className="flex-col space-y-3" key={specification.uuid}>
              <Label htmlFor={inputId}>
                {specification.key.replaceAll("-", " ")}
              </Label>
              {specification.type === "text" && (
                <>
                  <Input
                    name={`specifications[${specification.key}]`}
                    id={inputId}
                    type={specification.type}
                    required={true}
                    className={cn(
                      "focus-visible:ring-primary",
                      fieldError && "border-destructive",
                    )}
                    value={
                      specificationState.specificationValues[
                        specification.key
                      ] || ""
                    }
                    onChange={(event) =>
                      specificationState.handleSpecificationChange(
                        specification.key,
                        event.target.value,
                      )
                    }
                  />
                  {fieldError && (
                    <p className="text-sm text-destructive">{fieldError}</p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </ProductCard>
  );
}

interface OptionsSectionProps {
  controller: ProductAuthoringController;
  feedback: ProductAuthoringController["submissionState"]["feedback"];
  mode: ProductAuthoringMode;
  supportsCustomerOptions: boolean;
  variantsError: boolean;
}

function OptionsSection({
  controller,
  feedback,
  mode,
  supportsCustomerOptions,
  variantsError,
}: OptionsSectionProps) {
  const { optionModeState, selectorState, variantState } = controller;

  return (
    <ProductCard
      title="Customer Options"
      className={variantsError ? "border-destructive" : undefined}
    >
      <div className="space-y-4">
        {supportsCustomerOptions && (
          <>
            <p className="text-sm text-muted-foreground">
              Does this product have customer-selectable options?
            </p>
            <div className="flex gap-3">
              <ThemedButton
                type="button"
                variant={
                  optionModeState.hasCustomerSelectableOptions
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  optionModeState.setHasCustomerSelectableOptions(true)
                }
              >
                Yes
              </ThemedButton>
              <ThemedButton
                type="button"
                variant={
                  optionModeState.hasCustomerSelectableOptions
                    ? "outline"
                    : "default"
                }
                onClick={() =>
                  optionModeState.setHasCustomerSelectableOptions(false)
                }
              >
                No
              </ThemedButton>
            </div>
          </>
        )}
        {mode === "update" && optionModeState.modeLockedMessage && (
          <p className="text-sm text-muted-foreground">
            {optionModeState.modeLockedMessage}
          </p>
        )}
        {supportsCustomerOptions &&
        optionModeState.hasCustomerSelectableOptions ? (
          selectorState.attributes?.length > 0 ? (
            <>
              {mode === "update" && (
                <p className="mb-3 text-sm text-muted-foreground">
                  Existing variant image removals are staged locally and only
                  apply after you save this product.
                </p>
              )}
              <ProductVariant
                feedback={feedback}
                variantState={variantState}
                selectorState={selectorState}
              />
              {mode === "update" &&
                variantState.hasPendingExistingImageRemovals && (
                  <p className="mt-4 text-sm text-amber-700">
                    Pending variant image removals will apply when you save.
                  </p>
                )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              This category has no customer-selectable attributes, so use the
              internal SKU mode instead.
            </p>
          )
        ) : (
          <OptionlessSkuEditor
            variant={optionModeState.optionlessVariant}
            feedback={feedback}
            onChange={optionModeState.handleOptionlessVariantChange}
            onUpload={optionModeState.handleOptionlessVariantImageUpload}
            onImageRemove={optionModeState.handleOptionlessVariantImageRemove}
          />
        )}
      </div>
    </ProductCard>
  );
}

interface SubmitSectionProps {
  submissionState: ProductAuthoringController["submissionState"];
}

function SubmitSection({ submissionState }: SubmitSectionProps) {
  return (
    <div className="pb-10">
      {submissionState.feedback && (
        <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submissionState.feedback.summary}
        </div>
      )}
      <ThemedButton
        onClick={submissionState.handleSubmit}
        disabled={submissionState.isSubmitting}
        className="w-full"
      >
        {submissionState.isSubmitting ? "Submitting..." : "Submit"}
      </ThemedButton>
    </div>
  );
}
