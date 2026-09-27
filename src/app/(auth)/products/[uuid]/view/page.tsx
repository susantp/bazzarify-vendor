import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

import { IPageParams } from "@/modules/core";
import BackLinkButton from "@/modules/core/components/server/BackLinkButton";
import PageContainer from "@/modules/core/components/server/PageContainer";

import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import { getWorkspaceCapabilities } from "@/modules/auth/domain/workspace-capabilities";
import {
  actionEditProduct,
  actionViewProduct,
} from "@/modules/product.management/actions/product";
import ProductInspectionView from "@/modules/product.management/components/client/product/ProductInspectionView";

export default async function Page({ params }: IPageParams) {
  const { uuid } = await params;
  const user = await requireWorkspaceCapability(
    "canViewProducts",
    `/products/${uuid}/view`,
  );
  const capabilities = getWorkspaceCapabilities(user);
  const productPayload = capabilities.canWriteProducts
    ? await actionEditProduct(uuid)
    : await actionViewProduct(uuid);

  if ("error" in productPayload) {
    return (
      <PageContainer
        pageTitle="Product not found"
        actionSlot={
          <BackLinkButton href="/products" label="Back to Products" />
        }
      >
        <Card className="border-destructive/40">
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-base">
              Unable to load this product
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {productPayload.error ??
                "The product could not be loaded. It may have been deleted, or you may not have access to it."}
            </p>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/products">Back to Products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <ProductInspectionView
      productPayload={productPayload}
      canEdit={capabilities.canWriteProducts}
      canPublish={capabilities.canReviewProducts}
    />
  );
}
