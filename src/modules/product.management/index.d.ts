import type { TUser } from "@/modules/auth/domain/schemas/UserSchema";
import type { TServerDataTableMeta } from "@/modules/core/domain/schemas/ServerDataTableMeta";
import type { TProductAuthoringSchema } from "@/modules/product.management/schemas/ProductAuthoringSchema";
import type { SerializedEditorState } from "lexical";
import { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react";
export type { TProductAuthoringSchema } from "@/modules/product.management/schemas/ProductAuthoringSchema";
export type {
  TProductDraft,
  TProductDraftMedia,
  TProductDraftStep,
} from "@/modules/product.management/schemas/ProductDraftSchema";

export type TSpecification = {
  uuid: string;
  key: string;
  type: string;
};
export type TCategory = {
  uuid: string;
  id: string;
  name: string;
  position?: string;
  slug: string;
  image_base_path?: string;
  image_base_url?: string;
  icon_base_path?: string;
  icon_base_url?: string;
  images?: TImage[] | null;
  is_sellable?: boolean;
  attribute_count?: number;
  specification_count?: number;
  specifications?: string[];
  specifications_with_model?: TSpecification[];
  attributes?: string[];
  attributes_with_model?: TAttribute[];
  authoring_profile?: TCategoryAuthoringProfile;
  parent?: TCategory;
  children?: TCategory[];
};
export type TProductAuthoringCapability =
  | "product_sku"
  | "variants"
  | "customer_options"
  | "inventory"
  | "base_price"
  | "specifications"
  | "images"
  | "import"
  | "minimum_order_quantity";
export type TCategoryAuthoringProfile = {
  type: "retail" | "wholesale";
  status: "active";
  capabilities: Record<TProductAuthoringCapability, boolean>;
  unavailable_reasons: Partial<Record<TProductAuthoringCapability, string>>;
};
export type TProduct = {
  type: "retail" | "wholesale";
  uuid: string;
  created_by_user_uuid?: string | null;
  updated_by_user_uuid?: string | null;
  sku: string;
  image_base_path?: string;
  image_base_url?: string;
  id: string;
  name: string;
  slug: string;
  base_price: string;
  description?: string;
  highlights?: string;
  box_items?: string;
  category?: TCategory;
  categories?: TCategory[];
  createdBy?: Pick<TUser, "uuid" | "name"> | null;
  updatedBy?: Pick<TUser, "uuid" | "name"> | null;
  images: TImage[];
  specifications: Record<string, string>;
  variants: TVariant[];
  wholesale_product_detail?: {
    minimum_order_quantity: number;
  } | null;
  status_text?: string;
  status?: number;
  created_at?: string | null;
  updated_at?: string | null;
};
export type TImage = {
  uuid: string;
  file: string;
};

export interface TProductForm {
  type: string;
  sku: string;
  uuid?: string;
  name: string;
  base_price: string;
  minimum_order_quantity: string;
  description: string;
  highlights: string;
  box_items: string;
  category?: string;
}
export interface TProductImagesForm {
  uploadedImages: File[];
  existingImages: ExistingImage[];
}

export type TAttributeValue = {
  uuid: string;
  attribute_uuid: string;
  label: string;
  code: string;
};
export type TAttribute = {
  uuid: string;
  name: string;
  attribute_value: TAttributeValue[];
};

export interface TVariant {
  uuid?: string;
  name: string;
  sku?: string;
  image_base_path?: string;
  image_base_url?: string;
  stock?: string;
  price?: string;
  images?: (string | File | TImage)[];
  isValid?: boolean;
  available?: boolean;
  attributes?: { attribute: TAttribute; attribute_value: TAttributeValue }[];
}
export type TVariantDataMap = Record<string, TVariant>;
export type TVariantPayload = {
  uuid?: string;
  name: string;
  sku?: string;
  stock?: string;
  price?: string;
  images?: (string | File | TImage)[];
  available?: boolean;
  [key: string]: string | boolean | (string | File | TImage)[] | undefined;
};
export type TCategoryIndexPayload = {
  categories: IPaginatedData<TCategory[]>;
  totalCount: number;
  table: TServerDataTableMeta;
};
export type TProductIndexPayload = {
  products: IPaginatedData<TProduct[]>;
  table: TServerDataTableMeta;
};

export type TProductImportGuideField = {
  key: string;
  label: string;
  required: boolean;
  description: string;
  example: string | null;
};

export type TProductImportTargetStore = {
  uuid: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  sellable_category_count: number;
  product_authoring_ready: boolean;
  owner: {
    uuid: string;
    name: string | null;
    email: string | null;
  } | null;
};

export type TProductImportEligibility = {
  actor_type: "vendor" | "admin";
  can_initiate: boolean;
  target_store_required: boolean;
  blocking_reasons: {
    code: string;
    message: string;
  }[];
  target_store: TProductImportTargetStore | null;
};

export type TProductImportGuidePayload = {
  guide: {
    template: {
      filename: string;
      headers: string[];
      sample_rows: Record<string, string>[];
      api_path: string;
      requires_target_store_uuid: boolean;
    };
    catalog: {
      api_path: string;
      requires_target_store_uuid: boolean;
    };
    constraints: {
      csv_max_size_mb: number;
      image_archive_max_size_mb: number;
      grouping_rule: string;
    };
    prerequisites: string[];
    workflow_steps: string[];
    image_rules: string[];
    fields: TProductImportGuideField[];
  };
  eligibility: TProductImportEligibility;
};

export type TProductImportRecord = {
  uuid: string;
  status: string | null;
  source_filename: string | null;
  image_archive_filename: string | null;
  target_store_uuid: string | null;
  target_store: Pick<TProductImportTargetStore, "uuid" | "name"> | null;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  processed_rows: number;
  succeeded_rows: number;
  failed_rows: number;
  progress_percentage: number;
  summary: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  started_at: string | null;
  finished_at: string | null;
};

export type TProductImportRow = {
  uuid: string;
  row_number: number;
  status: string | null;
  raw_payload: Record<string, unknown> | null;
  normalized_payload: Record<string, unknown> | null;
  errors: string[] | Record<string, string[]> | null;
  suggestions: string[] | null;
  product_uuid: string | null;
};

export type TProductImportUploadPayload = {
  import: TProductImportRecord;
};

export type TProductImportValidationPayload = {
  import: TProductImportRecord;
  rows: TProductImportRow[];
};

export type TProductImportProcessPayload = {
  import: TProductImportRecord;
  result: {
    processed_rows: number;
    succeeded_rows: number;
    failed_rows: number;
    status: string | null;
    sample_failures: {
      import_key: string;
      row_numbers: number[];
      message: string;
    }[];
    idempotent_replay: boolean;
    queued?: boolean;
    message?: string;
  };
};

export type TProductImportTargetStorePayload = {
  stores: TProductImportTargetStore[];
};

export type TProductStoreFilterOption = {
  value: string;
  label: string;
};

export type TProductStoreFilterOptionPayload = {
  options: TProductStoreFilterOption[];
};

export type TProductImportTableFilter = {
  type?: string;
  key: string;
  label: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
  [extra: string]: unknown;
};

export type TProductImportTableMeta = {
  search: { queryKey: string; placeholder: string };
  filters: TProductImportTableFilter[];
};

export type TProductImportListPayload = {
  imports: IPaginatedData<TProductImportRecord[]>;
  table: TProductImportTableMeta;
};

export type TProductImportActivePayload = {
  active_import: TProductImportRecord | null;
};

export type TSpecificationsIndexPayload = {
  specifications: IPaginatedData<TSpecification[]>;
};
export type TAttributesIndexPayload = {
  attributes: IPaginatedData<TAttribute[]>;
};
export type TShowProductPayload = {
  product: TProduct;
};
export type TCategoryAncestors = {
  root: Pick<TCategory, "id" | "name" | "uuid" | "slug">;
  sub: Pick<TCategory, "id" | "name" | "uuid" | "slug">;
  subChild: Pick<TCategory, "id" | "name" | "uuid" | "slug">;
};
export type TEditProductPayload = {
  product: TProduct;
  categoryAncestors: TCategoryAncestors;
  categoryContext: TCategoryAuthoringContextPayload | null;
};
export type TCategoryAuthoringContextPayload = {
  categoryAncestors: TCategoryAncestors;
  subCategories: TCategory[];
  subChildCategories: TCategory[];
  specifications: TSpecification[];
  attributes: TAttribute[];
  authoringProfile: TCategoryAuthoringProfile;
  authoringSchema: TProductAuthoringSchema;
};
export interface IPaginatedData<T> {
  current_page: number;
  data: T;
  from: number;
  next_page_url: string;
  path: string;
  per_page: number;
  prev_page_url: string;
  to: 15;
}

export type VariantToggleResult = { ok: true } | { ok: false; reason?: "cap" };

export interface VariantRow {
  rowId: string;
  combo: string[];
  comboKey: string;
  uuid?: string;
}

export interface VariantSelectorState {
  attributes: TAttribute[];
  variantSelections: Record<string, string[]>;
  toggleValue: (attribute: string, value: string) => VariantToggleResult;
  removeValue: (attribute: string, value: string) => VariantToggleResult;
  attributeCap: number;
  variantCountByValue: Record<string, Record<string, number>>;
}
export interface VariantState {
  setVariantSelections: Dispatch<SetStateAction<Record<string, string[]>>>;
  combinations: string[][];
  rows: VariantRow[];
  variantData: TVariantDataMap;
  hasPendingExistingImageRemovals?: boolean;
  handleVariantChange: <K extends keyof TVariant>(
    combo: string[],
    field: K,
    value: TVariant[K],
  ) => void;
  handleImageUpload: (combo: string[], files: FileList) => void;
  handleImageRemove: (combo: string[], image: File | string | TImage) => void;
  columns: string[];
  handleReorderColumns?: (newOrder: string[]) => void;
  addVariant: (combo: string[]) => void;
  generateMissingCombinations: () => void;
  deleteRow: (rowId: string) => void;
  bulkApply: (
    rowIds: string[],
    patch: Partial<Pick<TVariant, "price" | "stock" | "available">>,
  ) => void;
  removedVariantUuids: string[];
}

export interface ProductSubmissionFeedback {
  summary: string;
  fieldErrors: Record<string, string[]>;
}

export interface ProductAuthoringBasicState {
  productForm: TProductForm;
  onProductFormInputChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export interface ProductAuthoringCategoryState {
  showDropdown: boolean;
  selectedCategories: TCategory[];
  committedCategories: TCategory[];
  committedCategory: TCategory | null;
  subCategories: TCategory[];
  subChildCategories: TCategory[];
  filters: { root: string; sub: string; subchild: string };
  handleShowDropdownChange: () => void;
  handleClickRoot: (category: TCategory) => void;
  handleClickSub: (category: TCategory) => void;
  handleClickSubChild: (category: TCategory) => void;
  handleCommitSelectedCategory: () => Promise<void>;
  updateFilter: (level: "root" | "sub" | "subchild", value: string) => void;
  categoryChangeLocked?: boolean;
}

export interface ProductAuthoringMediaState {
  existingProductImages: string[];
  hasPendingExistingImageRemovals?: boolean;
  handleProductImageUpload: (files: File[]) => void;
  handleExistingProductImagesChange: (images: string[]) => void;
  handleRemoveExistingProductImage?: (url: string) => Promise<boolean>;
}

export interface ProductAuthoringSpecificationState {
  categorySpecifications: TSpecification[];
  specificationValues: Record<string, string>;
  handleSpecificationChange: (key: string, value: string) => void;
}

export interface ProductAuthoringSubmissionState {
  feedback: ProductSubmissionFeedback | null;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
}

export interface ProductOptionModeState {
  hasCustomerSelectableOptions: boolean;
  canSwitchMode: boolean;
  modeLockedMessage?: string;
  optionlessVariant: TVariant;
  setHasCustomerSelectableOptions: (value: boolean) => void;
  handleOptionlessVariantChange: <K extends keyof TVariant>(
    field: K,
    value: TVariant[K],
  ) => void;
  handleOptionlessVariantImageUpload: (files: FileList) => void;
  handleOptionlessVariantImageRemove: (
    image: File | string | TImage,
  ) => Promise<void>;
}

export interface ProductAuthoringController {
  authoringProfile: TCategoryAuthoringProfile | null;
  authoringSchema: TProductAuthoringSchema | null;
  basicState: ProductAuthoringBasicState;
  categoryState: ProductAuthoringCategoryState;
  mediaState: ProductAuthoringMediaState;
  specificationState: ProductAuthoringSpecificationState;
  selectorState: VariantSelectorState;
  variantState: VariantState;
  optionModeState: ProductOptionModeState;
  submissionState: ProductAuthoringSubmissionState;
}

export interface IProductCard {
  title: string;
  children?: ReactNode;
  tooltip?: TooltipConfig;
  className?: string;
}
export type TooltipTrigger = { type: "icon" } | { type: "text"; label: string };

export type TooltipConfig = {
  trigger: TooltipTrigger;
  texts: string[];
};
export type ProductEditorValue = string | SerializedEditorState | undefined;
export interface ProductRichTextEditorProps {
  name: string;
  toolbar: RTEToolbarVariant;
  value?: ProductEditorValue;
  handleOnChange?: (name: string, value: string) => void;
  className?: string;
  placeholder: string;
  enableImages?: boolean;
}
type RTEToolbarVariant = "full" | "minimal" | "none";
