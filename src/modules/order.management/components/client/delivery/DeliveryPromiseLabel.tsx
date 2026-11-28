import type { TDeliveryPromise } from "@/modules/order.management/schemas/deliverySchema";
import formatDeliveryPromise from "@/modules/order.management/utils/formatDeliveryPromise";

export default function DeliveryPromiseLabel({
  promise,
}: {
  promise: TDeliveryPromise | null;
}) {
  if (!promise) return null;

  return (
    <span className="block text-xs text-muted-foreground">
      {formatDeliveryPromise(promise)}
    </span>
  );
}
