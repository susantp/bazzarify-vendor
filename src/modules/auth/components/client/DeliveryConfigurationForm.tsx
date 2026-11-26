"use client";

import { Button } from "@/components/ui/button";
import { actionSaveDeliveryConfiguration } from "@/modules/auth/domain/delivery-configuration-actions";
import type { DeliveryConfiguration } from "@/modules/auth/domain/schemas/TenantDeliveryPolicySchema";
import { startTransition, useRef, useState } from "react";

type Area = NonNullable<DeliveryConfiguration["service_area_rules"]>[number];

const fields = [
  {
    name: "timezone",
    label: "Time zone (IANA name)",
    type: "text",
    initial: "UTC",
  },
  {
    name: "cutoff_local_time",
    label: "Daily cutoff",
    type: "time",
    initial: "17:00",
  },
  {
    name: "preparation_min_working_days",
    label: "Minimum preparation days",
    type: "number",
    initial: "0",
  },
  {
    name: "preparation_max_working_days",
    label: "Maximum preparation days",
    type: "number",
    initial: "0",
  },
  {
    name: "max_product_surcharge_minor",
    label: "Maximum product surcharge (minor units)",
    type: "number",
    initial: "0",
  },
] as const;
const permissions = [
  [
    "vendor_product_configuration_enabled",
    "Allow delegated product delivery changes",
  ],
  [
    "vendor_fee_configuration_enabled",
    "Allow delegated product surcharge changes",
  ],
] as const;
const ruleFields = [
  ["key", "Rule key", "text", true],
  ["country", "Country code (two letters)", "text", true],
  ["region", "State or region", "text", false],
  ["city", "City", "text", false],
  ["postal_code", "Postal code", "text", false],
  ["base_fee_minor", "Base fee (minor units)", "number", true],
  [
    "free_base_fee_threshold_minor",
    "Free base fee threshold (minor units)",
    "number",
    false,
  ],
  ["transit_min_working_days", "Minimum transit days", "number", true],
  ["transit_max_working_days", "Maximum transit days", "number", true],
] as const;
const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const fieldStyle = "h-9 w-full rounded-md border bg-background px-2";
const emptyRule: Area = {
  key: "",
  country: "",
  base_fee_minor: 0,
  transit_min_working_days: 0,
  transit_max_working_days: 0,
};

function formValue(form: FormData, name: string, numeric = false) {
  const raw = form.get(name);
  const value = typeof raw === "string" ? raw.trim() : "";
  return value === "" ? null : numeric ? Number(value) : value;
}

