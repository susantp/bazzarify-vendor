import TenantMembersManager from "@/modules/auth/components/server/TenantMembersManager";
import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import { actionGetTenantMembers } from "@/modules/auth/domain/tenant-membership-actions";
import ErrorComponent from "@/modules/core/components/client/ErrorComponent";
import PageContainer from "@/modules/core/components/server/PageContainer";

export default async function WorkspaceMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const user = await requireWorkspaceCapability(
    "canManageTenantMembers",
    "/workspace/members",
  );
  const [response, params] = await Promise.all([
    actionGetTenantMembers(),
    searchParams,
  ]);

  return (
    <PageContainer pageTitle="Workspace members">
      {"error" in response ? (
        <ErrorComponent err={response.error} />
      ) : (
        <TenantMembersManager
          currentUserUuid={user.uuid}
          error={params.error}
          memberships={response.memberships}
          stores={user.authorized_stores.map(({ uuid, name }) => ({
            uuid,
            name,
          }))}
          updated={params.updated}
        />
      )}
    </PageContainer>
  );
}
