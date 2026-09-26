import WorkspaceStoreFilter from "@/modules/auth/components/server/WorkspaceStoreFilter";
import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { flattenSearchParams } from "@/modules/core/utils/searchParams";
import { actionGetOrders } from "@/modules/order.management/actions/actionGetOrders";
import { actionGetOrderStatuses } from "@/modules/order.management/actions/actionGetOrderStatuses";
import OrdersServerTable from "@/modules/order.management/components/client/order/OrdersServerTable";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const flattenedParams = flattenSearchParams(resolvedSearchParams);
  const page = Number(flattenedParams.page ?? "1");
  const sessionUser = await requireWorkspaceCapability(
    "canViewOrders",
    "/orders",
  );
  const canManageWholeOrder = sessionUser.roles.some(
    (role) => role.name === "super-admin",
  );

  const [ordersResponse, statusOptionsResponse] = await Promise.all([
    actionGetOrders({
      ...flattenedParams,
      page: Number.isFinite(page) && page > 0 ? page : 1,
    }),
    canManageWholeOrder ? actionGetOrderStatuses() : Promise.resolve([]),
  ]);

  const orders =
    ordersResponse &&
    typeof ordersResponse === "object" &&
    "orders" in ordersResponse
      ? ordersResponse.orders
      : null;
  const table =
    ordersResponse &&
    typeof ordersResponse === "object" &&
    "table" in ordersResponse
      ? ordersResponse.table
      : null;
  const statusOptions = Array.isArray(statusOptionsResponse)
    ? statusOptionsResponse
    : [];

  return (
    <PageContainer
      pageTitle="Manage Orders"
      actionSlot={
        <WorkspaceStoreFilter
          actionPath="/orders"
          parameterName="filter[store_uuid]"
          preservedParameters={flattenedParams}
          selectedStoreUuid={flattenedParams["filter[store_uuid]"]}
          stores={sessionUser.authorized_stores.map(({ uuid, name }) => ({
            uuid,
            name,
          }))}
        />
      }
    >
      <OrdersServerTable
        rows={orders?.data ?? []}
        table={
          table ?? {
            search: {
              queryKey: "filter[order_number]",
              placeholder: "Search orders by order number...",
            },
            filters: [],
          }
        }
        initialFilters={Object.fromEntries(
          Object.entries(flattenedParams).filter(([key]) => key !== "page"),
        )}
        pagination={{
          currentPage: Number(orders?.current_page ?? 1),
          perPage: orders?.per_page ? Number(orders.per_page) : null,
          from: orders?.from ?? null,
          to: orders?.to ?? null,
          hasNextPage: Boolean(orders?.next_page_url),
          hasPreviousPage: Boolean(orders?.prev_page_url),
        }}
        statusOptions={statusOptions}
        canManageWholeOrder={canManageWholeOrder}
      />
    </PageContainer>
  );
}
