import type { ProductAuthoringController } from "@/modules/product.management";
import {
  isAuthoringFieldVisible,
  type ProductAuthoringMode,
} from "@/modules/product.management/utils/productAuthoringRenderer";

export interface ProductAuthoringNavigationField {
  key: string;
  label: string;
  targetId: string;
}

export interface ProductAuthoringNavigationStep {
  stepKey: string;
  fields: ProductAuthoringNavigationField[];
}

const field = (
  key: string,
  label: string,
  targetId = key,
): ProductAuthoringNavigationField => ({ key, label, targetId });

export const getProductAuthoringNavigation = (
  controller: ProductAuthoringController,
  mode: ProductAuthoringMode,
): ProductAuthoringNavigationStep[] => {
  const supportsField = (key: string) =>
    isAuthoringFieldVisible(controller.authoringSchema, key, mode);
  const setupFields = [
    field("name", "Name"),
    supportsField("base_price") && field("base_price", "Base price"),
    supportsField("minimum_order_quantity") &&
      field("minimum_order_quantity", "Minimum order quantity"),
    field("sku", "SKU"),
    supportsField("description") && field("description", "Description"),
    supportsField("highlights") && field("highlights", "Highlights"),
    supportsField("box_items") && field("box_items", "What's in the box?"),
    field("category", "Category", "category"),
  ].filter(Boolean) as ProductAuthoringNavigationField[];

  const specificationFields =
    controller.specificationState.categorySpecifications.map((specification) =>
      field(
        `specification:${specification.key}`,
        specification.key.replaceAll("-", " "),
        `specification-value-${specification.key}`,
      ),
    );

  const optionFields = [
    field("customer-options", "Customer options", "options"),
    ...controller.selectorState.attributes.map((attribute) =>
      field(
        `attribute:${attribute.uuid}`,
        attribute.name,
        `attribute-${attribute.uuid}`,
      ),
    ),
    field("variants", "Variants", "options"),
  ];

  return [
    { stepKey: "setup", fields: setupFields },
    {
      stepKey: "category_details",
      fields: supportsField("specifications") ? specificationFields : [],
    },
    {
      stepKey: "options",
      fields: supportsField("variants") ? optionFields : [],
    },
    {
      stepKey: "media",
      fields: supportsField("images")
        ? [field("images", "Images", "media")]
        : [],
    },
    { stepKey: "review", fields: [field("review", "Review")] },
  ];
};
