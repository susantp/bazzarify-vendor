import WorkspaceSwitchForm from "@/modules/auth/components/client/WorkspaceSwitchForm";
import type { TSessionUser } from "@/modules/auth/domain/schemas/UserSchema";
import Link from "next/link";

function canUsePlatformWorkspace(user: TSessionUser): boolean {
  return user.platform_roles.some(
    (role) => role === "admin" || role === "super-admin",
  );
}

export default function WorkspaceSwitcher({ user }: { user: TSessionUser }) {
  return (
    <div className="space-y-2 px-4 pb-3">
      <WorkspaceSwitchForm
        canUsePlatformWorkspace={canUsePlatformWorkspace(user)}
        currentTenantUuid={user.current_tenant_uuid}
        tenants={user.tenants}
      />
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
