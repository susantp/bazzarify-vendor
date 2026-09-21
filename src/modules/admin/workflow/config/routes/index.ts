import adminTicket from "@/modules/admin/workflow/config/routes/adminTicket";
import { IRoute } from "@/modules/core";

export const ADMIN_WORKFLOW_ROUTES: Pick<IRoute, "adminTicket"> = {
  adminTicket,
};
