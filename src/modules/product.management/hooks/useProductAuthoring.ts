import { getValidationFeedback } from "@/modules/core/lib/utils.validationFeedback";
import {
  ProductAuthoringController,
  TAttribute,
  TCategory,
  TCategoryAuthoringProfile,
  TEditProductPayload,
  TImage,
  TProductAuthoringSchema,
  TProductForm,
  TSpecification,
  TVariant,
  TVariantDataMap,
} from "@/modules/product.management";
import {
  actionStoreProducts,
  actionUpdateProducts,
} from "@/modules/product.management/actions/product";
import {
  MAX_PRODUCT_IMAGES_COUNT,
  MAX_VARIANT_IMAGE_COUNT,
} from "@/modules/product.management/config/constants/IMAGE_CONSTANTS";
import { PRODUCT_CRUD_CONSTANTS } from "@/modules/product.management/config/constants/PRODUCT_CRUD_CONSTANTS";
import {
  CreateProductSchema,
  UpdateProductSchema,
} from "@/modules/product.management/config/schemas/product";
import useCategory from "@/modules/product.management/hooks/useCategory";
import useProduct from "@/modules/product.management/hooks/useProduct";
import useVariant from "@/modules/product.management/hooks/useVariant";
import { fillSelectedProductVariantData } from "@/modules/product.management/utils/editProductUtils";
import { resolveStorageImageUrl } from "@/modules/product.management/utils/imageUrl";
import {
  loadProductCategoryContext,
  prepareProductSubmission,
} from "@/modules/product.management/utils/productAuthoring";
import { isAuthoringFieldRenderable } from "@/modules/product.management/utils/productAuthoringRenderer";
import { OPTIONLESS_VARIANT_KEY } from "@/modules/product.management/utils/productForm";
import { lexicalJsonToHtml } from "@/modules/product.management/utils/richTextEditorUtils";
import {
  createVariantDraftKey,
  resolveVariantOptionValuesFromAttributes,
} from "@/modules/product.management/utils/variantDraft";
import { omit } from "lodash-es";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

type ProductAuthoringMode = "create" | "update";

interface UseProductAuthoringOptions {
  mode: ProductAuthoringMode;
  editProductPayload?: TEditProductPayload;
}

