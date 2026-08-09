export const fieldLabelClasses =
  "mb-balsa-2xs block text-sm font-medium leading-snug text-balsa-foreground";

export const fieldHintClasses = "mt-balsa-2xs block text-sm text-balsa-muted-foreground";

export const textControlClasses =
  "w-full rounded-lg border font-balsa-body text-balsa-input-foreground outline-none transition-[border-color,box-shadow,opacity] placeholder:text-balsa-muted-foreground focus:border-balsa-focus-ring focus:ring-2 focus:ring-balsa-focus-ring/30 disabled:border-balsa-border disabled:bg-balsa-disabled disabled:text-balsa-disabled-foreground";

export const textControlPopupClasses =
  "max-h-64 overflow-auto rounded-lg p-balsa-3xs text-balsa-surface-elevated-foreground shadow-balsa-surface transition-[opacity,transform,visibility] duration-balsa-fast ease-balsa";

export const textControlOptionClasses =
  "flex min-h-8 w-full items-center justify-between rounded-md px-balsa-sm py-balsa-2xs text-left text-sm transition-colors";

/*
 * No bare `border`. Tailwind compiles it to a literal 1px, which outranks the
 * `border-width: var(--balsa-border-width)` the stylesheet sets on these
 * controls -- so a checkbox and a radio kept a 1px edge at every border
 * setting while everything around them moved. The colour utilities stay; only
 * the width comes from the token.
 */
export const choiceInputClasses =
  "shrink-0 cursor-pointer appearance-none outline-none transition-[border-color,background-color,box-shadow,opacity] focus-visible:border-balsa-focus-ring focus-visible:ring-2 focus-visible:ring-balsa-focus-ring/30 disabled:cursor-not-allowed disabled:border-balsa-border disabled:bg-balsa-disabled";

export type FieldStatus = "default" | "validated" | "unvalidated";
export type FieldSize = "sm" | "md";
export type FieldVariant = "outline" | "surface" | "soft" | "glass";
export type Rounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
export type TextareaResize = "none" | "vertical" | "both";

export const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
};

/**
 * A surface that may be contained by another one.
 *
 * `auto` means "concentric with whatever contains me": the corner follows the
 * containing surface's radius minus the inset between them, so the gap between
 * the two edges stays even instead of thickening at every corner. A surface
 * standing on its own finds nothing published to nest inside and keeps the
 * ordinary surface radius.
 *
 * Kept apart from `Rounded` because that union is shared with text controls,
 * where there is nothing to be concentric with and `auto` would be a value
 * nobody could act on.
 */
export type SurfaceRounded = Rounded | "auto";

export const surfaceRoundedClasses: Readonly<Record<SurfaceRounded, string>> = {
  ...roundedClasses,
  // Deliberately no class. The radius comes from the concentric rule in
  // balsa-theme.css, keyed on data-rounded="auto"; a utility emitted here would
  // outrank it and pin the corner to one value.
  auto: "",
};

const fieldVariantClasses: Readonly<Record<FieldVariant, string>> = {
  outline: "border-balsa-input-border bg-balsa-background",
  surface: "border-balsa-input-border bg-balsa-input",
  soft: "border-transparent bg-balsa-muted",
  glass: "border-balsa-border/70 bg-balsa-surface/70 backdrop-blur-md",
};

const fieldPopupVariantClasses: Readonly<Record<FieldVariant, string>> = {
  outline: "border-balsa-input-border bg-balsa-background",
  surface: "border-balsa-border-strong bg-balsa-surface-elevated",
  soft: "border-transparent bg-balsa-muted",
  glass: "border-balsa-border/70 bg-balsa-surface/80 backdrop-blur-md",
};

export interface AnchoredPopupPosition {
  left: number;
  top: number;
  width: number;
}

const textControlSizeClasses: Record<FieldSize, string[]> = {
  sm: ["h-8", "px-balsa-md", "text-sm"],
  md: ["h-9", "px-balsa-md", "text-sm"],
};

const textareaResizeClasses: Readonly<Record<TextareaResize, string>> = {
  none: "resize-none",
  vertical: "resize-y",
  both: "resize",
};

export const fieldStatusMessages: Record<
  Extract<FieldStatus, "unvalidated">,
  string
