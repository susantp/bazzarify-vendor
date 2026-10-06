"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toTitleCase } from "@/modules/core/utils";
import DeliveryUnitsPanel from "@/modules/order.management/components/client/order/DeliveryUnitsPanel";
import RefundActions from "@/modules/order.management/components/client/order/RefundActions";
import ItemCell from "@/modules/order.management/components/client/orderItem/ItemCell";
import useOrderShow from "@/modules/order.management/hooks/order/useOrderShow";
import { TOrder } from "@/modules/order.management/schemas/orderSchema";

export default function Show({
  order,
  canFulfillOrders,
  canManageWholeOrder,
  canRequestRefunds,
  canManageRefunds,
}: {
  order: TOrder;
  canFulfillOrders: boolean;
  canManageWholeOrder: boolean;
  canRequestRefunds: boolean;
  canManageRefunds: boolean;
}) {
  const {
    isPending,
    optimisticStatus,
    statusOptions,
    handleOrderStatusChange,
  } = useOrderShow({ order, canManageWholeOrder });
  const isFullOrder = order.response_scope === "full_order";
  const allocationStoreNames = new Map(
    order.items.map((item) => [
      item.store_uuid,
      item.store?.name ?? "Visible store",
    ]),
  );
  const orderSummary =
    order.response_scope === "authorized_stores"
      ? {
          itemCount: order.scoped_summary.item_count,
          itemQuantity: order.scoped_summary.item_quantity,
          totals: order.scoped_summary.totals,
        }
      : {
          itemCount: order.item_count,
          itemQuantity: order.item_quantity,
          totals: {
            sub_total: order.sub_total,
            discount_total: order.discount_total,
            tax_total: order.tax_total,
            shipping_total: order.shipping_total,
            grand_total: order.grand_total,
          },
        };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Order Details</CardTitle>
        <CardDescription>
          {isFullOrder
            ? "Manage full order information and platform-level status."
            : "Review items in this order for stores you are authorized to access."}
        </CardDescription>
      </CardHeader>
      <DeliveryUnitsPanel
        canManage={canFulfillOrders && !canManageWholeOrder}
        orderUuid={order.uuid}
        units={order.delivery_units}
      />
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic information</CardTitle>
            <CardDescription>
              {isFullOrder
                ? "View full order details and manage order status."
                : "View the platform order identifier and your authorized-store fulfillment slice."}
            </CardDescription>
            {canManageWholeOrder && isFullOrder ? (
              <CardAction>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="default" disabled={!statusOptions.length}>
                      Update Status
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full flex flex-col space-y-3">
                    {statusOptions.length ? (
                      statusOptions.map((status) => (
                        <Button
                          key={status.code}
                          value={status.code}
                          data-note={`Order marked as ${status.label.toLowerCase()} by super admin.`}
                          onClick={handleOrderStatusChange}
                          variant="outline"
                        >
                          {status.label}
                        </Button>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No statuses available.
                      </p>
                    )}
                  </PopoverContent>
                </Popover>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent>
            <p>Order Number: {order.order_number}</p>
            <p>Status: {isPending ? "Updating status..." : optimisticStatus}</p>
            <p>
              {isFullOrder ? "Total Items" : "Visible Items"}:{" "}
              {orderSummary.itemCount}
            </p>
            <p>
              {isFullOrder ? "Total Ordered Quantity" : "Visible Quantity"}:{" "}
              {orderSummary.itemQuantity}
            </p>
            <p>Placed At: {order.placed_at}</p>
            {!isFullOrder ? (
              <p className="text-sm text-muted-foreground">
                Whole-order status is platform-managed. This view contains only
                items from stores you are authorized to access.
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buyer information</CardTitle>
            <CardDescription>View buyer details</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Name: {order.buyer?.name}</p>
            <p>Email: {order.buyer?.email}</p>
            <p>Phone: {order.buyer?.phone}</p>
          </CardContent>
        </Card>
        {order.shipping_information && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping Information</CardTitle>
              <CardDescription>View order shipping information</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(order.shipping_information).map(
                ([key, value]) => (
                  <p key={key}>
                    {toTitleCase(key)}: {value}
                  </p>
                ),
              )}
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isFullOrder ? "Payment information" : "Visible store totals"}
            </CardTitle>
            <CardDescription>
              {isFullOrder
                ? "View payment details"
                : "Totals and allocations cover only your authorized stores."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Sub Total:{" "}
              {isFullOrder ? order.sub_total : orderSummary.totals.sub_total}
            </p>
            <p>
              Discount:{" "}
              {isFullOrder
                ? order.discount_total
                : orderSummary.totals.discount_total}
            </p>
            <p>
              Tax:{" "}
              {isFullOrder ? order.tax_total : orderSummary.totals.tax_total}
            </p>
            {isFullOrder ? (
              <>
                <p>Shipping: {order.shipping_total}</p>
                <p>Method: {order.payment_method}</p>
                <p>Type: {order.payment_status}</p>
                <p>Fee: {order.payment_fee}</p>
                <p>Grand Total: {order.grand_total}</p>
              </>
            ) : (
              <>
                <p>Shipping: {orderSummary.totals.shipping_total}</p>
                <p>Visible Total: {orderSummary.totals.grand_total}</p>
              </>
            )}
            {order.payment_allocations.map((allocation) => (
              <p key={allocation.uuid}>
                Collection for{" "}
                {allocationStoreNames.get(allocation.store_uuid) ??
                  "visible store"}
                : {(allocation.amount_minor / 100).toFixed(2)} ·{" "}
                {allocation.status}
              </p>
            ))}
          </CardContent>
        </Card>
        <Card className="grid md:col-span-2 grid-cols-1">
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
            <CardDescription>
              {isFullOrder
                ? "View all order items by store."
                : "View items from stores you are authorized to access."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Shipping fee</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order?.items?.map((item) => (
                  <TableRow key={item.uuid}>
                    <TableCell>
                      <Accordion
                        type="single"
                        collapsible
                        className="w-full"
                        defaultValue="item-1"
                      >
                        <AccordionItem value={item.uuid}>
                          <AccordionTrigger>
                            <p className="truncate w-72">{item.name}</p>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ItemCell
                              item={item}
                              className="flex flex-col w-72 gap-4 text-balance"
                            />
                            <RefundActions
                              orderUuid={order.uuid}
                              item={item}
                              canRequest={canRequestRefunds}
                              canManage={canManageRefunds}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.unit_price}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.qty_ordered}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.row_discount}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.row_shipping}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.row_total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="text-end bg-transparent">
                <TableRow>
                  <TableCell className="text-left">Sub Total</TableCell>
                  <TableCell colSpan={5}>
                    {isFullOrder
                      ? order.sub_total
                      : orderSummary.totals.sub_total}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left">Discount</TableCell>
                  <TableCell colSpan={5}>
                    {isFullOrder
                      ? order.discount_total
                      : orderSummary.totals.discount_total}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left">Tax</TableCell>
                  <TableCell colSpan={5}>
                    {isFullOrder
                      ? order.tax_total
                      : orderSummary.totals.tax_total}
                  </TableCell>
                </TableRow>
                {isFullOrder ? (
                  <>
                    <TableRow>
                      <TableCell className="text-left">Shipping</TableCell>
                      <TableCell colSpan={5}>{order.shipping_total}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left">Payment Fee</TableCell>
                      <TableCell colSpan={5}>{order.payment_fee}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left">Grand Total</TableCell>
                      <TableCell colSpan={5}>{order.grand_total}</TableCell>
                    </TableRow>
                  </>
                ) : (
                  <>
                    <TableRow>
                      <TableCell className="text-left">Shipping</TableCell>
                      <TableCell colSpan={5}>
                        {orderSummary.totals.shipping_total}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left">Visible Total</TableCell>
                      <TableCell colSpan={5}>
                        {orderSummary.totals.grand_total}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
