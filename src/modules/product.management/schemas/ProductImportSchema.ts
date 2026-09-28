import { z } from "zod";

export const ProductImportTargetStoreSchema = z
  .object({
    uuid: z.uuid(),
    name: z.string(),
    slug: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    sellable_category_count: z.number().int().nonnegative(),
    product_authoring_ready: z.boolean(),
    assigned_vendor: z
      .object({
        uuid: z.uuid(),
        name: z.string().nullable(),
        email: z.string().nullable(),
      })
      .nullable(),
  })
  .strict();

export const ProductImportEligibilitySchema = z
  .object({
    actor_type: z.enum(["vendor", "admin"]),
    can_initiate: z.boolean(),
    target_store_required: z.boolean(),
    blocking_reasons: z.array(
      z
        .object({
          code: z.string(),
          message: z.string(),
        })
        .strict(),
    ),
    target_store: ProductImportTargetStoreSchema.nullable(),
  })
  .strict();

export const ProductImportGuidePayloadSchema = z
  .object({
    guide: z
      .object({
        template: z
          .object({
            filename: z.string(),
            headers: z.array(z.string()),
            sample_rows: z.array(z.record(z.string(), z.string())),
            api_path: z.string(),
            requires_target_store_uuid: z.boolean(),
          })
          .strict(),
        // Backend (ProductImportController::guide) emits the catalog download metadata
        // so the client can proxy to the ZIP endpoint and gate the admin flow on
        // target_store_uuid. Per the "API Contract Parity" invariant.
        catalog: z
          .object({
            api_path: z.string(),
            requires_target_store_uuid: z.boolean(),
          })
          .strict(),
        constraints: z
          .object({
            csv_max_size_mb: z.number().int().positive(),
            image_archive_max_size_mb: z.number().int().positive(),
            grouping_rule: z.string(),
          })
          .strict(),
        prerequisites: z.array(z.string()),
        workflow_steps: z.array(z.string()),
        image_rules: z.array(z.string()),
        fields: z.array(
          z
            .object({
              key: z.string(),
              label: z.string(),
              required: z.boolean(),
              description: z.string(),
              example: z.string().nullable(),
            })
            .strict(),
        ),
      })
      .strict(),
    eligibility: ProductImportEligibilitySchema,
  })
  .strict();

export const ProductImportRecordSchema = z
  .object({
    uuid: z.uuid(),
    status: z.string().nullable(),
    source_filename: z.string().nullable(),
    image_archive_filename: z.string().nullable(),
    target_store_uuid: z.uuid().nullable(),
    target_store: z
      .object({
        uuid: z.uuid(),
        name: z.string(),
      })
      .nullable(),
    total_rows: z.number().int().nonnegative(),
    valid_rows: z.number().int().nonnegative(),
    invalid_rows: z.number().int().nonnegative(),
    processed_rows: z.number().int().nonnegative(),
    succeeded_rows: z.number().int().nonnegative(),
    failed_rows: z.number().int().nonnegative(),
    progress_percentage: z.number().nonnegative(),
    summary: z.record(z.string(), z.unknown()).nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    started_at: z.string().nullable(),
    finished_at: z.string().nullable(),
  })
  .strict();

export const ProductImportRowSchema = z
  .object({
    uuid: z.uuid(),
    row_number: z.number().int().positive(),
    status: z.string().nullable(),
    raw_payload: z.record(z.string(), z.unknown()).nullable(),
    normalized_payload: z.record(z.string(), z.unknown()).nullable(),
    // Backend (ProductImportPreflightValidator::addError) builds Record<string, string[]>
    // for INVALID rows; an empty PHP array (READY rows) JSON-encodes as [] not {}.
    errors: z
      .union([z.array(z.string()), z.record(z.string(), z.array(z.string()))])
      .nullable(),
    // Backend (ProductImportPreflightValidator) emits array_values(array_unique(...))
    // of plain strings (or [] when no suggestions). Never a record.
    suggestions: z.array(z.string()).nullable(),
    product_uuid: z.uuid().nullable(),
  })
  .strict();

export const ProductImportUploadPayloadSchema = z
  .object({
    import: ProductImportRecordSchema,
  })
  .strict();

export const ProductImportValidationPayloadSchema = z
  .object({
    import: ProductImportRecordSchema,
    rows: z.array(ProductImportRowSchema),
  })
  .strict();

export const ProductImportProcessPayloadSchema = z
  .object({
    import: ProductImportRecordSchema,
    result: z
      .object({
        processed_rows: z.number().int().nonnegative(),
        succeeded_rows: z.number().int().nonnegative(),
        failed_rows: z.number().int().nonnegative(),
        // Backend (ProductImportProcessor::buildReplayResult) uses $import->status?->value;
        // nullable on the wire when status column is null.
        status: z.string().nullable(),
        sample_failures: z.array(
          z
            .object({
              import_key: z.string(),
              row_numbers: z.array(z.number().int().positive()),
              message: z.string(),
            })
            .strict(),
        ),
        idempotent_replay: z.boolean(),
        queued: z.boolean().optional(),
        message: z.string().optional(),
      })
      .strict(),
  })
  .strict();

export const ProductImportTargetStorePayloadSchema = z
  .object({
    stores: z.array(ProductImportTargetStoreSchema),
  })
  .strict();

export const ProductImportTableFilterSchema = z.union([
  z
    .object({
      type: z.string(),
      key: z.string(),
      label: z.string(),
      placeholder: z.string().optional(),
      // ServerDataTableMeta::option accepts string|int values; current call sites
      // only pass strings. Keep strict and revisit if a numeric option is added.
      options: z
        .array(
          z
            .object({
              label: z.string(),
              value: z.string(),
            })
            .strict(),
        )
        .optional(),
      // ServerDataTableMeta::dateRange additional fields.
      fromKey: z.string().optional(),
      toKey: z.string().optional(),
      maxMonths: z.number().int().positive().optional(),
    })
    .passthrough(),
  z.record(z.string(), z.unknown()),
]);

export const ProductImportTableMetaSchema = z
  .object({
    search: z
      .object({
        queryKey: z.string(),
        placeholder: z.string(),
      })
      .strict(),
    filters: z.array(ProductImportTableFilterSchema),
  })
  .strict();

export const ProductImportListPayloadSchema = z
  .object({
    imports: z
      .object({
        data: z.array(ProductImportRecordSchema),
        current_page: z.number().int().positive().optional(),
        per_page: z.number().int().positive().optional(),
        path: z.string().optional(),
        next_page_url: z.string().nullable().optional(),
        prev_page_url: z.string().nullable().optional(),
        from: z.number().int().nullable().optional(),
        to: z.number().int().nullable().optional(),
      })
      .passthrough(),
    table: ProductImportTableMetaSchema,
  })
  .strict();

export const ProductImportActivePayloadSchema = z
  .object({
    active_import: ProductImportRecordSchema.nullable(),
  })
  .strict();

export const ProductImportActiveImportErrorSchema = z
  .object({
    uuid: z.uuid(),
    status: z.string().nullable(),
  })
  .strict();
