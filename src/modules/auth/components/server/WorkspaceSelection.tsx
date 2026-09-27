import { TSessionUser } from "@/modules/auth/domain/schemas/UserSchema";
import {
  actionAcceptTenantInvitation,
  actionSelectWorkspace,
} from "@/modules/auth/domain/workspace-actions";

type TenantInvitation = {
  membership_uuid: string;
  tenant: { uuid: string; name: string; slug: string };
  invited_at: string | null;
};

export default function WorkspaceSelection({
  user,
  invitations = [],
  error,
}: {
  user: TSessionUser;
  invitations?: TenantInvitation[];
  error?: string;
}) {
  const errorMessage =
    error === "invalid-workspace"
      ? "That workspace is not available to this account."
      : error === "membership-unavailable"
        ? "Your workspace access could not be verified. Choose again."
        : error === "invalid-invitation" || error === "invitation-unavailable"
          ? "That invitation is no longer available. Refresh and try again."
          : null;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Choose a workspace</h1>
        <p className="text-sm text-muted-foreground">
          Select the business workspace you want to work in. Your access is
          checked again by Bazarify when each request is made.
        </p>
      </header>
      {errorMessage ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      <div className="grid gap-3">
        {user.tenants.map((tenant) => (
          <form
            action={actionSelectWorkspace}
            className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4"
            key={tenant.uuid}
          >
            <input name="tenant_uuid" type="hidden" value={tenant.uuid} />
            <div className="min-w-0">
              <h2 className="truncate font-medium">{tenant.name}</h2>
              <p className="text-sm text-muted-foreground">
                {tenant.roles
                  .map((role) => role.replaceAll("-", " "))
                  .join(", ")}
                {" · "}
                {tenant.authorized_stores.length} authorized stores
              </p>
            </div>
            <button
              className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              type="submit"
            >
              Open workspace
            </button>
          </form>
        ))}
      </div>
      {user.tenants.length === 0 && invitations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No business workspace or invitation is available for this account yet.
        </p>
      ) : null}
      {invitations.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Invitations</h2>
          {invitations.map((invitation) => (
            <form
              action={actionAcceptTenantInvitation}
              className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4"
              key={invitation.membership_uuid}
            >
              <input
                name="membership_uuid"
                type="hidden"
                value={invitation.membership_uuid}
              />
              <div className="min-w-0">
                <h3 className="truncate font-medium">
                  {invitation.tenant.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Invitation to join this business workspace
                </p>
              </div>
              <button
                className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                type="submit"
              >
                Accept invitation
              </button>
            </form>
          ))}
        </div>
      ) : null}
    </section>
  );
}
