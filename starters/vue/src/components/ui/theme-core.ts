import type {
  ThemeComponentDefaultMap,
  ThemeRounded,
  ThemeShadow,
} from "./theme-component-contracts";

/**
 * Built-in theme metadata without framework icon component values.
 * A framework adapter attaches icon components on its public `designThemes` export.
 */
export const designThemeCatalog = [
  {
    id: "modern-flat",
    label: "Modern Flat",
    description: "Clean rounded surfaces with restrained elevation and direct interactions.",
  },
  {
    id: "brutalism",
    label: "Brutalism",
    description: "Rectangular geometry, visible structure, flat surfaces, and utility-first type.",
  },
  {
    id: "glassmorphism",
    label: "Glassmorphism",
    description: "Layered translucent controls with fluid depth and accessible solid fallbacks.",
  },
] as const;

export type DesignTheme = (typeof designThemeCatalog)[number]["id"];

export const defaultDesignTheme: DesignTheme = "modern-flat";

export type Rounded = ThemeRounded;

export type Shadow = ThemeShadow;

export type ThemeFamily =
  | "controls"
  | "fields"
  | "surfaces"
  | "overlays"
  | "navigation";

export type ThemeComponentName = (typeof publicThemeCoverage)[number];

export type ThemePaletteRole =
  | "background"
  | "foreground"
  | "surface"
  | "surface-foreground"
  | "surface-elevated"
  | "surface-elevated-foreground"
  | "muted"
  | "muted-foreground"
  | "inverse"
  | "inverse-foreground"
  | "primary"
  | "primary-foreground"
  | "primary-hover"
  | "primary-active"
  | "secondary"
  | "secondary-foreground"
  | "secondary-hover"
  | "secondary-active"
  | "accent"
  | "accent-foreground"
  | "accent-hover"
  | "accent-active"
  | "destructive"
  | "destructive-foreground"
  | "success"
  | "success-foreground"
  | "warning"
  | "warning-foreground"
  | "info"
  | "info-foreground"
  | "input"
  | "input-border"
  | "selected"
  | "border"
  | "border-strong"
  | "code"
  | "code-foreground";

export interface ThemeColorReference {
  role: ThemePaletteRole | "currentColor" | "transparent";
  opacity?: number;
}

export interface ThemeMaterial extends ThemeColorReference {
  tint?: ThemeColorReference;
}

export interface ThemeShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread?: number;
  color: ThemeColorReference;
  inset?: boolean;
}

export interface ThemeTransform {
  x?: number;
  y?: number;
  scale?: number;
}

export type ThemeEasing =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | readonly [number, number, number, number];

export type ThemeTypographyOption = "modern" | "system" | "editorial" | "mono";
export type ThemeShapeOption = "square" | "subtle" | "rounded" | "soft";
/**
 * How large a control is: its height, and the inset that follows from it.
 *
 * Distinct from spacing, which is the distance between things. One control
 * governed both until they were separated, which is why wiring the spacing
 * token to control padding double-counted: the size step already moved with it,
 * so a comfortable button gained the increase twice.
 */
/**
 * The default size of a control: its height, and the inset that follows from it.
 *
 * Named `size` because that is what it does and what its control has always been
 * labelled. It was called `density` while it also owned a spacing token, and
 * kept the name after `spacing` became its own dimension — a key whose name
 * contradicted its label, which is the same kind of lie that hid the size and
 * spacing conflation for as long as it did.
 *
 * Distinct from `Table`'s own `density` prop, which survives unchanged: that one
 * is a component's public API for row height, not a theme dimension.
 */
export type ThemeSizeOption = "compact" | "balanced" | "comfortable";

/** @deprecated The dimension is called `size`. Kept so older imports resolve. */
export type ThemeDensityOption = ThemeSizeOption;

/**
 * How much room the layout gives itself: the rhythm between siblings, and the
 * inset scale that derives from the same unit.
 *
 * Scales the base unit rather than each step, so the whole system moves in
 * proportion and the ratios between steps survive.
 */
export type ThemeSpacingOption = "tight" | "balanced" | "airy";
export type ThemeBorderOption = "none" | "soft" | "medium" | "strong";
export type ThemeElevationOption = "none" | "soft" | "floating" | "hard";
export type ThemeMotionOption = "none" | "snappy" | "balanced" | "fluid";
export type ThemeMaterialOption = "solid" | "soft" | "glass";

export interface ThemeOptions {
  typography?: ThemeTypographyOption;
  shape?: ThemeShapeOption;
  size?: ThemeSizeOption;
  spacing?: ThemeSpacingOption;
  border?: ThemeBorderOption;
  elevation?: ThemeElevationOption;
  motion?: ThemeMotionOption;
  material?: ThemeMaterialOption;
}

export type ResolvedThemeOptions = Required<ThemeOptions>;

export const themeOptionDefinitions = [
  {
    key: "typography",
    label: "Typography",
    values: ["modern", "system", "editorial", "mono"],
  },
  {
    key: "shape",
    label: "Shape",
    values: ["square", "subtle", "rounded", "soft"],
  },
  {
    key: "size",
    label: "Control size",
    values: ["compact", "balanced", "comfortable"],
  },
  {
    key: "spacing",
    label: "Spacing",
    values: ["tight", "balanced", "airy"],
  },
  {
    key: "border",
    label: "Borders",
    values: ["none", "soft", "medium", "strong"],
  },
  {
    key: "elevation",
    label: "Elevation",
    values: ["none", "soft", "floating", "hard"],
  },
  {
    key: "motion",
    label: "Motion",
    values: ["none", "snappy", "balanced", "fluid"],
  },
  {
    key: "material",
    label: "Material",
    values: ["solid", "soft", "glass"],
  },
] as const satisfies readonly {
  key: keyof ThemeOptions;
  label: string;
  values: readonly string[];
}[];

export const builtInThemeOptions: Readonly<Record<DesignTheme, ResolvedThemeOptions>> = {
  "modern-flat": {
    typography: "modern",
    shape: "rounded",
    size: "compact",
    spacing: "balanced",
    border: "soft",
    elevation: "none",
    motion: "balanced",
    material: "soft",
  },
  brutalism: {
    typography: "mono",
    shape: "square",
    size: "compact",
    spacing: "balanced",
    border: "strong",
    elevation: "none",
    motion: "snappy",
    material: "solid",
  },
  glassmorphism: {
    typography: "modern",
    shape: "soft",
    size: "compact",
    spacing: "balanced",
    border: "medium",
    elevation: "floating",
    motion: "fluid",
    material: "glass",
  },
};

export type ThemeMaterialKey =
  | "background"
  | "foreground"
  | "surface"
  | "surface-foreground"
  | "surface-elevated"
  | "surface-elevated-foreground"
  | "muted"
  | "muted-foreground"
  | "inverse"
  | "inverse-foreground"
  | "primary"
  | "primary-foreground"
  | "primary-hover"
  | "primary-active"
  | "secondary"
  | "secondary-foreground"
  | "secondary-hover"
  | "secondary-active"
  | "accent"
  | "accent-foreground"
  | "accent-hover"
  | "accent-active"
  | "input"
  | "input-border"
  | "selected"
  | "border"
  | "border-strong"
  | "code"
  | "playground-workspace"
  | "playground-properties"
  | "slider-thumb"
  | "outline-control"
  | "outline-control-hover"
  | "outline-control-active"
  | "outline-control-border"
  | "glass-control"
  | "glass-control-hover"
  | "glass-control-active"
  | "glass-control-border";

