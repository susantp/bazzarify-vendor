"use client";

import { TAdminUserListItem } from "@/modules/auth/domain/schemas/payloads/AdminUserIndexPayloadSchema";
import { TableColumn } from "@/modules/core/components/client/DynamicTable";
import ServerDataTable from "@/modules/core/components/client/ServerDataTable";
import { TServerDataTableMeta } from "@/modules/core/domain/schemas/ServerDataTableMeta";

function formatOnboardingLabel(value: string | undefined): string {
  return value ? value.replaceAll("_", " ") : "Not available";
}

const identityColumns: TableColumn<TAdminUserListItem>[] = [
  { key: "name", title: "Name" },
  { key: "email", title: "Email" },
  { key: "phone", title: "Phone" },
  { key: "authType", title: "Auth Type" },
];

const vendorColumns: TableColumn<TAdminUserListItem>[] = [
  {
    key: "roles",
    title: "Roles",
    render: (_, record) => record.roles.join(", ") || "-",
  },
  {
    key: "has_store",
    title: "Store",
    render: (value) => (value ? "Yes" : "No"),
  },
  {
    key: "store_status",
    title: "Store Readiness",
    render: (value) =>
      value === "ready"
        ? "Ready"
        : value === "needs_categories"
          ? "Needs Categories"
          : "No Store",
  },
  {
    key: "onboarding_state",
    title: "Onboarding",
    render: (_, record) =>
      formatOnboardingLabel(
        record.onboarding?.state ?? record.store?.onboarding?.state,
      ),
  },
  {
    key: "onboarding_next_action",
    title: "Next Action",
    render: (_, record) =>
      formatOnboardingLabel(
        record.onboarding?.next_action ?? record.store?.onboarding?.next_action,
      ),
  },
  { key: "created_at", title: "Created At" },
];

const consumerColumns: TableColumn<TAdminUserListItem>[] = [
  ...identityColumns,
  { key: "created_at", title: "Created At" },
];

interface UsersServerTableProps {
  rows: TAdminUserListItem[];
  table: TServerDataTableMeta;
  initialFilters: Record<string, string>;
  title?: string;
  description?: string;
  emptyMessage?: string;
  detailHrefTemplate?: string;
  showVendorColumns?: boolean;
  pagination: {
    currentPage: number;
    perPage?: number | null;
    from?: number | string | null;
    to?: number | string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export default function UsersServerTable({
  rows,
  table,
  initialFilters,
  title = "Manage Users",
  description = "Browse platform users with backend-owned filters and server-driven pagination.",
  emptyMessage = "No users found for the current filters.",
  detailHrefTemplate = "/users/:uuid",
  showVendorColumns = false,
  pagination,
}: UsersServerTableProps) {
  return (
    <ServerDataTable
      title={title}
      description={description}
      columns={
        showVendorColumns
          ? [...identityColumns, ...vendorColumns]
          : consumerColumns
      }
      rows={rows}
      emptyMessage={emptyMessage}
      table={table}
      initialFilters={initialFilters}
      pagination={pagination}
      rowActions={[
        { label: "View", hrefTemplate: detailHrefTemplate, variant: "default" },
      ]}
    />
  );
}
