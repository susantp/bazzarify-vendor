"use client";

import { IMetaData } from "@/modules/core";
import ErrorComponent from "@/modules/core/components/client/ErrorComponent";
import {
  TCategoryIndexPayload,
  TEditProductPayload,
} from "@/modules/product.management";
import ProductAuthoringDraftForm from "@/modules/product.management/components/client/product/ProductAuthoringDraftForm";
import useUpdateProduct from "@/modules/product.management/hooks/useUpdateProduct";

interface EditProps {
  productPayload: TEditProductPayload | IMetaData;
  categoryIndexPayload: TCategoryIndexPayload | IMetaData;
}

export default function Edit({
  productPayload,
  categoryIndexPayload,
}: EditProps) {
  if ("error" in productPayload) {
    return <ErrorComponent err={productPayload.error} />;
  }
  if ("error" in categoryIndexPayload) {
    return <ErrorComponent err={categoryIndexPayload.error} />;
  }

  return (
    <EditContent
      productPayload={productPayload}
      categoryIndexPayload={categoryIndexPayload}
    />
  );
}

function EditContent({
  productPayload,
  categoryIndexPayload,
}: {
  productPayload: TEditProductPayload;
  categoryIndexPayload: TCategoryIndexPayload;
}) {
  const controller = useUpdateProduct(productPayload);

  return (
    <ProductAuthoringDraftForm
      categoryIndexPayload={categoryIndexPayload}
      controller={controller}
      mode="update"
      targetProductUuid={productPayload.product.uuid}
    />
  );
}
