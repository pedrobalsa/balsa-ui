import type { BalsaBackgroundConfig } from "@/components/ui/gradient-background";
import {
  defineTheme,
  isDesignTheme,
  normalizeThemeDefinition,
  themeOptionDefinitions,
  type ThemeOverrides,
} from "@/components/ui/theme";
import {
  directionBlock,
  projectContextInstruction,
  type AgentCreationSource,
  type AgentProjectContext,
} from "../agent/studio-workflows";
import { frameworkProjectCopy } from "../framework/copy";
import { paletteColorDefinitions, type PaletteColors } from "../palette/derive";
import type { PaletteCliConfig } from "../palette/palette-store";
import type { DesignThemeDraft } from "@/theme/theme-store";

export const DESIGN_SYSTEM_SCHEMA_VERSION = 1 as const;

export interface ThemeCliConfig {
  schemaVersion: 1;
  base: string;
  options?: DesignThemeDraft["options"];
  overrides?: DesignThemeDraft["overrides"];
}

export interface DesignSystemCliConfig {
  schemaVersion: 1;
  palette: PaletteCliConfig;
  theme: ThemeCliConfig;
  /**
   * The gradient a named preset was designed against, carried across so the
   * system arrives with its surface.
   *
   * A design system is still not *defined* by a background — it is the palette
   * and the theme, the rules components answer to, and a background is a
   * component that consumes them. But a preset names one, and five of the eight
   * tune it further so the surface and the type work together. Dropping it
   * delivered the palette and the theme and silently lost the thing the system
   * was composed against.
   *
   * Absent for a custom system, which resolves its gradient from the palette and
   * therefore has nothing to serialise.
   */
  background?: BalsaBackgroundConfig;
}

/**
 * Mirrors `themeExportIdentifier` in scripts/theme-cli.mjs so the instructions
 * shown in the Studio name the same binding the CLI actually generates.
 */
export function themeExportIdentifier(name: string): string {
  const camel = name.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase());
  return camel.endsWith("Theme") ? camel : `${camel}Theme`;
}

