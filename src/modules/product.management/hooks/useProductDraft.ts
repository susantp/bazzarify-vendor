import type { TProductDraft } from "@/modules/product.management";
import {
  actionAbandonProductDraft,
  actionDeleteProductDraftMedia,
  actionGetProductDraft,
  actionListProductDrafts,
  actionSaveProductDraftStep,
  actionStartProductDraft,
  actionUploadProductDraftMedia,
} from "@/modules/product.management/actions/draft";
import { useCallback, useState } from "react";

type DraftFeedback = {
  error: string;
  errorCode?: number;
};

type StartDraftInput = Parameters<typeof actionStartProductDraft>[0];

const isDraft = (
  value: Awaited<ReturnType<typeof actionGetProductDraft>>,
): value is TProductDraft => "workflow" in value;

const toFeedback = (
  value: Awaited<ReturnType<typeof actionGetProductDraft>>,
): DraftFeedback | null => {
  if (isDraft(value) || !value.error) {
    return null;
  }

  return {
    error: value.error,
    errorCode: value.errorCode,
  };
};

const isMediaUpload = (
  value: Awaited<ReturnType<typeof actionUploadProductDraftMedia>>,
): value is Extract<
  Awaited<ReturnType<typeof actionUploadProductDraftMedia>>,
  { draft: TProductDraft }
> => "draft" in value;

export default function useProductDraft(uuid?: string) {
  const [draft, setDraft] = useState<TProductDraft | null>(null);
  const [feedback, setFeedback] = useState<DraftFeedback | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [savedLabel, setSavedLabel] = useState<string>();

  const loadDraft = useCallback(async (draftUuid: string) => {
    setIsPending(true);
    setFeedback(null);
    const result = await actionGetProductDraft(draftUuid);
    setIsPending(false);

    if (isDraft(result)) {
      setDraft(result);
      return result;
    }

    setFeedback(toFeedback(result));
    return null;
  }, []);

  const resumeDraft = useCallback(
    async (mode: "create" | "edit", targetProductUuid?: string) => {
      setIsPending(true);
      setFeedback(null);
      const result = await actionListProductDrafts();
      setIsPending(false);

      if ("error" in result) {
        setFeedback({
          error: result.error ?? "Unable to resume product draft.",
          errorCode: result.errorCode,
        });
        return null;
      }

      const matchingDraft = result.drafts.find(
        (candidate) =>
          candidate.mode === mode &&
          (mode === "create" ||
            candidate.target_product_uuid === targetProductUuid),
      );

      if (!matchingDraft) {
        return null;
      }

      setDraft(matchingDraft);
      setSavedLabel("Draft resumed");
      return matchingDraft;
    },
    [],
  );

  const startDraft = useCallback(
    async (input: StartDraftInput, advance = false) => {
      setIsPending(true);
      setFeedback(null);
      const result = await actionStartProductDraft(input);
      setIsPending(false);

      if (isDraft(result)) {
        if (advance) {
          const advanced = await actionSaveProductDraftStep(
            result.uuid,
            "setup",
            result.version,
            input.payload ?? {},
            true,
          );
          if (isDraft(advanced)) {
            setDraft(advanced);
            setSavedLabel("Saved just now");
            return advanced;
          }
          setFeedback(toFeedback(advanced));
          return null;
        }

        setDraft(result);
        setSavedLabel("Draft created");
        return result;
      }

      setFeedback(toFeedback(result));
      return null;
    },
    [],
  );

  const saveStep = useCallback(
    async (
      stepKey: string,
      payload: Record<string, unknown>,
      advance = false,
    ) => {
      if (!draft) {
        return null;
      }

      setIsPending(true);
      setFeedback(null);
      const result = await actionSaveProductDraftStep(
        draft.uuid,
        stepKey,
        draft.version,
        payload,
        advance,
      );
      setIsPending(false);

      if (isDraft(result)) {
        setDraft(result);
        setSavedLabel("Saved just now");
        return result;
      }

      setFeedback(toFeedback(result));
      return null;
    },
    [draft],
  );

  const uploadMedia = useCallback(
    async (file: File, clientKey?: string) => {
      if (!draft) {
        return null;
      }

      setIsPending(true);
      setFeedback(null);
      const result = await actionUploadProductDraftMedia(
        draft.uuid,
        draft.version,
        file,
        clientKey,
      );
      setIsPending(false);

      if (isMediaUpload(result)) {
        setDraft(result.draft);
        setSavedLabel("Media saved just now");
        return result;
      }

      setFeedback(toFeedback(result));
      return null;
    },
    [draft],
  );

  const removeMedia = useCallback(
    async (mediaUuid: string) => {
      if (!draft) {
        return null;
      }

      setIsPending(true);
      setFeedback(null);
      const result = await actionDeleteProductDraftMedia(draft.uuid, mediaUuid);
      setIsPending(false);

      if (isDraft(result)) {
        setDraft(result);
        setSavedLabel("Media removed just now");
        return result;
      }

      setFeedback(toFeedback(result));
      return null;
    },
    [draft],
  );

  const abandon = useCallback(async () => {
    if (!draft) {
      return false;
    }

    setIsPending(true);
    const result = await actionAbandonProductDraft(draft.uuid);
    setIsPending(false);
    setFeedback(
      result.error
        ? { error: result.error, errorCode: result.errorCode }
        : null,
    );

    if (!result.error) {
      setDraft(null);
      return true;
    }

    return false;
  }, [draft]);

  return {
    abandon,
    draft,
    feedback,
    isPending,
    loadDraft: uuid ? () => loadDraft(uuid) : loadDraft,
    removeMedia,
    resumeDraft,
    savedLabel,
    saveStep,
    startDraft,
    uploadMedia,
  };
}
