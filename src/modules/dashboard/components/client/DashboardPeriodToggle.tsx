"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type DashboardWindow } from "@/modules/dashboard/schemas/dashboard-summary-schema";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Props = {
  currentWindow: DashboardWindow;
  choices: readonly { value: DashboardWindow; label: string }[];
};

export default function DashboardPeriodToggle({
  currentWindow,
  choices,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: string) => {
    if (!next || next === currentWindow) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("window", next);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <ToggleGroup
      type="single"
      value={currentWindow}
      onValueChange={handleChange}
      variant="outline"
      size="sm"
      disabled={isPending}
      aria-label="Select dashboard time window"
      className="rounded-lg border border-border bg-background p-1"
    >
      {choices.map(({ value, label }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className="border-l border-input bg-transparent text-muted-foreground first:border-l-0 hover:bg-selected/10 hover:text-foreground data-[state=on]:border-selected data-[state=on]:bg-selected data-[state=on]:text-selected-foreground"
        >
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
