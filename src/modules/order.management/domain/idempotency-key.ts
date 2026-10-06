import { v4 as uuidv4 } from "uuid";

export function createOrderIdempotencyKey(): string {
  return uuidv4();
}
