import TenantStoresManager from "@/modules/auth/components/server/TenantStoresManager";
import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import { actionGetTenantStorePageData } from "@/modules/auth/domain/tenant-store-actions";
import ErrorComponent from "@/modules/core/components/client/ErrorComponent";
import PageContainer from "@/modules/core/components/server/PageContainer";

export default async function WorkspaceStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  await requireWorkspaceCapability(
    "canManageTenantMembers",
    "/workspace/stores",
  );
  const [response, params] = await Promise.all([
    actionGetTenantStorePageData(),
    searchParams,
  ]);

  return (
    <PageContainer pageTitle="Workspace stores">
      {"error" in response ? (
        <ErrorComponent
          err={response.error ?? "Tenant stores could not be loaded."}
        />
      ) : (
        <TenantStoresManager
          error={params.error}
          storeTypes={response.storeTypes}
          stores={response.stores}
          updated={params.updated}
        />
      )}
    </PageContainer>
  );
}
