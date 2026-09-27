import { expect, test } from "bun:test";

import { CreateProductSchema } from "@/modules/product.management/config/schemas/product";
import { createOptionlessVariantPayload } from "@/modules/product.management/utils/productForm";

test("optionless product variants preserve their identity and omit attributes", () => {
  const variants = createOptionlessVariantPayload({
    productName: "Face Wash",
    productSku: "FACE-WASH",
    variant: {
      uuid: "11111111-1111-1111-1111-111111111111",
      name: "Face Wash",
      sku: "FACE-WASH-01",
      stock: "8",
      price: "110",
      available: true,
      images: [],
    },
  });

  expect(variants).toEqual([
    {
      uuid: "11111111-1111-1111-1111-111111111111",
      name: "Face Wash",
      sku: "FACE-WASH-01",
      stock: "8",
      price: "110",
      available: true,
      images: [],
    },
  ]);
  expect("attribute" in variants[0]).toBe(false);
});

test("optionless variant payload passes product authoring validation", () => {
  const variantValidation = CreateProductSchema.shape.variants.safeParse(
    createOptionlessVariantPayload({
      productName: "Face Wash Product",
      productSku: "FACE-WASH",
      variant: {
        sku: "FACE-WASH-01",
        stock: "8",
        price: "110",
        available: true,
        images: [],
        name: "Face Wash Product",
      },
    }),
  );

  expect(variantValidation.success).toBe(true);
});
