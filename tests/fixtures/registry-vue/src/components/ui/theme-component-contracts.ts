export type ThemeRounded =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "full";

export type ThemeShadow = "auto" | "none" | "sm" | "md" | "lg";

type Defaults<
  Variant extends string = never,
  Size extends string | null = never,
  Extra extends object = object,
> = {
  variant?: Variant;
  size?: Size;
} & Extra;

type RoundedDefaults<
  Variant extends string = never,
  Size extends string | null = never,
  Extra extends object = object,
> = Defaults<Variant, Size, Extra> & {
  rounded?: ThemeRounded;
};

type ElevatedDefaults<
  Variant extends string = never,
  Size extends string | null = never,
  Extra extends object = object,
> = Defaults<Variant, Size, Extra> & {
  shadow?: ThemeShadow;
};

type RoundedElevatedDefaults<
  Variant extends string = never,
  Size extends string | null = never,
  Extra extends object = object,
> = RoundedDefaults<Variant, Size, Extra> & {
  shadow?: ThemeShadow;
};

type FieldVariant = "outline" | "surface" | "soft" | "glass";
type FieldSize = "sm" | "md";
type LayerVariant = "surface" | "outline" | "soft" | "glass";
type LayerSize = "sm" | "md" | "lg";
type ActionVariant = "surface" | "solid" | "outline" | "glass";
type SurfaceVariant = "surface" | "outline" | "soft" | "glass";

/**
 * Appearance-only defaults keyed by the public component contract. These
 * unions stay independent from the Vue files so the theme item installs by
 * itself rather than pulling the entire component catalog into a project.
 */
export interface ThemeComponentDefaultMap {
  button: ElevatedDefaults<
    "solid" | "soft" | "outline" | "glass",
    "sm" | "md" | "lg" | "xl" | null,
    { shape?: "rounded" | "pill" | "fab" }
  >;
  "button-group": ElevatedDefaults<
    ActionVariant | "code",
    "sm" | "md" | "lg" | "xl",
    { shape?: "rounded" | "pill" }
  >;
  input: RoundedDefaults<FieldVariant, FieldSize>;
  "input-group": RoundedDefaults<never, FieldSize>;
  "input-otp": RoundedDefaults<FieldVariant | "solid", FieldSize>;
  "radio-group": RoundedDefaults<never, FieldSize>;
  slider: RoundedDefaults<never, LayerSize>;
  popup: RoundedElevatedDefaults<LayerVariant, LayerSize | "trigger">;
  "hover-card": RoundedElevatedDefaults<LayerVariant>;
  tooltip: RoundedElevatedDefaults<LayerVariant>;
  "dropdown-menu": RoundedElevatedDefaults<LayerVariant>;
  "context-menu": RoundedElevatedDefaults<LayerVariant>;
  menubar: RoundedElevatedDefaults<LayerVariant>;
  "command-menu": RoundedElevatedDefaults<LayerVariant, LayerSize>;
  drawer: RoundedElevatedDefaults<LayerVariant, LayerSize>;
  "color-picker": RoundedElevatedDefaults<FieldVariant, LayerSize>;
  modal: RoundedElevatedDefaults<
    "surface" | "solid" | "outline" | "soft" | "glass",
    LayerSize | "full"
  >;
  textarea: RoundedDefaults<FieldVariant, FieldSize>;
  breadcrumb: Defaults<never, "sm" | "md">;
  link: RoundedElevatedDefaults<"text" | "solid" | "outline", LayerSize>;
  badge: RoundedDefaults<"solid" | "soft" | "outline" | "glass", LayerSize>;
  card: Omit<
    RoundedElevatedDefaults<
      "surface" | "elevated" | "muted" | "outline" | "soft" | "glass",
      LayerSize,
      { padding?: "none" | "sm" | "md" | "lg" }
    >,
    "shadow"
  > & { shadow?: ThemeShadow | boolean };
  select: RoundedElevatedDefaults<FieldVariant, FieldSize>;
  autocomplete: RoundedElevatedDefaults<FieldVariant, FieldSize>;
  checkbox: RoundedDefaults<FieldVariant, LayerSize>;
  switch: RoundedDefaults<FieldVariant, LayerSize>;
  toggle: RoundedElevatedDefaults<ActionVariant, "sm" | "md" | "lg" | "xl">;
  "toggle-group": RoundedElevatedDefaults<ActionVariant, "sm" | "md" | "lg" | "xl">;
  collapsible: RoundedElevatedDefaults<"underline" | LayerVariant, LayerSize>;
  accordion: RoundedElevatedDefaults<"underline" | LayerVariant, LayerSize>;
  kbd: RoundedElevatedDefaults<"raised" | "outline" | "soft", LayerSize>;
  avatar: Defaults<never, "sm" | "md" | "lg" | "xl", {
    shape?: "circle" | "rounded" | "square";
  }>;
  pagination: RoundedDefaults<never, LayerSize>;
  resizable: RoundedElevatedDefaults<SurfaceVariant, LayerSize>;
  "scroll-area": RoundedElevatedDefaults<never, "thin" | "regular">;
  preview: Defaults;
  carousel: RoundedElevatedDefaults<SurfaceVariant>;
  sidebar: RoundedElevatedDefaults<SurfaceVariant>;
  attachment: RoundedElevatedDefaults<never, LayerSize>;
  table: RoundedElevatedDefaults<SurfaceVariant, never, {
    density?: "compact" | "default" | "comfortable";
  }>;
  calendar: RoundedElevatedDefaults;
  "date-picker": RoundedDefaults;
  "data-table": RoundedDefaults<SurfaceVariant, never, {
    density?: "compact" | "default" | "comfortable";
  }>;
  charts: RoundedDefaults;
  separator: Defaults<"solid" | "dashed" | "dotted", LayerSize>;
  skeleton: RoundedDefaults<"muted" | "soft" | "glass", LayerSize, {
    shape?: "text" | "rect" | "circle";
  }>;
  spinner: Defaults<never, "xs" | "sm" | "md" | "lg" | "xl">;
  progress: RoundedDefaults<"solid" | "soft" | "striped", LayerSize>;
  alert: RoundedElevatedDefaults<"surface" | "outline" | "soft" | "solid" | "glass", LayerSize>;
  toast: RoundedElevatedDefaults<"surface" | "soft" | "outline" | "glass", LayerSize>;
  tabs: RoundedElevatedDefaults<SurfaceVariant, LayerSize, {
    type?: "segmented" | "underline" | "pills" | "tiles";
    panelSurface?: boolean;
  }>;
  "code-block": RoundedElevatedDefaults<never, LayerSize>;
  "gradient-background": Defaults;
  dropdown: RoundedElevatedDefaults<SurfaceVariant>;
  navbar: ElevatedDefaults<SurfaceVariant, never, {
    type?: "bar" | "floating" | "minimal";
  }>;
  footer: Defaults;
}
