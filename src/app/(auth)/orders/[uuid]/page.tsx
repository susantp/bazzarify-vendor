import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import { getWorkspaceCapabilities } from "@/modules/auth/domain/workspace-capabilities";
import BackLinkButton from "@/modules/core/components/server/BackLinkButton";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { actionGetOrder } from "@/modules/order.management/actions/actionGetOrder";
import Show from "@/modules/order.management/components/client/order/Show";
import { Suspense } from "react";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const sessionUser = await requireWorkspaceCapability(
    "canViewOrders",
    `/orders/${uuid}`,
  );
  const capabilities = getWorkspaceCapabilities(sessionUser);
  const order = await actionGetOrder(uuid);
  if (!order) {
    return <div>Loading...</div>;
  }
  if ("error" in order) {
    return <div>Something went wrong.</div>;
  }
  const canManageWholeOrder = sessionUser.roles.some(
    (role) => role.name === "super-admin",
  );
  return (
    <PageContainer
      pageTitle={`Order ${order.order_number}`}
      actionSlot={<BackLinkButton href="/orders" label="Back to Orders" />}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <Show
          order={order}
          canFulfillOrders={capabilities.canFulfillOrders}
          canManageWholeOrder={canManageWholeOrder}
        />
      </Suspense>
    </PageContainer>
  );
}
