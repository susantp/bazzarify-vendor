import {
  getAuthUser,
  getSessionUserUUID,
} from "@/modules/auth/data/lib/auth-lib";
import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import ErrorComponent from "@/modules/core/components/client/ErrorComponent";
import BackLinkButton from "@/modules/core/components/server/BackLinkButton";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { getCookieStore } from "@/modules/core/lib/utils.session";
import { TProductImportTargetStore } from "@/modules/product.management";
import {
  actionGetActiveProductImport,
  actionGetProductImportGuide,
  actionGetProductImportTargetStores,
} from "@/modules/product.management/actions/import";
import ProductImportUploadForm from "@/modules/product.management/components/client/product-import/ProductImportUploadForm";
import { redirect } from "next/navigation";

export default async function NewProductImportPage() {
  await requireWorkspaceCapability(
    "canImportProducts",
    "/products/imports/new",
  );
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

  const userUuid = await getSessionUserUUID(await getCookieStore());
  const authUser = userUuid ? await getAuthUser(userUuid) : null;
  const isAdmin = Boolean(
    authUser &&
    !("error" in authUser) &&
    authUser.roles.some(
      (role) => role.name === "super-admin" || role.name === "admin",
    ),
  );

  let initialStoreOptions: TProductImportTargetStore[] = [];
  let initialStoreOptionsError: string | null = null;

  if (isAdmin) {
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
