import { requireWorkspaceCapability } from "@/modules/auth/domain/requireWorkspaceCapability";
import { actionGetCategories } from "@/modules/product.management/actions/category";
import Create from "@/modules/product.management/components/client/product/Create";

export default async function Page() {
  await requireWorkspaceCapability("canWriteProducts", "/products/create");

  const categoryIndexPayload = await actionGetCategories({
    filter: { rootOnly: true },
    sort: "name",
  });

  return <Create categoryIndexPayload={categoryIndexPayload} />;
}
