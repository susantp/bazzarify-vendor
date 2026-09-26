import { TSessionUser } from "@/modules/auth/domain/schemas/UserSchema";
import { actionSelectWorkspace } from "@/modules/auth/domain/workspace-actions";
import Link from "next/link";

function canUsePlatformWorkspace(user: TSessionUser): boolean {
  return user.platform_roles.some(
    (role) => role === "admin" || role === "super-admin",
  );
}

export default function WorkspaceSwitcher({ user }: { user: TSessionUser }) {
  return (
    <div className="space-y-2 px-4 pb-3">
      {user.tenants.length > 0 || canUsePlatformWorkspace(user) ? (
        <form action={actionSelectWorkspace} className="space-y-2">
          <label
            className="flex flex-col gap-1 text-xs font-medium text-sidebar-foreground"
            htmlFor="workspace-picker"
          >
            Workspace
            <select
              className="h-9 rounded-md border border-sidebar-border bg-sidebar px-2 text-sm"
              defaultValue={
                user.current_tenant_uuid ??
                (canUsePlatformWorkspace(user) ? "platform" : "")
              }
              id="workspace-picker"
              name="tenant_uuid"
            >
              {!user.current_tenant_uuid && !canUsePlatformWorkspace(user) ? (
                <option value="">Choose a workspace</option>
              ) : null}
              {canUsePlatformWorkspace(user) ? (
                <option value="platform">Platform</option>
              ) : null}
              {user.tenants.map((tenant) => (
                <option key={tenant.uuid} value={tenant.uuid}>
                  {tenant.name} ({tenant.authorized_stores.length} stores)
                </option>
              ))}
            </select>
          </label>
          <button
            className="w-full rounded-md bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground hover:opacity-90"
            type="submit"
          >
            Switch workspace
          </button>
        </form>
      ) : null}
      {user.current_tenant_uuid ? (
        <ul
          aria-label="Authorized stores in this workspace"
          className="space-y-1 px-3 text-xs text-sidebar-foreground/80"
        >
          {user.tenants
            .find((tenant) => tenant.uuid === user.current_tenant_uuid)
            ?.authorized_stores.map((store) => (
              <li className="truncate" key={store.uuid} title={store.name}>
                {store.name}
              </li>
            ))}
        </ul>
      ) : null}
      <Link
        className="block rounded-md px-3 py-2 text-center text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
        href="/workspace"
      >
        Workspace and invitations
      </Link>
    </div>
  );
}
