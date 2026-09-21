import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAuthUser,
  getSessionUserUUID,
} from "@/modules/auth/data/lib/auth-lib";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { ThemedButton } from "@/modules/core/components/server/ThemedButton";
import { getCookieStore } from "@/modules/core/lib/utils.session";
import { isStoreProductAuthoringReady } from "@/modules/vendor/domain/schemas/store";
import { actionGetStoreTypeOptions } from "@/modules/vendor/domain/store-actions";
import { buildStoreRemediationPath } from "@/modules/vendor/domain/storeRequirementNavigation";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StoreCreatedPage() {
  const userUuid = await getSessionUserUUID(await getCookieStore());
  if (!userUuid) {
    redirect("/login");
  }

  const authUser = await getAuthUser(userUuid);
  if (!authUser || "error" in authUser || !authUser.store) {
    redirect("/store-required");
  }

  if (!isStoreProductAuthoringReady(authUser.store)) {
    redirect(buildStoreRemediationPath());
  }

  const storeTypeOptions = await actionGetStoreTypeOptions();
  const selectedStoreType = storeTypeOptions.find(
    (option) => option.uuid === authUser.store?.store_type_uuid,
  );
  const starterCategories =
    selectedStoreType?.onboarding_category_set?.categories ?? [];

  return (
    <PageContainer pageTitle="Store Created">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your store is ready</CardTitle>
            <CardDescription>
              {selectedStoreType
                ? `Bazarify assigned starter categories for ${selectedStoreType.name}.`
                : "Your store is created and ready for the next onboarding step."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedStoreType && selectedStoreType.onboarding_category_set ? (
              <div className="space-y-3 rounded-md border bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedStoreType.name}
                  </p>
                  {selectedStoreType.description ? (
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedStoreType.description}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Assigned starter categories
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {starterCategories.map((category) => (
                      <li
                        key={category.uuid}
                        className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 shadow-sm ring-1 ring-slate-200"
                      >
                        {category.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-md border bg-slate-50 p-4 text-sm text-slate-700">
                Your store was created, but the onboarding category preview is
                not available right now.
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <ThemedButton asChild className="w-full sm:w-auto">
                <Link href="/products/create">Create your first product</Link>
              </ThemedButton>
              <ThemedButton
                variant="outline"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href="/">Go to dashboard</Link>
              </ThemedButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
