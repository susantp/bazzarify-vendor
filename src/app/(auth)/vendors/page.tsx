import UsersServerTable from "@/modules/admin/users/components/client/UsersServerTable";
import { actionGetUsers } from "@/modules/auth/domain/auth-actions";
import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { TServerDataTableMeta } from "@/modules/core/domain/schemas/ServerDataTableMeta";
import { flattenSearchParams } from "@/modules/core/utils/searchParams";

const VENDOR_ROLE = "vendor";
const DISALLOWED_FILTER_KEYS = new Set(["filter[role]"]);

function stripRoleFilter(
  table: TServerDataTableMeta | null,
): TServerDataTableMeta | null {
  if (!table) {
    return null;
  }

  return {
    ...table,
    filters: table.filters.filter(
      (filter) => !DISALLOWED_FILTER_KEYS.has(filter.key),
    ),
  };
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireWorkspaceCapability("canManagePlatformVendors", "/vendors");

  const resolvedSearchParams = await searchParams;
  const incomingParams = flattenSearchParams(resolvedSearchParams);
  const flattenedParams: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(incomingParams).filter(
        ([key]) => !DISALLOWED_FILTER_KEYS.has(key),
      ),
    ),
    "filter[role]": VENDOR_ROLE,
  };
  const page = Number(flattenedParams.page ?? "1");
  const usersResponse = await actionGetUsers({
    ...flattenedParams,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });
  const rows =
    usersResponse &&
    typeof usersResponse === "object" &&
    "users" in usersResponse
      ? (usersResponse.users.data ?? [])
      : [];
  const users =
    usersResponse &&
    typeof usersResponse === "object" &&
    "users" in usersResponse
      ? usersResponse.users
      : null;
  const table =
    usersResponse &&
    typeof usersResponse === "object" &&
    "table" in usersResponse
      ? stripRoleFilter(usersResponse.table)
      : null;

  return (
    <PageContainer pageTitle="Manage Vendors">
      <UsersServerTable
        rows={rows}
        table={
          table ?? {
            search: {
              queryKey: "filter[name]",
              placeholder: "Search vendors by name, email, or phone...",
            },
            filters: [],
          }
        }
        initialFilters={Object.fromEntries(
          Object.entries(flattenedParams).filter(([key]) => key !== "page"),
        )}
        title="Manage Vendors"
        description="Browse vendor accounts with email and phone search plus server-driven pagination."
        emptyMessage="No vendors found for the current filters."
        detailHrefTemplate="/vendors/:uuid"
        showVendorColumns={true}
        pagination={{
          currentPage: Number(users?.current_page ?? 1),
          perPage: users?.per_page ? Number(users.per_page) : null,
          from: users?.from ?? null,
          to: users?.to ?? null,
          hasNextPage: Boolean(users?.next_page_url),
          hasPreviousPage: Boolean(users?.prev_page_url),
        }}
      />
    </PageContainer>
  );
}
