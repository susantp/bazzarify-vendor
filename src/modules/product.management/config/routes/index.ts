import { IRoute } from "@/modules/core";
import attribute from "@/modules/product.management/config/routes/attribute";
import category from "@/modules/product.management/config/routes/category";
import image from "@/modules/product.management/config/routes/image";
import product from "@/modules/product.management/config/routes/product";
import productDraft from "@/modules/product.management/config/routes/productDraft";
import specification from "@/modules/product.management/config/routes/specification";
import variant from "@/modules/product.management/config/routes/variant";

export const PRODUCT_MANAGEMENT_ROUTES: Pick<
  IRoute,
  | "category"
  | "product"
  | "productDraft"
  | "variant"
  | "attribute"
  | "image"
  | "specification"
> = {
  category,
  product,
  productDraft,
  variant,
  image,
  attribute,
  specification,
};
