import { expect, test } from "bun:test";

import {
  ProductAuthoringSchema,
  hasAuthoringField,
} from "@/modules/product.management/schemas/ProductAuthoringSchema";
import { resolveAuthoringRenderer } from "@/modules/product.management/utils/productAuthoringRenderer";

const retailSchema = {
  version: "product-authoring.v1",
  profile: {
    uuid: "11111111-1111-4111-8111-111111111111",
    version: 1,
    type: "retail",
    status: "active",
  },
  fields: [
    {
      key: "name",
      label: "Product name",
      type: "text",
      scope: "common",
      required: true,
      capability: null,
      validation: { min_length: 8 },
      metadata: {},
    },
    {
      key: "variants",
      label: "Variants",
      type: "collection",
      scope: "family",
      required: true,
      capability: "variants",
      validation: {},
      metadata: {
        item_fields: [
          {
            key: "variants.sku",
            label: "Variant SKU",
            type: "text",
            scope: "family",
            required: true,
            capability: "variants",
            validation: {},
            metadata: { unique: "global" },
          },
        ],
      },
    },
  ],
  unavailable_fields: [
    {
      key: "images",
      capability: "images",
      reason: "Images are not configured for this profile.",
    },
  ],
};

test("product authoring schema exposes supported fields and renderers", () => {
  const parsed = ProductAuthoringSchema.safeParse(retailSchema);
  expect(parsed.success).toBe(true);
  if (!parsed.success) return;

  expect(hasAuthoringField(parsed.data, "name")).toBe(true);
  expect(hasAuthoringField(parsed.data, "variants.sku")).toBe(true);
  expect(hasAuthoringField(parsed.data, "images")).toBe(false);
  expect(resolveAuthoringRenderer(parsed.data, "variants")).toBe("collection");
});

test("product authoring schema rejects unsupported profile versions, families, and field types", () => {
  expect(
    ProductAuthoringSchema.safeParse({
      ...retailSchema,
      version: "product-authoring.v2",
    }).success,
  ).toBe(false);
  expect(
    ProductAuthoringSchema.safeParse({
      ...retailSchema,
      profile: { ...retailSchema.profile, type: "service" },
    }).success,
  ).toBe(false);
  expect(
    ProductAuthoringSchema.safeParse({
      ...retailSchema,
      fields: [{ ...retailSchema.fields[0], type: "component" }],
    }).success,
  ).toBe(false);
});

test("product authoring schema accepts backend empty maps", () => {
  expect(
    ProductAuthoringSchema.safeParse({
      ...retailSchema,
      fields: [
        {
          ...retailSchema.fields[0],
          validation: [],
          metadata: [],
        },
      ],
    }).success,
  ).toBe(true);
});
