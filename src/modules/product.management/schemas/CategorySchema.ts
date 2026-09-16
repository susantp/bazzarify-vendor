import { ImageSchema } from "@/modules/product.management/schemas/ImageSchema";
import { z } from "zod";

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

export const CategoryAuthoringProfileSchema = z
  .object({
    type: z.enum(["retail", "wholesale"]),
    status: z.literal("active"),
    capabilities: z.record(ProductAuthoringCapabilitySchema, z.boolean()),
    unavailable_reasons: z.record(z.string(), z.string()),
  })
  .strict();

export const CategoryCore = z
  .object({
    uuid: z.uuid(),
    id: z.string().optional(),
    name: z.string(),
    position: z.string().optional(),
    slug: z.string(),
    image_base_path: z.string(),
    image_base_url: z.string(),
    icon_base_path: z.string(),
    icon_base_url: z.string(),
    specifications: z.array(z.string()).optional(),
    attributes: z.array(z.string()).optional(),
    authoring_profile: CategoryAuthoringProfileSchema.optional(),
  })
  .strict();

export const CategoryWithImageSchema = CategoryCore.extend({
  images: z.array(ImageSchema).nullable(),
}).strict();

export const CategoryRecursiveWithImageSchema: typeof CategoryWithImageSchema =
  CategoryWithImageSchema.extend({
    parent: z.lazy(() => CategoryRecursiveWithImageSchema).optional(),
    children: z
      .array(z.lazy(() => CategoryRecursiveWithImageSchema))
      .optional(),
  });
export type TCategoryCore = z.infer<typeof CategoryCore>;
export type TCategoryWithImageSchema = z.infer<typeof CategoryWithImageSchema>;
export type TCategoryRecursiveWithImage = z.infer<
  typeof CategoryRecursiveWithImageSchema
>;