export interface ThemeTokens {
  typography?: {
    titleFonts?: readonly string[];
    bodyFonts?: readonly string[];
    controlFonts?: readonly string[];
    titleLetterSpacing?: number;
    titleTextTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
    controlWeight?: number;
    controlLetterSpacing?: number;
    controlTextTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  };
  radius?: {
    control?: number;
    surface?: number;
    panel?: number;
    badge?: number;
    toggle?: number;
    codeControl?: number;
  };
  spacing?: {
    /** The spacing scale's base unit. Every step is a multiple of it. */
    unit?: number;
    controlInline?: number;
    densityCompact?: number;
    densityDefault?: number;
    densityComfortable?: number;
  };
  border?: {
    width?: number;
    outlineWidth?: number;
    solidWidth?: number;
    opacity?: number;
    style?: "solid" | "dashed" | "dotted" | "double";
  };
  shadow?: {
    sm?: readonly ThemeShadowLayer[];
    md?: readonly ThemeShadowLayer[];
    lg?: readonly ThemeShadowLayer[];
    detail?: readonly ThemeShadowLayer[];
  };
  motion?: {
    fast?: number;
    normal?: number;
    slow?: number;
    easing?: ThemeEasing;
    controlHover?: ThemeTransform;
    controlActive?: ThemeTransform;
    surfaceHover?: ThemeTransform;
  };
  effects?: {
    backdropBlur?: number;
    backdropSaturation?: number;
    overlayBlur?: number;
  };
  materials?: Partial<Record<ThemeMaterialKey, ThemeMaterial>>;
}

export interface ThemeFamilyDefault {
  rounded?: Rounded;
  shadow?: Shadow;
}

export interface ThemeVisualDefaults {
  variant?: string;
  type?: string;
  size?: string | null;
  density?: string;
  rounded?: Rounded;
  shape?: string;
  padding?: string;
  shadow?: Shadow | boolean;
  panelSurface?: boolean;
}

export interface ThemeDefaults {
  families?: Partial<Record<ThemeFamily, ThemeFamilyDefault>>;
  components?: Partial<ThemeComponentDefaultMap>;
}

export interface ThemeOverrides {
  tokens?: ThemeTokens;
  defaults?: ThemeDefaults;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  extends: DesignTheme | ThemeDefinition;
  options?: ThemeOptions;
  overrides?: ThemeOverrides;
  /** @deprecated Use overrides.tokens. */
  tokens?: ThemeTokens;
  /** @deprecated Use overrides.defaults. */
  defaults?: ThemeDefaults;
}

export type ThemeInput = DesignTheme | ThemeDefinition;

/**
 * Portable input for creating a source-controlled theme from one of Balsa's
 * built-in presets. The configuration deliberately excludes ids, names, and
 * component defaults so quick editors can stay focused on presentation.
 */
export interface BalsaThemePresetConfig {
  schemaVersion: 1;
  base: DesignTheme;
  options?: ThemeOptions;
  overrides?: Pick<ThemeOverrides, "tokens">;
}

export interface ResolvedThemeDefinition {
  id: string;
  name: string;
  base: DesignTheme;
  options: ResolvedThemeOptions;
  tokens: ThemeTokens;
  defaults: ThemeDefaults;
}

export interface ThemePresentation {
  id: string;
  base?: DesignTheme;
  style: Readonly<Record<string, string>>;
}

export const publicThemeCoverage = [
  "button",
  "button-group",
  "input",
  "input-group",
  "input-otp",
  "radio-group",
  "slider",
  "popup",
  "hover-card",
  "tooltip",
  "dropdown-menu",
  "context-menu",
  "menubar",
  "command-menu",
  "drawer",
  "color-picker",
  "modal",
  "textarea",
  "breadcrumb",
  "link",
  "badge",
  "card",
  "select",
  "autocomplete",
  "checkbox",
  "switch",
  "toggle",
  "toggle-group",
  "collapsible",
  "accordion",
  "kbd",
  "avatar",
  "pagination",
  "resizable",
  "scroll-area",
  "preview",
  "carousel",
  "sidebar",
  "attachment",
  "table",
  "calendar",
  "date-picker",
  "data-table",
  "charts",
  "separator",
  "skeleton",
  "spinner",
  "progress",
  "alert",
  "toast",
  "tabs",
  "code-block",
  "gradient-background",
  "dropdown",
  "navbar",
  "footer",
] as const;

export const publicShadowCoverage = [
  "button",
  "button-group",
  "popup",
  "hover-card",
  "tooltip",
  "dropdown-menu",
  "context-menu",
  "menubar",
  "command-menu",
  "drawer",
  "color-picker",
  "modal",
  "link",
  "card",
  "select",
  "autocomplete",
  "toggle",
  "toggle-group",
  "collapsible",
  "accordion",
  "kbd",
  "resizable",
  "scroll-area",
  "carousel",
  "sidebar",
  "attachment",
  "table",
  "calendar",
  "alert",
  "toast",
  "tabs",
  "code-block",
  "dropdown",
  "navbar",
] as const satisfies readonly ThemeComponentName[];

const nonRoundedThemeComponents: ReadonlySet<ThemeComponentName> = new Set([
  "button",
  "button-group",
  "breadcrumb",
  "avatar",
  "preview",
  "separator",
  "spinner",
  "gradient-background",
  "navbar",
  "footer",
]);

export const publicRoundedCoverage: readonly ThemeComponentName[] =
  publicThemeCoverage.filter((component) => !nonRoundedThemeComponents.has(component));

export const themeDefaultPropCoverage = {
  variant: [
    "button", "button-group", "input", "input-otp", "popup", "hover-card",
    "tooltip", "dropdown-menu", "context-menu", "menubar", "command-menu",
    "drawer", "color-picker", "modal", "textarea", "link", "badge", "card",
    "select", "autocomplete", "checkbox", "switch", "toggle", "toggle-group",
    "collapsible", "accordion", "kbd", "resizable", "carousel", "sidebar",
    "table", "data-table", "separator", "skeleton", "progress", "alert",
    "toast", "tabs", "dropdown", "navbar",
  ],
  size: [
    "button", "button-group", "input", "input-group", "input-otp",
    "radio-group", "slider", "popup", "command-menu", "drawer",
    "color-picker", "modal", "textarea", "breadcrumb", "link", "badge",
    "card", "select", "autocomplete", "checkbox", "switch", "toggle",
    "toggle-group", "collapsible", "accordion", "kbd", "avatar",
    "pagination", "resizable", "scroll-area", "attachment", "separator",
    "skeleton", "spinner", "progress", "alert", "toast", "tabs", "code-block",
  ],
  type: ["tabs", "navbar"],
  shape: ["button", "button-group", "avatar", "skeleton"],
  padding: ["card"],
  density: ["table", "data-table"],
  panelSurface: ["tabs"],
} as const satisfies Readonly<Record<
  "variant" | "size" | "type" | "shape" | "padding" | "density" | "panelSurface",
  readonly ThemeComponentName[]
>>;

export const themeComponentSizeOptions: Readonly<
  Partial<Record<ThemeComponentName, readonly string[]>>
> = {
  button: ["sm", "md", "lg", "xl", "2xl"],
  "button-group": ["sm", "md", "lg", "xl"],
  input: ["sm", "md"],
  "input-group": ["sm", "md"],
  "input-otp": ["sm", "md"],
  "radio-group": ["sm", "md"],
  slider: ["sm", "md", "lg"],
  popup: ["sm", "md", "lg", "trigger"],
  "command-menu": ["sm", "md", "lg"],
  drawer: ["sm", "md", "lg"],
  "color-picker": ["sm", "md", "lg"],
  modal: ["sm", "md", "lg", "full"],
  textarea: ["sm", "md"],
  breadcrumb: ["sm", "md"],
  link: ["sm", "md", "lg"],
  badge: ["sm", "md", "lg"],
  card: ["sm", "md", "lg"],
  select: ["sm", "md"],
  autocomplete: ["sm", "md"],
  checkbox: ["sm", "md", "lg"],
  switch: ["sm", "md", "lg"],
  toggle: ["sm", "md", "lg", "xl"],
  "toggle-group": ["sm", "md", "lg", "xl"],
  collapsible: ["sm", "md", "lg"],
  accordion: ["sm", "md", "lg"],
  kbd: ["sm", "md", "lg"],
  avatar: ["sm", "md", "lg", "xl"],
  pagination: ["sm", "md", "lg"],
  resizable: ["sm", "md", "lg"],
  "scroll-area": ["thin", "regular"],
  attachment: ["sm", "md", "lg"],
  separator: ["sm", "md", "lg"],
  skeleton: ["sm", "md", "lg"],
  spinner: ["xs", "sm", "md", "lg", "xl"],
  progress: ["sm", "md", "lg"],
  alert: ["sm", "md", "lg"],
  toast: ["sm", "md", "lg"],
  tabs: ["sm", "md", "lg"],
  "code-block": ["sm", "md", "lg"],
};

