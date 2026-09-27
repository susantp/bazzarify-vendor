import { actionListAdminTickets } from "@/modules/admin/workflow/actions/adminTicket";
import type { TAdminTicket } from "@/modules/admin/workflow/schemas/AdminTicketSchema";
import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import ErrorComponent from "@/modules/core/components/client/ErrorComponent";
import ServerDataTable from "@/modules/core/components/client/ServerDataTable";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { TServerDataTableMeta } from "@/modules/core/domain/schemas/ServerDataTableMeta";
import { flattenSearchParams } from "@/modules/core/utils/searchParams";

const ticketTable: TServerDataTableMeta = {
  search: {
    queryKey: "search",
    placeholder: "Search ticket title, description, or comments...",
  },
  filters: [
    {
      type: "select",
      key: "type",
      label: "Type",
      options: [{ label: "Product review", value: "product_review" }],
    },
    {
      type: "select",
      key: "status",
      label: "Status",
      options: [
        { label: "Open", value: "open" },
        { label: "In review", value: "in_review" },
        { label: "Changes requested", value: "changes_requested" },
        { label: "Approved", value: "approved" },
        { label: "Closed", value: "closed" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      type: "select",
      key: "priority",
      label: "Urgency",
      options: [
        { label: "Low", value: "low" },
        { label: "Normal", value: "normal" },
        { label: "High", value: "high" },
        { label: "Urgent", value: "urgent" },
      ],
    },
    {
      type: "date-range",
      key: "created_at",
      label: "Submitted",
      fromKey: "from",
      toKey: "to",
      maxMonths: 12,
    },
  ],
};

const ticketColumns = [
  { key: "type", title: "Type" },
  { key: "title", title: "Ticket" },
  { key: "priority", title: "Urgency" },
  { key: "status", title: "Status" },
  { key: "requester.name", title: "Requester" },
  { key: "submitted_at", title: "Submitted" },
];

export default async function ProductReviewTicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireWorkspaceCapability("canReviewProducts", "/products/reviews");
  const resolvedSearchParams = await searchParams;
  const filters = flattenSearchParams(resolvedSearchParams);
  const response = await actionListAdminTickets(filters);

  if ("error" in response) {
    return (
      <PageContainer pageTitle="Product Review Tickets">
        <ErrorComponent err={response.error} />
      </PageContainer>
    );
  }

  return (
    <PageContainer pageTitle="Product Review Tickets">
      <ServerDataTable<TAdminTicket>
        title="Product Review Tickets"
        description="Review submissions are tracked as tickets so administrators can filter, assign, comment, and transition them independently from authoring."
        columns={ticketColumns}
        rows={response.tickets}
        emptyMessage="No tickets match the current filters."
        table={ticketTable}
        initialFilters={Object.fromEntries(
          Object.entries(filters).filter(([key]) => key !== "page"),
        )}
        pagination={{
          currentPage: response.pagination.current_page,
          perPage: response.pagination.per_page,
          from:
            response.tickets.length === 0
              ? null
              : (response.pagination.current_page - 1) *
                  response.pagination.per_page +
                1,
          to:
            response.tickets.length === 0
              ? null
              : (response.pagination.current_page - 1) *
                  response.pagination.per_page +
                response.tickets.length,
          hasNextPage:
            response.pagination.current_page < response.pagination.last_page,
          hasPreviousPage: response.pagination.current_page > 1,
        }}
        rowActions={[
          { label: "Open", hrefTemplate: "/products/reviews/:uuid" },
        ]}
      />
    </PageContainer>
  );
}
