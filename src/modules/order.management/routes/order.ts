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
  itemFulfillment: {
    path: "/order-management/orders/:orderId/items/:itemId/fulfillment",
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
