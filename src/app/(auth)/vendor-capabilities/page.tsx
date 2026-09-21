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
import {
  TCategory,
  TCategoryAuthoringProfile,
} from "@/modules/product.management";
import { actionGetCategories } from "@/modules/product.management/actions/category";
import { isStoreProductAuthoringReady } from "@/modules/vendor/domain/schemas/store";
import Link from "next/link";
import { redirect } from "next/navigation";

function flattenCategories(categories: TCategory[]): TCategory[] {
  return categories.flatMap((category) => [
    category,
    ...flattenCategories(category.children ?? []),
  ]);
}

function capabilityLabel(capability: string): string {
  return capability
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ProfileCard({
  category,
  profile,
}: {
  category: TCategory;
  profile: TCategoryAuthoringProfile;
}) {
  const available = Object.entries(profile.capabilities).filter(
    ([, enabled]) => enabled,
  );
  const unavailable = Object.entries(profile.unavailable_reasons);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{category.name}</CardTitle>
        <CardDescription>
          {category.slug} · {profile.type} authoring · {profile.status}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Available capabilities</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {available.map(([capability]) => (
              <li key={capability}>{capabilityLabel(capability)}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">
            Unavailable capabilities
          </h3>
          {unavailable.length > 0 ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {unavailable.map(([capability, reason]) => (
                <li key={capability}>
                  <span className="font-medium text-foreground">
                    {capabilityLabel(capability)}:
                  </span>{" "}
                  {reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No capabilities are currently blocked for this category.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function VendorCapabilitiesPage() {
  const userUuid = await getSessionUserUUID(await getCookieStore());
  if (!userUuid) {
    redirect("/login");
  }

  const authUser = await getAuthUser(userUuid);
  if (!authUser || "error" in authUser) {
    redirect("/login");
  }

  if (!authUser.store) {
    return (
      <PageContainer pageTitle="Vendor Capability Profile">
        <Card>
          <CardHeader>
            <CardTitle>Store setup is required</CardTitle>
            <CardDescription>
              Category capabilities become available after a store is created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemedButton asChild>
              <Link href="/store-required">Complete store setup</Link>
            </ThemedButton>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!isStoreProductAuthoringReady(authUser.store)) {
    return (
      <PageContainer pageTitle="Vendor Capability Profile">
        <Card>
          <CardHeader>
            <CardTitle>Product authoring is not ready</CardTitle>
            <CardDescription>
              Category access is still being configured for{" "}
              {authUser.store.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemedButton asChild>
              <Link href="/store-remediation">View setup requirements</Link>
            </ThemedButton>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const categoryPayload = await actionGetCategories({ perPage: "100" });
  if ("error" in categoryPayload) {
    return (
      <PageContainer pageTitle="Vendor Capability Profile">
        <Card>
          <CardHeader>
            <CardTitle>Capabilities are temporarily unavailable</CardTitle>
            <CardDescription>{categoryPayload.error}</CardDescription>
          </CardHeader>
        </Card>
      </PageContainer>
    );
  }

  const profiles = flattenCategories(categoryPayload.categories.data).filter(
    (
      category,
    ): category is TCategory & {
      authoring_profile: TCategoryAuthoringProfile;
    } => category.authoring_profile != null,
  );

  return (
    <PageContainer pageTitle="Vendor Capability Profile">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{authUser.store.name}</CardTitle>
            <CardDescription>
              These capabilities are resolved by the backend from your assigned
              categories. They describe authoring support; they do not grant
              category access.
            </CardDescription>
          </CardHeader>
        </Card>
        {profiles.length > 0 ? (
          profiles.map((category) => (
            <ProfileCard
              key={category.uuid}
              category={category}
              profile={category.authoring_profile}
            />
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No assigned category authoring profiles are available yet.
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
