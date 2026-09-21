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
import {
  DEFAULT_STORE_REQUIREMENT_RETURN_PATH,
  buildStoreRequirementPath,
  sanitizeVendorReturnPath,
} from "@/modules/vendor/domain/storeRequirementNavigation";
import Link from "next/link";
import { redirect } from "next/navigation";

interface StoreRemediationPageProps {
  searchParams: Promise<{
    returnTo?: string;
  }>;
}

export default async function StoreRemediationPage({
  searchParams,
}: StoreRemediationPageProps) {
  const { returnTo } = await searchParams;
  const safeReturnTo = returnTo
    ? sanitizeVendorReturnPath(returnTo, DEFAULT_STORE_REQUIREMENT_RETURN_PATH)
    : null;

  const userUuid = await getSessionUserUUID(await getCookieStore());
  if (!userUuid) {
    redirect("/login");
  }

  const authUser = await getAuthUser(userUuid);
  if (!authUser || "error" in authUser) {
    redirect("/login");
  }

  if (!authUser.store) {
    redirect(buildStoreRequirementPath(safeReturnTo ?? "/products"));
  }

  if (isStoreProductAuthoringReady(authUser.store)) {
    redirect(safeReturnTo ?? "/products");
  }

  return (
    <PageContainer pageTitle="Store Setup Incomplete">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your store setup is incomplete</CardTitle>
            <CardDescription>
              Your store exists, but product authoring is still blocked until
              category access is configured.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-slate-50 p-4 text-sm text-slate-700">
              A superadmin needs to finish the category setup for your store
              before you can create or edit products. This applies only to
              legacy stores created before onboarding categories were assigned
              automatically.
            </div>
            <div className="rounded-md border bg-slate-50 p-4 text-sm text-slate-700">
              {typeof authUser.store.category_count === "number"
                ? `Current assigned category count: ${authUser.store.category_count}.`
                : "Current assigned category count is unavailable right now."}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ThemedButton asChild className="w-full sm:w-auto">
                <Link href="/">Go to dashboard</Link>
              </ThemedButton>
              <ThemedButton
                variant="outline"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href={safeReturnTo ?? "/products"}>
                  Retry status check
                </Link>
              </ThemedButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
