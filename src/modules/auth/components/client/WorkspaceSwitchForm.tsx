"use client";

import type { TSessionUser } from "@/modules/auth/domain/schemas/UserSchema";
import { actionSwitchWorkspace } from "@/modules/auth/domain/workspace-actions";
import { useRouter } from "next/navigation";

type TenantWorkspace = TSessionUser["tenants"][number];

type Props = {
  canUsePlatformWorkspace: boolean;
  currentTenantUuid: string | null;
  tenants: TenantWorkspace[];
};

export default function WorkspaceSwitchForm({
  canUsePlatformWorkspace,
  currentTenantUuid,
  tenants,
}: Props) {
  const router = useRouter();

  if (tenants.length === 0 && !canUsePlatformWorkspace) {
    return null;
  }

  return (
    <form
      action={async (formData) => {
        await actionSwitchWorkspace(formData);
        router.refresh();
      }}
      className="space-y-2"
    >
      <label
        className="flex flex-col gap-1 text-xs font-medium text-sidebar-foreground"
        htmlFor="workspace-picker"
      >
        Workspace
        <select
          className="h-9 rounded-md border border-sidebar-border bg-sidebar px-2 text-sm"
          key={currentTenantUuid ?? "platform"}
          defaultValue={
            currentTenantUuid ?? (canUsePlatformWorkspace ? "platform" : "")
          }
          id="workspace-picker"
          name="tenant_uuid"
        >
          {!currentTenantUuid && !canUsePlatformWorkspace ? (
            <option value="">Choose a workspace</option>
          ) : null}
          {canUsePlatformWorkspace ? (
            <option value="platform">Platform</option>
          ) : null}
          {tenants.map((tenant) => (
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
  );
}
