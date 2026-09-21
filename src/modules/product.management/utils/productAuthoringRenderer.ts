import type {
  TProductAuthoringField,
  TProductAuthoringSchema,
} from "@/modules/product.management/schemas/ProductAuthoringSchema";
import { getAuthoringField } from "@/modules/product.management/schemas/ProductAuthoringSchema";

export const PRODUCT_AUTHORING_RENDERER_REGISTRY = {
  reference: "reference",
  text: "text",
  rich_text: "rich_text",
  money: "money",
  file_list: "file_list",
  key_value_collection: "key_value_collection",
  collection: "collection",
  integer: "integer",
  boolean: "boolean",
  taxonomy_reference_collection: "taxonomy_reference_collection",
} as const satisfies Record<TProductAuthoringField["type"], string>;

export type ProductAuthoringRendererKey =
  (typeof PRODUCT_AUTHORING_RENDERER_REGISTRY)[keyof typeof PRODUCT_AUTHORING_RENDERER_REGISTRY];

export type ProductAuthoringMode = "create" | "update";

export const resolveAuthoringRenderer = (
  schema: TProductAuthoringSchema,
  fieldKey: string,
): ProductAuthoringRendererKey | null => {
  const field = getAuthoringField(schema, fieldKey);
  return field ? PRODUCT_AUTHORING_RENDERER_REGISTRY[field.type] : null;
};

export const isAuthoringFieldRenderable = (
  schema: TProductAuthoringSchema,
  fieldKey: string,
): boolean => resolveAuthoringRenderer(schema, fieldKey) !== null;

export const isAuthoringFieldVisible = (
  schema: TProductAuthoringSchema | null,
  fieldKey: string,
  mode: ProductAuthoringMode,
): boolean =>
  schema ? isAuthoringFieldRenderable(schema, fieldKey) : mode === "create";