export function isDesignTheme(value: unknown): value is DesignTheme {
  return designThemeCatalog.some((theme) => theme.id === value);
}

export function isThemeDefinition(value: unknown): value is ThemeDefinition {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ThemeDefinition>;
  return typeof candidate.id === "string"
    && typeof candidate.name === "string"
    && (
      isDesignTheme(candidate.extends)
      || (typeof candidate.extends === "object" && candidate.extends !== null)
    );
}

function assertFiniteNumber(
  value: number | undefined,
  label: string,
  minimum = 0,
): void {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < minimum) {
    throw new TypeError(`${label} must be a finite number greater than or equal to ${minimum}.`);
  }
}

function assertOpacity(value: number | undefined, label: string): void {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new TypeError(`${label} must be between 0 and 1.`);
  }
}

function validateColorReference(value: ThemeColorReference, label: string): void {
  const roles: ReadonlySet<string> = new Set([
    "currentColor",
    "transparent",
    "background",
    "foreground",
    "surface",
    "surface-foreground",
    "surface-elevated",
    "surface-elevated-foreground",
    "muted",
    "muted-foreground",
    "inverse",
    "inverse-foreground",
    "primary",
    "primary-foreground",
    "primary-hover",
    "primary-active",
    "secondary",
    "secondary-foreground",
    "secondary-hover",
    "secondary-active",
    "accent",
    "accent-foreground",
    "accent-hover",
    "accent-active",
    "destructive",
    "destructive-foreground",
    "success",
    "success-foreground",
    "warning",
    "warning-foreground",
    "info",
    "info-foreground",
    "input",
    "input-border",
    "selected",
    "border",
    "border-strong",
    "code",
    "code-foreground",
  ]);
  if (!roles.has(value.role)) {
    throw new TypeError(`${label}.role is not a supported semantic palette role.`);
  }
  assertOpacity(value.opacity, `${label}.opacity`);
}

function validateThemeTokens(tokens: ThemeTokens | undefined): void {
  if (!tokens) return;

  for (const [key, fonts] of Object.entries({
    titleFonts: tokens.typography?.titleFonts,
    bodyFonts: tokens.typography?.bodyFonts,
    controlFonts: tokens.typography?.controlFonts,
  })) {
    if (fonts !== undefined && (
      !Array.isArray(fonts)
      || !fonts.length
      || fonts.some((font) => typeof font !== "string" || !font.trim())
    )) {
      throw new TypeError(`tokens.typography.${key} must be a non-empty font stack.`);
    }
  }
  assertFiniteNumber(tokens.typography?.controlWeight, "tokens.typography.controlWeight", 1);
  assertFiniteNumber(
    tokens.typography?.titleLetterSpacing,
    "tokens.typography.titleLetterSpacing",
    Number.NEGATIVE_INFINITY,
  );
  assertFiniteNumber(
    tokens.typography?.controlLetterSpacing,
    "tokens.typography.controlLetterSpacing",
    Number.NEGATIVE_INFINITY,
  );
  if (
    tokens.typography?.titleTextTransform !== undefined
    && !["none", "uppercase", "lowercase", "capitalize"].includes(
      tokens.typography.titleTextTransform,
    )
  ) {
    throw new TypeError("tokens.typography.titleTextTransform is invalid.");
  }
  if (
    tokens.typography?.controlTextTransform !== undefined
    && !["none", "uppercase", "lowercase", "capitalize"].includes(
      tokens.typography.controlTextTransform,
    )
  ) {
    throw new TypeError("tokens.typography.controlTextTransform is invalid.");
  }
  for (const [key, value] of Object.entries(tokens.radius ?? {})) {
    assertFiniteNumber(value, `tokens.radius.${key}`);
  }
  for (const [key, value] of Object.entries(tokens.spacing ?? {})) {
    assertFiniteNumber(value, `tokens.spacing.${key}`);
  }
  for (const [key, value] of Object.entries(tokens.border ?? {})) {
    if (key !== "style") assertFiniteNumber(value as number, `tokens.border.${key}`);
  }
  assertOpacity(tokens.border?.opacity, "tokens.border.opacity");
  if (
    tokens.border?.style !== undefined
    && !["solid", "dashed", "dotted", "double"].includes(tokens.border.style)
  ) {
    throw new TypeError("tokens.border.style is invalid.");
  }
  for (const [key, layers] of Object.entries(tokens.shadow ?? {})) {
    for (const [index, layer] of (layers ?? []).entries()) {
      assertFiniteNumber(layer.x, `tokens.shadow.${key}[${index}].x`, Number.NEGATIVE_INFINITY);
      assertFiniteNumber(layer.y, `tokens.shadow.${key}[${index}].y`, Number.NEGATIVE_INFINITY);
      assertFiniteNumber(layer.blur, `tokens.shadow.${key}[${index}].blur`);
      assertFiniteNumber(layer.spread, `tokens.shadow.${key}[${index}].spread`, Number.NEGATIVE_INFINITY);
      validateColorReference(layer.color, `tokens.shadow.${key}[${index}].color`);
    }
  }
  for (const [key, value] of Object.entries(tokens.motion ?? {})) {
    if (key === "fast" || key === "normal" || key === "slow") {
      assertFiniteNumber(value as number, `tokens.motion.${key}`);
    }
  }
  const easing = tokens.motion?.easing;
  if (Array.isArray(easing) && (
    easing.length !== 4
    || easing.some((value) => !Number.isFinite(value))
  )) {
    throw new TypeError("tokens.motion.easing must contain four finite numbers.");
  }
  if (
    typeof easing === "string"
    && !["linear", "ease", "ease-in", "ease-out", "ease-in-out"].includes(easing)
  ) {
    throw new TypeError("tokens.motion.easing preset is invalid.");
  }
  for (const [key, transform] of Object.entries({
    controlHover: tokens.motion?.controlHover,
    controlActive: tokens.motion?.controlActive,
    surfaceHover: tokens.motion?.surfaceHover,
  })) {
    if (!transform) continue;
    assertFiniteNumber(transform.x, `tokens.motion.${key}.x`, Number.NEGATIVE_INFINITY);
    assertFiniteNumber(transform.y, `tokens.motion.${key}.y`, Number.NEGATIVE_INFINITY);
    assertFiniteNumber(transform.scale, `tokens.motion.${key}.scale`, 0);
  }
  for (const [key, value] of Object.entries(tokens.effects ?? {})) {
    assertFiniteNumber(value, `tokens.effects.${key}`);
  }
  for (const [key, material] of Object.entries(tokens.materials ?? {})) {
    if (!material) continue;
    validateColorReference(material, `tokens.materials.${key}`);
    if (material.tint) validateColorReference(material.tint, `tokens.materials.${key}.tint`);
  }
}

function validateThemeOptions(options: ThemeOptions | undefined): void {
  if (!options) return;
  const definitions = new Map(
    themeOptionDefinitions.map((definition) => [
      definition.key,
      new Set<string>(definition.values),
    ]),
  );
  for (const [key, value] of Object.entries(options)) {
    const values = definitions.get(key as keyof ThemeOptions);
    if (!values || typeof value !== "string" || !values.has(value)) {
      throw new TypeError(`options.${key} is not a supported theme recipe choice.`);
    }
  }
}

