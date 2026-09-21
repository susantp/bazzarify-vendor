import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUserRoleManagementCard from "@/modules/admin/users/components/client/AdminUserRoleManagementCard";
import { TAdminUserDetail } from "@/modules/auth/domain/schemas/payloads/AdminUserDetailPayloadSchema";

function renderValue(value: string | null | undefined): string {
  return value && value.length > 0 ? value : "-";
}

function formatLabel(value: string | null | undefined): string {
  return renderValue(value).replaceAll("_", " ");
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function OnboardingBadge({
  state,
}: {
  state: string | null | undefined;
}): React.JSX.Element {
  const variant =
    state === "ready" ? "default" : state ? "secondary" : "outline";

  return <Badge variant={variant}>{formatLabel(state)}</Badge>;
}

interface UserDetailViewProps {
  user: TAdminUserDetail;
  audience?: "consumer" | "vendor";
}

export default function UserDetailView({
  user,
  audience = "consumer",
}: UserDetailViewProps): React.JSX.Element {
  const isVendorView = audience === "vendor";
  const onboarding = user.onboarding ?? user.store?.onboarding;
  const storeProductAuthoringReady =
    user.store?.product_authoring_ready ??
    user.store?.onboarding?.product_authoring_ready;

  if (!isVendorView) {
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Details</CardTitle>
            <CardDescription>
              Read-only consumer account summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Name: {renderValue(user.name)}</p>
            <p>Email: {renderValue(user.email)}</p>
            <p>Phone: {renderValue(user.phone)}</p>
            <p>Auth Type: {user.authType}</p>
            <p>Email Verified: {renderValue(user.email_verified_at)}</p>
            <p>Phone Verified: {renderValue(user.phone_verified_at)}</p>
            <p>Created At: {renderValue(user.created_at)}</p>
            <p>Updated At: {renderValue(user.updated_at)}</p>
          </CardContent>
        </Card>
        <AdminUserRoleManagementCard
          userUuid={user.uuid}
          roles={user.roles}
          hasStore={user.has_store}
          audience={audience}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardDescription>Account identity</CardDescription>
              <CardTitle className="text-xl">
                {renderValue(user.name ?? user.email ?? user.phone)}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Email" value={renderValue(user.email)} />
              <DetailItem label="Phone" value={renderValue(user.phone)} />
              <DetailItem label="Auth type" value={user.authType} />
              <DetailItem label="Roles" value={user.roles.join(", ") || "-"} />
              <DetailItem
                label="Email verified"
                value={renderValue(user.email_verified_at)}
              />
              <DetailItem
                label="Phone verified"
                value={renderValue(user.phone_verified_at)}
              />
              <DetailItem
                label="Created"
                value={renderValue(user.created_at)}
              />
              <DetailItem
                label="Updated"
                value={renderValue(user.updated_at)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding progress</CardTitle>
              <CardDescription>
                Canonical backend-owned state and the next action required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {onboarding ? (
                <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      State
                    </dt>
                    <dd>
                      <OnboardingBadge state={onboarding.state} />
                    </dd>
                  </div>
                  <DetailItem
                    label="Next action"
                    value={formatLabel(onboarding.next_action)}
                  />
                  <DetailItem
                    label="Product authoring"
                    value={
                      onboarding.product_authoring_ready ? "Ready" : "Blocked"
                    }
                  />
                  <DetailItem label="Onboarding ID" value={onboarding.uuid} />
                </dl>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No onboarding record is linked to this vendor.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Store context</CardTitle>
              <CardDescription>
                Store details become available after store creation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.store ? (
                <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="Name"
                    value={renderValue(user.store.name)}
                  />
                  <DetailItem
                    label="Store type"
                    value={renderValue(user.store.store_type_name)}
                  />
                  <DetailItem
                    label="Email"
                    value={renderValue(user.store.email)}
                  />
                  <DetailItem
                    label="Phone"
                    value={renderValue(user.store.phone)}
                  />
                  <DetailItem
                    label="Slug"
                    value={renderValue(user.store.slug)}
                  />
                  <DetailItem
                    label="Short name"
                    value={renderValue(user.store.short_name)}
                  />
                  <DetailItem
                    label="Description"
                    value={renderValue(user.store.short_description)}
                  />
                  <DetailItem
                    label="City"
                    value={renderValue(user.store.city)}
                  />
                  <DetailItem
                    label="Province"
                    value={renderValue(user.store.province)}
                  />
                  <DetailItem
                    label="Country"
                    value={renderValue(user.store.country)}
                  />
                  <DetailItem
                    label="Store status"
                    value={formatLabel(user.store_status)}
                  />
                  <DetailItem
                    label="Assigned categories"
                    value={String(user.store.category_count ?? 0)}
                  />
                  <DetailItem
                    label="Product authoring"
                    value={
                      storeProductAuthoringReady === undefined
                        ? "Not available"
                        : storeProductAuthoringReady
                          ? "Ready"
                          : "Blocked"
                    }
                  />
                </dl>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No store is linked to this vendor yet. The onboarding tab
                  shows the prerequisite state.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <AdminUserRoleManagementCard
            userUuid={user.uuid}
            roles={user.roles}
            hasStore={user.has_store}
            audience={audience}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
