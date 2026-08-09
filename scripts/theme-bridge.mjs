/**
 * Compile a Balsa design system into the standard shadcn token surface.
 *
 * An upstream component styles itself from unprefixed variables -- `--primary`,
 * `--border`, `--radius` -- while Balsa resolves its own `--balsa-*` chain
 * through palette, material and theme layers. Bridging one to the other is what
 * makes `balsa add @shadcn/stepper` produce a component that answers to the
 * active Balsa palette instead of shadcn's defaults.
 *
 * The mapping targets Balsa's Tailwind namespace (`--color-balsa-primary`)
 * rather than the raw palette token, because that namespace already encodes the
 * material override and the light-dark fallback. Mapping the raw token would
 * silently drop the Glass material.
 */

/**
 * Standard shadcn semantic variables, mapped to the Balsa token that carries
 * the same meaning. `null` means Balsa has no equivalent and the value is left
 * to whatever the consumer already defines.
 */
export const colorBridge = {
  background: "--color-balsa-background",
  foreground: "--color-balsa-foreground",
  card: "--color-balsa-surface",
  "card-foreground": "--color-balsa-surface-foreground",
  popover: "--color-balsa-surface-elevated",
  "popover-foreground": "--color-balsa-surface-elevated-foreground",
  primary: "--color-balsa-primary",
  "primary-foreground": "--color-balsa-primary-foreground",
  secondary: "--color-balsa-secondary",
  "secondary-foreground": "--color-balsa-secondary-foreground",
  muted: "--color-balsa-muted",
  "muted-foreground": "--color-balsa-muted-foreground",
  accent: "--color-balsa-accent",
  "accent-foreground": "--color-balsa-accent-foreground",
  destructive: "--color-balsa-destructive",
  "destructive-foreground": "--color-balsa-destructive-foreground",
  border: "--color-balsa-border",
  // shadcn's `--input` is an input's border, not its fill.
  input: "--color-balsa-input-border",
  ring: "--color-balsa-focus-ring",
};

/** Charts read a numbered scale rather than named roles. */
export const chartBridge = {
  "chart-1": "--color-balsa-primary",
  "chart-2": "--color-balsa-secondary",
  "chart-3": "--color-balsa-accent",
  "chart-4": "--color-balsa-info",
  "chart-5": "--color-balsa-success",
};

/** Sidebar is a surface with its own accent, not a separate palette. */
export const sidebarBridge = {
  sidebar: "--color-balsa-surface",
  "sidebar-foreground": "--color-balsa-surface-foreground",
  "sidebar-primary": "--color-balsa-primary",
  "sidebar-primary-foreground": "--color-balsa-primary-foreground",
  "sidebar-accent": "--color-balsa-selected",
  "sidebar-accent-foreground": "--color-balsa-selected-foreground",
  "sidebar-border": "--color-balsa-border",
  "sidebar-ring": "--color-balsa-focus-ring",
};

/**
 * Dimensions upstream has no variable for. Publishing them keeps a Balsa
 * design system portable: an adapter, a patch or a consumer's own component can
 * read the same typography, density, motion and elevation the Balsa components
 * use, instead of re-deriving them.
 */
export const extendedDimensions = {
  typography: ["--balsa-font-title", "--balsa-font-body"],
  /*
   * The spacing scale, and the inset scale derived from it. Both are stated
   * here because this is what an adapter or an agent reads to know what the
   * design system exposes, and spacing reaches upstream components by patch —
   * their fixed Tailwind steps are rewritten onto these tokens at install.
   *
   * Only the base unit and the anchors are listed. Every other step is a
   * multiple of `--balsa-space-unit`, so naming all eleven would suggest they
   * are independent values someone might set one at a time.
   */
  spacing: [
    "--balsa-space-unit",
    "--balsa-space-md",
    "--balsa-space-section-md",
    "--balsa-inset-md",
  ],
  shape: [
    "--balsa-radius-control",
    "--balsa-radius-surface",
    "--balsa-radius-panel",
    "--balsa-radius-badge",
    "--balsa-radius-toggle",
  ],
  border: ["--balsa-border-style", "--balsa-border-width", "--balsa-border-opacity"],
  elevation: [
    "--balsa-shadow-sm",
    "--balsa-shadow-md",
    "--balsa-shadow-lg",
    "--balsa-shadow-control",
    "--balsa-shadow-surface",
    "--balsa-shadow-panel",
  ],
  motion: [
    "--balsa-motion-fast",
    "--balsa-motion-normal",
    "--balsa-motion-slow",
    "--balsa-motion-easing",
  ],
};

