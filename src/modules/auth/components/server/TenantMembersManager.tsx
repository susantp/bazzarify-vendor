import { Button } from "@/components/ui/button";
import type { TTenantMembership } from "@/modules/auth/domain/schemas/TenantMembershipSchema";
import {
  actionDeactivateTenantMember,
  actionInviteTenantMember,
  actionUpdateTenantMember,
} from "@/modules/auth/domain/tenant-membership-actions";

const TENANT_ROLES = [
  { value: "tenant-admin", label: "Tenant admin" },
  { value: "sales-manager", label: "Sales manager" },
  { value: "operator", label: "Operator" },
  { value: "vendor", label: "Vendor" },
] as const;

type StoreOption = { uuid: string; name: string };

function RoleAndStoresFields({
  stores,
  role,
  selectedStoreUuids = [],
}: {
  stores: StoreOption[];
  role?: string;
  selectedStoreUuids?: string[];
}) {
  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        Role
        <select
          className="h-9 rounded-md border bg-background px-2"
          defaultValue={
            TENANT_ROLES.some((item) => item.value === role)
              ? role
              : "sales-manager"
          }
          name="role"
        >
          {TENANT_ROLES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Operator store access</legend>
        <p className="text-xs text-muted-foreground">
          Select stores only when the role is Operator.
        </p>
        {stores.map((store) => (
          <label className="flex items-center gap-2 text-sm" key={store.uuid}>
            <input
              defaultChecked={selectedStoreUuids.includes(store.uuid)}
              name="store_uuids"
              type="checkbox"
              value={store.uuid}
            />
            {store.name}
          </label>
        ))}
        {stores.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Add a store before inviting or assigning an operator.
          </p>
        ) : null}
      </fieldset>
    </div>
  );
}

export default function TenantMembersManager({
  memberships,
  stores,
  currentUserUuid,
  updated,
  error,
}: {
  memberships: TTenantMembership[];
  stores: StoreOption[];
  currentUserUuid: string;
  updated?: string;
  error?: string;
}) {
  return (
    <div className="grid gap-8">
      {updated ? (
        <p
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm"
          role="status"
        >
          Workspace membership updated.
        </p>
      ) : null}
      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          The membership change could not be saved. Check the role and store
          assignments, then try again.
        </p>
      ) : null}

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">Invite a member</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Invitations are sent to existing Bazarify accounts.
        </p>
        <form action={actionInviteTenantMember} className="grid gap-4">
          <label className="grid gap-1 text-sm">
            Email address
            <input
              autoComplete="email"
              className="h-9 rounded-md border bg-background px-3"
              name="email"
              required
              type="email"
            />
          </label>
          <RoleAndStoresFields stores={stores} />
          <div>
            <Button type="submit">Send invitation</Button>
          </div>
        </form>
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">
            Roles and operator store access apply to this workspace only.
          </p>
        </div>
        {memberships.map((membership) => {
          const currentRole = membership.roles[0] ?? "sales-manager";
          return (
            <article
              className="grid gap-4 rounded-lg border bg-card p-5"
              key={membership.uuid}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">
                    {membership.user.name || membership.user.email || "Account"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {membership.user.email ?? "No email"} · {membership.status}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {TENANT_ROLES.find((item) => item.value === currentRole)
                    ?.label ?? currentRole}
                </p>
              </div>
              {membership.status === "active" ? (
                <div className="grid gap-4 border-t pt-4 md:grid-cols-[minmax(0,1fr)_auto]">
                  <form
                    action={actionUpdateTenantMember}
                    className="grid gap-4"
                  >
                    <input
                      name="membership_uuid"
                      type="hidden"
                      value={membership.uuid}
                    />
                    <RoleAndStoresFields
                      role={currentRole}
                      selectedStoreUuids={membership.store_uuids}
                      stores={stores}
                    />
                    <div>
                      <Button size="sm" type="submit" variant="outline">
                        Save role and access
                      </Button>
                    </div>
                  </form>
                  {membership.user.uuid !== currentUserUuid ? (
                    <form action={actionDeactivateTenantMember}>
                      <input
                        name="membership_uuid"
                        type="hidden"
                        value={membership.uuid}
                      />
                      <Button size="sm" type="submit" variant="destructive">
                        Remove member
                      </Button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
        {memberships.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No members are available in this workspace.
          </p>
        ) : null}
      </section>
    </div>
  );
}
