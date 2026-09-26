import {
  getAuthUser,
  getSessionUserUUID,
} from "@/modules/auth/data/lib/auth-lib";
import PageContainer from "@/modules/core/components/server/PageContainer";
import { getCookieStore } from "@/modules/core/lib/utils.session";
import { actionGetDashboardSummary } from "@/modules/dashboard/actions/getDashboardSummary";
import DashboardPeriodToggle from "@/modules/dashboard/components/client/DashboardPeriodToggle";
import DashboardSurfaceRenderer from "@/modules/dashboard/components/server/DashboardSurfaceRenderer";
import {
  DASHBOARD_WINDOWS,
  type DashboardWindow,
} from "@/modules/dashboard/schemas/dashboard-summary-schema";
import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<{ window?: string }>;
};

const resolveWindow = (raw?: string): DashboardWindow =>
  (DASHBOARD_WINDOWS as readonly string[]).includes(raw ?? "")
    ? (raw as DashboardWindow)
    : "7d";

export default async function DashboardContainer({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const window = resolveWindow(params.window);

  const userUUID = await getSessionUserUUID(await getCookieStore());
  if (!userUUID) {
    return null;
  }
  const authUser = await getAuthUser(userUUID);
  if (authUser && "error" in authUser) {
    return null;
  }

  const result = await actionGetDashboardSummary(window);

  if ("error" in result) {
    if (result.errorCode === 403) {
      redirect("/onboarding");
    }

    return (
      <PageContainer pageTitle="Dashboard">
        <div className="text-destructive flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="size-4" aria-hidden />
          <span>{result.error}</span>
        </div>
      </PageContainer>
    );
  }

  const { surface } = result;

  return (
    <PageContainer
      pageTitle={surface.heading}
      actionSlot={
        <DashboardPeriodToggle
          currentWindow={result.period.window}
          choices={surface.period_choices}
        />
      }
    >
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">{surface.description}</p>
        <DashboardSurfaceRenderer surface={surface} />
      </div>
    </PageContainer>
  );
}
