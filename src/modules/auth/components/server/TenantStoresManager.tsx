import { Button } from "@/components/ui/button";
import { actionCreateTenantStore } from "@/modules/auth/domain/tenant-store-actions";
import type {
  TAvailableStoreType,
  TTenantStoreSummary,
} from "@/modules/vendor/domain/schemas/tenant-store";

export default function TenantStoresManager({
  stores,
  storeTypes,
  updated,
  error,
}: {
  stores: TTenantStoreSummary[];
  storeTypes: TAvailableStoreType[];
  updated?: string;
  error?: string;
}) {
  return (
    <div className="grid gap-8">
      {updated ? (
        <p
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm"
          role="status"
        >
          Tenant-owned store created. Assign an accepted vendor from Workspace
          members.
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
