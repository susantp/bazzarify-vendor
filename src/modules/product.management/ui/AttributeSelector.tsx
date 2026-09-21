"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemedButton } from "@/modules/core/components/server/ThemedButton";
import { TAttribute, TAttributeValue } from "@/modules/product.management";
import { Label } from "@radix-ui/react-menu";
import { Plus, Trash } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
  attributes: TAttribute[];
  selections: Record<string, string[]>;
  onToggle: (
    attribute: string,
    value: string,
  ) => { ok: boolean; reason?: "cap" };
  onRemove: (
    attribute: string,
    value: string,
  ) => { ok: boolean; reason?: "cap" };
  nonRemovable?: Record<string, Set<string>>;
  attributeCap: number;
  variantCountByValue: Record<string, Record<string, number>>;
}

export default function AttributeSelector({
  attributes,
  selections,
  onToggle,
  onRemove,
  nonRemovable,
  attributeCap,
  variantCountByValue,
}: Props) {
  const [pendingRemoval, setPendingRemoval] = useState<{
    attribute: string;
    value: string;
    affected: number;
  } | null>(null);

  const activeAttrCount = useMemo(
    () =>
      Object.values(selections).reduce(
        (acc, values) => acc + (values.length > 0 ? 1 : 0),
        0,
      ),
    [selections],
  );

  const attemptToggle = (attributeName: string, value: string) => {
    const isActivatingNewDimension = !(selections[attributeName] || []).length;
    if (isActivatingNewDimension && activeAttrCount >= attributeCap) {
      toast.error(
        `A product can have at most ${attributeCap} attribute dimensions.`,
      );
      return;
    }
    const result = onToggle(attributeName, value);
    if (!result.ok && result.reason === "cap") {
      toast.error(
        `A product can have at most ${attributeCap} attribute dimensions.`,
      );
    }
  };

  const requestRemoval = (attributeName: string, value: string) => {
    const affected = variantCountByValue[attributeName]?.[value] ?? 0;
    if (affected <= 1) {
      onRemove(attributeName, value);
      return;
    }
    setPendingRemoval({ attribute: attributeName, value, affected });
  };

  const confirmRemoval = () => {
    if (!pendingRemoval) return;
    onRemove(pendingRemoval.attribute, pendingRemoval.value);
    setPendingRemoval(null);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        <div className="text-xs text-muted-foreground">
          Active attributes: {activeAttrCount} / {attributeCap}
          {attributeCap > 3 && (
            <span className="ml-2">
              (legacy product kept above the standard 3-attribute cap — no new
              dimensions can be added)
            </span>
          )}
        </div>
        {attributes.map((attr) => {
          const selectedValues = selections[attr.name] || [];
          const availableOptions = attr.attribute_value.filter(
            (val: TAttributeValue) => !selectedValues.includes(val.label),
          );
          const wouldAddNewDimension = selectedValues.length === 0;
          const capBlocksThisAttribute =
            wouldAddNewDimension && activeAttrCount >= attributeCap;

          return (
            <div
              id={`attribute-${attr.uuid}`}
              data-authoring-field={`attribute:${attr.uuid}`}
              key={attr.uuid}
              className="space-y-3 rounded-lg border p-4"
            >
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">{attr.name}</Label>
              </div>
              <div className="space-y-2">
                {selectedValues.map((val) => {
                  const isLocked = !!nonRemovable?.[attr.name]?.has(val);
                  return (
                    <div key={val} className="flex items-center gap-2">
                      <Select defaultValue={val} disabled>
                        <SelectTrigger className="w-64">
                          <SelectValue>{val}</SelectValue>
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                      <ThemedButton
                        variant="ghost"
                        size="icon"
                        disabled={isLocked}
                        onClick={() => requestRemoval(attr.name, val)}
                        title={
                          isLocked
                            ? "Cannot remove: used by existing variant"
                            : undefined
                        }
                      >
                        <Trash
                          className={`h-4 w-4 ${
                            isLocked ? "text-gray-300" : "text-red-500"
                          }`}
                        />
                      </ThemedButton>
                    </div>
                  );
                })}
                {availableOptions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={
                            capBlocksThisAttribute
                              ? "cursor-not-allowed opacity-60"
                              : undefined
                          }
                        >
                          <Select
                            value=""
                            disabled={capBlocksThisAttribute}
                            onValueChange={(value) =>
                              attemptToggle(attr.name, value)
                            }
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Please type or select" />
                            </SelectTrigger>
                            <SelectContent className="max-h-96">
                              {availableOptions.map((option) => (
                                <SelectItem
                                  key={option.uuid}
                                  value={option.label}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TooltipTrigger>
                      {capBlocksThisAttribute && (
                        <TooltipContent>
                          Attribute cap reached ({attributeCap}). Remove an
                          existing attribute to add another.
                        </TooltipContent>
                      )}
                    </Tooltip>
                    <ThemedButton variant="ghost" size="icon" disabled>
                      <Plus className="h-4 w-4 text-gray-400" />
                    </ThemedButton>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <AlertDialog
          open={pendingRemoval !== null}
          onOpenChange={(open) => {
            if (!open) setPendingRemoval(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Remove &ldquo;{pendingRemoval?.value}&rdquo;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will cascade-remove {pendingRemoval?.affected} variant
                {pendingRemoval?.affected === 1 ? "" : "s"} that use this value
                from the grid. Saved variants will be staged for deletion and
                only actually removed when you submit.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemoval}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove value
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
