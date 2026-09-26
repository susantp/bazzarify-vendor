import { Button } from "@/components/ui/button";
import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import { getWorkspaceCapabilities } from "@/modules/auth/domain/workspace-capabilities";
import { TableColumn } from "@/modules/core/components/client/DynamicTable";
import ServerDataTable from "@/modules/core/components/client/ServerDataTable";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { flattenSearchParams } from "@/modules/core/utils/searchParams";
import { TProduct } from "@/modules/product.management";
import { actionGetProducts } from "@/modules/product.management/actions/product";
import { Upload } from "lucide-react";
import Link from "next/link";
import { FaPlus } from "react-icons/fa6";

const productColumns: TableColumn<TProduct>[] = [
  {
    key: "categories.name",
    title: "Category",
  },
  {
    key: "name",
    title: "Name",
  },
  {
    key: "sku",
    title: "SKU",
  },
  {
    key: "createdBy.name",
    title: "Created By",
  },
  {
    key: "status_text",
    title: "Status",
  },
  {
    key: "created_at",
    title: "Created At",
  },
  {
    key: "updated_at",
    title: "Updated At",
  },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireWorkspaceCapability("canViewProducts", "/products");
  const capabilities = getWorkspaceCapabilities(user);
  const canWriteProducts = capabilities.canWriteProducts;
  const canImportProducts = capabilities.canImportProducts;

  const resolvedSearchParams = await searchParams;
  const flattenedParams = flattenSearchParams(resolvedSearchParams);
  const page = Number(flattenedParams.page ?? "1");

  const productResponse = await actionGetProducts({
    ...flattenedParams,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  const products =
    productResponse &&
    typeof productResponse === "object" &&
    "products" in productResponse
      ? productResponse.products
      : null;
  const table =
    productResponse &&
    typeof productResponse === "object" &&
    "table" in productResponse
      ? productResponse.table
      : null;

  return (
    <PageContainer pageTitle="Manage Products">
      <ServerDataTable
        title="Manage Products"
        description="Manage products with server-driven filters, pagination, and backend-owned query behavior."
        toolbarAction={
          canWriteProducts || canImportProducts ? (
            <div className="flex items-center gap-2">
              {canImportProducts ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/products/imports/new">
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Import
                  </Link>
                </Button>
              ) : null}
              {canWriteProducts ? (
                <Button asChild size="sm">
                  <Link href="/products/create">
                    <FaPlus className="mr-2" />
                    New Product
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
        columns={productColumns}
        rows={products?.data ?? []}
        emptyMessage="No products found for the current filters."
        table={
          table ?? {
            search: {
              queryKey: "filter[name]",
              placeholder: "Search products by name...",
            },
            filters: [],
          }
        }
        initialFilters={Object.fromEntries(
          Object.entries(flattenedParams).filter(([key]) => key !== "page"),
        )}
        pagination={{
          currentPage: Number(products?.current_page ?? 1),
          perPage: products?.per_page ? Number(products.per_page) : null,
          from: products?.from ?? null,
          to: products?.to ?? null,
          hasNextPage: Boolean(products?.next_page_url),
          hasPreviousPage: Boolean(products?.prev_page_url),
        }}
        rowActions={[
          {
            label: "View",
            hrefTemplate: "/products/:uuid/view",
            variant: "outline",
          },
          ...(canWriteProducts
            ? [
                {
                  label: "Edit",
                  hrefTemplate: "/products/:uuid/edit",
                  variant: "outline" as const,
                },
              ]
            : []),
        ]}
      />
    </PageContainer>
  );
}
