import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import ProductRichTextEditor from "@/modules/core/components/client/ProductRichTextEditor";
import {
  ProductSubmissionFeedback,
  TProductAuthoringSchema,
  TProductForm,
} from "@/modules/product.management";
import { isAuthoringFieldRenderable } from "@/modules/product.management/utils/productAuthoringRenderer";
import { getSubmissionFieldError } from "@/modules/product.management/utils/productSubmissionFeedback";
import { ChangeEvent } from "react";

interface Props {
  productForm: TProductForm;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  feedback?: ProductSubmissionFeedback | null;
  authoringSchema?: TProductAuthoringSchema | null;
}
export default function ProductDetail({
  productForm,
  onChange,
  feedback,
  authoringSchema,
}: Props) {
  const handleRteChange = (name: string, json: string) => {
    const synthetic = {
      target: { name, value: json },
    } as unknown as ChangeEvent<HTMLInputElement>;
    onChange(synthetic);
  };

  const descriptionError = getSubmissionFieldError(
    feedback ?? null,
    "description",
  );
  const highlightsError = getSubmissionFieldError(
    feedback ?? null,
    "highlights",
  );
  const boxItemsError = getSubmissionFieldError(feedback ?? null, "box_items");
  const rendersField = (fieldKey: string) =>
    !authoringSchema || isAuthoringFieldRenderable(authoringSchema, fieldKey);

  return (
    <>
      {rendersField("description") && (
        <>
          <Label>Description</Label>
          <ProductRichTextEditor
            name="description"
            toolbar="full"
            enableImages={true}
            value={productForm.description}
            handleOnChange={handleRteChange}
            className={cn(
              "rounded-lg border",
              descriptionError && "border-destructive",
            )}
            placeholder="Describe your product…"
          />
          {descriptionError && (
            <p className="text-sm text-destructive">{descriptionError}</p>
          )}
        </>
      )}
      {rendersField("highlights") && (
        <>
          <Label>Highlights</Label>
          <ProductRichTextEditor
            name="highlights"
            toolbar="minimal"
            enableImages={true}
            value={productForm.highlights}
            handleOnChange={handleRteChange}
            className={cn(
              "rounded-lg border",
              highlightsError && "border-destructive",
            )}
            placeholder="Enter a minimum of three short highlights of the product"
          />
          {highlightsError && (
            <p className="text-sm text-destructive">{highlightsError}</p>
          )}
        </>
      )}
      {rendersField("box_items") && (
        <>
          <Label>What&apos;s in the box?</Label>
          <Input
            placeholder="comma seperated items in the box"
            id="box_items"
            name="box_items"
            value={productForm.box_items}
            onChange={onChange}
            className={cn(boxItemsError && "border-destructive")}
          />
          {boxItemsError && (
            <p className="text-sm text-destructive">{boxItemsError}</p>
          )}
        </>
      )}
    </>
  );
}
