"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actionRecordDeliveryEvent } from "@/modules/order.management/actions/actionRecordDeliveryEvent";
import { createOrderIdempotencyKey } from "@/modules/order.management/domain/idempotency-key";
import type { TOrder } from "@/modules/order.management/schemas/orderSchema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DeliveryUnit = TOrder["delivery_units"][number];
type DeliveryItem = DeliveryUnit["items"][number];
type QuantityEvent = "prepared" | "handed_off" | "delivered" | "canceled";

function remainingFor(unit: DeliveryUnit, item: DeliveryItem): number {
  if (unit.status === "delivered" || unit.status === "canceled") return 0;
  return Math.max(0, item.quantity - item.canceled - item.handed_off);
}

function DeliveryItemActions({
  orderUuid,
  unit,
  item,
}: {
  orderUuid: string;
  unit: DeliveryUnit;
  item: DeliveryItem;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const available = remainingFor(unit, item);
  const awaitingDelivery = Math.max(0, item.handed_off - item.delivered);
  const awaitingHandoff = Math.max(0, item.prepared - item.handed_off);

  const record = (type: QuantityEvent, maximum: number) => {
    if (quantity < 1 || quantity > maximum) {
      setError(`Choose a quantity from 1 to ${maximum}.`);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await actionRecordDeliveryEvent(
        orderUuid,
        unit.uuid,
        type,
        createOrderIdempotencyKey(),
        item.order_item_uuid,
        quantity,
      );
      if ("error" in result) {
        setError(
          "The delivery update could not be saved. Review the current quantity and try again.",
        );
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="grid gap-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{item.name || "Order item"}</p>
          <p className="text-xs text-muted-foreground">
            Ordered {item.quantity} · Prepared {item.prepared} · Handed off{" "}
            {item.handed_off} · Delivered {item.delivered} · Canceled{" "}
            {item.canceled}
          </p>
        </div>
        <Input
          aria-label={`Quantity for ${item.name || "order item"}`}
          className="w-24"
          max={Math.max(available, awaitingHandoff, awaitingDelivery, 1)}
          min={1}
          onChange={(event) => setQuantity(Number(event.target.value))}
          type="number"
          value={quantity}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={pending || available === 0}
          onClick={() => record("prepared", available)}
          size="sm"
          type="button"
        >
          Mark prepared
        </Button>
        <Button
          disabled={pending || awaitingHandoff === 0}
          onClick={() => record("handed_off", awaitingHandoff)}
          size="sm"
          type="button"
          variant="outline"
        >
          Hand off
        </Button>
        {unit.mode === "vendor_managed" ? (
          <Button
            disabled={pending || awaitingDelivery === 0}
            onClick={() => record("delivered", awaitingDelivery)}
            size="sm"
            type="button"
            variant="outline"
          >
            Mark delivered
          </Button>
        ) : null}
        <Button
          disabled={pending || available === 0}
          onClick={() => record("canceled", available)}
          size="sm"
          type="button"
          variant="ghost"
        >
          Cancel remaining
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function DeliveryUnitsPanel({
  orderUuid,
  units,
  canManage,
}: {
  orderUuid: string;
  units: DeliveryUnit[];
  canManage: boolean;
}) {
  if (units.length === 0) return null;

  return (
    <section className="mb-4 grid gap-3 rounded-lg border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">Delivery progress</h2>
        <p className="text-sm text-muted-foreground">
          Progress is recorded per store so partial fulfillment remains visible.
        </p>
      </div>
      {units.map((unit) => (
        <article className="grid gap-3 rounded-md border p-4" key={unit.uuid}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-medium">
                {unit.store_name || "Store delivery"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {unit.mode.replaceAll("_", " ")} ·{" "}
                {unit.status.replaceAll("_", " ")}
                {unit.tracking_reference ? ` · ${unit.tracking_reference}` : ""}
              </p>
            </div>
          </div>
          {unit.items.map((item) =>
            canManage && unit.mode === "vendor_managed" ? (
              <DeliveryItemActions
                item={item}
                key={item.order_item_uuid}
                orderUuid={orderUuid}
                unit={unit}
              />
            ) : (
              <p
                className="rounded-md bg-muted p-3 text-sm"
                key={item.order_item_uuid}
              >
                {item.name || "Order item"}: {item.delivered} of{" "}
                {item.quantity - item.canceled} delivered
              </p>
            ),
          )}
          <ol
            aria-label={`${unit.store_name || "Store"} delivery events`}
            className="grid gap-1 text-xs text-muted-foreground"
          >
            {unit.events.map((event) => (
              <li key={event.uuid}>{event.type.replaceAll("_", " ")}</li>
            ))}
          </ol>
        </article>
      ))}
    </section>
  );
}