/**
 * Dimensions an upstream component spends through Tailwind's own theme
 * variables rather than through shadcn's semantic ones. Redefining these under
 * a scope carries part of the Balsa design system into hardcoded utilities like
 * `rounded-md`, `font-medium` and `transition-colors`.
 *
 * Measured against Tailwind CSS 4 output, not assumed. Each entry exists
 * because the compiled utility reads that variable.
 */
export const adapterBridge = {
  // .rounded-md compiles to border-radius: var(--radius-md)
  "radius-sm": "--balsa-radius-badge",
  "radius-md": "--balsa-radius-control",
  "radius-lg": "--balsa-radius-surface",
  "radius-xl": "--balsa-radius-panel",
  // .font-sans compiles to font-family: var(--font-sans)
  "font-sans": "--balsa-font-body",
  // .font-medium compiles to font-weight: var(--font-weight-medium)
  "font-weight-medium": "--balsa-control-font-weight",
  // .transition-* read these two defaults
  "default-transition-duration": "--balsa-motion-normal",
  "default-transition-timing-function": "--balsa-motion-easing",
};

/**
 * Dimensions that cannot be carried by redefining a variable, with the reason.
 * Publishing the reason is what stops a future adapter from "fixing" one of
 * these with a mapping that quietly breaks upstream layout.
 */
export const unreachableDimensions = {
  density:
    "Tailwind spends control heights as calc(var(--spacing) * n), where --spacing is a"
    + " grid base unit. Balsa expresses density as absolute gap values (0.25rem, 0.5rem,"
    + " 0.75rem), not as a base unit, so mapping it onto --spacing would multiply every"
    + " upstream dimension: a comfortable density would render h-9 at 6.75rem.",
  typographyScale:
    "Utilities read --text-sm and similar. Balsa defines font families, weight, letter"
    + " spacing and case, but no numeric type scale, so there is nothing to map without"
    + " inventing one.",
  borderWidth:
    "Tailwind's .border compiles to a literal border-width: 1px, with only the style"
    + " exposed as a variable. Reaching Balsa's border widths needs a source patch.",
  elevation:
    "Shadow utilities compile to literal offsets and a literal shadow color; only"
    + " --tw-shadow-color is overridable. Reaching Balsa's elevation recipes needs a"
    + " source patch.",
  material:
    "Material direction changes which surface treatment a component uses, which is a"
    + " composition decision rather than a token value.",
};

const header = `/* Generated by Balsa UI. Do not edit.
 *
 * Maps the active Balsa design system onto the standard shadcn token surface so
 * components installed from @shadcn (or any compatible registry) follow the
 * Balsa palette, radius and focus ring.
 *
 * Import after the Balsa foundation, theme and palette, and before any
 * stylesheet that intentionally overrides these variables.
 */`;

function declarations(map, indent = "  ") {
  return Object.entries(map)
    .map(([token, source]) => `${indent}--${token}: var(${source});`)
    .join("\n");
}

function themeMappings(names, indent = "  ") {
  return names
    .map((name) => `${indent}--color-${name}: var(--${name});`)
    .join("\n");
}

/**
 * The bridge is emitted for `:root` rather than a palette scope, because it
 * reads Balsa tokens that are themselves scoped. A scoped palette or theme
 * therefore reaches upstream components through the same cascade, including
 * inside a portal that inherits from the scope it was opened in.
 */