/** base64url so the payload survives a shell argument without quoting rules. */
export function encodeDesignSystemPayload(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function themeCliConfig(
  base: string,
  draft: DesignThemeDraft | undefined,
): ThemeCliConfig {
  return {
    schemaVersion: DESIGN_SYSTEM_SCHEMA_VERSION,
    base,
    ...(draft?.options ? { options: draft.options } : {}),
    ...(draft?.overrides ? { overrides: draft.overrides } : {}),
  };
}

export function themeCliCommand(name: string, config: ThemeCliConfig): string {
  return `npx balsa-ui@latest theme create ${name} --config ${encodeDesignSystemPayload(config)}`;
}

export function designSystemCliConfig(
  palette: PaletteCliConfig,
  theme: ThemeCliConfig,
  background?: BalsaBackgroundConfig,
): DesignSystemCliConfig {
  return {
    schemaVersion: DESIGN_SYSTEM_SCHEMA_VERSION,
    palette,
    theme,
    ...(background ? { background } : {}),
  };
}

export function designSystemCliCommand(name: string, config: DesignSystemCliConfig): string {
  return `npx balsa-ui@latest design-system create ${name} --config ${encodeDesignSystemPayload(config)}`;
}

export function paletteCliCommand(name: string, config: PaletteCliConfig): string {
  return `npx balsa-ui@latest palette create ${name} --config ${encodeDesignSystemPayload(config)}`;
}

/**
 * Every artifact the CLI writes is editable source in the consumer's own tree,
 * so an agent running these prompts has to be told not to clobber local edits.
 */
const customizationClause =
  "Review the generated files. Preserve existing project customizations, and do not overwrite differing files without showing me the diff first.";

export function buildDesignSystemAgentPrompt(
  name: string,
  config: DesignSystemCliConfig,
  context: AgentProjectContext = "add-existing",
): string {
  return `${projectContextInstruction(context, "design system")}

Use this exact Balsa UI design system; do not approximate its colors or recipe.

Run this command from the project root:

\`\`\`sh
${designSystemCliCommand(name, config)}
\`\`\`

It writes the theme module \`src/themes/${name}.ts\` and the palette stylesheet \`src/styles/${name}-palette.css\`, and installs the Balsa theme and palette foundations.

Then wire it up:
1. Import the theme: \`import { ${themeExportIdentifier(name)} } from "@/themes/${name}";\`
2. Register it: \`createDesignThemeStore({ themes: [${themeExportIdentifier(name)}] });\`
3. Import "./styles/${name}-palette.css" after the Balsa foundation stylesheet.
4. Activate both on the root element: \`<html data-palette="${name}" data-theme="${name}">\`

${customizationClause}`;
}

const designSystemJsonExample: DesignSystemCliConfig = {
  schemaVersion: 1,
  palette: {
    schemaVersion: 1,
    base: "light",
    colors: {
      background: "#F8FAFC",
      foreground: "#172033",
      surface: "#FFFFFF",
      muted: "#E8EDF4",
      primary: "#2457D6",
      secondary: "#6D4FD2",
      accent: "#D24F86",
    },
  },
  theme: {
    schemaVersion: 1,
    base: "modern-flat",
    options: {
      typography: "modern",
      shape: "rounded",
      size: "compact",
      spacing: "balanced",
      border: "soft",
      elevation: "none",
      motion: "balanced",
      material: "soft",
    },
  },
};

/** Prompt an agent for the exact portable payload this Studio can validate. */
export function buildDesignSystemCreationPrompt(
  source: AgentCreationSource,
  direction: string,
): string {
  const optionVocabulary = themeOptionDefinitions
    .map(({ key, values }) => `${key}: ${values.join(" | ")}`)
    .join("\n");
  const imageInstruction = source === "image"
    ? "Extract relationships rather than copying brand marks or illustration assets: infer the seven semantic source colors, typography character, geometry, density, depth, motion, and material."
    : "Translate the direction into one coherent semantic palette and one complete Balsa recipe.";

  return `Create a Balsa UI design system that I can paste directly into Design Studio.

Read the official agent instructions at https://balsa-ui.com/llms.txt and the Design systems guide at https://balsa-ui.com/docs/design-systems before choosing values. ${imageInstruction}

${directionBlock(source, direction, "design system")}

Return only one JSON object, with no Markdown fence, commentary, CSS, Tailwind configuration, or Vue source. Use schemaVersion 1 at the root and in both nested objects. Include exactly the seven palette colors shown below as six-digit hexadecimal values. Choose a contrast-safe background/foreground pair and meaningful primary, secondary, and accent roles. Do not add palette overrides or a background field.

Theme base: modern-flat | brutalism | glassmorphism
Theme option vocabulary:
${optionVocabulary}

Return every theme option. Use this exact object shape:
${JSON.stringify(designSystemJsonExample, null, 2)}`;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function parsedJson(source: string | unknown): unknown {
  if (typeof source !== "string") return source;
  try {
    return JSON.parse(source);
  } catch {
    throw new Error("Paste one valid JSON object without Markdown fences.");
  }
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  const unknown = Object.keys(value).find((key) => !allowed.includes(key));
  if (unknown) throw new Error(`${label} field "${unknown}" is not supported.`);
}

/** Browser-side counterpart of the CLI contract, used only for live preview import. */
export function parseDesignSystemStudioConfig(source: string | unknown): DesignSystemCliConfig {
  const value = record(parsedJson(source), "Design system");
  exactKeys(value, ["schemaVersion", "palette", "theme"], "Design system");
  if (value.schemaVersion !== 1) throw new Error("Design system schemaVersion must be 1.");

  const palette = record(value.palette, "Palette");
  exactKeys(palette, ["schemaVersion", "base", "colors"], "Palette");
  if (palette.schemaVersion !== 1) throw new Error("Palette schemaVersion must be 1.");
  if (palette.base !== "light" && palette.base !== "dark") {
    throw new Error('Palette base must be "light" or "dark".');
  }
  const rawColors = record(palette.colors, "Palette colors");
  const colorKeys = paletteColorDefinitions.map(({ key }) => key);
  exactKeys(rawColors, colorKeys, "Palette colors");
  const colors = Object.fromEntries(colorKeys.map((key) => {
    const color = rawColors[key];
    if (typeof color !== "string" || !/^#[\da-f]{6}$/i.test(color)) {
      throw new Error(`Palette color "${key}" must be a six-digit hex value.`);
    }
    return [key, color.toUpperCase()];
  })) as unknown as PaletteColors;

  const theme = record(value.theme, "Theme");
  exactKeys(theme, ["schemaVersion", "base", "options", "overrides"], "Theme");
  if (theme.schemaVersion !== 1) throw new Error("Theme schemaVersion must be 1.");
  if (!isDesignTheme(theme.base)) throw new Error("Theme base is not a Balsa built-in.");
  const normalized = normalizeThemeDefinition(defineTheme({
    id: "studio-agent-generated",
    name: "Agent generated",
    extends: theme.base,
    ...(theme.options === undefined ? {} : { options: record(theme.options, "Theme options") }),
    ...(theme.overrides === undefined
      ? {}
      : { overrides: record(theme.overrides, "Theme overrides") as ThemeOverrides }),
  }));

  return {
    schemaVersion: 1,
    palette: { schemaVersion: 1, base: palette.base, colors },
    theme: {
      schemaVersion: 1,
      base: theme.base,
      ...(normalized.options ? { options: normalized.options } : {}),
      ...(normalized.overrides?.tokens
        ? { overrides: { tokens: normalized.overrides.tokens } }
        : {}),
    },
  };
}

export function buildPaletteAgentPrompt(name: string, config: PaletteCliConfig): string {
  const projectCopy = frameworkProjectCopy();
  return `Add this exact Balsa UI palette to my ${projectCopy.project}.

Run this command from the project root:

\`\`\`sh
${paletteCliCommand(name, config)}
\`\`\`

It writes \`src/styles/${name}.css\`, which maps the seven source colors to \`--balsa-color-*\` variables under a \`[data-palette="${name}"]\` selector, and installs the Balsa palette foundation.

Then wire it up:
1. Import "./styles/${name}.css" after the Balsa foundation stylesheet so it wins the cascade.
2. Activate it on the intended root or subtree: \`<html data-palette="${name}">\`

This palette carries colors only. Leave Balsa's derived tokens and the active theme alone.

${customizationClause}`;
}

export function buildThemeAgentPrompt(name: string, config: ThemeCliConfig): string {
  const projectCopy = frameworkProjectCopy();
  return `Add this exact Balsa UI theme to my ${projectCopy.project}.

Run this command from the project root:

\`\`\`sh
${themeCliCommand(name, config)}
\`\`\`

It writes \`src/themes/${name}.ts\` and installs the Balsa theme foundation.

Then wire it up:
1. Import the theme: \`import { ${themeExportIdentifier(name)} } from "@/themes/${name}";\`
2. Register it: \`createDesignThemeStore({ themes: [${themeExportIdentifier(name)}] });\`
3. Activate it on the root element: \`<html data-theme="${name}">\`

This theme carries shape, size, and token overrides only. It does not change palette colors.

${customizationClause}`;
}
