import { actionGetAdminTicket } from "@/modules/admin/workflow/actions/adminTicket";
import AdminTicketDetail from "@/modules/admin/workflow/components/client/AdminTicketDetail";
import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import ErrorComponent from "@/modules/core/components/client/ErrorComponent";
import BackLinkButton from "@/modules/core/components/server/BackLinkButton";
import PageContainer from "@/modules/core/components/server/PageContainer";

export default async function ProductReviewTicketPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  await requireWorkspaceCapability("canReviewProducts", "/products/reviews");
  const { uuid } = await params;
  const response = await actionGetAdminTicket(uuid);

  if ("error" in response) {
    return (
      <PageContainer pageTitle="Product Review Ticket">
        <ErrorComponent err={response.error} />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      pageTitle="Product Review Ticket"
      actionSlot={
        <BackLinkButton href="/products/reviews" label="Back to tickets" />
      }
    >
      <AdminTicketDetail ticket={response} />
    </PageContainer>
  );
}
