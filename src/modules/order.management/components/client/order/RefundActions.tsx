"use client";

import { Button } from "@/components/ui/button";
import {
  actionConfirmStoreOrderRefundReturned,
  actionDecideStoreOrderRefund,
  actionRequestStoreOrderRefund,
} from "@/modules/order.management/actions/actionManageStoreOrderRefund";
import type { TOrder } from "@/modules/order.management/schemas/orderSchema";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type OrderItem = TOrder["items"][number];

export default function RefundActions({
  orderUuid,
  item,
  canRequest,
  canManage,
}: {
  orderUuid: string;
  item: OrderItem;
  canRequest: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [receiptReference, setReceiptReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const requestKey = useRef<string | null>(null);
  const returnKeys = useRef<Record<string, string>>({});
  const allocationUuid = item.payment_allocation_uuid;
  const hasActiveRefund = item.refund_cases.some(
    (refundCase) =>
      refundCase.status === "requested" || refundCase.status === "approved",
  );
  const canOpenRequest =
    canRequest &&
    !hasActiveRefund &&
    item.refund_policy_enabled === true &&
    !!allocationUuid &&
    item.payment_allocation_method === "cod" &&
    item.payment_allocation_status === "collected";

  const runAction = (
    action: () => Promise<unknown>,
    onSuccess?: () => void,
  ) => {
    setError(null);
    startTransition(() => {
      void action().then((result) => {
        if (result && typeof result === "object" && "error" in result) {
          setError(String(result.error));
          return;
        }
        onSuccess?.();
        router.refresh();
      });
    });
  };

  return (
    <section className="mt-4 space-y-3 border-t pt-3">
      <h3 className="text-sm font-semibold">Refunds</h3>
      {item.refund_cases.length ? (
        <ul className="space-y-2 text-sm">
          {item.refund_cases.map((refundCase) => (
            <li
              key={refundCase.uuid}
              className="space-y-2 rounded-md bg-muted p-3"
            >
              <p>
                {refundCase.status.replaceAll("_", " ")} ·{" "}
                {refundCase.requested_quantity} item(s) ·{" "}
                {(refundCase.amount_minor / 100).toFixed(2)}
              </p>
              <p className="text-muted-foreground">{refundCase.reason}</p>
              {refundCase.decision_note ? (
                <p className="text-muted-foreground">
                  Admin note: {refundCase.decision_note}
                </p>
              ) : null}
              {canManage && refundCase.return_receipt_reference ? (
                <p className="text-muted-foreground">
                  Return receipt: {refundCase.return_receipt_reference}
                </p>
              ) : null}
              {canManage && refundCase.status === "requested" ? (
                <div className="space-y-2">
                  <textarea
                    aria-label={`Decision note for refund ${refundCase.uuid}`}
                    className="min-h-16 w-full rounded-md border bg-background p-2 text-sm"
                    maxLength={500}
                    placeholder="Optional decision note"
                    value={decisionNote}
                    onChange={(event) => setDecisionNote(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() =>
                        runAction(() =>
                          actionDecideStoreOrderRefund(
                            orderUuid,
                            refundCase.uuid,
                            "approve",
                            decisionNote,
                          ),
                        )
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() =>
                        runAction(() =>
                          actionDecideStoreOrderRefund(
                            orderUuid,
                            refundCase.uuid,
                            "decline",
                            decisionNote,
                          ),
                        )
                      }
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ) : null}
              {canManage && refundCase.status === "approved" ? (
                <div className="flex flex-wrap gap-2">
                  <input
                    aria-label={`Return receipt reference for refund ${refundCase.uuid}`}
                    className="min-w-56 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                    maxLength={120}
                    placeholder="Cash return receipt reference"
                    value={receiptReference}
                    onChange={(event) => {
                      setReceiptReference(event.target.value);
                      delete returnKeys.current[refundCase.uuid];
                    }}
                  />
                  <Button
                    size="sm"
                    disabled={isPending || receiptReference.trim().length === 0}
                    onClick={() =>
                      runAction(
                        () => {
                          const idempotencyKey =
                            returnKeys.current[refundCase.uuid] ??
                            (returnKeys.current[refundCase.uuid] =
                              crypto.randomUUID());
                          return actionConfirmStoreOrderRefundReturned(
                            orderUuid,
                            refundCase.uuid,
                            receiptReference,
                            idempotencyKey,
                          );
                        },
                        () => delete returnKeys.current[refundCase.uuid],
                      )
                    }
                  >
                    Confirm cash returned
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No refund requests.</p>
      )}

      {canOpenRequest ? (
        <div className="grid gap-2 sm:grid-cols-[8rem_1fr_auto]">
          <input
            aria-label={`Refund quantity for ${item.name}`}
            className="rounded-md border bg-background px-3 py-2 text-sm"
            min={1}
            max={item.qty_ordered - item.qty_refunded}
            type="number"
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value);
              requestKey.current = null;
            }}
          />
          <textarea
            aria-label={`Refund reason for ${item.name}`}
            className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm"
            maxLength={500}
            placeholder="Reason for refund"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              requestKey.current = null;
            }}
          />
          <Button
            size="sm"
            disabled={
              isPending ||
              Number(quantity) < 1 ||
              Number(quantity) > item.qty_ordered - item.qty_refunded ||
              reason.trim().length === 0
            }
            onClick={() =>
              runAction(
                () => {
                  const idempotencyKey =
                    requestKey.current ??
                    (requestKey.current = crypto.randomUUID());
                  return actionRequestStoreOrderRefund(
                    orderUuid,
                    allocationUuid,
                    item.uuid,
                    Number(quantity),
                    reason,
                    idempotencyKey,
                  );
                },
                () => {
                  requestKey.current = null;
                },
              )
            }
          >
            Request refund
          </Button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
