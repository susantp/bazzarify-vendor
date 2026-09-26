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
import { actionUpdateOrderItemFulfillment } from "@/modules/order.management/actions/actionUpdateOrderItemFulfillment";
import ItemCell from "@/modules/order.management/components/client/orderItem/ItemCell";
import useOrderShow from "@/modules/order.management/hooks/order/useOrderShow";
import { TOrder } from "@/modules/order.management/schemas/orderSchema";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function Show({
  order,
  canFulfillOrders,
  canManageWholeOrder,
}: {
  order: TOrder;
  canFulfillOrders: boolean;
  canManageWholeOrder: boolean;
}) {
  const {
    isPending,
    optimisticStatus,
    statusOptions,
    handleOrderStatusChange,
  } = useOrderShow({ order, canManageWholeOrder });
  const router = useRouter();
  const [isItemActionPending, startItemAction] = useTransition();
  const scopedItemCount = order.items.length;
  const scopedQuantity = order.items.reduce(
    (total, item) => total + item.qty_ordered,
    0,
  );
  const scopedTotals = order.store_scoped_totals ?? {
    sub_total: 0,
    discount_total: 0,
    tax_total: 0,
    shipping_total: 0,
    grand_total: 0,
  };
  const canOfferFulfillmentActions = canFulfillOrders && !canManageWholeOrder;

  const itemRemainingQuantity = (item: TOrder["items"][number]) =>
    Math.max(0, item.qty_ordered - item.qty_canceled - item.qty_shipped);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Order Details</CardTitle>
        <CardDescription>
          {canManageWholeOrder
            ? "Manage full order information and platform-level status."
            : "Review the items in this order that belong to your store."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic information</CardTitle>
            <CardDescription>
              {canManageWholeOrder
                ? "View full order details and manage order status."
                : "View the platform order identifier and your scoped fulfillment slice."}
            </CardDescription>
            {canManageWholeOrder ? (
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
              {canManageWholeOrder ? "Total Items" : "Your Store Items"}:{" "}
              {canManageWholeOrder ? order.item_count : scopedItemCount}
            </p>
            <p>
              {canManageWholeOrder
                ? "Total Ordered Quantity"
                : "Your Store Quantity"}
              : {canManageWholeOrder ? order.item_quantity : scopedQuantity}
            </p>
            <p>Placed At: {order.placed_at}</p>
            {!canManageWholeOrder ? (
              <p className="text-sm text-muted-foreground">
                Whole-order status is platform-managed. You are only viewing the
                items assigned to your store.
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
              {canManageWholeOrder
                ? "Payment information"
                : "Your Store Totals"}
            </CardTitle>
            <CardDescription>
              {canManageWholeOrder
                ? "View payment details"
                : "These totals are calculated from the items visible to your store."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Sub Total:{" "}
              {canManageWholeOrder ? order.sub_total : scopedTotals.sub_total}
            </p>
            <p>
              Discount:{" "}
              {canManageWholeOrder
                ? order.discount_total
                : scopedTotals.discount_total}
            </p>
            <p>
              Tax:{" "}
              {canManageWholeOrder ? order.tax_total : scopedTotals.tax_total}
            </p>
            {canManageWholeOrder ? (
              <>
                <p>Shipping: {order.shipping_total}</p>
                <p>Method: {order.payment_method}</p>
                <p>Type: {order.payment_status}</p>
                <p>Fee: {order.payment_fee}</p>
                <p>Grand Total: {order.grand_total}</p>
              </>
            ) : (
              <>
                <p>Shipping: {scopedTotals.shipping_total}</p>
                <p>Your Total: {scopedTotals.grand_total}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="grid md:col-span-2 grid-cols-1">
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
            <CardDescription>View order items.</CardDescription>
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
                  {canOfferFulfillmentActions ? (
                    <TableHead>Item Actions</TableHead>
                  ) : null}
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
                    {canOfferFulfillmentActions ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={
                              isItemActionPending ||
                              itemRemainingQuantity(item) === 0
                            }
                            onClick={() => {
                              startItemAction(async () => {
                                const result =
                                  await actionUpdateOrderItemFulfillment(
                                    order.uuid,
                                    item.uuid,
                                    "ship_remaining",
                                    `Store item marked shipped for ${item.name}.`,
                                  );

                                if (!("error" in result)) {
                                  router.refresh();
                                }
                              });
                            }}
                          >
                            Ship Remaining
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              isItemActionPending ||
                              itemRemainingQuantity(item) === 0
                            }
                            onClick={() => {
                              startItemAction(async () => {
                                const result =
                                  await actionUpdateOrderItemFulfillment(
                                    order.uuid,
                                    item.uuid,
                                    "cancel_remaining",
                                    `Store item canceled for ${item.name}.`,
                                  );

                                if (!("error" in result)) {
                                  router.refresh();
                                }
                              });
                            }}
                          >
                            Cancel Remaining
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="text-end bg-transparent">
                <TableRow>
                  <TableCell className="text-left">Sub Total</TableCell>
                  <TableCell
                    colSpan={
                      canManageWholeOrder
                        ? 5
                        : canOfferFulfillmentActions
                          ? 6
                          : 5
                    }
                  >
                    {canManageWholeOrder
                      ? order.sub_total
                      : scopedTotals.sub_total}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left">Discount</TableCell>
                  <TableCell
                    colSpan={
                      canManageWholeOrder
                        ? 5
                        : canOfferFulfillmentActions
                          ? 6
                          : 5
                    }
                  >
                    {canManageWholeOrder
                      ? order.discount_total
                      : scopedTotals.discount_total}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left">Tax</TableCell>
                  <TableCell
                    colSpan={
                      canManageWholeOrder
                        ? 5
                        : canOfferFulfillmentActions
                          ? 6
                          : 5
                    }
                  >
                    {canManageWholeOrder
                      ? order.tax_total
                      : scopedTotals.tax_total}
                  </TableCell>
                </TableRow>
                {canManageWholeOrder ? (
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
                      <TableCell colSpan={canOfferFulfillmentActions ? 6 : 5}>
                        {scopedTotals.shipping_total}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-left">Your Total</TableCell>
                      <TableCell colSpan={canOfferFulfillmentActions ? 6 : 5}>
                        {scopedTotals.grand_total}
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
