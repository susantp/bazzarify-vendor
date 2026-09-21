import { isValidRichTextEditorContent } from "@/modules/core/lib/utils.index";
import { z } from "zod";

const VariantDraftSchema = z.object({
  uuid: z.uuid().optional(),
  name: z.string().min(1, "SKU name is required"),
  stock: z.string().min(1, "Variant stock is required"),
  price: z.string().min(1, "Variant price is required"),
  sku: z
    .string()
    .min(8, "Variant sku must be at least 8 characters long")
    .max(64, "Variant sku must be at most 64 characters long"),
  available: z.boolean(),
  images: z.array(z.unknown()).optional(),
});

const OptionalCreateSkuSchema = z.union([
  z.literal(""),
  z.string().min(8, "Product sku must be at least 8 characters long").max(32),
]);

export const CreateProductSchema = z.object({
  type: z.string(),
  sku: OptionalCreateSkuSchema.optional(),
  name: z.string().min(8, "Product name must be at least 8 characters long"),
  base_price: z
    .string("Base price is not valid")
    .min(1, "Product base price is required")
    .refine((val) => /^(?:[1-9]\d*|0)(?:\.\d+)?$/.test(val), {
      message: "Base price must be 1 to 9 digits",
    }),
  minimum_order_quantity: z
    .string()
    .regex(/^[1-9]\d*$/, "Minimum order quantity must be at least 1")
    .optional(),
  description: z.string().refine(isValidRichTextEditorContent, {
    message: "Product description is required",
  }),
  highlights: z.string().min(1, "Product highlights is required"),
  box_items: z.string().min(1, "Product box items is required"),
  category: z.uuid("Category is required"),
  variants: z
    .array(VariantDraftSchema)
    .min(1, "At least one sellable SKU is required"),
});
export const UpdateProductSchema = z.object({
  type: z.string(),
  uuid: z.uuid("Product id is required"),
  category: z.uuid("Committed category is required"),
  name: z.string().min(8, "Product name must be at least 8 characters long"),
  sku: z.string().min(8, "Product sku is required").max(32),
  base_price: z
    .string()
    .min(1, "Product base price is required")
    .refine((val) => /^(?:[1-9]\d*|0)(?:\.\d+)?$/.test(val), {
      message: "Base price must be 1 to 9 digits",
    }),
  minimum_order_quantity: z
    .string()
    .regex(/^[1-9]\d*$/, "Minimum order quantity must be at least 1")
    .optional(),
  description: z.string().refine(isValidRichTextEditorContent, {
    message: "Product description is required",
  }),
  highlights: z.string().min(1, "Product highlights is required"),
  box_items: z.string().min(1, "Product box items is required"),
  variants: z
    .array(VariantDraftSchema)
    .min(1, "At least one sellable SKU is required"),
});