export default function useProductAuthoring({
  mode,
  editProductPayload,
}: UseProductAuthoringOptions): ProductAuthoringController {
  const router = useRouter();
  const [authoringProfile, setAuthoringProfile] =
    useState<TCategoryAuthoringProfile | null>(null);
  const [authoringSchema, setAuthoringSchema] =
    useState<TProductAuthoringSchema | null>(null);
  const [categoryAttributes, setCategoryAttributes] = useState<TAttribute[]>(
    [],
  );
  const [variantSelections, setVariantSelections] = useState<
    Record<string, string[]>
  >({});
  const [specificationValues, setSpecificationValues] = useState<
    Record<string, string>
  >({});
  const [variantImageIdMap, setVariantImageIdMap] = useState<
    Record<string, Record<string, string>>
  >({});
  const [legacyAttributeCount, setLegacyAttributeCount] = useState<number>(0);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    summary: string;
    fieldErrors: Record<string, string[]>;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removedProductImageUuids, setRemovedProductImageUuids] = useState<
    string[]
  >([]);
  const [removedVariantImageUuids, setRemovedVariantImageUuids] = useState<
    Record<string, string[]>
  >({});
  const [hasCustomerSelectableOptions, setHasCustomerSelectableOptions] =
    useState(mode === "create");
  const [optionlessVariant, setOptionlessVariant] = useState<TVariant>({
    name: "",
    sku: "",
    stock: "",
    price: "",
    available: true,
    images: [],
    isValid: false,
  });
  const hydratedEditProductUuidRef = useRef<string | null>(null);

  const clearSubmissionFieldError = (field: string) => {
    setSubmissionFeedback((previous) => {
      if (!previous?.fieldErrors[field]) {
        return previous;
      }

      const nextFieldErrors = { ...previous.fieldErrors };
      delete nextFieldErrors[field];

      if (Object.keys(nextFieldErrors).length === 0) {
        return null;
      }

      return {
        ...previous,
        fieldErrors: nextFieldErrors,
      };
    });
  };

  const product = useProduct();
  const category = useCategory();
  const variant = useVariant({
    variantSelections,
    setVariantSelections,
    attributeCap: mode === "update" ? Math.max(3, legacyAttributeCount) : 3,
    onExistingVariantImageRemove: async (combo, url) => {
      const key = createVariantDraftKey(combo);
      const uuid = variantImageIdMap[key]?.[url];
      if (!uuid) {
        return false;
      }

      setRemovedVariantImageUuids((previous) => ({
        ...previous,
        [key]: Array.from(new Set([...(previous[key] || []), uuid])),
      }));
      return true;
    },
  });

  const resetDraftForCategoryChange = () => {
    setSpecificationValues({});
    setSubmissionFeedback(null);
    setVariantImageIdMap({});
    setRemovedVariantImageUuids({});
    variant.setVariantData({});
    variant.setColumns([]);
    variant.resetRemovedVariantUuids();
  };

  const categoryChangeNeedsResetConfirmation = () =>
    Object.values(specificationValues).some((value) => value.trim() !== "") ||
    Object.keys(variant.variantData).length > 0 ||
    Object.values(variantSelections).some((values) => values.length > 0) ||
    variant.columns.length > 0;

  const onProductFormInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setSubmissionFeedback(null);
    product.handleProductForm(
      event.target.name as keyof TProductForm,
      event.target.value,
    );

    if (!hasCustomerSelectableOptions && event.target.name === "base_price") {
      setOptionlessVariant((previous) => ({
        ...previous,
        price: event.target.value,
      }));
    }
  };

  const persistedEditHasCustomerSelectableOptions =
    mode === "update" && editProductPayload
      ? productUsesCustomerSelectableOptions(editProductPayload.product)
      : null;

  const handleOptionModeChange = (value: boolean) => {
    if (
      mode === "update" &&
      persistedEditHasCustomerSelectableOptions !== null &&
      value !== persistedEditHasCustomerSelectableOptions
    ) {
      toast.error(
        "Switching between no-options and customer-selectable option modes is not supported while editing this product yet.",
      );
      return;
    }

    setSubmissionFeedback(null);
    setHasCustomerSelectableOptions(value);

    if (!value) {
      setOptionlessVariant((previous) => ({
        ...previous,
        name: product.productForm.name || previous.name,
        price: String(product.productForm.base_price || previous.price || ""),
      }));
    }
  };

  const handleOptionlessVariantChange = <K extends keyof TVariant>(
    field: K,
    value: TVariant[K],
  ) => {
    setSubmissionFeedback(null);
    setOptionlessVariant((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (field === "price" && typeof value === "string") {
      product.handleProductForm("base_price", value);
    }
  };

  const handleOptionlessVariantImageUpload = (files: FileList) => {
    const existingImages = optionlessVariant.images || [];
    const remaining = Math.max(
      0,
      MAX_VARIANT_IMAGE_COUNT - existingImages.length,
    );
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_VARIANT_IMAGE_COUNT} images allowed per SKU.`);
      return;
    }

    const nextFiles = Array.from(files)
      .filter((file) => file instanceof File)
      .slice(0, remaining);

    setOptionlessVariant((previous) => ({
      ...previous,
      images: [...(previous.images || []), ...nextFiles],
    }));
  };

  const handleOptionlessVariantImageRemove = async (
    image: File | string | TImage,
  ): Promise<void> => {
    setOptionlessVariant((previous) => ({
      ...previous,
      images: previous.images?.filter((candidate) => candidate !== image) || [],
    }));
  };

  const handleSpecificationChange = (key: string, value: string) => {
    setSubmissionFeedback(null);
    setSpecificationValues((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleProductImageUpload = (files: File[]) => {
    if (files.length > 0 || product.existingProductImages.length > 0) {
      clearSubmissionFieldError("images");
    }
    product.handleProductImageUpload(files);
  };

  const handleExistingProductImagesChange = (images: string[]) => {
    if (images.length > 0 || product.uploadedProductImages.length > 0) {
      clearSubmissionFieldError("images");
    }
    product.handleExistingProductImagesChange(images);
  };

  const handleCommitSelectedCategory = async () => {
    const selectedCategory = category.selectedCategories.at(-1);

    if (!selectedCategory) {
      return;
    }

    if (!selectedCategory.is_sellable) {
      toast.error("Choose a category that already defines product fields.");
      return;
    }

    const isChangingCommittedCategory =
      category.committedCategory?.uuid !== selectedCategory.uuid;

    if (
      mode === "update" &&
      isChangingCommittedCategory &&
      category.committedCategory
    ) {
      toast.error(
        "Changing category is not supported while editing an existing product.",
      );
      return;
    }

    if (
      isChangingCommittedCategory &&
      category.committedCategory &&
      categoryChangeNeedsResetConfirmation() &&
      !window.confirm(
        "Changing category will reset specifications and variant configuration. Continue?",
      )
    ) {
      return;
    }

    const categoryContext = await loadProductCategoryContext(
      selectedCategory.slug,
    );
    if ("error" in categoryContext) {
      toast.error(categoryContext.error);
      return;
    }

    if (isChangingCommittedCategory) {
      resetDraftForCategoryChange();
      setVariantSelections({});
    }

    category.setCommittedCategories([...category.selectedCategories]);
    category.setCommittedCategory(selectedCategory);
    category.setCategorySpecifications(categoryContext.specifications ?? []);
    setCategoryAttributes(categoryContext.attributes ?? []);
    setAuthoringProfile(categoryContext.authoringProfile);
    setAuthoringSchema(categoryContext.authoringSchema);
    product.handleProductForm("type", categoryContext.authoringProfile.type);
    category.setShowDropdown(false);
    clearSubmissionFieldError("category");
  };

  const handleRemoveExistingProductImage = async (
    url: string,
  ): Promise<boolean> => {
    try {
      const uuid = product.existingImageIdMap[url];
      if (!uuid) {
        toast.error("Could not determine image id.");
        return false;
      }

      const remainingImages = (product.existingProductImages || []).filter(
        (imageUrl) => imageUrl !== url,
      );
      handleExistingProductImagesChange(remainingImages);
      const { [url]: removedImageUuid, ...restImageIdMap } =
        product.existingImageIdMap;
      void removedImageUuid;
      product.setExistingImageIdMap(restImageIdMap);
      setRemovedProductImageUuids((previous) =>
        Array.from(new Set([...previous, uuid])),
      );
      return true;
    } catch (error) {
      console.log(error);
      toast.error("Failed to stage image removal. Please try again.");
      return false;
    }
  };

  useEffect(() => {
    if (mode !== "update" || !editProductPayload) {
      return;
    }

    if (
      hydratedEditProductUuidRef.current === editProductPayload.product.uuid
    ) {
      return;
    }

    hydratedEditProductUuidRef.current = editProductPayload.product.uuid;

    hydrateEditProduct({
      editProductPayload,
      setProductForm: product.setProductForm,
      setExistingProductImages: product.setExistingProductImages,
      setExistingImageIdMap: product.setExistingImageIdMap,
      setSelectedCategories: category.setSelectedCategories,
      setCommittedCategories: category.setCommittedCategories,
      setCommittedCategory: category.setCommittedCategory,
      setSubCategories: category.setSubCategories,
      setSubChildCategories: category.setSubChildCategories,
      setCategorySpecifications: category.setCategorySpecifications,
      setCategoryAttributes,
      setAuthoringProfile,
      setAuthoringSchema,
      setSelectedSpecifications: setSpecificationValues,
      setVariantData: variant.setVariantData,
      setVariantSelections,
      setColumns: variant.setColumns,
      setVariantImageIdMap,
      setLegacyAttributeCount,
      setHasCustomerSelectableOptions,
      setOptionlessVariant,
    });
  }, [
    category.setCategorySpecifications,
    category.setCommittedCategories,
    category.setCommittedCategory,
    category.setSelectedCategories,
    category.setSubCategories,
    category.setSubChildCategories,
    editProductPayload,
    mode,
    product.setExistingImageIdMap,
    product.setExistingProductImages,
    product.setProductForm,
    setCategoryAttributes,
    setAuthoringProfile,
    setAuthoringSchema,
    setSpecificationValues,
    setVariantImageIdMap,
    setVariantSelections,
    variant.setColumns,
    variant.setVariantData,
  ]);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const imagesEnabled =
      authoringSchema === null ||
      isAuthoringFieldRenderable(authoringSchema, "images");

    if (
      mode === "create" &&
      imagesEnabled &&
      product.uploadedProductImages.length === 0
    ) {
      const feedback: {
        summary: string;
        fieldErrors: Record<string, string[]>;
      } = {
        summary: "Please fix the highlighted fields.",
        fieldErrors: {
          images: ["Please select product image."],
        },
      };
      setSubmissionFeedback(feedback);
      toast.error(feedback.summary);
      return;
    }

    if (
      mode === "update" &&
      (!product.productForm.uuid ||
        (imagesEnabled &&
          !product.existingProductImages.length &&
          !product.uploadedProductImages.length))
    ) {
      const feedback: {
        summary: string;
        fieldErrors: Record<string, string[]>;
      } = product.productForm.uuid
        ? {
            summary: "Please fix the highlighted fields.",
            fieldErrors: {
              images: ["Please select product image."],
            },
          }
        : {
            summary: "Cannot proceed request.",
            fieldErrors: {},
          };
      setSubmissionFeedback(feedback);
      toast.error(feedback.summary);
      return;
    }

    const submission = hasCustomerSelectableOptions
      ? mode === "create"
        ? prepareProductSubmission({
            schema: CreateProductSchema,
            product: omit(product.productForm, "uuid"),
            productSku: product.productForm.sku,
            committedCategoryUuid: category.committedCategory?.uuid,
            hasCustomerSelectableOptions,
            combinations: variant.combinations,
            columns: variant.columns,
            variantData: variant.variantData,
            uploadedProductImages: product.uploadedProductImages,
            specifications: specificationValues,
            categoryAttributes,
          })
        : prepareProductSubmission({
            schema: UpdateProductSchema,
            product: {
              type: product.productForm.type,
              uuid: product.productForm.uuid,
              sku: product.productForm.sku,
              name: product.productForm.name,
              base_price: String(product.productForm.base_price),
              description: product.productForm.description,
              highlights: product.productForm.highlights,
              box_items: product.productForm.box_items,
              minimum_order_quantity:
                product.productForm.minimum_order_quantity,
            },
            productSku: product.productForm.sku,
            committedCategoryUuid: category.committedCategory?.uuid,
            hasCustomerSelectableOptions,
            combinations: variant.combinations,
            columns: variant.columns,
            variantData: variant.variantData,
            uploadedProductImages: product.uploadedProductImages,
            specifications: specificationValues,
            categoryAttributes,
          })
      : mode === "create"
        ? prepareProductSubmission({
            schema: CreateProductSchema,
            product: omit(product.productForm, "uuid"),
            productSku: product.productForm.sku,
            committedCategoryUuid: category.committedCategory?.uuid,
            hasCustomerSelectableOptions,
            combinations: [],
            columns: [],
            variantData: {
              [OPTIONLESS_VARIANT_KEY]: optionlessVariant,
            },
            uploadedProductImages: product.uploadedProductImages,
            specifications: specificationValues,
            categoryAttributes,
          })
        : prepareProductSubmission({
            schema: UpdateProductSchema,
            product: {
              type: product.productForm.type,
              uuid: product.productForm.uuid,
              sku: product.productForm.sku,
              name: product.productForm.name,
              base_price: String(product.productForm.base_price),
              description: product.productForm.description,
              highlights: product.productForm.highlights,
              box_items: product.productForm.box_items,
              minimum_order_quantity:
                product.productForm.minimum_order_quantity,
            },
            productSku: product.productForm.sku,
            committedCategoryUuid: category.committedCategory?.uuid,
            hasCustomerSelectableOptions,
            combinations: [],
            columns: [],
            variantData: {
              [OPTIONLESS_VARIANT_KEY]: optionlessVariant,
            },
            uploadedProductImages: product.uploadedProductImages,
            specifications: specificationValues,
            categoryAttributes,
          });

    variant.setVariantData(submission.updatedVariantData);
    if (!submission.ok) {
      setSubmissionFeedback(submission.feedback);
      toast.error(submission.feedback.summary);
      return;
    }

    setSubmissionFeedback(null);
    toast.info(
      mode === "create" ? "Uploading product..." : "Updating product...",
    );
    setIsSubmitting(true);

    try {
      if (mode === "update") {
        removedProductImageUuids.forEach((uuid, index) => {
          submission.formData.append(
            `removed_product_image_uuids[${index}]`,
            uuid,
          );
        });

        variant.removedVariantUuids.forEach((uuid, index) => {
          submission.formData.append(`removed_variant_uuids[${index}]`, uuid);
        });

        variant.combinations.forEach((combo, index) => {
          const key = createVariantDraftKey(combo);
          (removedVariantImageUuids[key] || []).forEach((uuid, removeIndex) => {
            submission.formData.append(
              `variants[${index}][removed_image_uuids][${removeIndex}]`,
              uuid,
            );
          });
        });
      }

      const response =
        mode === "create"
          ? await actionStoreProducts(submission.formData)
          : await actionUpdateProducts(
              submission.formData,
              product.productForm.uuid as string,
            );

      if ("error" in response) {
        const feedback = getValidationFeedback(
          "details" in response ? response.details : response.error,
        );
        if (feedback) {
          setSubmissionFeedback(feedback);
        }
        toast.error(feedback?.summary ?? response.error);
        return;
      }

      toast.success(
        mode === "create"
          ? PRODUCT_CRUD_CONSTANTS.createProductSuccess
          : PRODUCT_CRUD_CONSTANTS.updateProductSuccess,
      );
      router.replace("/products");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    authoringProfile,
    authoringSchema,
    basicState: {
      productForm: product.productForm,
      onProductFormInputChange,
    },
    categoryState: {
      showDropdown: category.showDropdown,
      selectedCategories: category.selectedCategories,
      committedCategories: category.committedCategories,
      committedCategory: category.committedCategory,
      subCategories: category.subCategories,
      subChildCategories: category.subChildCategories,
      filters: category.filters,
      handleShowDropdownChange: category.handleShowDropdownChange,
      handleClickRoot: category.handleClickRoot,
      handleClickSub: category.handleClickSub,
      handleClickSubChild: category.handleClickSubChild,
      handleCommitSelectedCategory,
      updateFilter: category.updateFilter,
      categoryChangeLocked: mode === "update",
    },
    mediaState: {
      existingProductImages: product.existingProductImages,
      hasPendingExistingImageRemovals: removedProductImageUuids.length > 0,
      handleProductImageUpload,
      handleExistingProductImagesChange,
      handleRemoveExistingProductImage:
        mode === "update" ? handleRemoveExistingProductImage : undefined,
    },
    specificationState: {
      categorySpecifications: category.categorySpecifications,
      specificationValues,
      handleSpecificationChange,
    },
    selectorState: {
      attributes: categoryAttributes,
      toggleValue: variant.toggleValue,
      removeValue: variant.removeValue,
      variantSelections,
      attributeCap: variant.attributeCap,
      variantCountByValue: variant.variantCountByValue,
    },
    variantState: {
      setVariantSelections,
      combinations: variant.combinations,
      rows: variant.rows,
      variantData: variant.variantData,
      hasPendingExistingImageRemovals: Object.values(
        removedVariantImageUuids,
      ).some((uuids) => uuids.length > 0),
      handleVariantChange: variant.handleVariantChange,
      handleImageUpload: variant.handleImageUpload,
      handleImageRemove: variant.handleImageRemove,
      columns: variant.columns,
      handleReorderColumns: variant.handleReorderColumns,
      addVariant: variant.addVariant,
      generateMissingCombinations: variant.generateMissingCombinations,
      deleteRow: variant.deleteRow,
      bulkApply: variant.bulkApply,
      removedVariantUuids: variant.removedVariantUuids,
    },
    optionModeState: {
      hasCustomerSelectableOptions,
      canSwitchMode:
        persistedEditHasCustomerSelectableOptions === null ||
        persistedEditHasCustomerSelectableOptions ===
          hasCustomerSelectableOptions,
      modeLockedMessage:
        mode === "update"
          ? "Switching between no-options and customer-selectable option modes is not supported while editing this product yet."
          : undefined,
      optionlessVariant,
      setHasCustomerSelectableOptions: handleOptionModeChange,
      handleOptionlessVariantChange,
      handleOptionlessVariantImageUpload,
      handleOptionlessVariantImageRemove,
    },
    submissionState: {
      feedback: submissionFeedback,
      isSubmitting,
      handleSubmit,
    },
  };
}

interface HydrateEditProductArgs {
  editProductPayload: TEditProductPayload;
  setProductForm: (productForm: TProductForm) => void;
  setExistingProductImages: Dispatch<SetStateAction<string[]>>;
  setExistingImageIdMap: (imageIdMap: Record<string, string>) => void;
  setSelectedCategories: Dispatch<SetStateAction<TCategory[]>>;
  setCommittedCategories: Dispatch<SetStateAction<TCategory[]>>;
  setCommittedCategory: Dispatch<SetStateAction<TCategory | null>>;
  setSubCategories: Dispatch<SetStateAction<TCategory[]>>;
  setSubChildCategories: Dispatch<SetStateAction<TCategory[]>>;
  setCategorySpecifications: Dispatch<SetStateAction<TSpecification[]>>;
  setCategoryAttributes: Dispatch<SetStateAction<TAttribute[]>>;
  setAuthoringProfile: Dispatch<
    SetStateAction<TCategoryAuthoringProfile | null>
  >;
  setAuthoringSchema: Dispatch<SetStateAction<TProductAuthoringSchema | null>>;
  setSelectedSpecifications: (specifications: Record<string, string>) => void;
  setVariantData: Dispatch<SetStateAction<TVariantDataMap>>;
  setVariantSelections: Dispatch<SetStateAction<Record<string, string[]>>>;
  setColumns: Dispatch<SetStateAction<string[]>>;
  setVariantImageIdMap: (value: Record<string, Record<string, string>>) => void;
  setLegacyAttributeCount: Dispatch<SetStateAction<number>>;
  setHasCustomerSelectableOptions: Dispatch<SetStateAction<boolean>>;
  setOptionlessVariant: Dispatch<SetStateAction<TVariant>>;
}

function hydrateEditProduct({
  editProductPayload,
  setProductForm,
  setExistingProductImages,
  setExistingImageIdMap,
  setSelectedCategories,
  setCommittedCategories,
  setCommittedCategory,
  setSubCategories,
  setSubChildCategories,
  setCategorySpecifications,
  setCategoryAttributes,
  setAuthoringProfile,
  setAuthoringSchema,
  setSelectedSpecifications,
  setVariantData,
  setVariantSelections,
  setColumns,
  setVariantImageIdMap,
  setLegacyAttributeCount,
  setHasCustomerSelectableOptions,
  setOptionlessVariant,
}: HydrateEditProductArgs) {
  const { product } = editProductPayload;
  const imageUrls: string[] = [];
  const imageIdMap: Record<string, string> = {};
  const imageBaseUrl = (product.image_base_url || "").replace(/\/+$/, "");
  const toFullImageUrl = (file: string) =>
    /^(https?:)?\/\//.test(file)
      ? file
      : `${imageBaseUrl}/${String(file).replace(/^\/+/, "")}`;

  if (Array.isArray(product.images)) {
    for (const image of product.images as { uuid: string; file: string }[]) {
      const imageUrl = toFullImageUrl(image.file);
      imageUrls.push(imageUrl);
      imageIdMap[imageUrl] = image.uuid;
    }
  }

  const existingProductImages = imageUrls.slice(0, MAX_PRODUCT_IMAGES_COUNT);
  const existingImageIdMap: Record<string, string> = {};
  existingProductImages.forEach((imageUrl) => {
    if (imageIdMap[imageUrl]) {
      existingImageIdMap[imageUrl] = imageIdMap[imageUrl];
    }
  });

  setExistingProductImages(existingProductImages);
  setExistingImageIdMap(existingImageIdMap);
  setProductForm({
    type: product.type,
    sku: product.sku,
    name: product.name,
    uuid: product.uuid,
    description: lexicalJsonToHtml(product.description || undefined),
    box_items: product.box_items || "",
    highlights: lexicalJsonToHtml(product.highlights || undefined),
    base_price:
      product.base_price === undefined || product.base_price === null
        ? ""
        : String(product.base_price),
    minimum_order_quantity:
      product.wholesale_product_detail?.minimum_order_quantity === undefined ||
      product.wholesale_product_detail?.minimum_order_quantity === null
        ? ""
        : String(product.wholesale_product_detail.minimum_order_quantity),
  });
  setSelectedSpecifications(product.specifications ?? {});

  const categoryContext = editProductPayload.categoryContext;

  if (!categoryContext) {
    setAuthoringProfile(null);
    setAuthoringSchema(null);
    return;
  }

  const categorySpecifications = categoryContext.specifications ?? [];
  const categoryAttributes = categoryContext.attributes ?? [];
  const normalizedCategoryPath = normalizeCategoryPath([
    categoryContext.categoryAncestors.root,
    categoryContext.categoryAncestors.sub,
    categoryContext.categoryAncestors.subChild,
  ]);

  setSelectedCategories(normalizedCategoryPath);
  setCommittedCategories(normalizedCategoryPath);
  setCommittedCategory(normalizedCategoryPath.at(-1) ?? null);
  setSubCategories(categoryContext.subCategories);
  setSubChildCategories(categoryContext.subChildCategories);
  setCategorySpecifications(categorySpecifications);
  setCategoryAttributes(categoryAttributes);
  setAuthoringProfile(categoryContext.authoringProfile);
  setAuthoringSchema(categoryContext.authoringSchema);

  const optionlessVariant = getOptionlessVariant(product.variants);
  if (optionlessVariant) {
    setHasCustomerSelectableOptions(false);
    setVariantSelections({});
    setColumns([]);
    setVariantData({});
    setLegacyAttributeCount(0);
    setOptionlessVariant(normalizeOptionlessVariant(optionlessVariant));
    return;
  }

  if (!categoryAttributes.length) {
    return;
  }

  setHasCustomerSelectableOptions(true);

  fillSelectedProductVariantData({
    setVariantData: setVariantData as never,
    setVariantSelections,
    setColumns,
    selectedProductVariants: product.variants,
    categoryAttributes,
  });

  const distinctAttributeUuids = new Set<string>();
  product.variants.forEach((existingVariant) => {
    existingVariant.attributes?.forEach((attr) => {
      if (attr.attribute?.uuid) {
        distinctAttributeUuids.add(attr.attribute.uuid);
      }
    });
  });
  setLegacyAttributeCount(distinctAttributeUuids.size);

  const nextVariantImageIdMap: Record<string, Record<string, string>> = {};
  product.variants.forEach((existingVariant) => {
    const key = createVariantDraftKey(
      resolveVariantOptionValuesFromAttributes(
        categoryAttributes,
        existingVariant,
      ),
    );
    const variantBaseUrl = (existingVariant.image_base_url || "").replace(
      /\/+$/,
      "",
    );
    const toFullVariantImageUrl = (file: string) =>
      /^(https?:)?\/\//.test(file)
        ? file
        : `${variantBaseUrl}/${String(file).replace(/^\/+/, "")}`;
    const images = existingVariant.images || [];
    let count = 0;

    for (const image of images as unknown[]) {
      if (
        typeof image === "object" &&
        image !== null &&
        "file" in (image as Record<string, unknown>) &&
        typeof (image as { file?: unknown }).file === "string" &&
        "uuid" in (image as Record<string, unknown>) &&
        typeof (image as { uuid?: unknown }).uuid === "string"
      ) {
        if (count >= MAX_VARIANT_IMAGE_COUNT) {
          break;
        }
        const file = (image as { file: string }).file;
        const imageUrl = toFullVariantImageUrl(file);
        const uuid = (image as { uuid: string }).uuid;
        if (!nextVariantImageIdMap[key]) {
          nextVariantImageIdMap[key] = {};
        }
        nextVariantImageIdMap[key][imageUrl] = uuid;
        count += 1;
      }
    }
  });

  setVariantImageIdMap(nextVariantImageIdMap);
}

function productUsesCustomerSelectableOptions(
  product: TEditProductPayload["product"],
) {
  return !getOptionlessVariant(product.variants);
}

function getOptionlessVariant(variants: TVariant[] = []) {
  if (variants.length !== 1) {
    return null;
  }

  const [variant] = variants;

  return (variant.attributes?.length || 0) === 0 ? variant : null;
}

function normalizeOptionlessVariant(variant: TVariant): TVariant {
  const normalizedImages = (variant.images || [])
    .map((image) => {
      if (image instanceof File) {
        return image;
      }

      if (
        image &&
        typeof image === "object" &&
        "file" in (image as Record<string, unknown>) &&
        typeof (image as { file?: unknown }).file === "string"
      ) {
        return resolveStorageImageUrl(
          image as { file: string; uuid: string },
          variant.image_base_url,
        );
      }

      if (typeof image === "string") {
        return resolveStorageImageUrl(image, variant.image_base_url);
      }

      return String(image);
    })
    .slice(0, MAX_VARIANT_IMAGE_COUNT);

  return {
    ...variant,
    sku: variant.sku || "",
    stock:
      variant.stock === undefined || variant.stock === null
        ? ""
        : String(variant.stock),
    price:
      variant.price === undefined || variant.price === null
        ? ""
        : String(variant.price),
    images: normalizedImages as TVariant["images"],
  };
}

function normalizeCategoryPath(categories: TCategory[]): TCategory[] {
  return categories.filter(
    (category): category is TCategory =>
      Boolean(category?.uuid) &&
      category.uuid !== "unknown" &&
      Boolean(category?.name) &&
      category.name !== "unknown",
  );
}