function validateThemeDefaults(defaults: ThemeDefaults | undefined): void {
  if (!defaults) return;
  const familyNames: ReadonlySet<string> = new Set([
    "controls",
    "fields",
    "surfaces",
    "overlays",
    "navigation",
  ]);
  const visualKeys: ReadonlySet<string> = new Set([
    "variant",
    "type",
    "size",
    "density",
    "rounded",
    "shape",
    "padding",
    "shadow",
    "panelSurface",
  ]);
  const roundedValues: ReadonlySet<string> = new Set([
    "none",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "full",
  ]);
  const shadowValues: ReadonlySet<string> = new Set(["auto", "none", "sm", "md", "lg"]);

  for (const [family, values] of Object.entries(defaults.families ?? {})) {
    if (!familyNames.has(family)) {
      throw new TypeError(`defaults.families.${family} is not a supported theme family.`);
    }
    if (!values || typeof values !== "object") {
      throw new TypeError(`defaults.families.${family} must be an object.`);
    }
    for (const [key, value] of Object.entries(values)) {
      if (key !== "rounded" && key !== "shadow") {
        throw new TypeError(`defaults.families.${family}.${key} is not appearance-configurable.`);
      }
      if (key === "rounded" && !roundedValues.has(value as string)) {
        throw new TypeError(`defaults.families.${family}.rounded is invalid.`);
      }
      if (key === "shadow" && !shadowValues.has(value as string)) {
        throw new TypeError(`defaults.families.${family}.shadow is invalid.`);
      }
    }
  }

  const componentNames: ReadonlySet<string> = new Set(publicThemeCoverage);
  for (const [component, values] of Object.entries(defaults.components ?? {})) {
    if (!componentNames.has(component)) {
      throw new TypeError(`defaults.components.${component} is not a public themed component.`);
    }
    if (!values || typeof values !== "object") {
      throw new TypeError(`defaults.components.${component} must be an object.`);
    }
    for (const [key, value] of Object.entries(values)) {
      if (!visualKeys.has(key)) {
        throw new TypeError(`defaults.components.${component}.${key} is not appearance-configurable.`);
      }
      if (
        key in themeDefaultPropCoverage
        && !themeDefaultPropCoverage[
          key as keyof typeof themeDefaultPropCoverage
        ].includes(component as never)
      ) {
        throw new TypeError(`defaults.components.${component}.${key} is not supported.`);
      }
      if (key === "rounded" && !roundedValues.has(value as string)) {
        throw new TypeError(`defaults.components.${component}.rounded is invalid.`);
      }
      if (
        key === "rounded"
        && !publicRoundedCoverage.includes(component as ThemeComponentName)
      ) {
        throw new TypeError(`defaults.components.${component}.rounded is not supported.`);
      }
      if (key === "size") {
        const supportedSizes = themeComponentSizeOptions[
          component as ThemeComponentName
        ];
        const validButtonAutoSize = component === "button" && value === null;
        if (
          !validButtonAutoSize
          && (!supportedSizes || !supportedSizes.includes(value as string))
        ) {
          throw new TypeError(`defaults.components.${component}.size is invalid.`);
        }
      } else if (key === "shadow") {
        if (!publicShadowCoverage.includes(component as never)) {
          throw new TypeError(`defaults.components.${component}.shadow is not supported.`);
        }
        const validCardAlias = component === "card" && typeof value === "boolean";
        if (!validCardAlias && !shadowValues.has(value as string)) {
          throw new TypeError(`defaults.components.${component}.shadow is invalid.`);
        }
      } else if (key === "panelSurface") {
        if (typeof value !== "boolean") {
          throw new TypeError(`defaults.components.${component}.panelSurface must be a boolean.`);
        }
      } else if (
        value !== undefined
        && value !== null
        && typeof value !== "string"
      ) {
        throw new TypeError(`defaults.components.${component}.${key} must be a string.`);
      }
    }
  }
}

function validateThemeDefinition(
  definition: ThemeDefinition,
  ancestors: Set<ThemeDefinition>,
): void {
  if (!isThemeDefinition(definition)) {
    throw new TypeError("Theme extends must reference a built-in or another valid theme definition.");
  }
  if (!/^[a-z][a-z0-9-]{0,47}$/.test(definition.id)) {
    throw new TypeError("Theme id must be a lowercase slug between 1 and 48 characters.");
  }
  if (!definition.name.trim() || definition.name.trim().length > 80) {
    throw new TypeError("Theme name must contain between 1 and 80 characters.");
  }
  if (ancestors.has(definition)) {
    throw new TypeError(`Theme inheritance cycle detected at "${definition.id}".`);
  }
  validateThemeOptions(definition.options);
  validateThemeTokens(definition.tokens);
  validateThemeDefaults(definition.defaults);
  validateThemeTokens(definition.overrides?.tokens);
  validateThemeDefaults(definition.overrides?.defaults);
  if (isThemeDefinition(definition.extends)) {
    ancestors.add(definition);
    validateThemeDefinition(definition.extends, ancestors);
    ancestors.delete(definition);
  }
}

export function defineTheme<const T extends ThemeDefinition>(definition: T): T {
  validateThemeDefinition(definition, new Set());
  return definition;
}

function color(
  role: ThemeColorReference["role"],
  opacity?: number,
  tintRole?: ThemeColorReference["role"],
  tintOpacity?: number,
): ThemeMaterial {
  return {
    role,
    ...(opacity === undefined ? {} : { opacity }),
    ...(tintRole === undefined
      ? {}
      : { tint: { role: tintRole, ...(tintOpacity === undefined ? {} : { opacity: tintOpacity }) } }),
  };
}

function commonActionMaterials(): Partial<Record<ThemeMaterialKey, ThemeMaterial>> {
  return {
    primary: color("primary"),
    "primary-foreground": color("primary-foreground"),
    "primary-hover": color("primary-hover"),
    "primary-active": color("primary-active"),
    secondary: color("secondary"),
    "secondary-foreground": color("secondary-foreground"),
    "secondary-hover": color("secondary-hover"),
    "secondary-active": color("secondary-active"),
    accent: color("accent"),
    "accent-foreground": color("accent-foreground"),
    "accent-hover": color("accent-hover"),
    "accent-active": color("accent-active"),
  };
}

function controlMaterials(
  source: ThemePaletteRole,
  sourceOpacity: readonly [number, number, number],
  borderOpacity: number,
): Partial<Record<ThemeMaterialKey, ThemeMaterial>> {
  return {
    "outline-control": color("transparent"),
    "outline-control-hover": color("currentColor", 0.15),
    "outline-control-active": color("currentColor", 0.25),
    "outline-control-border": color("currentColor"),
    "glass-control": color(source, sourceOpacity[0], "currentColor", 0.04),
    "glass-control-hover": color(source, sourceOpacity[1], "currentColor", 0.08),
    "glass-control-active": color(source, sourceOpacity[2], "currentColor", 0.12),
    "glass-control-border": color("currentColor", borderOpacity),
  };
}

