import { ServerDataTableMetaSchema } from "@/modules/core/domain/schemas/ServerDataTableMeta";
import { SimplePaginatedSchema } from "@/modules/core/schemas/SimplePaginated";
import { OrderListItemSchema } from "@/modules/order.management/schemas/orderSchema";
import { z } from "zod";

export const OrderListPayloadSchema = z
  .object({
    orders: SimplePaginatedSchema(OrderListItemSchema).nullable(),
    table: ServerDataTableMetaSchema,
  })
  .strict();
