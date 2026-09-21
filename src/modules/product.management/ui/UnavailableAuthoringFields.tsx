import type { TProductAuthoringSchema } from "@/modules/product.management/schemas/ProductAuthoringSchema";

interface UnavailableAuthoringFieldsProps {
  fields: TProductAuthoringSchema["unavailable_fields"];
}

export default function UnavailableAuthoringFields({
  fields,
}: UnavailableAuthoringFieldsProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Unavailable product authoring fields"
      className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-medium">Some product options are unavailable</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {fields.map((field) => (
          <li key={field.key}>
            <span className="font-medium">{field.key}</span>: {field.reason}
          </li>
        ))}
      </ul>
    </aside>
  );
}
