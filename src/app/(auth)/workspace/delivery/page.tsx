import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import { actionGetTenantMembers } from "@/modules/auth/domain/tenant-membership-actions";
import ErrorComponent from "@/modules/core/components/client/ErrorComponent";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { actionGetDeliveryQueue } from "@/modules/order.management/actions/actionDeliveryOperations";
import DeliveryQueueManager from "@/modules/order.management/components/client/delivery/DeliveryQueueManager";

export default async function WorkspaceDeliveryPage() {
  await requireWorkspaceCapability(
    "canManageTenantMembers",
    "/workspace/delivery",
  );
  const [queue, memberResult] = await Promise.all([
    actionGetDeliveryQueue(),
    actionGetTenantMembers(),
  ]);

  return (
    <PageContainer pageTitle="Workspace delivery">
      {"error" in queue ? (
        <ErrorComponent err={queue.error} />
      ) : "error" in memberResult ? (
        <ErrorComponent err={memberResult.error} />
      ) : (
        <DeliveryQueueManager
          memberships={memberResult.memberships}
          units={queue.delivery_units}
        />
      )}
    </PageContainer>
  );
}
