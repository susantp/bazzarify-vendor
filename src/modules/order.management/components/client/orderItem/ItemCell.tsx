import { toTitleCase } from "@/modules/core/utils";
import { TOrderItem } from "@/modules/order.management/schemas/orderSchema";

interface Props {
  item: TOrderItem;
  className?: string;
}
const ItemCell = ({ item, className }: Props) => {
  const optionAttributes =
    typeof item.variant_attributes === "string"
      ? JSON.parse(item.variant_attributes || "{}")
      : {};
  const options = Object.keys(optionAttributes).length ? (
    <p>
      {Object.entries(optionAttributes)
        .map(([key, value]) => `${toTitleCase(key)}: ${value}`)
        .join(", ")}
    </p>
  ) : null;
  const store = item.store ? <p>Store: {item.store.name}</p> : null;
  return (
    <div className={className}>
      <p className="font-semibold">{item.name}</p>
      {options}
      {store}
    </div>
  );
};
export default ItemCell;
