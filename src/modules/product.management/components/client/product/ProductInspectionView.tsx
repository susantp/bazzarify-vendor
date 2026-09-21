"use client";

import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  Settings2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { IMetaData } from "@/modules/core";
import BackLinkButton from "@/modules/core/components/server/BackLinkButton";
import PageContainer from "@/modules/core/components/server/PageContainer";

import {
  TEditProductPayload,
  TImage,
  TProduct,
  TVariant,
} from "@/modules/product.management";
import {
  actionPublishProduct,
  actionUpdateProductStatus,
} from "@/modules/product.management/actions/product";
import { resolveStorageImageUrl } from "@/modules/product.management/utils/imageUrl";
import {
  PRODUCT_STATUS,
  productStatusBadge,
  productStatusTransitions,
} from "@/modules/product.management/utils/productStatusBadge";
import {
  isRichHtmlEmpty,
  sanitizeRichHtml,
} from "@/modules/product.management/utils/sanitizeRichHtml";

interface Props {
  productPayload: TEditProductPayload;
  canPublish?: boolean;
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const CopyButton = ({ value, label }: { value: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label ?? "Value"} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={handleCopy}
      aria-label={`Copy ${label ?? "value"}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
};

const KeyValue = ({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-col gap-0.5", className)}>
    <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </dt>
    <dd className="text-sm text-foreground break-all">{children}</dd>
  </div>
);

const EmptyRow = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-md border border-dashed bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
    {children}
  </div>
);

const ImageLightbox = ({
  image,
  url,
  index,
  total,
  children,
}: {
  image: TImage | string;
  url: string;
  index: number;
  total: number;
  children: React.ReactNode;
}) => {
  const uuid = typeof image === "string" ? null : image.uuid;
  const filePath = typeof image === "string" ? image : image.file;
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Image {index + 1} of {total}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">
            {filePath}
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={filePath}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5">
            {uuid ? (
              <div>
                <span className="text-muted-foreground">UUID:</span>{" "}
                <span className="font-mono">{uuid}</span>
              </div>
            ) : null}
            <div className="truncate">
              <span className="text-muted-foreground">URL:</span>{" "}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                Open in new tab <ExternalLink className="inline h-3 w-3" />
              </a>
            </div>
          </div>
          <CopyButton value={url} label="URL" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RichContent = ({ html }: { html: unknown }) => {
  const safe = useMemo(() => sanitizeRichHtml(html), [html]);
  if (isRichHtmlEmpty(html) || safe === "") {
    return <EmptyRow>No content</EmptyRow>;
  }
  return (
    <div
      className={cn(
        "rich-content max-w-none text-sm leading-relaxed text-foreground",
        "[&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline",
        "[&_strong]:font-semibold",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-1",
        "[&_p]:my-2",
        "[&_h1]:mt-3 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold",
        "[&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold",
        "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
        "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded",
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
};

const VariantAttributeChips = ({ variant }: { variant: TVariant }) => {
  if (!variant.attributes || variant.attributes.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {variant.attributes.map((pair, idx) => (
        <span
          key={`${pair.attribute.uuid}-${pair.attribute_value.uuid}-${idx}`}
          className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-1.5 py-0.5 text-[11px]"
        >
          <span className="text-muted-foreground">{pair.attribute.name}:</span>
          <span className="font-medium text-foreground">
            {pair.attribute_value.label}
          </span>
        </span>
      ))}
    </div>
  );
};

export default function ProductInspectionView({
  productPayload,
  canPublish = false,
}: Props) {
  const [product, setProduct] = useState<TProduct>(productPayload.product);
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<number | null>(null);

  const ancestors = productPayload.categoryAncestors;
  const categoryContext = productPayload.categoryContext;
  const statusBadge = productStatusBadge(product.status);
  const transitions = productStatusTransitions(product.status).filter(
    (transition) => transition.status !== PRODUCT_STATUS.ACTIVE || canPublish,
  );
  const imageBaseUrl = product.image_base_url ?? null;

  const imageUrls = useMemo(
    () =>
      (product.images ?? []).map((image) => ({
        image,
        url: resolveStorageImageUrl(image, imageBaseUrl),
      })),
    [product.images, imageBaseUrl],
  );

  const handleStatusChange = (nextStatus: number, label: string) => {
    if (isPending || nextStatus === product.status) return;

    setPendingStatus(nextStatus);
    startTransition(async () => {
      const result = await actionUpdateProductStatus(product.uuid, nextStatus);
      setPendingStatus(null);

      if (result && typeof result === "object" && "error" in result) {
        const err = result as IMetaData;
        toast.error(err.error ?? "Failed to update status");
        return;
      }

      setProduct(result as TProduct);
      toast.success(`${label} — status updated`);
    });
  };

  const handlePublish = () => {
    if (isPending || product.status !== PRODUCT_STATUS.PENDING || !canPublish) {
      return;
    }

    setPendingStatus(PRODUCT_STATUS.ACTIVE);
    startTransition(async () => {
      const result = await actionPublishProduct(product.uuid);
      setPendingStatus(null);

      if (result && typeof result === "object" && "error" in result) {
        const err = result as IMetaData;
        toast.error(err.error ?? "Failed to publish product");
        return;
      }

      const publishedProduct = result as TProduct;
      setProduct({
        ...product,
        ...publishedProduct,
        images: publishedProduct.images ?? product.images,
        variants: publishedProduct.variants ?? product.variants,
        specifications:
          publishedProduct.specifications ?? product.specifications,
      });
      toast.success("Product published successfully");
    });
  };

  const breadcrumb = [ancestors?.root, ancestors?.sub, ancestors?.subChild]
    .filter((node): node is { name: string } & typeof node =>
      Boolean(node?.name),
    )
    .map((node) => node.name)
    .join(" › ");

  const specEntries: [string, string][] = (() => {
    const specs = product.specifications as unknown;
    if (!specs || typeof specs !== "object" || Array.isArray(specs)) {
      return [];
    }
    return Object.entries(specs as Record<string, unknown>)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => [key, String(value)]);
  })();

  return (
    <PageContainer
      pageTitle={product.name || "Product"}
      actionSlot={
        <div className="flex items-center gap-2">
          <BackLinkButton href="/products" label="Back" />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href={`/products/${product.uuid}/edit`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                disabled={isPending || transitions.length === 0}
              >
                {isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-xs">
                Current:{" "}
                <Badge className={cn("ml-1", statusBadge.className)}>
                  {statusBadge.label}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {transitions.length === 0 ? (
                <DropdownMenuItem disabled>
                  No available transitions
                </DropdownMenuItem>
              ) : (
                transitions.map((transition) => (
                  <DropdownMenuItem
                    key={transition.status}
                    onSelect={(event) => {
                      event.preventDefault();
                      if (
                        product.status === PRODUCT_STATUS.PENDING &&
                        transition.status === PRODUCT_STATUS.ACTIVE
                      ) {
                        handlePublish();
                      } else {
                        handleStatusChange(transition.status, transition.label);
                      }
                    }}
                    disabled={isPending}
                    className={cn(
                      "flex flex-col items-start gap-0.5 py-2",
                      transition.tone === "danger" && "text-destructive",
                    )}
                  >
                    <span className="text-sm font-medium">
                      {transition.label}
                      {pendingStatus === transition.status ? (
                        <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />
                      ) : null}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {transition.description}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <Badge className={cn(statusBadge.className)}>
                      {statusBadge.label}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] uppercase">
                      {product.type}
                    </Badge>
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-muted-foreground">SKU</span>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                        {product.sku || "—"}
                      </code>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="text-muted-foreground">Slug</span>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                        {product.slug || "—"}
                      </code>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="text-muted-foreground">UUID</span>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                        {product.uuid}
                      </code>
                      <CopyButton value={product.uuid} label="UUID" />
                    </span>
                  </CardDescription>
                </div>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:hidden"
                >
                  <ArrowLeft className="h-3 w-3" /> Back
                </Link>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                  Identity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <KeyValue label="Name">{product.name || "—"}</KeyValue>
                  <KeyValue label="Type">{product.type}</KeyValue>
                  <KeyValue label="SKU">
                    <code className="font-mono text-xs">
                      {product.sku || "—"}
                    </code>
                  </KeyValue>
                  <KeyValue label="Slug">
                    <code className="font-mono text-xs">
                      {product.slug || "—"}
                    </code>
                  </KeyValue>
                  <KeyValue label="Status">
                    <Badge className={cn(statusBadge.className)}>
                      {statusBadge.label}
                    </Badge>
                  </KeyValue>
                  <KeyValue label="UUID">
                    <div className="flex items-center gap-1">
                      <code className="font-mono text-xs">{product.uuid}</code>
                      <CopyButton value={product.uuid} label="UUID" />
                    </div>
                  </KeyValue>
                  <KeyValue label="Created">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{formatDate(product.created_at)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatDate(product.created_at)}
                      </TooltipContent>
                    </Tooltip>
                    {product.createdBy?.name ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        by {product.createdBy.name}
                      </span>
                    ) : null}
                  </KeyValue>
                  <KeyValue label="Updated">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{formatDate(product.updated_at)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatDate(product.updated_at)}
                      </TooltipContent>
                    </Tooltip>
                    {product.updatedBy?.name ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        by {product.updatedBy.name}
                      </span>
                    ) : null}
                  </KeyValue>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-semibold tracking-tight">
                    {product.base_price || "0.00"}
                  </span>
                  <span className="text-xs uppercase text-muted-foreground">
                    base price
                  </span>
                </div>
                <Separator className="my-3" />
                <div className="text-xs text-muted-foreground">
                  {product.variants?.length ?? 0} variant
                  {product.variants?.length === 1 ? "" : "s"} configured
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Taxonomy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {breadcrumb ? (
                <div className="text-sm text-foreground">{breadcrumb}</div>
              ) : (
                <EmptyRow>No category assigned</EmptyRow>
              )}
              {ancestors?.subChild ? (
                <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <KeyValue label="Leaf slug">
                    <code className="font-mono text-xs">
                      {ancestors.subChild.slug}
                    </code>
                  </KeyValue>
                  {categoryContext ? (
                    <>
                      <KeyValue label="Specifications">
                        {categoryContext.specifications.length}
                      </KeyValue>
                      <KeyValue label="Attributes">
                        {categoryContext.attributes.length}
                      </KeyValue>
                      <KeyValue label="Sub-children">
                        {categoryContext.subChildCategories.length}
                      </KeyValue>
                    </>
                  ) : null}
                </dl>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="description">
                <TabsList>
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="highlights">Highlights</TabsTrigger>
                  <TabsTrigger value="box">Box items</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-3">
                  <RichContent html={product.description} />
                </TabsContent>
                <TabsContent value="highlights" className="mt-3">
                  <RichContent html={product.highlights} />
                </TabsContent>
                <TabsContent value="box" className="mt-3">
                  <RichContent html={product.box_items} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Images
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {product.images?.length ?? 0} total
              </span>
            </CardHeader>
            <CardContent>
              {imageUrls.length === 0 ? (
                <EmptyRow>No images uploaded</EmptyRow>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {imageUrls.map(({ image, url }, idx) => (
                    <ImageLightbox
                      key={typeof image === "string" ? url : image.uuid}
                      image={image}
                      url={url}
                      index={idx}
                      total={imageUrls.length}
                    >
                      <button
                        type="button"
                        className="group relative aspect-square overflow-hidden rounded-md border bg-muted transition-colors hover:border-primary"
                        aria-label={`Open image ${idx + 1}`}
                      >
                        <Image
                          src={url}
                          alt={`Product image ${idx + 1}`}
                          fill
                          sizes="(max-width: 768px) 33vw, 16vw"
                          className="object-cover transition-transform group-hover:scale-105"
                          unoptimized
                        />
                      </button>
                    </ImageLightbox>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Specifications
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {specEntries.length} total
              </span>
            </CardHeader>
            <CardContent>
              {specEntries.length === 0 ? (
                <EmptyRow>No specifications</EmptyRow>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Key</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specEntries.map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>
                          <code className="font-mono text-xs">{key}</code>
                        </TableCell>
                        <TableCell className="text-sm">
                          {value || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Variants
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {product.variants?.length ?? 0} total
              </span>
            </CardHeader>
            <CardContent>
              {!product.variants || product.variants.length === 0 ? (
                <EmptyRow>No internal SKUs</EmptyRow>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Attributes</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-center">Available</TableHead>
                        <TableHead>Images</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.variants.map((variant, idx) => {
                        const variantBaseUrl =
                          variant.image_base_url ?? imageBaseUrl;
                        const variantImages: {
                          image: TImage | string;
                          url: string;
                        }[] = [];
                        for (const img of variant.images ?? []) {
                          if (img instanceof File) continue;
                          variantImages.push({
                            image: img,
                            url: resolveStorageImageUrl(img, variantBaseUrl),
                          });
                        }
                        return (
                          <TableRow
                            key={variant.uuid ?? `${idx}-${variant.name}`}
                          >
                            <TableCell className="text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell>
                              <code className="font-mono text-xs">
                                {variant.name}
                              </code>
                            </TableCell>
                            <TableCell>
                              <VariantAttributeChips variant={variant} />
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {variant.price ?? "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {variant.stock ?? "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              {variant.available ? (
                                <Check className="mx-auto h-4 w-4 text-emerald-600" />
                              ) : (
                                <X className="mx-auto h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell>
                              {variantImages.length === 0 ? (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              ) : (
                                <div className="flex -space-x-2">
                                  {variantImages.slice(0, 3).map((entry, i) => (
                                    <ImageLightbox
                                      key={
                                        typeof entry.image === "string"
                                          ? entry.url + i
                                          : entry.image.uuid
                                      }
                                      image={entry.image}
                                      url={entry.url}
                                      index={i}
                                      total={variantImages.length}
                                    >
                                      <button
                                        type="button"
                                        className="relative h-8 w-8 overflow-hidden rounded border-2 border-background bg-muted hover:z-10"
                                        aria-label={`Variant image ${i + 1}`}
                                      >
                                        <Image
                                          src={entry.url}
                                          alt=""
                                          fill
                                          sizes="32px"
                                          className="object-cover"
                                          unoptimized
                                        />
                                      </button>
                                    </ImageLightbox>
                                  ))}
                                  {variantImages.length > 3 ? (
                                    <span className="flex h-8 w-8 items-center justify-center rounded border-2 border-background bg-muted text-[10px] text-muted-foreground">
                                      +{variantImages.length - 3}
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </PageContainer>
  );
}