function materialTokens(option: ThemeMaterialOption): Pick<ThemeTokens, "effects" | "materials"> {
  const actions = commonActionMaterials();
  if (option === "solid") {
    return {
      effects: { backdropBlur: 0, backdropSaturation: 1, overlayBlur: 0 },
      materials: {
        background: color("background"),
        foreground: color("foreground"),
        surface: color("background"),
        "surface-foreground": color("foreground"),
        "surface-elevated": color("background"),
        "surface-elevated-foreground": color("foreground"),
        muted: color("background", 0.88, "foreground", 0.12),
        "muted-foreground": color("muted-foreground"),
        inverse: color("inverse"),
        "inverse-foreground": color("inverse-foreground"),
        ...actions,
        input: color("background"),
        "input-border": color("input-border"),
        selected: color("selected"),
        border: color("border"),
        "border-strong": color("border-strong"),
        code: color("code"),
        "playground-workspace": color("background", 0.88, "foreground", 0.12),
        "playground-properties": color("background"),
        "slider-thumb": color("input"),
        ...controlMaterials("background", [0.78, 0.8, 0.82], 0.18),
      },
    };
  }
  if (option === "glass") {
    return {
      effects: { backdropBlur: 14, backdropSaturation: 1.1, overlayBlur: 4 },
      materials: {
        background: color("background"),
        foreground: color("foreground"),
        surface: color("surface", 0.6),
        "surface-foreground": color("surface-foreground"),
        "surface-elevated": color("surface-elevated", 0.64),
        "surface-elevated-foreground": color("surface-elevated-foreground"),
        muted: color("muted", 0.6),
        "muted-foreground": color("muted-foreground"),
        inverse: color("inverse", 0.88),
        "inverse-foreground": color("inverse-foreground"),
        ...actions,
        secondary: color("secondary", 0.92),
        "secondary-hover": color("secondary-hover", 0.94),
        "secondary-active": color("secondary-active", 0.96),
        accent: color("accent", 0.92),
        "accent-hover": color("accent-hover", 0.94),
        "accent-active": color("accent-active", 0.96),
        input: color("input", 0.76),
        "input-border": color("foreground", 0.24),
        selected: color("selected", 0.88),
        border: color("foreground", 0.14),
        "border-strong": color("foreground", 0.22),
        code: color("code", 0.88),
        "playground-workspace": color("muted", 0.32),
        "playground-properties": color("surface", 0.4),
        "slider-thumb": color("input", 0.94, "background", 0.06),
        "outline-control": color("surface-elevated", 0.94, "currentColor", 0.06),
        "outline-control-hover": color("surface-elevated", 0.86, "currentColor", 0.14),
        "outline-control-active": color("surface-elevated", 0.78, "currentColor", 0.22),
        "outline-control-border": color("currentColor", 0.32),
        ...controlMaterials("surface", [0.5, 0.58, 0.64], 0.16),
      },
    };
  }
  return {
    effects: { backdropBlur: 0, backdropSaturation: 1, overlayBlur: 4 },
    materials: {
      background: color("background"),
      foreground: color("foreground"),
      surface: color("surface"),
      "surface-foreground": color("surface-foreground"),
      "surface-elevated": color("surface-elevated"),
      "surface-elevated-foreground": color("surface-elevated-foreground"),
      muted: color("muted"),
      "muted-foreground": color("muted-foreground"),
      inverse: color("inverse"),
      "inverse-foreground": color("inverse-foreground"),
      ...actions,
      input: color("input"),
      "input-border": color("input-border"),
      selected: color("selected"),
      border: color("border"),
      "border-strong": color("border-strong"),
      code: color("code"),
      "playground-workspace": color("muted"),
      "playground-properties": color("surface"),
      "slider-thumb": color("input"),
      ...controlMaterials("surface-elevated", [0.78, 0.8, 0.82], 0.18),
    },
  };
}

function typographyTokens(option: ThemeTypographyOption): NonNullable<ThemeTokens["typography"]> {
  if (option === "mono") {
    const fonts = ["ui-monospace", "SFMono-Regular", "Consolas", "Liberation Mono", "monospace"];
    return {
      titleFonts: fonts,
      bodyFonts: fonts,
      controlFonts: fonts,
      titleLetterSpacing: -0.48,
      titleTextTransform: "uppercase",
      controlWeight: 800,
      controlLetterSpacing: 0.96,
      controlTextTransform: "uppercase",
    };
  }
  const systemFonts = ["ui-sans-serif", "system-ui", "sans-serif"];
  if (option === "system") {
    return {
      titleFonts: systemFonts,
      bodyFonts: systemFonts,
      controlFonts: systemFonts,
      titleLetterSpacing: 0,
      titleTextTransform: "none",
      controlWeight: 600,
      controlLetterSpacing: 0,
      controlTextTransform: "none",
    };
  }
  if (option === "editorial") {
    const serifFonts = ["Georgia", "Cambria", "Times New Roman", "serif"];
    return {
      titleFonts: serifFonts,
      /*
       * Body copy is set in the serif, which is the whole of what the word
       * editorial means: a newspaper sets its *prose* in a serif, and the
       * headline face follows from that rather than the other way round.
       *
       * This read `systemFonts` until an editorial application was built on it,
       * and the only route to serif prose was applying `font-balsa-title` to
       * paragraphs — using the title token for body text because nothing else
       * existed. `mono` and `system` both set all three faces; this was the one
       * option that did not follow its own name.
       */
      bodyFonts: serifFonts,
      /*
       * Controls stay in the sans deliberately, and this is the one asymmetry
       * worth keeping. Serif for reading and sans for interface chrome is the
       * conventional editorial pairing: a serif gives up too much at the small
       * sizes and tight measures a label or a button occupies.
       */
      controlFonts: systemFonts,
      titleLetterSpacing: -0.2,
      titleTextTransform: "none",
      controlWeight: 600,
      controlLetterSpacing: 0,
      controlTextTransform: "none",
    };
  }
  return {
    titleFonts: ["Space Grotesk", "sans-serif"],
    bodyFonts: ["Noto Sans", "sans-serif"],
    controlFonts: ["Noto Sans", "sans-serif"],
    titleLetterSpacing: 0,
    titleTextTransform: "none",
    controlWeight: 600,
    controlLetterSpacing: 0,
    controlTextTransform: "none",
  };
}

function radiusTokens(option: ThemeShapeOption): NonNullable<ThemeTokens["radius"]> {
  if (option === "square") {
    return { control: 0, surface: 0, panel: 0, badge: 0, toggle: 0, codeControl: 0 };
  }
  if (option === "subtle") {
    return { control: 4, surface: 8, panel: 12, badge: 4, toggle: 4, codeControl: 4 };
  }
  if (option === "soft") {
    return { control: 12, surface: 18, panel: 24, badge: 9999, toggle: 9999, codeControl: 8 };
  }
  return { control: 8, surface: 14, panel: 18, badge: 9999, toggle: 9999, codeControl: 8 };
}

/**
 * The spacing scale's base unit, and the legacy density values.
 *
 * Only the unit moves. Every rhythm step and every control inset is a multiple
 * of it, so scaling the unit scales the whole system in proportion and the
 * ratios between steps survive -- which is the property that makes a scale a
 * scale rather than a list of sizes.
 *
 * Half-pixel steps are deliberate. A 4px unit puts the heaviest-used step on
 * 12px; 3.5 and 4.5 move that to 10.5 and 13.5, which is a perceptible change
 * in rhythm without breaking the ladder into values nobody chose.
 */
function spacingTokens(
  option: ThemeSpacingOption,
  size: ThemeSizeOption,
): NonNullable<ThemeTokens["spacing"]> {
  const unit = option === "tight" ? 3.5 : option === "airy" ? 4.5 : 4;
  // `controlInline` predates the split and now describes the size dimension,
  // not the spacing one. The composition matrix still reads it to size a tile
  // against the control scale.
  const controlInline = size === "compact" ? 12 : size === "comfortable" ? 20 : 16;
  return { unit, controlInline, densityCompact: 4, densityDefault: 8, densityComfortable: 12 };
}

function borderTokens(option: ThemeBorderOption): NonNullable<ThemeTokens["border"]> {
  if (option === "none") {
    return { width: 0, outlineWidth: 0, solidWidth: 0, opacity: 1, style: "solid" };
  }
  if (option === "soft") {
    return { width: 1, outlineWidth: 1, solidWidth: 1, opacity: 0.55, style: "solid" };
  }
  if (option === "strong") {
    return { width: 2, outlineWidth: 2, solidWidth: 2, opacity: 1, style: "solid" };
  }
  return { width: 1, outlineWidth: 1, solidWidth: 1, opacity: 1, style: "solid" };
}

function shadowLayer(
  x: number,
  y: number,
  blur: number,
  opacity = 1,
  spread = 0,
): ThemeShadowLayer {
  return { x, y, blur, spread, color: { role: "foreground", opacity } };
}

