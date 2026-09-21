import {
  ProductAuthoringSchema,
  hasAuthoringField,
} from "@/modules/product.management/schemas/ProductAuthoringSchema";
import { resolveAuthoringRenderer } from "@/modules/product.management/utils/productAuthoringRenderer";
import assert from "node:assert/strict";

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

const parsed = ProductAuthoringSchema.safeParse(retailSchema);
assert.equal(parsed.success, true);
if (parsed.success) {
  assert.equal(hasAuthoringField(parsed.data, "name"), true);
  assert.equal(hasAuthoringField(parsed.data, "variants.sku"), true);
  assert.equal(hasAuthoringField(parsed.data, "images"), false);
  assert.equal(resolveAuthoringRenderer(parsed.data, "variants"), "collection");
}

const unknownVersion = ProductAuthoringSchema.safeParse({
  ...retailSchema,
  version: "product-authoring.v2",
});
assert.equal(unknownVersion.success, false);

const unsupportedFamily = ProductAuthoringSchema.safeParse({
  ...retailSchema,
  profile: { ...retailSchema.profile, type: "service" },
});
assert.equal(unsupportedFamily.success, false);

const unknownFieldType = ProductAuthoringSchema.safeParse({
  ...retailSchema,
  fields: [{ ...retailSchema.fields[0], type: "component" }],
});
assert.equal(unknownFieldType.success, false);

const backendEmptyMaps = ProductAuthoringSchema.safeParse({
  ...retailSchema,
  fields: [
    {
      ...retailSchema.fields[0],
      validation: [],
      metadata: [],
    },
  ],
});
assert.equal(backendEmptyMaps.success, true);

console.log("product authoring schema vendor assertions passed");
