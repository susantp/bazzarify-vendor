import { cn } from "@/lib/utils";
import type { TProductDraftMedia } from "@/modules/product.management";
import {
  MAX_FILE_SIZE_MB,
  MAX_PRODUCT_IMAGES_COUNT,
} from "@/modules/product.management/config/constants/IMAGE_CONSTANTS";
import { validateImage } from "@/modules/product.management/utils/productForm";
import { CirclePlus, X } from "lucide-react";
import NextImage from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageSelect?: (files: File[]) => void;
  initialImages?: string[];
  stagedImages?: TProductDraftMedia[];
  onStageImage?: (file: File) => Promise<boolean>;
  onRemoveStaged?: (uuid: string) => Promise<boolean>;
  onRemoveExisting?: (url: string) => Promise<boolean>;
  onExistingListChange?: (urls: string[]) => void;
  invalid?: boolean;
  errorMessage?: string;
}

type PreviewItem = {
  url: string;
  revoke: boolean; // whether this URL is an object URL that should be revoked
};

export default function ImageUploader({
  onImageSelect,
  initialImages = [],
  stagedImages = [],
  onStageImage,
  onRemoveStaged,
  onRemoveExisting,
  onExistingListChange,
  invalid = false,
  errorMessage,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});
  const [isStaging, setIsStaging] = useState(false);

  // When initialImages change, merge existing URLs with current new previews; trim to max
  useEffect(() => {
    // Build existing items from incoming URLs, trimmed to max
    const existing: PreviewItem[] = (initialImages || [])
      .slice(0, MAX_PRODUCT_IMAGES_COUNT)
      .map((url) => ({ url, revoke: false }));

    setPreviews((prev) => {
      // Keep current new (revoke=true) items if there is room
      const newItems = prev.filter((p) => p.revoke);

      const availableSlots = Math.max(
        0,
        MAX_PRODUCT_IMAGES_COUNT - existing.length,
      );

      // If no room left, revoke all current object URLs (they won't be shown)
      if (availableSlots <= 0) {
        newItems.forEach((p) => p.revoke && URL.revokeObjectURL(p.url));
        // Also clear selected files because none can be shown
        setSelectedFiles([]);
        if (inputRef.current) inputRef.current.value = "";
        return existing;
      }

      // Otherwise, keep up to availableSlots new items
      const keptNew = newItems.slice(0, availableSlots);
      return [...existing, ...keptNew];
    });
    // Note: do not clear selectedFiles unless we had to drop all new items above
  }, [initialImages]);

  // Revoke any remaining object URLs on unmount or when previews list changes
  useEffect(() => {
    return () => {
      previews.forEach((p) => p.revoke && URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const handleIconClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      event.target.value = "";
      return;
    }

    // De-duplicate incoming files against current selection and within batch
    const fileArray = Array.from(files);
    const dedupeKey = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
    const existingKeys = new Set(selectedFiles.map(dedupeKey));
    const uniqueIncoming: File[] = [];
    const seen = new Set<string>();
    for (const f of fileArray) {
      const key = dedupeKey(f);
      if (existingKeys.has(key) || seen.has(key)) continue;
      seen.add(key);
      uniqueIncoming.push(f);
    }

    const newValidFiles: File[] = [];

    for (const file of uniqueIncoming) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(
          `File ${file.name} exceeds max size of ${MAX_FILE_SIZE_MB}MB.`,
        );
        continue;
      }

      const isValid = await validateImage(file);
      if (!isValid) continue;

      newValidFiles.push(file);
    }

    if (
      previews.length +
        (onStageImage ? stagedImages.length : 0) +
        newValidFiles.length >
      MAX_PRODUCT_IMAGES_COUNT
    ) {
      toast.error(
        `Maximum ${MAX_PRODUCT_IMAGES_COUNT} images allowed per product.`,
      );
      event.target.value = "";
      return;
    }
    if (newValidFiles.length === 0) {
      // Nothing added; still reset so picking the same file retriggers change
      event.target.value = "";
      return;
    }

    if (onStageImage) {
      setIsStaging(true);
      try {
        for (const file of newValidFiles) {
          const staged = await onStageImage(file);
          if (!staged) {
            toast.error(`Unable to stage ${file.name}.`);
          }
        }
      } finally {
        setIsStaging(false);
        event.target.value = "";
      }
      return;
    }

    const newPreviews = newValidFiles.map((file) => ({
      url: URL.createObjectURL(file),
      revoke: true,
    }));

    const updatedPreviews = [...previews, ...newPreviews];
    const updatedFiles = [...selectedFiles, ...newValidFiles];

    setPreviews(updatedPreviews);
    setSelectedFiles(updatedFiles);
    onImageSelect?.(updatedFiles);
    // Clear after success so re-selecting the same file triggers onChange
    event.target.value = "";
  };

  const handleRemoveImage = async (index: number) => {
    const toRemove = previews[index];
    if (!toRemove) return;

    // If this is an existing image (revoke=false), call API before removing
    if (!toRemove.revoke) {
      if (typeof onRemoveExisting === "function") {
        const ok = await onRemoveExisting(toRemove.url);
        if (!ok) return; // abort UI removal if API failed
      }
    } else if (toRemove.revoke) {
      URL.revokeObjectURL(toRemove.url);
    }

    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);

    const newFiles = [...selectedFiles];
    // Only adjust files list for object-URL previews (new uploads)
    if (toRemove.revoke) {
      // Map preview index to selectedFiles index by counting revoke items prior to index
      const priorRevokeCount = previews
        .slice(0, index)
        .filter((p) => p.revoke).length;
      if (priorRevokeCount >= 0 && priorRevokeCount < newFiles.length) {
        newFiles.splice(priorRevokeCount, 1);
        setSelectedFiles(newFiles);
        onImageSelect?.(newFiles);
      }
    }

    // Notify parent about existing list change (filter previews that are existing)
    if (typeof onExistingListChange === "function") {
      const existingUrls = newPreviews
        .filter((p) => !p.revoke)
        .map((p) => p.url);
      onExistingListChange(existingUrls);
    }
  };

  const handleRemoveStagedImage = async (uuid: string) => {
    if (!onRemoveStaged) return;
    await onRemoveStaged(uuid);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-transparent p-3 transition-colors",
        invalid && "border-destructive bg-destructive/5 shadow-sm",
      )}
    >
      <div className="flex items-center space-x-4">
        <input
          name="files[]"
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={isStaging}
          className="hidden"
        />
        <div className="flex flex-wrap gap-4">
          {stagedImages.map((image) => (
            <div
              key={image.uuid}
              className="relative flex h-20 w-44 items-center gap-2 rounded border px-2"
            >
              <div className="min-w-0">
                <p
                  className="truncate text-xs font-medium"
                  title={image.original_name}
                >
                  {image.original_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(image.size)} · {image.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleRemoveStagedImage(image.uuid)}
                disabled={isStaging}
                aria-label={`Remove ${image.original_name}`}
                className="absolute -top-2 -right-2 rounded-full bg-white p-1 shadow"
              >
                <X className="h-4 w-4 text-red-500" />
              </button>
            </div>
          ))}
          {previews.map((p, index) => (
            <div key={index} className="relative">
              {brokenUrls[p.url] ? (
                <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed text-center text-xs text-muted-foreground">
                  Image unavailable
                </div>
              ) : (
                <NextImage
                  width={100}
                  height={100}
                  src={p.url}
                  alt={`preview-${index}`}
                  className="h-20 w-20 rounded border object-cover"
                  onError={() =>
                    setBrokenUrls((prev) => ({ ...prev, [p.url]: true }))
                  }
                />
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
        <div
          onClick={isStaging ? undefined : handleIconClick}
          aria-disabled={isStaging}
          className={cn(isStaging && "cursor-wait opacity-60")}
        >
          <CirclePlus width={80} height={80} />
        </div>
      </div>
      {isStaging && (
        <p className="mt-3 text-sm text-muted-foreground">Saving images…</p>
      )}
      {errorMessage && (
        <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
