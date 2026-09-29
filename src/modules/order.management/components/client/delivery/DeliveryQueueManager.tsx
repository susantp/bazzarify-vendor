"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TTenantMembership } from "@/modules/auth/domain/schemas/TenantMembershipSchema";
import {
  actionCreateDeliveryRun,
  actionReassignDeliveryRun,
} from "@/modules/order.management/actions/actionDeliveryOperations";
import { createOrderIdempotencyKey } from "@/modules/order.management/domain/idempotency-key";
import type { TDeliveryUnitSummary } from "@/modules/order.management/schemas/deliverySchema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type Operator = TTenantMembership;

function canAssign(units: TDeliveryUnitSummary[], operator: Operator): boolean {
  return (
    operator.status === "active" &&
    operator.roles.includes("operator") &&
    operator.delivery_execution_enabled &&
    units.every((unit) => operator.store_uuids.includes(unit.store_uuid))
  );
}

function isAvailable(unit: TDeliveryUnitSummary): boolean {
  return (
    unit.mode === "tenant_managed" &&
    unit.delivery_run_uuid === null &&
    ["preparing", "ready_for_handoff", "handed_off"].includes(unit.status)
  );
}

export default function DeliveryQueueManager({
  units,
  memberships,
}: {
  units: TDeliveryUnitSummary[];
  memberships: Operator[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedUnitUuids, setSelectedUnitUuids] = useState<string[]>([]);
  const [trackingReference, setTrackingReference] = useState("");
  const [createAssigneeUuid, setCreateAssigneeUuid] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedUnits = useMemo(
    () => units.filter((unit) => selectedUnitUuids.includes(unit.uuid)),
    [selectedUnitUuids, units],
  );
  const eligibleOperators = useMemo(
    () =>
      memberships.filter((membership) => canAssign(selectedUnits, membership)),
    [memberships, selectedUnits],
  );
  const runs = useMemo(() => {
    const grouped = new Map<string, TDeliveryUnitSummary[]>();
    for (const unit of units) {
      if (!unit.delivery_run_uuid) continue;
      const group = grouped.get(unit.delivery_run_uuid) ?? [];
      group.push(unit);
      grouped.set(unit.delivery_run_uuid, group);
    }
    return [...grouped.entries()].map(([uuid, runUnits]) => ({
      uuid,
      units: runUnits,
    }));
  }, [units]);

  function toggleUnit(uuid: string, checked: boolean) {
    setSelectedUnitUuids((current) =>
      checked
        ? [...new Set([...current, uuid])]
        : current.filter((item) => item !== uuid),
    );
  }

  function createRun() {
    if (!createAssigneeUuid || selectedUnits.length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await actionCreateDeliveryRun({
        unit_uuids: selectedUnits.map((unit) => unit.uuid),
        assigned_user_uuid: createAssigneeUuid,
        ...(trackingReference.trim()
          ? { tracking_reference: trackingReference.trim() }
          : {}),
        idempotency_key: createOrderIdempotencyKey(),
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSelectedUnitUuids([]);
      setTrackingReference("");
      router.refresh();
    });
  }

  function reassignRun(runUuid: string, assigneeUuid: string) {
    if (!assigneeUuid) return;
    setError(null);
    startTransition(async () => {
      const result = await actionReassignDeliveryRun({
        run_uuid: runUuid,
        assigned_user_uuid: assigneeUuid,
        idempotency_key: createOrderIdempotencyKey(),
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const availableUnits = units.filter(isAvailable);

  return (
    <div className="grid gap-6">
      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 rounded-lg border bg-card p-5">
        <div>
          <h2 className="text-lg font-semibold">Create shared delivery run</h2>
          <p className="text-sm text-muted-foreground">
            Combine prepared deliveries from stores in this tenant and assign
            them to an operator who has access to every selected store.
          </p>
        </div>
        {availableUnits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No unassigned tenant-managed deliveries are ready for a run.
          </p>
        ) : (
          <div className="grid gap-3">
            {availableUnits.map((unit) => (
              <label
                className="flex gap-3 rounded-md border p-3"
                key={unit.uuid}
              >
                <input
                  checked={selectedUnitUuids.includes(unit.uuid)}
                  className="mt-1"
                  onChange={(event) =>
                    toggleUnit(unit.uuid, event.target.checked)
                  }
                  type="checkbox"
                />
                <span className="grid min-w-0 gap-1 text-sm">
                  <span className="font-medium">
                    {unit.store_name || "Store"} ·{" "}
                    {unit.status.replaceAll("_", " ")}
                  </span>
                  <span className="break-all text-muted-foreground">
                    Order{" "}
                    <Link
                      className="underline underline-offset-2"
                      href={`/orders/${unit.order_uuid}`}
                    >
                      {unit.order_uuid}
                    </Link>
                  </span>
                  {unit.items.map((item) => (
                    <span
                      className="text-muted-foreground"
                      key={item.order_item_uuid}
                    >
                      {item.name || "Order item"}:{" "}
                      {item.prepared - item.handed_off} prepared,{" "}
                      {item.handed_off - item.delivered} awaiting delivery
                    </span>
                  ))}
                </span>
              </label>
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="grid gap-1 text-sm">
            Assigned operator
            <select
              className="h-9 rounded-md border bg-background px-2"
              onChange={(event) => setCreateAssigneeUuid(event.target.value)}
              value={createAssigneeUuid}
            >
              <option value="">Select an eligible operator</option>
              {eligibleOperators.map((operator) => (
                <option key={operator.uuid} value={operator.user.uuid}>
                  {operator.user.name || operator.user.email || "Operator"}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Tracking reference{" "}
            <span className="text-muted-foreground">(optional)</span>
            <Input
              maxLength={120}
              onChange={(event) => setTrackingReference(event.target.value)}
              value={trackingReference}
            />
          </label>
          <Button
            disabled={
              pending || !createAssigneeUuid || selectedUnits.length === 0
            }
            onClick={createRun}
            type="button"
          >
            Assign shared run
          </Button>
        </div>
        {selectedUnits.length > 0 && eligibleOperators.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Enable delivery access and assign an operator to every selected
            store in Workspace members.
          </p>
        ) : null}
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-semibold">Active shared runs</h2>
          <p className="text-sm text-muted-foreground">
            Reassignment applies to every store delivery in the run and is
            recorded in the event history.
          </p>
        </div>
        {runs.length === 0 ? (
          <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
            No shared delivery runs have been assigned.
          </p>
        ) : (
          runs.map((run) => {
            const currentAssigneeUuid = run.units[0]?.assigned_user_uuid ?? "";
            const candidates = memberships.filter((member) =>
              canAssign(run.units, member),
            );
            return (
              <article
                className="grid gap-3 rounded-lg border bg-card p-5"
                key={run.uuid}
              >
                <div>
                  <h3 className="font-medium">
                    Shared run · {run.units.length} store deliveries
                  </h3>
                  {run.units.map((unit) => (
                    <p
                      className="text-sm text-muted-foreground"
                      key={unit.uuid}
                    >
                      {unit.store_name || "Store"} ·{" "}
                      {unit.status.replaceAll("_", " ")}
                    </p>
                  ))}
                </div>
                <label className="grid gap-1 text-sm sm:max-w-sm">
                  Reassign operator
                  <select
                    className="h-9 rounded-md border bg-background px-2"
                    defaultValue={currentAssigneeUuid}
                    key={`${run.uuid}:${currentAssigneeUuid}`}
                    onChange={(event) =>
                      reassignRun(run.uuid, event.target.value)
                    }
                  >
                    {candidates.map((operator) => (
                      <option key={operator.uuid} value={operator.user.uuid}>
                        {operator.user.name ||
                          operator.user.email ||
                          "Operator"}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