> = {
  unvalidated: "Check this information and try again.",
};

export function getTextControlClasses(
  status: FieldStatus,
  hasAdornment: boolean,
  disabled: boolean,
  loading: boolean,
  size: FieldSize = "md",
  rounded: Rounded = "lg",
  variant: FieldVariant = "surface",
): string[] {
  const resolvedSize = textControlSizeClasses[size] ? size : "md";
  return [
    textControlClasses,
    fieldVariantClasses[variant],
    roundedClasses[rounded],
    ...textControlSizeClasses[resolvedSize],
    ...(loading
      ? ["disabled:cursor-progress"]
      : disabled
        ? ["disabled:cursor-not-allowed"]
        : ["cursor-pointer"]),
    ...(status === "validated" ? ["border-balsa-success", "focus:border-balsa-success"] : []),
    ...(status === "unvalidated"
      ? ["border-balsa-destructive", "focus:border-balsa-destructive", "focus:ring-balsa-destructive/30"]
      : []),
    ...(hasAdornment ? ["pr-10"] : []),
  ];
}

export function getTextControlPopupClasses(
  rounded: Rounded = "lg",
  variant: FieldVariant = "surface",
): string[] {
  return [textControlPopupClasses, roundedClasses[rounded], fieldPopupVariantClasses[variant]];
}

export function getTextareaControlClasses(
  status: FieldStatus,
  disabled: boolean,
  loading: boolean,
  size: FieldSize = "md",
  rounded: Rounded = "lg",
  resizable: TextareaResize = "vertical",
  hasAdornment = false,
  variant: FieldVariant = "surface",
): string[] {
  return [
    textControlClasses,
    fieldVariantClasses[variant],
    "h-auto min-h-0 py-balsa-xs leading-6",
    roundedClasses[rounded],
    textareaResizeClasses[resizable],
    size === "sm" ? "px-balsa-md text-sm leading-5" : "px-balsa-md text-sm leading-6",
    ...(loading
      ? ["disabled:cursor-progress"]
      : disabled
        ? ["disabled:cursor-not-allowed"]
        : ["cursor-text"]),
    ...(status === "validated" ? ["border-balsa-success", "focus:border-balsa-success"] : []),
    ...(status === "unvalidated"
      ? ["border-balsa-destructive", "focus:border-balsa-destructive", "focus:ring-balsa-destructive/30"]
      : []),
    ...(hasAdornment ? ["pr-10"] : []),
  ];
}

export function getChoiceInputClasses(variant: FieldVariant = "surface"): string[] {
  return [choiceInputClasses, fieldVariantClasses[variant]];
}

export function getChoiceTrackClasses(variant: FieldVariant = "surface"): string {
  return fieldVariantClasses[variant];
}

export function getAnchoredPopupPosition(
  trigger: HTMLElement,
  popup: HTMLElement,
  fallbackHeight = 256,
): AnchoredPopupPosition {
  const triggerRect = trigger.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  const viewportPadding = 8;
  const gap = 8;
  const width = Math.min(
    triggerRect.width,
    window.innerWidth - viewportPadding * 2,
  );
  const height = popupRect.height || fallbackHeight;
  const maxLeft = Math.max(
    viewportPadding,
    window.innerWidth - width - viewportPadding,
  );

  return {
    width,
    left: Math.min(Math.max(triggerRect.left, viewportPadding), maxLeft),
    top:
      triggerRect.bottom + gap + height <= window.innerHeight - viewportPadding
        ? triggerRect.bottom + gap
        : Math.max(viewportPadding, triggerRect.top - height - gap),
  };
}

export function getFieldStatusIcon(status: FieldStatus): IconComponent | undefined {
  if (status === "validated") return CircleCheckBig;
  if (status === "unvalidated") return CircleAlert;
  return undefined;
}

export function getFieldStateColorClass(status: FieldStatus): string {
  if (status === "unvalidated") return "text-balsa-destructive";
  if (status === "validated") return "text-balsa-success";
  return "text-balsa-muted-foreground";
}
import { CircleAlert, CircleCheckBig } from "@lucide/vue";
import type { IconComponent } from "./Icon.vue";
