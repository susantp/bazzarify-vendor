import { IRoute } from "@/modules/core";

const adminTicket: IRoute["adminTicket"] = {
  index: {
    path: "/admin-workflow/tickets",
  },
  show: {
    path: "/admin-workflow/tickets/:uuid",
  },
  update: {
    path: "/admin-workflow/tickets/:uuid",
    method: "PATCH",
  },
  comments: {
    path: "/admin-workflow/tickets/:uuid/comments",
    method: "POST",
  },
};

export default adminTicket;
