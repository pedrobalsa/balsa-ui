import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureStyleImports } from "./agent-context.mjs";
import {
  createBackgroundConfiguration,
  loadBackgroundPresets,
  normalizeCliBackgroundConfig,
} from "./background-cli.mjs";
import { listAdapters } from "./apply-adapters.mjs";
import { colorBridge, createIntegrationManifest, extendedDimensions } from "./theme-bridge.mjs";
import { installRegistryItems } from "./install-registry.mjs";
import { readJson, rootDir, targetPath, writeJson } from "./registry-lib.mjs";
import {
  createThemeModuleSource,
  normalizeCliThemeConfig,
  themeExportIdentifier,
  validateThemeName,
} from "./theme-cli.mjs";

const sourceColorKeys = [
  "background", "foreground", "surface", "muted", "primary", "secondary", "accent",
];
const builtInDesignSystemsPath = path.join(
  rootDir,
  "src",
  "design-system",
  "built-ins.json",
);
const paletteTokenKeys = new Set([
  ...sourceColorKeys,
  "surface-foreground", "surface-elevated", "surface-elevated-foreground",
  "muted-foreground", "inverse", "inverse-foreground", "code", "code-foreground",
  "primary-foreground", "primary-hover", "primary-active",
  "secondary-foreground", "secondary-hover", "secondary-active",
  "accent-foreground", "accent-hover", "accent-active",
  "destructive", "destructive-foreground", "destructive-hover", "destructive-active",
  "success", "success-foreground", "warning", "warning-foreground",
  "info", "info-foreground", "border", "border-strong", "input",
  "input-foreground", "input-border", "focus-ring", "selected",
  "selected-foreground", "disabled", "disabled-foreground", "overlay",
]);
const hexColor = /^#[\da-f]{6}$/i;
const anyHexColor = /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i;
const keywordColor = /^[a-z]{3,20}$/i;
// Whitelisted color functions only, and no nested parentheses, so a token value
// can never smuggle url(), var(), or an extra declaration into the stylesheet.
const functionalColor =
  /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(\s*[-+\d.%,/\sa-z]{1,80}\)$/i;