function shadowTokens(option: ThemeElevationOption): NonNullable<ThemeTokens["shadow"]> {
  if (option === "none") return { sm: [], md: [], lg: [], detail: [] };
  if (option === "hard") {
    return {
      sm: [shadowLayer(3, 3, 0)],
      md: [shadowLayer(5, 5, 0)],
      lg: [shadowLayer(6, 6, 0)],
      detail: [shadowLayer(2, 2, 0)],
    };
  }
  if (option === "floating") {
    return {
      sm: [shadowLayer(0, 6, 20, 0.04)],
      md: [shadowLayer(0, 14, 36, 0.05)],
      lg: [shadowLayer(0, 8, 24, 0.05)],
      detail: [shadowLayer(0, 1, 2, 0.08)],
    };
  }
  return {
    sm: [],
    md: [shadowLayer(0, 1, 2, 0.08), shadowLayer(0, 12, 32, 0.08)],
    lg: [shadowLayer(0, 1, 2, 0.06), shadowLayer(0, 12, 32, 0.07)],
    detail: [shadowLayer(0, 1, 2, 0.1)],
  };
}

function motionTokens(option: ThemeMotionOption): NonNullable<ThemeTokens["motion"]> {
  if (option === "none") {
    return {
      fast: 0,
      normal: 0,
      slow: 0,
      easing: "linear",
      controlHover: {},
      controlActive: {},
      surfaceHover: {},
    };
  }
  if (option === "snappy") {
    return {
      fast: 90,
      normal: 140,
      slow: 220,
      easing: "linear",
      controlHover: { x: -2, y: -2 },
      controlActive: { x: 1, y: 1 },
      surfaceHover: { x: -2, y: -2 },
    };
  }
  if (option === "fluid") {
    return {
      fast: 180,
      normal: 320,
      slow: 520,
      easing: [0.22, 1, 0.36, 1],
      controlHover: { y: -1, scale: 1.01 },
      controlActive: { scale: 0.98 },
      surfaceHover: {},
    };
  }
  return {
    fast: 160,
    normal: 260,
    slow: 420,
    easing: [0.2, 0.8, 0.2, 1],
    controlHover: { y: -1 },
    controlActive: { y: 0 },
    surfaceHover: {},
  };
}

function shapeDefaults(option: ThemeShapeOption): ThemeDefaults {
  if (option === "rounded" || option === "soft") return {};
  const roundedByShape: Record<"square" | "subtle", Record<ThemeFamily, Rounded>> = {
    square: { controls: "none", fields: "none", surfaces: "none", overlays: "none", navigation: "none" },
    subtle: { controls: "sm", fields: "sm", surfaces: "lg", overlays: "lg", navigation: "sm" },
  };
  return {
    families: Object.fromEntries(
      Object.entries(roundedByShape[option]).map(([family, rounded]) => [
        family,
        { rounded },
      ]),
    ),
  };
}

/**
 * The size dimension, applied as each component's default size.
 *
 * `Table` and `DataTable` are the exception: their row height is their own
 * `density` prop, so the theme's size maps onto it by name rather than through
 * `size`. That is why this dimension could not simply be renamed everywhere —
 * two different things were spelled the same, and only one of them moved.
 */
function sizeDefaults(option: ThemeSizeOption): ThemeDefaults {
  const density = option === "compact" ? "compact" : option === "comfortable" ? "comfortable" : "default";
  const components: Partial<ThemeComponentDefaultMap> = {};
  for (const component of themeDefaultPropCoverage.size) {
    if (component === "scroll-area") {
      components[component] = { size: option === "compact" ? "thin" : "regular" };
    } else {
      const supportedSizes = themeComponentSizeOptions[component];
      const size = option === "compact"
        ? "sm"
        : option === "comfortable" && supportedSizes?.includes("lg")
          ? "lg"
          : "md";
      components[component] = { size } as never;
    }
  }
  components.table = { ...(components.table ?? {}), density };
  components["data-table"] = { ...(components["data-table"] ?? {}), density };
  return { components };
}

function elevationDefaults(option: ThemeElevationOption): ThemeDefaults {
  if (option !== "none") return {};
  return {
    families: {
      controls: { shadow: "none" },
      fields: { shadow: "none" },
      surfaces: { shadow: "none" },
      overlays: { shadow: "none" },
      navigation: { shadow: "none" },
    },
  };
}

function materialDefaults(option: ThemeMaterialOption): ThemeDefaults {
  if (option !== "glass") return {};
  return {
    components: {
      // Card carries the recipe's translucent surface material either way, so
      // without its typed glass variant it renders a see-through fill with no
      // backdrop to filter — the panel reads as broken rather than frosted.
      card: { variant: "glass" },
      "button-group": { variant: "glass" },
      popup: { variant: "glass" },
      "hover-card": { variant: "glass" },
      tooltip: { variant: "glass" },
      "dropdown-menu": { variant: "glass" },
      "context-menu": { variant: "glass" },
      menubar: { variant: "glass" },
      "command-menu": { variant: "glass" },
      drawer: { variant: "glass" },
      "color-picker": { variant: "glass" },
      modal: { variant: "glass" },
      select: { variant: "glass" },
      autocomplete: { variant: "glass" },
      dropdown: { variant: "glass" },
      navbar: { variant: "glass", type: "floating" },
    },
  };
}

export interface DerivedThemeRecipe {
  tokens: ThemeTokens;
  defaults: ThemeDefaults;
}

export function deriveThemeRecipe(options: ResolvedThemeOptions): DerivedThemeRecipe {
  const material = materialTokens(options.material);
  return {
    tokens: {
      typography: typographyTokens(options.typography),
      radius: radiusTokens(options.shape),
      spacing: spacingTokens(options.spacing, options.size),
      border: borderTokens(options.border),
      shadow: shadowTokens(options.elevation),
      motion: motionTokens(options.motion),
      effects: material.effects,
      materials: material.materials,
    },
    defaults: mergeThemeDefaults(
      mergeThemeDefaults(shapeDefaults(options.shape), sizeDefaults(options.size)),
      mergeThemeDefaults(elevationDefaults(options.elevation), materialDefaults(options.material)),
    ),
  };
}

function mergeThemeTokens(parent: ThemeTokens, child: ThemeTokens): ThemeTokens {
  return {
    typography: { ...parent.typography, ...child.typography },
    radius: { ...parent.radius, ...child.radius },
    spacing: { ...parent.spacing, ...child.spacing },
    border: { ...parent.border, ...child.border },
    shadow: { ...parent.shadow, ...child.shadow },
    motion: { ...parent.motion, ...child.motion },
    effects: { ...parent.effects, ...child.effects },
    materials: { ...parent.materials, ...child.materials },
  };
}

function mergeThemeDefaults(parent: ThemeDefaults, child: ThemeDefaults): ThemeDefaults {
  const familyKeys: readonly ThemeFamily[] = [
    "controls",
    "fields",
    "surfaces",
    "overlays",
    "navigation",
  ];
  const componentKeys = new Set<ThemeComponentName>([
    ...Object.keys(parent.components ?? {}) as ThemeComponentName[],
    ...Object.keys(child.components ?? {}) as ThemeComponentName[],
  ]);

  return {
    families: Object.fromEntries(
      familyKeys.map((family) => [
        family,
        {
          ...parent.families?.[family],
          ...child.families?.[family],
        },
      ]),
    ),
    components: Object.fromEntries(
      [...componentKeys].map((component) => [
        component,
        {
          ...parent.components?.[component],
          ...child.components?.[component],
        },
      ]),
    ),
  };
}

interface ThemeResolutionState {
  id: string;
  name: string;
  base: DesignTheme;
  options: ResolvedThemeOptions;
  tokenOverrides: ThemeTokens;
  defaultOverrides: ThemeDefaults;
}

function resolveThemeState(input: ThemeInput): ThemeResolutionState {
  if (isDesignTheme(input)) {
    const metadata = designThemeCatalog.find(({ id }) => id === input);
    return {
      id: input,
      name: metadata?.label ?? input,
      base: input,
      options: { ...builtInThemeOptions[input] },
      tokenOverrides: {},
      defaultOverrides: {},
    };
  }

  validateThemeDefinition(input, new Set());
  const parent = resolveThemeState(input.extends);
  return {
    id: input.id,
    name: input.name.trim(),
    base: parent.base,
    options: { ...parent.options, ...input.options },
    tokenOverrides: mergeThemeTokens(
      parent.tokenOverrides,
      mergeThemeTokens(input.tokens ?? {}, input.overrides?.tokens ?? {}),
    ),
    defaultOverrides: mergeThemeDefaults(
      parent.defaultOverrides,
      mergeThemeDefaults(input.defaults ?? {}, input.overrides?.defaults ?? {}),
    ),
  };
}

