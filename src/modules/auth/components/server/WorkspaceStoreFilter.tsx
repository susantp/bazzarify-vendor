import { Button } from "@/components/ui/button";

type StoreOption = {
  uuid: string;
  name: string;
};

export default function WorkspaceStoreFilter({
  stores,
  selectedStoreUuid,
  parameterName,
  actionPath,
  preservedParameters = {},
}: {
  stores: StoreOption[];
  selectedStoreUuid?: string;
  parameterName: string;
  actionPath: string;
  preservedParameters?: Record<string, string>;
}) {
  if (stores.length < 2) return null;

  return (
    <form
      action={actionPath}
      className="flex flex-wrap items-end gap-2"
      method="get"
    >
      {Object.entries(preservedParameters)
        .filter(([name]) => name !== parameterName && name !== "page")
        .map(([name, value]) => (
          <input key={name} name={name} type="hidden" value={value} />
        ))}
      <label className="grid gap-1 text-sm" htmlFor="workspace-store-filter">
        Store
        <select
          className="h-9 min-w-48 rounded-md border bg-background px-2"
          defaultValue={selectedStoreUuid ?? ""}
          id="workspace-store-filter"
          name={parameterName}
        >
          <option value="">All authorized stores</option>
          {stores.map((store) => (
            <option key={store.uuid} value={store.uuid}>
              {store.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="outline">
        Apply
      </Button>
    </form>
  );
}
