import type { TDeliveryPromise } from "@/modules/order.management/schemas/deliverySchema";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

export default function formatDeliveryPromise(
  promise: TDeliveryPromise,
): string {
  return `Estimated delivery: ${formatDate(promise.estimate_from)} – ${formatDate(promise.estimate_to)} (${promise.timezone})`;
}
