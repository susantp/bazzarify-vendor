"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TableColumn } from "@/modules/core/components/client/DynamicTable";
import ServerDataTable from "@/modules/core/components/client/ServerDataTable";
import { TServerDataTableMeta } from "@/modules/core/domain/schemas/ServerDataTableMeta";
import { TOrderStatusOption } from "@/modules/order.management/actions/actionGetOrderStatuses";
import { actionUpdateOrderStatus } from "@/modules/order.management/actions/actionUpdateOrderStatus";
import { TOrderList } from "@/modules/order.management/schemas/orderSchema";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type OrderListItem = TOrderList[number];

interface OrdersServerTableProps {
  rows: OrderListItem[];
  table: TServerDataTableMeta;
  initialFilters: Record<string, string>;
  pagination: {
    currentPage: number;
    perPage?: number | null;
    from?: number | string | null;
    to?: number | string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  statusOptions: TOrderStatusOption[];
  canManageWholeOrder: boolean;
}

export default function OrdersServerTable({
  rows,
  table,
  initialFilters,
  pagination,
  statusOptions,
  canManageWholeOrder,
}: OrdersServerTableProps) {
  const router = useRouter();
  const [isUpdatingStatus, startStatusUpdate] = useTransition();
  const includesFullOrderRows = rows.some(
    (record) => record.response_scope === "full_order",
  );
  const scopedRows = rows.some(
    (record) => record.response_scope === "authorized_stores",
  );

  const columns: TableColumn<OrderListItem>[] = [
    {
      key: "order_number",
      title: "Order Number",
    },
    {
      key: "items",
      title: includesFullOrderRows ? "Total items" : "Visible items",
      render: (_, record) => {
        return record.response_scope === "authorized_stores"
          ? record.scoped_summary.item_count
          : record.item_count;
      },
    },
    {
      key: "placed_at",
      title: "Placed At",
      render: (value) => {
        if (typeof value !== "string" || value.length === 0) {
          return "-";
        }

        return new Date(value).toLocaleDateString();
      },
    },
    {
      key: "status",
      title: "Status",
    },
    ...(includesFullOrderRows
      ? [{ key: "payment_method", title: "Payment Method" }]
      : []),
    {
      key: "grand_total",
      title: includesFullOrderRows ? "Total" : "Visible total",
      align: "right",
      render: (_, record) => {
        const total =
          record.response_scope === "authorized_stores"
            ? record.scoped_summary.totals.grand_total
            : record.grand_total;

        return total.toFixed(2);
      },
    },
    {
      key: "buyer.name",
      title: "Buyer",
      render: (_, record) => {
        const buyer = record.buyer;
        return buyer?.name ?? buyer?.email ?? "-";
      },
    },
  ];

  if (canManageWholeOrder) {
    columns.push({
      key: "__status_actions",
      title: "Status Action",
      align: "right",
      render: (_, record) =>
        record.response_scope === "full_order" ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdatingStatus || statusOptions.length === 0}
              >
                Update Status
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex w-56 flex-col gap-2">
              {statusOptions.map((statusOption) => (
                <Button
                  key={statusOption.code}
                  variant="outline"
                  onClick={() => {
                    startStatusUpdate(async () => {
                      const result = await actionUpdateOrderStatus(
                        record.uuid,
                        statusOption.code,
                        `Order marked as ${statusOption.label.toLowerCase()} by super admin.`,
                      );

                      if (!("error" in result)) {
                        router.refresh();
                      }
                    });
                  }}
                >
                  {statusOption.label}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        ) : null,
    });
  }

  return (
    <ServerDataTable
      title={canManageWholeOrder ? "Manage Orders" : "Authorized Store Orders"}
      description={
        canManageWholeOrder
          ? "Manage orders with server-driven filters, pagination, and backend-owned query behavior."
          : scopedRows
            ? "Review order items and totals from stores you are authorized to access. Whole-order status changes remain platform-admin controlled."
            : "No store-scoped orders are available for the current filters."
      }
      columns={columns}
      rows={rows}
      emptyMessage={
        canManageWholeOrder
          ? "No orders found for the current filters."
          : "No store-authorized orders found for the current filters."
      }
      table={table}
      initialFilters={initialFilters}
      pagination={pagination}
      rowActions={[
        { label: "View", hrefTemplate: "/orders/:uuid", variant: "default" },
      ]}
    />
  );
}
