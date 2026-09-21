import TimeStampsSchema from "@/modules/core/schemas/TimeStampsSchema";
import { ImageSchema } from "@/modules/product.management/schemas/ImageSchema";
import SpecificationSchema from "@/modules/product.management/schemas/SpecificationSchema";
import { z } from "zod";

export const ProductSchema = z
  .object({
    type: z.enum(["retail", "wholesale"]),
    uuid: z.uuid(),
    created_by_user_uuid: z.uuid().nullable(),
    updated_by_user_uuid: z.uuid().nullable().optional(),
    image_base_path: z.string(),
    image_base_url: z.string(),
    id: z.number().nullable(),
    name: z.string(),
    sku: z.string().min(8).max(32),
    slug: z.string(),
    base_price: z.number().nonnegative(),
    wholesale_product_detail: z
      .object({
        minimum_order_quantity: z.number().int().min(1),
      })
      .nullable()
      .optional(),
    description: z.looseObject({}).nullable(),
    highlights: z.looseObject({}).nullable(),
    box_items: z.string().nullable(),
    status_text: z.string(),
    brand_uuid: z.uuid().nullable(),
    status: z.number().nonnegative(),
    brand: z.object().nullable().optional(),
    createdBy: z
      .object({
        uuid: z.uuid(),
        name: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    updatedBy: z
      .object({
        uuid: z.uuid(),
        name: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    categories: z
      .array(
        z.object({
          uuid: z.uuid(),
          name: z.string(),
        }),
      )
      .optional(),
    images: z.union([z.array(ImageSchema).optional(), z.array(z.unknown())]),
  })
  .extend({
    specifications: SpecificationSchema,
  }) //TODO remove this from core product schema, extend it later
  .extend(TimeStampsSchema.shape)
  .strict();
export const OmittedProductWithImagesSchema = ProductSchema.omit({
  id: true,
  box_items: true,
  specifications: true,
  highlights: true,
  description: true,
  brand: true,
  created_by_user_uuid: true,
  updated_by_user_uuid: true,
  brand_uuid: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
})
  .extend({
    images: z.array(ImageSchema).nullable(),
  })
  .strict();

export type TOmittedProductWithImages = z.infer<
  typeof OmittedProductWithImagesSchema
>;
