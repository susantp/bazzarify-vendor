export const PRODUCT_STATUS = {
  INACTIVE: 0,
  ACTIVE: 1,
  PENDING: 2,
  ARCHIVED: 3,
  DRAFT: 4,
} as const;

export type ProductStatusValue =
  (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export type ProductStatusBadge = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  tone: "success" | "warning" | "info" | "muted" | "danger";
  className: string;
};

const FALLBACK: ProductStatusBadge = {
  label: "Unknown",
  variant: "outline",
  tone: "muted",
  className: "border-dashed text-muted-foreground",
};

export const productStatusBadge = (
  status: number | null | undefined,
): ProductStatusBadge => {
  switch (status) {
    case PRODUCT_STATUS.ACTIVE:
      return {
        label: "Active",
        variant: "default",
        tone: "success",
        className:
          "bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-500/90",
      };
    case PRODUCT_STATUS.DRAFT:
      return {
        label: "Draft",
        variant: "secondary",
        tone: "warning",
        className:
          "bg-amber-100 text-amber-900 hover:bg-amber-100/80 dark:bg-amber-900/40 dark:text-amber-200",
      };
    case PRODUCT_STATUS.PENDING:
      return {
        label: "Pending",
        variant: "secondary",
        tone: "info",
        className:
          "bg-sky-100 text-sky-900 hover:bg-sky-100/80 dark:bg-sky-900/40 dark:text-sky-200",
      };
    case PRODUCT_STATUS.ARCHIVED:
      return {
        label: "Archived",
        variant: "outline",
        tone: "muted",
        className:
          "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200",
      };
    case PRODUCT_STATUS.INACTIVE:
      return {
        label: "Inactive",
        variant: "destructive",
        tone: "danger",
        className: "",
      };
    default:
      return FALLBACK;
  }
};

export type ProductStatusTransition = {
  label: string;
  status: ProductStatusValue;
  tone: "primary" | "neutral" | "danger";
  description: string;
};

export const productStatusTransitions = (
  current: number | null | undefined,
): ProductStatusTransition[] => {
  switch (current) {
    case PRODUCT_STATUS.DRAFT:
      return [
        {
          label: "Publish",
          status: PRODUCT_STATUS.ACTIVE,
          tone: "primary",
          description: "Make this product visible in the storefront.",
        },
        {
          label: "Archive",
          status: PRODUCT_STATUS.ARCHIVED,
          tone: "danger",
          description: "Hide from storefront and lists; can be restored later.",
        },
      ];
    case PRODUCT_STATUS.ACTIVE:
      return [
        {
          label: "Unpublish",
          status: PRODUCT_STATUS.DRAFT,
          tone: "neutral",
          description: "Move back to Draft and hide from storefront.",
        },
        {
          label: "Archive",
          status: PRODUCT_STATUS.ARCHIVED,
          tone: "danger",
          description: "Hide from storefront and lists; can be restored later.",
        },
      ];
    case PRODUCT_STATUS.ARCHIVED:
      return [
        {
          label: "Restore to Draft",
          status: PRODUCT_STATUS.DRAFT,
          tone: "primary",
          description: "Bring back to Draft for further edits.",
        },
      ];
    case PRODUCT_STATUS.PENDING:
      return [
        {
          label: "Publish",
          status: PRODUCT_STATUS.ACTIVE,
          tone: "primary",
          description: "Make this approved product visible in the storefront.",
        },
        {
          label: "Move to Draft",
          status: PRODUCT_STATUS.DRAFT,
          tone: "neutral",
          description: "Send back to Draft for edits.",
        },
      ];
    case PRODUCT_STATUS.INACTIVE:
      return [
        {
          label: "Restore to Draft",
          status: PRODUCT_STATUS.DRAFT,
          tone: "primary",
          description: "Restore from inactive state.",
        },
      ];
    default:
      return [];
  }
};
