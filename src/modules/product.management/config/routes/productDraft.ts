import { IRoute } from "@/modules/core";

const productDraft: IRoute["productDraft"] = {
  index: {
    path: "/product-management/product-drafts",
  },
  store: {
    path: "/product-management/product-drafts",
    method: "POST",
  },
  show: {
    path: "/product-management/product-drafts/:uuid",
  },
  saveStep: {
    path: "/product-management/product-drafts/:uuid/steps/:stepKey",
    method: "PUT",
  },
  destroy: {
    path: "/product-management/product-drafts/:uuid",
    method: "DELETE",
  },
};

export default productDraft;
