import { OrderResponseSchema } from "@/modules/order.management/schemas/orderSchema";
import { z } from "zod";

export const OrderShowPayloadSchema = z
  .object({
    order: OrderResponseSchema.nullable(),
  })
  .strict();
