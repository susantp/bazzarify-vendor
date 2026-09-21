import { IRoute } from "@/modules/core";

const product: IRoute["product"] = {
  index: {
    path: "/product-management/products",
  },
  show: {
    path: "/product-management/products/:uuid",
  },
  edit: {
    path: "/product-management/products/:uuid/edit",
  },
  store: {
    path: "/product-management/products",
  },
  update: {
    path: "/product-management/products/:uuid",
  },
  updateStatus: {
    path: "/product-management/products/:uuid/status",
  },
  publish: {
    path: "/product-management/products/:uuid/publish",
  },
  storeOptions: {
    path: "/product-management/products/store-options",
  },
  delete: {
    path: "/product-management/products/:uuid",
  },
  importGuide: {
    path: "/product-management/product-imports/guide",
  },
  importTemplate: {
    path: "/product-management/product-imports/template",
  },
  importCatalog: {
    path: "/product-management/product-imports/catalog",
  },
  importStoreOptions: {
    path: "/product-management/product-imports/target-stores",
  },
  importStore: {
    path: "/product-management/product-imports",
  },
  importIndex: {
    path: "/product-management/product-imports",
  },
  importActive: {
    path: "/product-management/product-imports/active",
  },
  importShow: {
    path: "/product-management/product-imports/:uuid",
  },
  importValidate: {
    path: "/product-management/product-imports/:uuid/validate",
  },
  importProcess: {
    path: "/product-management/product-imports/:uuid/process",
  },
  importRows: {
    path: "/product-management/product-imports/:uuid/rows",
  },
  importCancel: {
    path: "/product-management/product-imports/:uuid/cancel",
  },
  importErrorReport: {
    path: "/product-management/product-imports/:uuid/error-report",
  },
};

export default product;
