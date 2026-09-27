import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import { getWorkspaceCapabilities } from "@/modules/auth/domain/workspace-capabilities";
import ErrorComponent from "@/modules/core/components/client/ErrorComponent";
import BackLinkButton from "@/modules/core/components/server/BackLinkButton";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { TProductImportTargetStore } from "@/modules/product.management";
import {
  actionGetActiveProductImport,
  actionGetProductImportGuide,
  actionGetProductImportTargetStores,
} from "@/modules/product.management/actions/import";
import ProductImportUploadForm from "@/modules/product.management/components/client/product-import/ProductImportUploadForm";
import { redirect } from "next/navigation";

export default async function NewProductImportPage() {
  const user = await requireWorkspaceCapability(
    "canImportProducts",
    "/products/imports/new",
  );
  const canManageAcrossStores =
    getWorkspaceCapabilities(user).canManageAcrossStores;
  const guidePayload = await actionGetProductImportGuide();

  if ("error" in guidePayload) {
    return (
      <PageContainer
        pageTitle="New Bulk Product Import"
        actionSlot={
          <BackLinkButton href="/products/imports" label="Back to Imports" />
        }
      >
        <ErrorComponent err={guidePayload.error} />
      </PageContainer>
    );
  }

  const activePayload = await actionGetActiveProductImport(
    guidePayload.eligibility.target_store?.uuid,
  );

  if (
    activePayload &&
    typeof activePayload === "object" &&
    "active_import" in activePayload &&
    activePayload.active_import
  ) {
    redirect(`/products/imports/${activePayload.active_import.uuid}?resumed=1`);
  }

  let initialStoreOptions: TProductImportTargetStore[] = [];
  let initialStoreOptionsError: string | null = null;

  if (canManageAcrossStores) {
    const storeOptionsPayload = await actionGetProductImportTargetStores();
    if ("error" in storeOptionsPayload) {
      initialStoreOptionsError = storeOptionsPayload.error;
    } else {
      initialStoreOptions = storeOptionsPayload.stores;
    }
  }

  return (
    <PageContainer
      pageTitle="New Bulk Product Import"
      actionSlot={
        <BackLinkButton href="/products/imports" label="Back to Imports" />
      }
    >
      <ProductImportUploadForm
        guidePayload={guidePayload}
        initialStoreOptions={initialStoreOptions}
        initialStoreOptionsError={initialStoreOptionsError}
      />
    </PageContainer>
  );
}
