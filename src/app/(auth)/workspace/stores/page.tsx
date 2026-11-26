import TenantStoresManager from "@/modules/auth/components/server/TenantStoresManager";
import {
  actionGetStoreDeliveryConfiguration,
  actionGetTenantDeliveryConfiguration,
} from "@/modules/auth/domain/delivery-configuration-actions";
import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import { actionGetTenantStorePageData } from "@/modules/auth/domain/tenant-store-actions";
import ErrorComponent from "@/modules/core/components/client/ErrorComponent";
import PageContainer from "@/modules/core/components/server/PageContainer";

export default async function WorkspaceStoresPage({
  searchParams,
}: {
  searchParams: Promise<{
    updated?: string;
    error?: string;
    deliveryStore?: string;
  }>;
}) {
  await requireWorkspaceCapability(
    "canManageTenantMembers",
    "/workspace/stores",
  );
  const [response, params, tenantDelivery] = await Promise.all([
    actionGetTenantStorePageData(),
    searchParams,
    actionGetTenantDeliveryConfiguration(),
  ]);
  const selectedStore = response.stores?.find(
    ({ uuid }) => uuid === params.deliveryStore,
  );
  const storeDelivery = selectedStore
    ? await actionGetStoreDeliveryConfiguration(selectedStore.uuid)
    : null;

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
          tenantDelivery={tenantDelivery?.delivery_policy ?? null}
          selectedStoreUuid={selectedStore?.uuid}
          storeDelivery={storeDelivery}
          updated={params.updated}
        />
      )}
    </PageContainer>
  );
}