export default function DeliveryConfigurationForm({
  storeUuid,
  configuration,
  effective,
  version,
  active,
}: {
  storeUuid: string | null;
  configuration: DeliveryConfiguration | null;
  effective?: DeliveryConfiguration;
  version: number;
  active?: boolean;
}) {
  const isStore = storeUuid !== null;
  const [rules, setRules] = useState(() =>
    (
      configuration?.service_area_rules ??
      effective?.service_area_rules ??
      []
    ).map((rule, id) => ({ id, rule })),
  );
  const nextId = useRef(rules.length);
  const [ownRules, setOwnRules] = useState(
    !isStore || configuration?.service_area_rules != null,
  );
  const [ownDays, setOwnDays] = useState(
    !isStore || configuration?.working_days != null,
  );
  const [savedVersion, setSavedVersion] = useState(version);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const readError = (name: string) => errors[name]?.join(" ");
  const showError = (name: string) =>
    readError(name) ? (
      <span className="text-sm text-destructive" role="alert">
        {readError(name)}
      </span>
    ) : null;
  const resetError = (name: string) =>
    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([field]) => field !== name && field !== `configuration.${name}`,
        ),
      ),
    );

  async function save(form: FormData) {
    setSaving(true);
    setMessage("");
    setErrors({});
    const values: Record<string, unknown> = { expected_version: savedVersion };
    if (!isStore) values.active = form.has("active");
    for (const { name, type } of fields)
      values[name] = formValue(form, name, type === "number");
    for (const [name] of permissions) {
      const value = form.get(name);
      values[name] = value === "" ? null : value === "true";
    }
    values.working_days = ownDays
      ? form.getAll("working_days").map(Number)
      : null;
    values.service_area_rules = ownRules
      ? rules.map(({ id }) =>
          Object.fromEntries(
            ruleFields.map(([name, , type]) => [
              name,
              formValue(form, `rule-${id}-${name}`, type === "number"),
            ]),
          ),
        )
      : null;
    try {
      const result = await actionSaveDeliveryConfiguration(storeUuid, values);
      if ("errors" in result) setErrors(result.errors);
      else {
        setSavedVersion(result.version);
        setMessage("Delivery settings saved.");
      }
    } catch {
      setErrors({ form: ["Delivery settings could not be saved. Try again."] });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (saving) return;
        const form = new FormData(event.currentTarget);
        startTransition(() => save(form));
      }}
    >
      <fieldset className="grid gap-4" disabled={saving}>
        {!isStore ? (
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={active} name="active" type="checkbox" />{" "}
            Activate delivery estimates
          </label>
        ) : (
          <p className="text-sm text-muted-foreground">
            Blank values inherit tenant defaults.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map(({ name, label, type, initial }) => (
            <label className="grid gap-1 text-sm" key={name}>
              {label}
              <input
                className={fieldStyle}
                defaultValue={configuration?.[name] ?? (isStore ? "" : initial)}
                placeholder={
                  isStore ? String(effective?.[name] ?? "") : undefined
                }
                min={type === "number" ? 0 : undefined}
                step={type === "number" ? 1 : undefined}
                name={name}
                required={!isStore}
                type={type}
                onChange={() => resetError(name)}
                aria-invalid={Boolean(readError(name))}
              />
              {showError(name)}
            </label>
          ))}
          {permissions.map(([name, label]) => (
            <label className="grid gap-1 text-sm" key={name}>
              {label}
              <select
                className={fieldStyle}
                name={name}
                defaultValue={
                  configuration?.[name] == null
                    ? isStore
                      ? ""
                      : "false"
                    : String(configuration[name])
                }
                onChange={() => resetError(name)}
              >
                {isStore ? (
                  <option value="">Inherit tenant default</option>
                ) : null}
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
              {showError(name)}
            </label>
          ))}
        </div>
        <fieldset className="grid gap-2">
          <legend className="font-medium">Working days</legend>
          {isStore ? (
            <label className="text-sm">
              <input
                checked={ownDays}
                onChange={(event) => setOwnDays(event.target.checked)}
                type="checkbox"
              />{" "}
              Override working days
            </label>
          ) : null}
          <div className={ownDays ? "flex flex-wrap gap-3" : "hidden"}>
            {weekdays.map((day, index) => (
              <label className="flex items-center gap-1 text-sm" key={day}>
                <input
                  defaultChecked={(
                    configuration?.working_days ??
                    effective?.working_days ?? [1, 2, 3, 4, 5]
                  ).includes(index + 1)}
                  name="working_days"
                  type="checkbox"
                  value={index + 1}
                  onChange={() => resetError("working_days")}
                />{" "}
                {day}
              </label>
            ))}
          </div>
          {showError("working_days")}
        </fieldset>
        <fieldset className="grid gap-3">
          <legend className="font-medium">Service areas</legend>
          {isStore ? (
            <label className="text-sm">
              <input
                checked={ownRules}
                onChange={(event) => setOwnRules(event.target.checked)}
                type="checkbox"
              />{" "}
              Override service areas
            </label>
          ) : null}
          <div className={ownRules ? "grid gap-3" : "hidden"}>
            {rules.map(({ rule, id }, index) => (
              <fieldset className="grid gap-2 rounded-md border p-3" key={id}>
                <legend className="text-sm">Service area {index + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ruleFields.map(([name, label, type, required]) => (
                    <label className="grid gap-1 text-sm" key={name}>
                      {label}
                      <input
                        className={fieldStyle}
                        defaultValue={rule[name] ?? ""}
                        name={`rule-${id}-${name}`}
                        required={ownRules && required}
                        type={type}
                        min={type === "number" ? 0 : undefined}
                        step={type === "number" ? 1 : undefined}
                        onChange={() =>
                          resetError(`service_area_rules.${index}.${name}`)
                        }
                      />
                      {showError(`service_area_rules.${index}.${name}`)}
                    </label>
                  ))}
                </div>
                {showError(`service_area_rules.${index}`)}
                <Button
                  onClick={() => {
                    setRules((current) =>
                      current.filter((entry) => entry.id !== id),
                    );
                    setErrors({});
                  }}
                  type="button"
                  variant="outline"
                >
                  Remove area
                </Button>
              </fieldset>
            ))}
            <Button
              onClick={() => {
                const id = nextId.current++;
                setRules((current) => [...current, { id, rule: emptyRule }]);
                resetError("service_area_rules");
              }}
              type="button"
              variant="outline"
            >
              Add service area
            </Button>
          </div>
          {showError("service_area_rules")}
        </fieldset>
        {showError("form")}
        {showError("expected_version")}
        {message ? <p role="status">{message}</p> : null}
        <div>
          <Button type="submit">
            {saving ? "Saving…" : "Save delivery settings"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
