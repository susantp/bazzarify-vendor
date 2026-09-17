"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getValidationFeedback } from "@/modules/core/lib/utils.validationFeedback";
import {
  TCategoryAuthoringCandidate,
  TCategoryAuthoringMutationPayload,
  TCategoryAuthoringReadiness,
} from "@/modules/product.management";
import {
  actionActivateCategoryAuthoring,
  actionGetCategoryAuthoringCandidates,
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

function isCandidates(value: unknown): value is TCategoryAuthoringCandidate[] {
  return Array.isArray(value) && value.every((candidate) =>
    typeof candidate === "object" && candidate !== null && "readiness" in candidate && isReadiness(candidate.readiness),
  );
}

export default function AuthoringActivationCard({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const [rollbackUuid, setRollbackUuid] = useState("");
  const [isMutating, setIsMutating] = useState(false);
  const readinessQuery = useQuery({
    queryKey: ["category-authoring-readiness", slug],
    queryFn: () => actionGetCategoryAuthoringReadiness(slug),
  });
  const candidatesQuery = useQuery({
    queryKey: ["category-authoring-candidates", slug],
    queryFn: () => actionGetCategoryAuthoringCandidates(slug),
  });
  const readiness = isReadiness(readinessQuery.data) ? readinessQuery.data : null;
  const candidates = isCandidates(candidatesQuery.data) ? candidatesQuery.data : [];
  const readinessError =
    !readiness && readinessQuery.data && typeof readinessQuery.data === "object" && "error" in readinessQuery.data
      ? String(readinessQuery.data.error)
      : null;
  const candidatesError =
    !isCandidates(candidatesQuery.data) && candidatesQuery.data && typeof candidatesQuery.data === "object" && "error" in candidatesQuery.data
      ? String(candidatesQuery.data.error)
      : null;

  const effectiveRollbackUuid = rollbackUuid || readiness?.profile.uuid || "";

  const showError = (result: unknown, fallback: string) => {
    const feedback = getValidationFeedback(result, fallback);
    toast.error(feedback?.fieldErrors.activation?.[0] ?? feedback?.fieldErrors.rollback?.[0] ?? feedback?.summary ?? fallback);
  };

  const mutate = async (kind: "activate" | "rollback", candidate?: TCategoryAuthoringCandidate) => {
    const uuid = effectiveRollbackUuid.trim();
    if (kind === "activate" && !candidate) {
      toast.error("Choose a backend-provided candidate profile.");
      return;
    }
    if (kind === "rollback" && !uuid) {
      toast.error("Enter a rollback target profile UUID.");
      return;
    }
    setIsMutating(true);
    const result = kind === "activate" && candidate
      ? await actionActivateCategoryAuthoring(slug, { profile: candidate.profile })
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
    const completedAction = kind === "activate" ? "activated" : "rolled back";
    toast.success(operation.idempotent ? "Authoring profile was already active." : `Authoring profile ${completedAction}.`);
    await queryClient.invalidateQueries({ queryKey: ["category-authoring-readiness", slug] });
    await queryClient.invalidateQueries({ queryKey: ["category-authoring-candidates", slug] });
    if (kind === "activate") setRollbackUuid(readiness?.profile.uuid ?? "");
    else setRollbackUuid("");
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
              <div className="space-y-3 rounded-md border p-3">
                <div>
                  <h3 className="font-medium">Available activation candidates</h3>
                  <p className="text-xs text-muted-foreground">Candidate definitions and readiness checks come from the backend. Activation rechecks readiness before creating a profile version.</p>
                </div>
                {candidatesQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading candidates…</p> : null}
                {candidatesError || candidatesQuery.isError ? <p className="text-sm text-destructive">{candidatesError ?? "Unable to load activation candidates."}</p> : null}
                {!candidatesQuery.isLoading && !candidatesError && candidates.length === 0 ? <p className="text-sm text-muted-foreground">No activation candidates are currently available for this category.</p> : null}
                {candidates.map((candidate) => (
                  <div key={candidate.profile.type} className="space-y-2 rounded-md bg-muted/40 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{candidate.profile.type} profile</span>
                      <Badge variant={candidate.readiness.ready ? "default" : "destructive"}>{candidate.readiness.ready ? "Ready" : "Blocked"}</Badge>
                      <span className="text-xs text-muted-foreground">{candidate.readiness.summary.passed} passed · {candidate.readiness.summary.failed} failed</span>
                    </div>
                    <ul className="space-y-1" aria-label={`${candidate.profile.type} candidate readiness checks`}>
                      {candidate.readiness.checks.map((check) => (
                        <li key={check.code} className="flex items-start gap-2 text-xs">
                          {check.passed ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />}
                          <span><strong>{check.code.replaceAll("_", " ")}</strong>: {check.message}</span>
                        </li>
                      ))}
                    </ul>
                    <Button type="button" onClick={() => void mutate("activate", candidate)} disabled={isMutating || !candidate.readiness.ready}>
                      Activate {candidate.profile.type} profile
                    </Button>
                  </div>
                ))}
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
