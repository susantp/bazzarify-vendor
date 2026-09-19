"use client";

import { IMetaData } from "@/modules/core";
import ErrorComponent from "@/modules/core/components/client/ErrorComponent";
import { TCategoryIndexPayload } from "@/modules/product.management";
import ProductAuthoringForm from "@/modules/product.management/components/client/product/ProductAuthoringForm";
import useCreateProduct from "@/modules/product.management/hooks/useCreateProduct";

interface CreateProps {
  categoryIndexPayload: TCategoryIndexPayload | IMetaData;
}

export default function Create({ categoryIndexPayload }: CreateProps) {
  if ("error" in categoryIndexPayload) {
    return <ErrorComponent err={categoryIndexPayload.error} />;
  }

  return <CreateContent categoryIndexPayload={categoryIndexPayload} />;
}

function CreateContent({
  categoryIndexPayload,
}: {
  categoryIndexPayload: TCategoryIndexPayload;
}) {
  const controller = useCreateProduct();

  return (
    <ProductAuthoringForm
      categoryIndexPayload={categoryIndexPayload}
      controller={controller}
      mode="create"
    />
  );
}
