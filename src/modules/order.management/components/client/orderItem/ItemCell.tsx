import { TOrderItem } from "@/modules/order.management/schemas/orderSchema";

interface Props {
  item: TOrderItem;
  className?: string;
}
const ItemCell = ({ item, className }: Props) => {
  const variant = item.variant_attributes;
  const variantDetails: [string, string | null | undefined][] = [
    ["Variant", variant?.name],
    ["SKU", variant?.sku],
    ["Color", variant?.color],
    ["Size", variant?.size],
  ];
  const options = variantDetails
    .filter(([, value]) => typeof value === "string" && value.trim() !== "")
    .map(([label, value]) => `${label}: ${value}`)
    .join(", ");
  const store = item.store ? <p>Store: {item.store.name}</p> : null;
  return (
    <div className={className}>
      <p className="font-semibold">{item.name}</p>
      {options ? <p>{options}</p> : null}
      {store}
    </div>
  );
};
export default ItemCell;