export function resolveTheme(input: ThemeInput): ResolvedThemeDefinition {
  const state = resolveThemeState(input);
  const derived = deriveThemeRecipe(state.options);
  return {
    id: state.id,
    name: state.name,
    base: state.base,
    options: state.options,
    tokens: mergeThemeTokens(derived.tokens, state.tokenOverrides),
    defaults: mergeThemeDefaults(derived.defaults, state.defaultOverrides),
  };
}

/**
 * A material refers to the *resolved* role, not the raw palette anchor.
 *
 * A palette defines the anchors and leaves the derived roles to the foundation,
 * so `var(--balsa-color-accent-hover)` had nothing to resolve — and a `var()`
 * on an undefined custom property with no fallback is invalid at computed-value
 * time, which makes the whole material variable vanish rather than fall back.
 * The failure was silent and only visible as a surface that stopped being glass
 * on hover. `--balsa-role-*` always resolves, so a material always has a value.
 */
function paletteColorReference(role: ThemeColorReference["role"]): string {
  if (role === "currentColor" || role === "transparent") return role;
  return `var(--balsa-role-${role})`;
}

function percentage(value: number): string {
  return `${Math.round(value * 10_000) / 100}%`;
}

function serializeColorReference(reference: ThemeColorReference): string {
  const color = paletteColorReference(reference.role);
  const opacity = reference.opacity ?? 1;
  if (reference.role === "transparent" || opacity === 1) return color;
  return `color-mix(in oklab, ${color} ${percentage(opacity)}, transparent)`;
}

function serializeMaterial(material: ThemeMaterial): string {
  if (!material.tint) return serializeColorReference(material);
  const source = paletteColorReference(material.role);
  const tint = paletteColorReference(material.tint.role);
  return `color-mix(in oklab, ${source} ${percentage(material.opacity ?? 1)}, ${tint} ${percentage(material.tint.opacity ?? 1)})`;
}

function serializeShadow(layers: readonly ThemeShadowLayer[]): string {
  if (!layers.length) return "none";
  return layers.map((layer) => [
    layer.inset ? "inset" : "",
    `${layer.x}px`,
    `${layer.y}px`,
    `${layer.blur}px`,
    `${layer.spread ?? 0}px`,
    serializeColorReference(layer.color),
  ].filter(Boolean).join(" ")).join(", ");
}

function serializeTransform(transform: ThemeTransform): string {
  const values = [];
  if (transform.x !== undefined || transform.y !== undefined) {
    values.push(`translate(${transform.x ?? 0}px, ${transform.y ?? 0}px)`);
  }
  if (transform.scale !== undefined) values.push(`scale(${transform.scale})`);
  return values.join(" ") || "none";
}

function serializeEasing(easing: ThemeEasing): string {
  return typeof easing === "string"
    ? easing
    : `cubic-bezier(${easing.join(", ")})`;
}