function isPlainCssColor(value) {
  return anyHexColor.test(value) || keywordColor.test(value) || functionalColor.test(value);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/*
 * The recipe calls a dimension `shape`; the adapter manifests call the same
 * thing `radius`. Without the mapping a report says shape is unmeasured across
 * all 58, which is worse than saying nothing — a confident wrong answer to the
 * exact question the report exists to answer.
 */
const adapterDimension = { shape: "radius" };

/**
 * What the active design system exposes, and how far each dimension reaches.
 *
 * Data only, with no output of its own, because there are now two callers that
 * present it differently — `balsa design-system show` and the MCP surface — and
 * a second derivation of "how far does spacing reach" is a second answer that
 * can disagree with the first.
 */
export async function describeDesignSystem(cwd) {
  let authored;
  try {
    authored = await readJson(path.join(cwd, ".balsa", "design-system.json"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  // How each dimension lands on upstream components, counted across every
  // adapter rather than asserted once.
  const adapters = await listAdapters();
  const reach = {};
  for (const adapter of adapters) {
    for (const [dimension, value] of Object.entries(adapter.dimensions ?? {})) {
      reach[dimension] ??= {};
      reach[dimension][value] = (reach[dimension][value] ?? 0) + 1;
    }
  }

  return {
    project: cwd,
    source: authored ? ".balsa/design-system.json" : "built-in defaults",
    palette: authored?.palette,
    theme: authored?.theme,
    supportedModes: authored?.supportedModes ?? ["light", "dark"],
    dimensions: Object.entries(extendedDimensions).map(([name, tokens]) => ({
      dimension: name,
      tokens,
      upstreamReach: reach[adapterDimension[name] ?? name] ?? { unmeasured: adapters.length },
    })),
    colorBridge: Object.keys(colorBridge).length,
    adapters: adapters.length,
  };
}

/** The same description as prose, for a terminal or an agent's context. */
export function formatDesignSystem(described) {
  const lines = [
    described.source === "built-in defaults"
      ? "No authored design system here; reporting the built-in defaults."
      : `Design system from .balsa/design-system.json${described.theme?.name ? ` (${described.theme.name})` : ""}`,
    `Modes: ${described.supportedModes.join(", ")}`,
    "",
    `Dimensions, and how far each reaches ${described.adapters} adapted upstream components:`,
  ];
  for (const entry of described.dimensions) {
    const spread = Object.entries(entry.upstreamReach)
      .sort(([, left], [, right]) => right - left)
      .map(([value, count]) => `${value} ${count}`)
      .join(", ");
    lines.push(`  ${entry.dimension.padEnd(11)} ${entry.tokens.length} tokens — upstream: ${spread}`);
  }
  lines.push(
    "",
    "Colour reaches upstream through the token bridge; the rest through the"
    + " adapter scope or a styling patch. A dimension reported unsupported cannot"
    + " be carried, and the adapter manifests say why per component.",
  );
  return lines.join("\n");
}

export function decodeDesignSystemInlineConfig(payload) {
  if (
    typeof payload !== "string"
    || !payload.length
    || payload.length > 131072
    || !/^[A-Za-z0-9_-]+$/.test(payload)
  ) {
    throw new Error("Inline design system configuration must be a valid base64url payload.");
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Could not decode the inline design system configuration.");
  }
}

export function normalizeCliPaletteConfig(value) {
  if (!isRecord(value)) throw new Error("Palette configuration must be an object.");
  if (value.schemaVersion !== 1) {
    throw new Error(`Unsupported Balsa palette schema version: ${String(value.schemaVersion)}.`);
  }
  if (value.base !== "light" && value.base !== "dark") {
    throw new Error('Palette base must be "light" or "dark".');
  }
  if (!isRecord(value.colors)) throw new Error("Palette colors must be an object.");
  const unknownColor = Object.keys(value.colors)
    .find((key) => !sourceColorKeys.includes(key));
  if (unknownColor) throw new Error(`Palette color "${unknownColor}" is not supported.`);
  const colors = {};
  for (const key of sourceColorKeys) {
    const color = value.colors[key];
    if (typeof color !== "string" || !hexColor.test(color)) {
      throw new Error(`Palette color "${key}" must be a six-digit hex value.`);
    }
    colors[key] = color.toLowerCase();
  }

  const overrides = {};
  if (value.overrides !== undefined && !isRecord(value.overrides)) {
    throw new Error("Palette overrides must be an object.");
  }
  for (const [key, color] of Object.entries(value.overrides ?? {})) {
    if (!paletteTokenKeys.has(key)) {
      throw new Error(`Palette override "${key}" is not a supported palette token.`);
    }
    if (typeof color !== "string" || !isPlainCssColor(color.trim())) {
      throw new Error(`Palette override "${key}" must be a plain CSS color value.`);
    }
    overrides[key] = color.trim();
  }

  return {
    schemaVersion: 1,
    base: value.base,
    colors,
    ...(Object.keys(overrides).length ? { overrides } : {}),
  };
}

export function normalizeCliDesignSystemConfig(value) {
  if (!isRecord(value)) throw new Error("Design system configuration must be an object.");
  if (value.schemaVersion !== 1) {
    throw new Error(`Unsupported Balsa design system schema version: ${String(value.schemaVersion)}.`);
  }
  const unknown = Object.keys(value)
    .find((key) => !["schemaVersion", "palette", "theme", "background"].includes(key));
  if (unknown) throw new Error(`Design system field "${unknown}" is not supported.`);
  return {
    schemaVersion: 1,
    palette: normalizeCliPaletteConfig(value.palette),
    theme: normalizeCliThemeConfig(value.theme),
    /*
     * Optional, and only a named preset carries one.
     *
     * A design system is not *defined* by a background — that stays decided: it
     * is the palette and the theme, the rules components answer to, and a
     * background is a component that consumes them. But a preset **names** a
     * gradient, and five of the eight tune it further so the surface and the
     * type work together: Press's overrides exist so the halftone reads as print
     * texture while near-black body copy still clears it.
     *
     * Dropping that on export delivered the palette and the theme and silently
     * lost the surface the system was designed against — the Press application
     * ended up with no gradient at all. So a preset carries its gradient across
     * and a custom system carries nothing, because a custom system resolves its
     * own from the palette and has nothing to serialise.
     *
     * Left unvalidated here: the background schema is the gradient's own, it
     * versions independently, and `createBackgroundConfiguration` already owns
     * checking it against the published presets.
     */
    ...(value.background === undefined ? {} : { background: value.background }),
  };
}

/**
 * The Studio and CLI read the same authored inputs. The CLI resolves the named
 * gradient here, then sends the complete result through the same validators as
 * a Studio payload before it can write consumer source.
 */
export async function loadBuiltInDesignSystems() {
  const catalog = await readJson(builtInDesignSystemsPath);
  if (!isRecord(catalog) || catalog.schemaVersion !== 1) {
    throw new Error("Unsupported built-in design system catalog schema.");
  }
  if (!Array.isArray(catalog.designSystems) || !catalog.designSystems.length) {
    throw new Error("The built-in design system catalog is empty.");
  }

  const backgroundPresets = await loadBackgroundPresets();
  const systems = catalog.designSystems.map((entry) => {
    if (!isRecord(entry)) throw new Error("A built-in design system must be an object.");
    validateThemeName(entry.id, "Built-in design system");
    if (typeof entry.name !== "string" || !entry.name.trim()) {
      throw new Error(`Built-in design system "${entry.id}" needs a display name.`);
    }
    if (typeof entry.gradient !== "string" || !backgroundPresets[entry.gradient]) {
      throw new Error(
        `Built-in design system "${entry.id}" names an unknown gradient: ${String(entry.gradient)}.`,
      );
    }
    if (entry.gradientOverrides !== undefined && !isRecord(entry.gradientOverrides)) {
      throw new Error(`Built-in design system "${entry.id}" gradient overrides must be an object.`);
    }

    const config = normalizeCliDesignSystemConfig({
      schemaVersion: 1,
      palette: {
        schemaVersion: 1,
        base: entry.base,
        colors: entry.colors,
        ...(entry.paletteOverrides ? { overrides: entry.paletteOverrides } : {}),
      },
      theme: {
        schemaVersion: 1,
        base: entry.themeBase,
        options: entry.options,
        ...(entry.overrides ? { overrides: entry.overrides } : {}),
      },
      background: normalizeCliBackgroundConfig(
        {
          ...backgroundPresets[entry.gradient],
          ...entry.gradientOverrides,
        },
        backgroundPresets,
      ),
    });
    return { id: entry.id, name: entry.name.trim(), config };
  });

  const ids = systems.map(({ id }) => id);
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  if (duplicate) throw new Error(`Duplicate built-in design system: ${duplicate}.`);
  if (typeof catalog.default !== "string" || !ids.includes(catalog.default)) {
    throw new Error("The built-in design system catalog has no valid default.");
  }
  return systems;
}

export async function applyBuiltInDesignSystem({ name, cwd, force = false }) {
  const systems = await loadBuiltInDesignSystems();
  const selected = systems.find(({ id }) => id === name);
  if (!selected) {
    throw new Error(
      `Unknown Balsa design system: ${String(name)}. Available design systems: ${systems.map(({ id }) => id).join(", ")}.`,
    );
  }
  const result = await createDesignSystemConfiguration({
    name: selected.id,
    cwd,
    providedConfig: selected.config,
    force,
  });
  return { ...result, preset: selected.id, displayName: selected.name };
}

export function createPaletteStylesheet(name, palette) {
  const declarations = [
    ...Object.entries(palette.colors),
    ...Object.entries(palette.overrides ?? {}),
  ].map(([key, color]) => `  --balsa-color-${key}: ${color};`).join("\n");
  return `/* Generated by Balsa UI. Activate with data-palette="${name}". */\n[data-palette="${name}"] {\n  color-scheme: ${palette.base};\n${declarations}\n}\n`;
}

async function readExisting(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export function contentHash(content) {
  return `sha256-${createHash("sha256").update(content).digest("hex")}`;
}

export async function writeGenerated(projectRoot, relativeTarget, content, force) {
  const destination = targetPath(projectRoot, relativeTarget);
  const existing = await readExisting(destination);
  if (existing !== undefined && existing !== content && !force) {
    throw new Error(`Refusing to overwrite customized file: ${relativeTarget}`);
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, content, "utf8");
  return relativeTarget.replaceAll(path.sep, "/");
}

export async function createDesignSystemConfiguration({
  name,
  cwd,
  from,
  inlineConfig,
  providedConfig,
  force = false,
}) {
  validateThemeName(name, "Design system");
  if ([from, inlineConfig, providedConfig].filter(Boolean).length > 1) {
    throw new Error("Use only one of --from or --config.");
  }
  if (!from && !inlineConfig && !providedConfig) {
    throw new Error("A design system needs --config <payload> or --from <file>.");
  }
  const projectRoot = path.resolve(cwd ?? process.cwd());

  let input;
  if (providedConfig) {
    input = providedConfig;
  } else if (inlineConfig) {
    input = decodeDesignSystemInlineConfig(inlineConfig);
  } else {
    const inputPath = path.resolve(from);
    try {
      input = JSON.parse(await readFile(inputPath, "utf8"));
    } catch (error) {
      throw new Error(`Could not read design system JSON ${inputPath}: ${error.message}`);
    }
  }
  const config = normalizeCliDesignSystemConfig(input);

  const themeSource = createThemeModuleSource(name, config.theme);
  const paletteSource = createPaletteStylesheet(name, config.palette);
  const themeTarget = path.join("src", "themes", `${name}.ts`);
  // The named Balsa system must coexist with the registry's balsa-palette.css,
  // which contains the optional generic Dark/Light presets. They are different
  // artifacts and must never rely on --force to occupy one target.
  const paletteFileName = name === "balsa"
    ? "balsa-design-system-palette.css"
    : `${name}-palette.css`;
  const paletteTarget = path.join("src", "styles", paletteFileName);

  const installed = await installRegistryItems({
    names: ["balsa-theme", "balsa-palette", "balsa-shadcn-bridge"],
    cwd: projectRoot,
    force,
  });
  const themeFile = await writeGenerated(projectRoot, themeTarget, themeSource, force);
  const paletteFile = await writeGenerated(projectRoot, paletteTarget, paletteSource, force);
  // Writing the stylesheets is not the same as activating them. Without this the
  // command reports success while the application renders completely unstyled.
  const stylesheet = await ensureStyleImports(projectRoot, {
    includeBridge: true,
    generated: [`${name}-palette.css`],
  });

  /*
   * The preset's gradient, written as its own artifact.
   *
   * A separate file and a separate registry entry rather than part of the theme
   * module, because the background *consumes* the design system and does not
   * define it — folding it in would make the definition grow a member every time
   * a tool shipped. Carrying it here only means a preset arrives with the surface
   * it was designed against instead of losing it in transit.
   */
  let backgroundTarget;
  let backgroundIdentifier;
  if (config.background) {
    const background = await createBackgroundConfiguration({
      name: `${name}-background`,
      cwd: projectRoot,
      config: config.background,
      force,
    });
    backgroundTarget = background.relativeTarget;
    backgroundIdentifier = background.identifier;
  }

  // The portable description of this design system. An adapter, an agent or a
  // later migration can read what the system exposes and how far it reaches
  // into upstream components without parsing the generated CSS.
  const designSystemPath = path.join(projectRoot, ".balsa", "design-system.json");
  await writeJson(
    designSystemPath,
    createIntegrationManifest({ palette: config.palette, theme: config.theme }),
  );

  const manifestPath = path.join(projectRoot, ".balsa", "installed.json");
  const manifest = await readJson(manifestPath);
  const generatedHash = contentHash(`${themeSource}${paletteSource}`);
  manifest.components[`@balsa/design-system-${name}`] = {
    registry: `@balsa/design-system-${name}`,
    namespace: "@balsa",
    installedVersion: "1.0.0",
    designSystemVersion: manifest.components["@balsa/balsa-theme"]?.designSystemVersion,
    originalSourceHash: generatedHash,
    installedSourceHash: generatedHash,
    targetPath: themeFile,
    files: [themeFile, paletteFile],
  };
  await writeJson(manifestPath, manifest);

  return {
    config,
    themeTarget: themeFile,
    paletteTarget: paletteFile,
    // Present only for a preset that named a gradient, so the command can say a
    // background was written rather than leaving a file the user did not expect.
    backgroundTarget,
    backgroundIdentifier,
    identifier: themeExportIdentifier(name),
    paletteId: name,
    installed,
    stylesheet,
    projectRoot,
    designSystem: designSystemPath,
  };
}
