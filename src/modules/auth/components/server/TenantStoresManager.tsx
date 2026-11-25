import { Button } from "@/components/ui/button";
import DeliveryConfigurationForm from "@/modules/auth/components/client/DeliveryConfigurationForm";
import type {
  StoreDeliveryPolicyPayloadSchema,
  TenantDeliveryPolicyPayloadSchema,
} from "@/modules/auth/domain/schemas/TenantDeliveryPolicySchema";
import {
  actionCreateTenantStore,
  actionUpdateTenantStoreDeliveryPolicy,
} from "@/modules/auth/domain/tenant-store-actions";
import type {
  TAvailableStoreType,
  TTenantStoreSummary,
} from "@/modules/vendor/domain/schemas/tenant-store";
import Link from "next/link";
import type { z } from "zod";

export default function TenantStoresManager({
  stores,
  storeTypes,
  updated,
  error,
  tenantDelivery,
  selectedStoreUuid,
  storeDelivery,
}: {
  stores: TTenantStoreSummary[];
  storeTypes: TAvailableStoreType[];
  updated?: string;
  error?: string;
  tenantDelivery:
    | z.infer<typeof TenantDeliveryPolicyPayloadSchema>["delivery_policy"]
    | null;
  selectedStoreUuid?: string;
  storeDelivery: z.infer<typeof StoreDeliveryPolicyPayloadSchema> | null;
}) {
  return (
    <div className="grid gap-8">
      {updated ? (
        <p
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm"
          role="status"
        >
          {updated === "delivery-policy"
            ? "Store delivery policy updated."
            : "Tenant-owned store created. Assign an accepted vendor from Workspace members."}
        </p>
      ) : null}
      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          The store could not be created. Check the details and active store
          type, then try again.
        </p>
      ) : null}

      <section className="grid gap-4 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">Tenant delivery defaults</h2>
        {tenantDelivery ? (
          <DeliveryConfigurationForm
            storeUuid={null}
            configuration={tenantDelivery.configuration}
            active={tenantDelivery.active}
            version={tenantDelivery.version}
          />
        ) : (
          <p role="alert">Delivery defaults could not be loaded.</p>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">Create a tenant store</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          The tenant owns each store. Assign an accepted vendor after creating
          it.
        </p>
        <form
          action={actionCreateTenantStore}
          className="grid gap-4 md:max-w-xl"
        >
          <label className="grid gap-1 text-sm">
            Store name
            <input
              className="h-9 rounded-md border bg-background px-3"
              maxLength={255}
              name="name"
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            Store type
            <select
              className="h-9 rounded-md border bg-background px-2"
              name="store_type_uuid"
              required
            >
              <option value="">Select a store type</option>
              {storeTypes.map((type) => (
                <option key={type.uuid} value={type.uuid}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Contact email
            <input
              autoComplete="email"
              className="h-9 rounded-md border bg-background px-3"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Contact phone
            <input
              autoComplete="tel"
              className="h-9 rounded-md border bg-background px-3"
              name="phone"
              required
              type="tel"
            />
          </label>
          <div>
            <Button disabled={storeTypes.length === 0} type="submit">
              Create store
            </Button>
          </div>
          {storeTypes.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No active store type has configured sellable categories.
            </p>
          ) : null}
        </form>
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-semibold">Tenant stores</h2>
          <p className="text-sm text-muted-foreground">
            Stores and assigned vendors in this workspace.
          </p>
        </div>
        {stores.length === 0 ? (
          <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
            No stores have been created.
          </p>
        ) : (
          stores.map((store) => (
            <article
              className="grid gap-1 rounded-lg border bg-card p-5"
              key={store.uuid}
            >
              <h3 className="font-medium">{store.name}</h3>
              <form
                action={actionUpdateTenantStoreDeliveryPolicy}
                className="mt-3 grid gap-2 sm:max-w-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
              >
                <input name="store_uuid" type="hidden" value={store.uuid} />
                <label className="grid gap-1 text-sm">
                  Delivery managed by
                  <select
                    className="h-9 rounded-md border bg-background px-2"
                    defaultValue={store.delivery_mode}
                    name="mode"
                  >
                    <option value="tenant_managed">Tenant team</option>
                    <option value="vendor_managed">Assigned vendor</option>
                  </select>
                </label>
                <Button size="sm" type="submit" variant="outline">
                  Save delivery policy
                </Button>
              </form>
              {selectedStoreUuid === store.uuid ? (
                <section className="my-4 grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-medium">Delivery overrides</h4>
                    <Link
                      className="text-sm underline"
                      href="/workspace/stores"
                    >
                      Close overrides
                    </Link>
                  </div>
                  {storeDelivery ? (
                    <DeliveryConfigurationForm
                      key={store.uuid}
                      storeUuid={store.uuid}
                      configuration={
                        storeDelivery.delivery_policy?.configuration ?? null
                      }
                      effective={storeDelivery.effective.configuration}
                      version={storeDelivery.delivery_policy?.version ?? 0}
                    />
                  ) : (
                    <p role="alert">
                      Store delivery overrides could not be loaded.
                    </p>
                  )}
                </section>
              ) : (
                <Link
                  className="my-2 w-fit text-sm underline"
                  href={`/workspace/stores?deliveryStore=${store.uuid}`}
                >
                  Configure delivery overrides
                </Link>
              )}
              <p className="text-sm text-muted-foreground">
                {store.assigned_vendor?.name ?? "No vendor assigned"}
              </p>
              {store.assigned_vendor?.email ? (
                <p className="text-sm text-muted-foreground">
                  {store.assigned_vendor.email}
                </p>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