function serializeFontStack(fonts: readonly string[]): string {
  return fonts.map((font) =>
    /\s/.test(font) && !/^["'].*["']$/.test(font) ? JSON.stringify(font) : font
  ).join(", ");
}

export function serializeThemeTokens(tokens: ThemeTokens): Readonly<Record<string, string>> {
  const declarations: Record<string, string> = {};
  const assign = (name: string, value: string | undefined): void => {
    if (value !== undefined) declarations[name] = value;
  };

  assign("--balsa-font-title", tokens.typography?.titleFonts
    ? serializeFontStack(tokens.typography.titleFonts)
    : undefined);
  assign("--balsa-font-body", tokens.typography?.bodyFonts
    ? serializeFontStack(tokens.typography.bodyFonts)
    : undefined);
  assign("--balsa-control-font-family", tokens.typography?.controlFonts
    ? serializeFontStack(tokens.typography.controlFonts)
    : undefined);
  assign("--balsa-title-letter-spacing", tokens.typography?.titleLetterSpacing === undefined
    ? undefined
    : `${tokens.typography.titleLetterSpacing}px`);
  assign("--balsa-title-text-transform", tokens.typography?.titleTextTransform);
  assign("--balsa-control-font-weight", tokens.typography?.controlWeight?.toString());
  assign("--balsa-control-letter-spacing", tokens.typography?.controlLetterSpacing === undefined
    ? undefined
    : `${tokens.typography.controlLetterSpacing}px`);
  assign("--balsa-control-text-transform", tokens.typography?.controlTextTransform);

  const radiusVariables = {
    control: "--balsa-radius-control",
    surface: "--balsa-radius-surface",
    panel: "--balsa-radius-panel",
    badge: "--balsa-radius-badge",
    toggle: "--balsa-radius-toggle",
    codeControl: "--balsa-code-control-radius",
  } as const;
  for (const [key, variable] of Object.entries(radiusVariables)) {
    const value = tokens.radius?.[key as keyof NonNullable<ThemeTokens["radius"]>];
    assign(variable, value === undefined ? undefined : `${value}px`);
  }
  const spacingVariables = {
    unit: "--balsa-space-unit",
    controlInline: "--balsa-spacing-control-inline",
    densityCompact: "--balsa-spacing-density-compact",
    densityDefault: "--balsa-spacing-density-default",
    densityComfortable: "--balsa-spacing-density-comfortable",
  } as const;
  for (const [key, variable] of Object.entries(spacingVariables)) {
    const value = tokens.spacing?.[key as keyof NonNullable<ThemeTokens["spacing"]>];
    assign(variable, value === undefined ? undefined : `${value}px`);
  }

  const borderVariables = {
    width: "--balsa-border-width",
    outlineWidth: "--balsa-outline-border-width",
    solidWidth: "--balsa-solid-border-width",
  } as const;
  for (const [key, variable] of Object.entries(borderVariables)) {
    const value = tokens.border?.[key as keyof typeof borderVariables];
    assign(variable, value === undefined ? undefined : `${value}px`);
  }
  assign(
    "--balsa-border-opacity",
    tokens.border?.opacity === undefined ? undefined : percentage(tokens.border.opacity),
  );
  assign("--balsa-border-style", tokens.border?.style);

  for (const level of ["sm", "md", "lg", "detail"] as const) {
    const value = tokens.shadow?.[level];
    assign(`--balsa-shadow-${level}`, value ? serializeShadow(value) : undefined);
  }

  for (const speed of ["fast", "normal", "slow"] as const) {
    const value = tokens.motion?.[speed];
    assign(`--balsa-motion-${speed}`, value === undefined ? undefined : `${value}ms`);
  }
  assign("--balsa-motion-easing", tokens.motion?.easing
    ? serializeEasing(tokens.motion.easing)
    : undefined);
  assign("--balsa-control-hover-transform", tokens.motion?.controlHover
    ? serializeTransform(tokens.motion.controlHover)
    : undefined);
  assign("--balsa-control-active-transform", tokens.motion?.controlActive
    ? serializeTransform(tokens.motion.controlActive)
    : undefined);
  assign("--balsa-surface-hover-transform", tokens.motion?.surfaceHover
    ? serializeTransform(tokens.motion.surfaceHover)
    : undefined);

  assign("--balsa-backdrop-blur", tokens.effects?.backdropBlur === undefined
    ? undefined
    : `${tokens.effects.backdropBlur}px`);
  assign("--balsa-backdrop-saturation", tokens.effects?.backdropSaturation?.toString());
  assign("--balsa-overlay-blur", tokens.effects?.overlayBlur === undefined
    ? undefined
    : `${tokens.effects.overlayBlur}px`);

  /*
   * The composed filters, resolved to `none` when they would do nothing.
   *
   * `backdrop-filter: blur(0px) saturate(1)` looks identical to `none` and is
   * not the same declaration: any computed value other than `none` creates a
   * stacking context, a containing block for absolute and fixed descendants,
   * and a compositing layer the browser repaints on every scroll frame. A
   * `position: fixed` child of such an element is fixed to the element rather
   * than to the viewport, which is a correctness bug rather than a slow one.
   *
   * Measured on the gallery before this existed: 32 elements carried an
   * identity filter at the Solid material and 24 carried a real blur over a
   * fully opaque background at Glass, where nothing shows through to filter.
   *
   * CSS cannot make this decision -- it has no conditional, and the blur is a
   * runtime value an authored theme sets -- so it is made here, where the
   * number is known, and mirrored by static defaults in `balsa-theme.css` for
   * the path where no theme has been applied yet.
   */
  const blur = tokens.effects?.backdropBlur;
  const saturation = tokens.effects?.backdropSaturation ?? 1;
  const filterFor = (radius: number) =>
    radius > 0 ? `blur(${radius}px) saturate(${saturation})` : "none";
  if (blur !== undefined) {
    assign("--balsa-backdrop-filter", filterFor(blur));
    // A glass surface inside another blurs less: the layer beneath it is
    // already frosted, so repeating the full radius reads as muddy rather than
    // deeper. Floored at zero, and `none` once it gets there.
    assign("--balsa-backdrop-filter-contained", filterFor(Math.max(0, blur - 4)));
  }
  const overlayBlur = tokens.effects?.overlayBlur;
  if (overlayBlur !== undefined) {
    assign("--balsa-overlay-filter", overlayBlur > 0 ? `blur(${overlayBlur}px)` : "none");
  }

  for (const [key, material] of Object.entries(tokens.materials ?? {})) {
    if (material) assign(`--balsa-material-${key}`, serializeMaterial(material));
  }

  return declarations;
}

export function themePresentation(input: ThemeInput): ThemePresentation {
  if (isDesignTheme(input)) return { id: input, style: {} };
  const resolved = resolveTheme(input);
  return {
    id: resolved.id,
    base: resolved.base,
    style: serializeThemeTokens(resolved.tokens),
  };
}

/**
 * Framework-neutral theme scope. Vue and React adapters recompute this
 * reactively and provide it through their own context; they do not reimplement
 * resolution, default merging, or presentation. Contract: the 2026-08-14
 * theme/portal design pass (`~/.agents/runs/20260814-164053-review-codex-personal`).
 */
export interface ThemeScopeState {
  readonly input: ThemeInput;
  readonly resolved: ResolvedThemeDefinition;
  readonly presentation: ThemePresentation;
}

export interface ComponentThemeRequest {
  readonly component: ThemeComponentName;
  readonly family: ThemeFamily;
  readonly explicit?: ThemeInput;
  readonly parent?: ThemeScopeState;
}

export interface ComponentThemeState extends ThemeScopeState {
  readonly inherited: boolean;
  readonly explicitPresentation?: ThemePresentation;
  readonly defaults: ThemeVisualDefaults;
}

function applyProviderDefaults(
  input: ThemeInput,
  providerDefaults?: ThemeDefaults,
): ThemeInput {
  if (!providerDefaults) return input;
  return {
    id: typeof input === "string" ? input : input.id,
    name: typeof input === "string" ? input : input.name,
    extends: input,
    overrides: { defaults: providerDefaults },
  };
}

export function createThemeScope(
  input: ThemeInput,
  providerDefaults?: ThemeDefaults,
): ThemeScopeState {
  const scopedInput = applyProviderDefaults(input, providerDefaults);
  return {
    input: scopedInput,
    resolved: resolveTheme(scopedInput),
    presentation: themePresentation(scopedInput),
  };
}

export function resolveComponentTheme(
  request: ComponentThemeRequest,
): ComponentThemeState {
  const input = request.explicit ?? request.parent?.input ?? defaultDesignTheme;
  const scope = createThemeScope(input);
  const defaults: ThemeVisualDefaults = {
    ...scope.resolved.defaults.families?.[request.family],
    ...scope.resolved.defaults.components?.[request.component],
  };

  return {
    ...scope,
    inherited: request.parent !== undefined,
    explicitPresentation: request.explicit === undefined
      ? undefined
      : scope.presentation,
    defaults,
  };
}

export function resolveThemeValue<
  K extends keyof ThemeVisualDefaults,
  T,
>(
  state: ComponentThemeState,
  key: K,
  explicitValue: T | undefined,
  fallback: T,
): T {
  if (explicitValue !== undefined) return explicitValue;
  const configured = state.defaults[key];
  return configured === undefined ? fallback : configured as T;
}

function compactThemeStructure(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(compactThemeStructure);
  if (!value || typeof value !== "object") return value;
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, entry]) => [key, compactThemeStructure(entry)] as const)
    .filter(([, entry]) => {
      if (entry === undefined) return false;
      if (Array.isArray(entry)) return true;
      return !entry || typeof entry !== "object" || Object.keys(entry).length > 0;
    });
  return Object.fromEntries(entries);
}

export function normalizeThemeDefinition(definition: ThemeDefinition): ThemeDefinition {
  defineTheme(definition);
  const tokenOverrides = compactThemeStructure(mergeThemeTokens(
    definition.tokens ?? {},
    definition.overrides?.tokens ?? {},
  )) as ThemeTokens;
  const defaultOverrides = compactThemeStructure(mergeThemeDefaults(
    definition.defaults ?? {},
    definition.overrides?.defaults ?? {},
  )) as ThemeDefaults;
  const hasTokenOverrides = Object.keys(tokenOverrides).length > 0;
  const hasDefaultOverrides = Object.keys(defaultOverrides).length > 0;
  return {
    id: definition.id,
    name: definition.name.trim(),
    extends: isDesignTheme(definition.extends)
      ? definition.extends
      : normalizeThemeDefinition(definition.extends),
    ...(definition.options && Object.keys(definition.options).length
      ? { options: { ...definition.options } }
      : {}),
    ...(hasTokenOverrides || hasDefaultOverrides
      ? {
          overrides: {
            ...(hasTokenOverrides ? { tokens: tokenOverrides } : {}),
            ...(hasDefaultOverrides ? { defaults: defaultOverrides } : {}),
          },
        }
      : {}),
  };
}

function normalizePresetThemeOptions(value: unknown): ThemeOptions | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value as ThemeOptions;
  }
  const options = value as Record<string, unknown>;
  const border = options.border === "subtle" ? "medium" : options.border;
  return {
    ...options,
    ...(border === undefined ? {} : { border }),
  } as ThemeOptions;
}

export function normalizeThemePresetConfig(value: unknown): BalsaThemePresetConfig {
  if (!value || typeof value !== "object") {
    throw new TypeError("Theme preset configuration must be an object.");
  }
  const candidate = value as Partial<BalsaThemePresetConfig>;
  if (candidate.schemaVersion !== 1) {
    throw new TypeError(
      `Unsupported Balsa theme preset schema version: ${String(candidate.schemaVersion)}.`,
    );
  }
  if (!isDesignTheme(candidate.base)) {
    throw new TypeError("Theme preset base must be a built-in Balsa theme.");
  }
  const normalized = normalizeThemeDefinition({
    id: "balsa-preset-config",
    name: "Balsa preset config",
    extends: candidate.base,
    options: normalizePresetThemeOptions(candidate.options),
    overrides: candidate.overrides,
  });
  return {
    schemaVersion: 1,
    base: candidate.base,
    ...(normalized.options ? { options: normalized.options } : {}),
    ...(normalized.overrides?.tokens
      ? { overrides: { tokens: normalized.overrides.tokens } }
      : {}),
  };
}

export function serializeThemeDefinition(
  definition: ThemeDefinition,
  exportName = "customTheme",
): string {
  defineTheme(definition);
  const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(exportName)
    ? exportName
    : "customTheme";
  const normalized = normalizeThemeDefinition(definition);
  return [
    'import { defineTheme } from "@/components/ui/theme";',
    "",
    `export const ${identifier} = defineTheme(${JSON.stringify(normalized, null, 2)});`,
  ].join("\n");
}
