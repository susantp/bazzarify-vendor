import UsersServerTable from "@/modules/admin/users/components/client/UsersServerTable";
import { actionGetUsers } from "@/modules/auth/domain/auth-actions";
import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { TServerDataTableMeta } from "@/modules/core/domain/schemas/ServerDataTableMeta";
import { flattenSearchParams } from "@/modules/core/utils/searchParams";

const DISALLOWED_FILTER_KEYS = new Set([
  "filter[role]",
  "filter[role_scope]",
  "filter[has_store]",
  "filter[store_status]",
]);

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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireWorkspaceCapability("canManagePlatformUsers", "/users");

  const resolvedSearchParams = await searchParams;
  const incomingParams = flattenSearchParams(resolvedSearchParams);
  const flattenedParams: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(incomingParams).filter(
        ([key]) => !DISALLOWED_FILTER_KEYS.has(key),
      ),
    ),
    "filter[role_scope]": "consumer_or_roleless",
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
    <PageContainer pageTitle="Manage Consumers">
      <UsersServerTable
        rows={rows}
        table={
          table ?? {
            search: {
              queryKey: "filter[name]",
              placeholder: "Search consumers by name, email, or phone...",
            },
            filters: [],
          }
        }
        initialFilters={Object.fromEntries(
          Object.entries(flattenedParams).filter(([key]) => key !== "page"),
        )}
        title="Manage Consumers"
        description="Browse consumer accounts and unresolved roleless users with email and phone search plus server-driven pagination."
        emptyMessage="No consumers or unresolved user accounts found for the current filters."
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