export function createBridgeStylesheet() {
  const colorNames = [
    ...Object.keys(colorBridge),
    ...Object.keys(chartBridge),
    ...Object.keys(sidebarBridge),
  ];

  return `${header}

:root {
${declarations(colorBridge)}

${declarations(chartBridge)}

${declarations(sidebarBridge)}

  /* Upstream expects one base radius and derives the rest. */
  --radius: var(--balsa-radius-surface);
}

@theme inline {
${themeMappings(colorNames)}
}

/* The radius ramp is deliberately NOT declared in @theme inline.
 *
 * An inline theme value is substituted into the utility at build time, so
 * rounded-md would compile to border-radius: calc(var(--radius) - 2px) and stop
 * reading --radius-md altogether, which makes the per-token override below dead
 * code. Leaving Tailwind's own radius scale in place keeps rounded-md reading
 * var(--radius-md), so the adapter scope can map each step onto the Balsa ramp.
 */

/* Opt-in adapter scope.
 *
 * Upstream components spend shape, typography and motion through Tailwind's own
 * theme variables rather than through shadcn's semantic ones, so carrying those
 * dimensions means redefining Tailwind's variables. Those cascade to every
 * utility, including the consumer's own markup, so this is scoped rather than
 * applied at :root. Opt in where you want it:
 *
 *   <html data-balsa-adapt>          the whole application
 *   <div data-balsa-adapt>...</div>  one subtree
 *
 * Density, type scale, border width and elevation are deliberately absent; see
 * .balsa/design-system.json for why each one cannot be carried this way.
 */
[data-balsa-adapt] {
${Object.entries(adapterBridge)
    .map(([token, sourceToken]) => `  --${token}: var(${sourceToken});`)
    .join("\n")}
}
`;
}

/**
 * The portable description of what a Balsa design system exposes and how it
 * reaches upstream components. Written to `.balsa/design-system.json` so an
 * agent, an adapter or a future migration can read the integration without
 * parsing CSS.
 */
export function createIntegrationManifest({ version, palette, theme } = {}) {
  return {
    schemaVersion: 1,
    ...(version ? { releaseVersion: version } : {}),
    ...(palette ? { palette } : {}),
    ...(theme ? { theme } : {}),
    tokenBridge: {
      stylesheet: "src/styles/balsa-shadcn-bridge.css",
      colors: colorBridge,
      charts: chartBridge,
      sidebar: sidebarBridge,
      radius: { "--radius": "--balsa-radius-surface" },
    },
    extendedDimensions,
    supportedModes: ["light", "dark"],
    // What the bridge does and does not reach, measured against Tailwind CSS 4
    // output rather than assumed.
    integration: {
      strategy: "token-bridge",
      alwaysApplied: {
        selector: ":root",
        reaches: [
          "palette colors",
          "focus ring",
          "base radius",
          "chart and sidebar scales",
        ],
      },
      optIn: {
        selector: "[data-balsa-adapt]",
        reaches: [
          "control and surface radius",
          "body font family",
          "control font weight",
          "motion duration and easing",
        ],
        note:
          "These redefine Tailwind's own theme variables, which cascade to every utility"
          + " including the consumer's own markup, so they are scoped rather than applied"
          + " at :root. Put the attribute on <html> for the whole application, or on a"
          + " wrapper for one subtree.",
        adapterBridge,
      },
      doesNotReach: unreachableDimensions,
      note:
        "An upstream component is color- and radius-correct through the bridge alone, and"
        + " additionally font- and motion-correct inside the adapter scope. Density, type"
        + " scale, border width and elevation cannot be carried by redefining a variable"
        + " and need a deterministic source patch.",
      scopedThemes:
        "The bridge reads scoped Balsa tokens through the cascade, so a scoped palette or"
        + " theme reaches upstream components inside that scope.",
      portals:
        "Portalled content inherits the bridge from :root. Content teleported outside a"
        + " scoped theme falls back to the root design system, which is the same behavior"
        + " Balsa's own portalled components have. The adapter scope does not follow a"
        + " teleport, so a scope on <html> covers portals while a scope on a subtree does"
        + " not; install @balsa/balsa-portal-scope to forward a subtree scope onto"
        + " teleported content.",
    },
  };
}
