import WorkspaceSelection from "@/modules/auth/components/server/WorkspaceSelection";
import { getSessionUser } from "@/modules/auth/data/auth-service";
import { actionGetTenantInvitations } from "@/modules/auth/domain/workspace-actions";
import { redirect } from "next/navigation";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [{ error }, invitations] = await Promise.all([
    searchParams,
    actionGetTenantInvitations(),
  ]);

  return (
    <WorkspaceSelection user={user} invitations={invitations} error={error} />
  );
}
