import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import PageContainer from "@/modules/core/components/server/PageContainer";
import StoreOnboardingManagement from "@/modules/vendor/components/client/StoreOnboardingManagement";
import { actionGetAdminStoreOnboardingStoreTypes } from "@/modules/vendor/domain/store-actions";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function StoreOnboardingSettingsPage() {
  const requestHeaders = await headers();
  const isVendor = requestHeaders.get("host")?.startsWith("vendor.");
  await requireWorkspaceCapability(
    "canManagePlatformStoreOnboarding",
    "/settings/store-onboarding",
  );

  if (isVendor) {
    redirect("/");
  }

  const storeTypes = await actionGetAdminStoreOnboardingStoreTypes();

  return (
    <PageContainer pageTitle="Store Onboarding Settings">
      <StoreOnboardingManagement storeTypes={storeTypes} />
    </PageContainer>
  );
}
