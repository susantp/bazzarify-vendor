"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getValidationFeedback } from "@/modules/core/lib/utils.validationFeedback";
import {
  TCategoryAuthoringMutationPayload,
  TCategoryAuthoringReadiness,
} from "@/modules/product.management";
import {
  actionActivateCategoryAuthoring,
  actionGetCategoryAuthoringReadiness,
  actionRollbackCategoryAuthoring,
} from "@/modules/product.management/actions/category";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function isReadiness(value: unknown): value is TCategoryAuthoringReadiness {
  return typeof value === "object" && value !== null && "checks" in value && "summary" in value;
}

function isMutation(value: unknown): value is TCategoryAuthoringMutationPayload {
  return typeof value === "object" && value !== null && ("activation" in value || "rollback" in value);
}

export default function AuthoringActivationCard({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const [candidateUuid, setCandidateUuid] = useState("");
  const [rollbackUuid, setRollbackUuid] = useState("");
  const [isMutating, setIsMutating] = useState(false);
  const readinessQuery = useQuery({
    queryKey: ["category-authoring-readiness", slug],
    queryFn: () => actionGetCategoryAuthoringReadiness(slug),
  });
  const readiness = isReadiness(readinessQuery.data) ? readinessQuery.data : null;
  const readinessError =
    !readiness && readinessQuery.data && typeof readinessQuery.data === "object" && "error" in readinessQuery.data
      ? String(readinessQuery.data.error)
      : null;

  const effectiveRollbackUuid = rollbackUuid || readiness?.profile.uuid || "";

  const showError = (result: unknown, fallback: string) => {
    const feedback = getValidationFeedback(result, fallback);
    toast.error(feedback?.fieldErrors.activation?.[0] ?? feedback?.fieldErrors.rollback?.[0] ?? feedback?.summary ?? fallback);
  };

  const mutate = async (kind: "activate" | "rollback") => {
    const uuid = kind === "activate" ? candidateUuid.trim() : effectiveRollbackUuid.trim();
    if (!uuid) {
      toast.error(`Enter a ${kind === "activate" ? "candidate" : "rollback target"} profile UUID.`);
      return;
    }
    setIsMutating(true);
    const result = kind === "activate"
      ? await actionActivateCategoryAuthoring(slug, uuid)
      : await actionRollbackCategoryAuthoring(slug, uuid);
    setIsMutating(false);
    if (!isMutation(result)) {
      showError(result, `Unable to ${kind} the authoring profile.`);
      return;
    }
    const operation = kind === "activate" ? result.activation : result.rollback;
    if (!operation?.ok) {
      showError(operation?.readiness, `The backend blocked this ${kind} request.`);
      return;
    }
    toast.success(operation.idempotent ? "Authoring profile was already active." : `Authoring profile ${kind}d.`);
    await queryClient.invalidateQueries({ queryKey: ["category-authoring-readiness", slug] });
    if (kind === "activate") setCandidateUuid("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Authoring activation</CardTitle>
            <CardDescription>Backend-owned readiness and guarded profile lifecycle for this category.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void readinessQuery.refetch()} disabled={readinessQuery.isFetching}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {readinessQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading readiness…</p> : null}
        {!readiness && (readinessQuery.isError || readinessError) ? <p className="text-sm text-destructive">{readinessError ?? "Unable to load authoring readiness."}</p> : null}
        {readiness ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={readiness.ready ? "default" : "destructive"}>{readiness.ready ? "Ready" : "Blocked"}</Badge>
              <span className="text-sm text-muted-foreground">{readiness.summary.passed} passed · {readiness.summary.failed} failed</span>
              <span className="text-sm text-muted-foreground">Profile: {readiness.profile.type ?? "unresolved"} v{readiness.profile.version ?? "—"}</span>
            </div>
            <ul className="space-y-2" aria-label="Authoring readiness checks">
              {readiness.checks.map((check) => (
                <li key={check.code} className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                  {check.passed ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />}
                  <span><strong>{check.code.replaceAll("_", " ")}</strong>: {check.message}</span>
                </li>
              ))}
            </ul>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2 rounded-md border p-3">
                <Label htmlFor="authoring-candidate-profile">Candidate profile UUID</Label>
                <Input id="authoring-candidate-profile" value={candidateUuid} onChange={(event) => setCandidateUuid(event.target.value)} placeholder="Existing profile UUID" />
                <p className="text-xs text-muted-foreground">Activation is accepted only when the backend confirms this profile belongs to the category and passes every readiness check.</p>
                <Button type="button" onClick={() => void mutate("activate")} disabled={isMutating}>Activate profile</Button>
              </div>
              <div className="space-y-2 rounded-md border p-3">
                <Label htmlFor="authoring-rollback-profile">Rollback target profile UUID</Label>
                <Input id="authoring-rollback-profile" value={effectiveRollbackUuid} onChange={(event) => setRollbackUuid(event.target.value)} placeholder="Prior profile UUID" />
                <p className="text-xs text-muted-foreground">Rollback restores a category profile pointer only when no product uses the active profile.</p>
                <Button type="button" variant="outline" onClick={() => void mutate("rollback")} disabled={isMutating}>Rollback profile</Button>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
