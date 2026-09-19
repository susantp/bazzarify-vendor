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
  mediaStore: {
    path: "/product-management/product-drafts/:uuid/media",
    method: "POST",
  },
  mediaDestroy: {
    path: "/product-management/product-drafts/:uuid/media/:mediaUuid",
    method: "DELETE",
  },
  destroy: {
    path: "/product-management/product-drafts/:uuid",
    method: "DELETE",
  },
};

export default productDraft;
