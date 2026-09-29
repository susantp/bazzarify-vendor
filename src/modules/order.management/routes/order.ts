import { IRoute } from "@/modules/core";

const order: IRoute["order"] = {
  index: {
    path: "/order-management/orders",
  },
  show: {
    path: "/order-management/orders/:orderId",
  },
  update: {
    path: "/order-management/orders/:orderId",
  },
  deliveryEvent: {
    path: "/order-management/orders/:orderId/delivery-units/:unitId/events",
  },
  deliveryQueue: {
    path: "/order-management/delivery-units",
  },
  deliveryRuns: {
    path: "/order-management/delivery-runs",
  },
  deliveryRunAssignment: {
    path: "/order-management/delivery-runs/:runId/assignment",
  },
  itemRefunds: {
    path: "/order-management/orders/:orderId/allocations/:allocationId/items/:itemId/refunds",
  },
  refundDecision: {
    path: "/order-management/orders/:orderId/refunds/:refundId",
  },
  refundConfirmReturned: {
    path: "/order-management/orders/:orderId/refunds/:refundId/confirm-returned",
  },
  statuses: {
    path: "/order-management/orders/statuses",
  },
};
export default order;
