import { z } from "zod";

export const PRODUCT_AUTHORING_SCHEMA_VERSION = "product-authoring.v1";

const ProductAuthoringCapabilitySchema = z.enum([
  "product_sku",
  "variants",
  "customer_options",
  "inventory",
  "base_price",
  "specifications",
  "images",
  "import",
  "minimum_order_quantity",
]);

const ProductAuthoringFieldTypeSchema = z.enum([
  "reference",
  "text",
  "rich_text",
  "money",
  "file_list",
  "key_value_collection",
  "collection",
  "integer",
  "boolean",
  "taxonomy_reference_collection",
]);

const ProductAuthoringFieldScopeSchema = z.enum([
  "common",
  "family",
  "taxonomy",
]);

// Backend PHP arrays are [] when empty and JSON objects when associative.
// Keep this dual-shape at the metadata boundary; field identity and types stay strict.
const ProductAuthoringMapSchema = z.union([
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
]);

export const ProductAuthoringFieldSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: ProductAuthoringFieldTypeSchema,
    scope: ProductAuthoringFieldScopeSchema,
    required: z.boolean(),
    capability: ProductAuthoringCapabilitySchema.nullable(),
    validation: ProductAuthoringMapSchema,
    metadata: ProductAuthoringMapSchema,
  })
  .strict();

export const ProductAuthoringSchema = z
  .object({
    version: z.literal(PRODUCT_AUTHORING_SCHEMA_VERSION),
    profile: z
      .object({
        uuid: z.uuid().nullable(),
        version: z.number().int().nullable(),
        type: z.enum(["retail", "wholesale"]),
        status: z.literal("active"),
      })
      .strict(),
    fields: z.array(ProductAuthoringFieldSchema),
    unavailable_fields: z.array(
      z
        .object({
          key: z.string().min(1),
          capability: ProductAuthoringCapabilitySchema,
          reason: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

export const ProductAuthoringContextPayloadSchema = z
  .object({
    authoringSchema: ProductAuthoringSchema,
  })
  .passthrough();

export type TProductAuthoringField = z.infer<
  typeof ProductAuthoringFieldSchema
>;
export type TProductAuthoringSchema = z.infer<typeof ProductAuthoringSchema>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getNestedFields = (
  field: TProductAuthoringField,
): TProductAuthoringField[] => {
  if (!isRecord(field.metadata)) {
    return [];
  }

  const nested = field.metadata.item_fields;
  if (!Array.isArray(nested)) {
    return [];
  }

  return nested.flatMap((item) => {
    const parsed = ProductAuthoringFieldSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
};

export const getAuthoringField = (
  schema: TProductAuthoringSchema,
  key: string,
): TProductAuthoringField | null => {
  const direct = schema.fields.find((field) => field.key === key);
  if (direct) {
    return direct;
  }

  for (const field of schema.fields) {
    const nested = getNestedFields(field).find((item) => item.key === key);
    if (nested) {
      return nested;
    }
  }

  return null;
};

export const hasAuthoringField = (
  schema: TProductAuthoringSchema,
  key: string,
): boolean => getAuthoringField(schema, key) !== null;

export const getUnavailableAuthoringField = (
  schema: TProductAuthoringSchema,
  key: string,
) => schema.unavailable_fields.find((field) => field.key === key) ?? null;
