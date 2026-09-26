import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import ErrorComponent from "@/modules/core/components/client/ErrorComponent";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { TServerDataTableMeta } from "@/modules/core/domain/schemas/ServerDataTableMeta";
import { flattenSearchParams } from "@/modules/core/utils/searchParams";
import { actionGetProductImports } from "@/modules/product.management/actions/import";
import ProductImportsServerTable from "@/modules/product.management/components/client/product-import/ProductImportsServerTable";

export default async function ProductImportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireWorkspaceCapability(
    "canImportProducts",
    "/products/imports",
  );
  const resolvedSearchParams = await searchParams;
  const flattenedParams = flattenSearchParams(resolvedSearchParams);
  const page = Number(flattenedParams.page ?? "1");

  const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1;
  const response = await actionGetProductImports({
    ...flattenedParams,
    page: String(normalizedPage),
  });

  if (response && typeof response === "object" && "error" in response) {
    return (
      <PageContainer pageTitle="Product Imports">
        <ErrorComponent err={response.error} />
      </PageContainer>
    );
  }

  const canManageAcrossStores = user.platform_roles.some(
    (role) => role === "super-admin" || role === "admin",
  );

  const imports = response.imports;

  return (
    <PageContainer pageTitle="Product Imports">
      <ProductImportsServerTable
        rows={imports.data}
        table={response.table as unknown as TServerDataTableMeta}
        initialFilters={Object.fromEntries(
          Object.entries(flattenedParams).filter(([key]) => key !== "page"),
        )}
        pagination={{
          currentPage: Number(imports.current_page ?? 1),
          perPage: imports.per_page ? Number(imports.per_page) : null,
          from: imports.from ?? null,
          to: imports.to ?? null,
          hasNextPage: Boolean(imports.next_page_url),
          hasPreviousPage: Boolean(imports.prev_page_url),
        }}
        canManageAcrossStores={canManageAcrossStores}
      />
    </PageContainer>
  );
}
