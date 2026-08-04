import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { installRegistryItems } from "./install-registry.mjs";
import { readJson, targetPath, writeJson } from "./registry-lib.mjs";

const themes = new Set(["modern-flat", "brutalism", "glassmorphism"]);
const optionValues = {
  typography: new Set(["modern", "system", "editorial", "mono"]),
  shape: new Set(["square", "subtle", "rounded", "soft"]),
  density: new Set(["compact", "balanced", "comfortable"]),
  border: new Set(["none", "soft", "medium", "strong"]),
  elevation: new Set(["none", "soft", "floating", "hard"]),
  motion: new Set(["none", "snappy", "balanced", "fluid"]),
  material: new Set(["solid", "soft", "glass"]),
};
const semanticRoles = new Set([
  "currentColor", "transparent", "background", "foreground", "surface",
  "surface-foreground", "surface-elevated", "surface-elevated-foreground",
  "muted", "muted-foreground", "inverse", "inverse-foreground", "primary",
  "primary-foreground", "primary-hover", "primary-active", "secondary",
  "secondary-foreground", "secondary-hover", "secondary-active", "accent",
  "accent-foreground", "accent-hover", "accent-active", "destructive",
  "destructive-foreground", "success", "success-foreground", "warning",
  "warning-foreground", "info", "info-foreground", "input", "input-border",
  "selected", "border", "border-strong", "code", "code-foreground",
]);
const materialKeys = new Set([
  "background", "foreground", "surface", "surface-foreground",
  "surface-elevated", "surface-elevated-foreground", "muted",
  "muted-foreground", "inverse", "inverse-foreground", "primary",
  "primary-foreground", "primary-hover", "primary-active", "secondary",
  "secondary-foreground", "secondary-hover", "secondary-active", "accent",
  "accent-foreground", "accent-hover", "accent-active", "input",
  "input-border", "selected", "border", "border-strong", "code",
  "playground-workspace", "playground-properties", "slider-thumb",
  "outline-control", "outline-control-hover", "outline-control-active",
  "outline-control-border", "glass-control", "glass-control-hover",
  "glass-control-active", "glass-control-border",
]);
const tokenKeys = {
  typography: new Set([
    "titleFonts", "bodyFonts", "controlFonts", "titleLetterSpacing",
    "titleTextTransform", "controlWeight", "controlLetterSpacing",
    "controlTextTransform",
  ]),
  radius: new Set(["control", "surface", "panel", "badge", "toggle", "codeControl"]),
  spacing: new Set([
    "controlInline", "densityCompact", "densityDefault", "densityComfortable",
  ]),
  border: new Set(["width", "outlineWidth", "solidWidth", "opacity", "style"]),
  shadow: new Set(["sm", "md", "lg", "detail"]),
  motion: new Set([
    "fast", "normal", "slow", "easing", "controlHover", "controlActive",
    "surfaceHover",
  ]),
  effects: new Set(["backdropBlur", "backdropSaturation", "overlayBlur"]),
  materials: materialKeys,
};

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function compact(value) {
  if (Array.isArray(value)) return value.map(compact);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, compact(entry)]),
  );
}

/**
 * Shared by themes, palettes, and design systems: the name becomes a file name,
 * a CSS selector value, and a JS identifier, so `label` only changes the error
 * wording -- the rule itself is deliberately identical across all three.
 */
export function validateThemeName(name, label = "Theme") {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name) || name.length > 48) {
    throw new Error(`${label} names must use lowercase kebab-case, begin with a letter, and contain at most 48 characters.`);
  }
  return name;
}

export function themeExportIdentifier(name) {
  const camel = name.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase());
  return camel.endsWith("Theme") ? camel : `${camel}Theme`;
}

export function decodeThemeInlineConfig(payload) {
  if (
    typeof payload !== "string"
    || !payload.length
    || payload.length > 65536
    || !/^[A-Za-z0-9_-]+$/.test(payload)
  ) {
    throw new Error("Inline theme configuration must be a valid base64url payload.");
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Could not decode the inline theme configuration.");
  }
}

function validateNumbers(value, pathName = "overrides") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateNumbers(entry, `${pathName}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number" && !Number.isFinite(entry)) {
      throw new Error(`${pathName}.${key} must be a finite number.`);
    }
    validateNumbers(entry, `${pathName}.${key}`);
  }
}

function rejectUnknownKeys(value, keys, pathName) {
  if (!isRecord(value)) throw new Error(`${pathName} must be an object.`);
  const unknown = Object.keys(value).find((key) => !keys.has(key));
  if (unknown) throw new Error(`${pathName}.${unknown} is not supported.`);
}

function finite(value, pathName, minimum = 0, maximum = Number.POSITIVE_INFINITY) {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || value < minimum
    || value > maximum
  ) {
    throw new Error(`${pathName} must be a finite number between ${minimum} and ${maximum}.`);
  }
}

function validateColorReference(value, pathName) {
  rejectUnknownKeys(value, new Set(["role", "opacity"]), pathName);
  if (!semanticRoles.has(value.role)) {
    throw new Error(`${pathName}.role is not a supported semantic palette role.`);
  }
  if (value.opacity !== undefined) finite(value.opacity, `${pathName}.opacity`, 0, 1);
}

function validateTokenOverrides(tokens) {
  rejectUnknownKeys(tokens, new Set(Object.keys(tokenKeys)), "overrides.tokens");
  for (const [group, section] of Object.entries(tokens)) {
    rejectUnknownKeys(section, tokenKeys[group], `overrides.tokens.${group}`);
  }
  const typography = tokens.typography ?? {};
  for (const key of ["titleFonts", "bodyFonts", "controlFonts"]) {
    const fonts = typography[key];
    if (
      fonts !== undefined
      && (
        !Array.isArray(fonts)
        || !fonts.length
        || fonts.some((font) => typeof font !== "string" || !font.trim())
      )
    ) {
      throw new Error(`overrides.tokens.typography.${key} must be a non-empty font stack.`);
    }
  }
  for (const key of ["titleLetterSpacing", "controlLetterSpacing"]) {
    if (typography[key] !== undefined) {
      finite(typography[key], `overrides.tokens.typography.${key}`, Number.NEGATIVE_INFINITY);
    }
  }
  if (typography.controlWeight !== undefined) {
    finite(typography.controlWeight, "overrides.tokens.typography.controlWeight", 1);
  }
  for (const key of ["titleTextTransform", "controlTextTransform"]) {
    if (
      typography[key] !== undefined
      && !["none", "uppercase", "lowercase", "capitalize"].includes(typography[key])
    ) {
      throw new Error(`overrides.tokens.typography.${key} is invalid.`);
    }
  }
  for (const group of ["radius", "spacing", "effects"]) {
    for (const [key, value] of Object.entries(tokens[group] ?? {})) {
      finite(value, `overrides.tokens.${group}.${key}`);
    }
  }
  for (const [key, value] of Object.entries(tokens.border ?? {})) {
    if (key === "style") {
      if (!["solid", "dashed", "dotted", "double"].includes(value)) {
        throw new Error("overrides.tokens.border.style is invalid.");
      }
    } else {
      finite(
        value,
        `overrides.tokens.border.${key}`,
        0,
        key === "opacity" ? 1 : Number.POSITIVE_INFINITY,
      );
    }
  }
  for (const [level, layers] of Object.entries(tokens.shadow ?? {})) {
    if (!Array.isArray(layers)) {
      throw new Error(`overrides.tokens.shadow.${level} must be an array.`);
    }
    for (const [index, layer] of layers.entries()) {
      const pathName = `overrides.tokens.shadow.${level}[${index}]`;
      rejectUnknownKeys(
        layer,
        new Set(["x", "y", "blur", "spread", "color", "inset"]),
        pathName,
      );
      finite(layer.x, `${pathName}.x`, Number.NEGATIVE_INFINITY);
      finite(layer.y, `${pathName}.y`, Number.NEGATIVE_INFINITY);
      finite(layer.blur, `${pathName}.blur`);
      if (layer.spread !== undefined) {
        finite(layer.spread, `${pathName}.spread`, Number.NEGATIVE_INFINITY);
      }
      if (layer.inset !== undefined && typeof layer.inset !== "boolean") {
        throw new Error(`${pathName}.inset must be a boolean.`);
      }
      validateColorReference(layer.color, `${pathName}.color`);
    }
  }
  const motion = tokens.motion ?? {};
  for (const key of ["fast", "normal", "slow"]) {
    if (motion[key] !== undefined) finite(motion[key], `overrides.tokens.motion.${key}`);
  }
  if (motion.easing !== undefined) {
    const easing = motion.easing;
    const validPreset = typeof easing === "string"
      && ["linear", "ease", "ease-in", "ease-out", "ease-in-out"].includes(easing);
    const validBezier = Array.isArray(easing)
      && easing.length === 4
      && easing.every((value) => typeof value === "number" && Number.isFinite(value));
    if (!validPreset && !validBezier) {
      throw new Error("overrides.tokens.motion.easing is invalid.");
    }
  }
  for (const key of ["controlHover", "controlActive", "surfaceHover"]) {
    if (motion[key] === undefined) continue;
    rejectUnknownKeys(motion[key], new Set(["x", "y", "scale"]), `overrides.tokens.motion.${key}`);
    for (const [field, value] of Object.entries(motion[key])) {
      finite(
        value,
        `overrides.tokens.motion.${key}.${field}`,
        field === "scale" ? 0 : Number.NEGATIVE_INFINITY,
      );
    }
  }
  for (const [key, material] of Object.entries(tokens.materials ?? {})) {
    rejectUnknownKeys(
      material,
      new Set(["role", "opacity", "tint"]),
      `overrides.tokens.materials.${key}`,
    );
    validateColorReference(
      { role: material.role, opacity: material.opacity },
      `overrides.tokens.materials.${key}`,
    );
    if (material.tint !== undefined) {
      validateColorReference(material.tint, `overrides.tokens.materials.${key}.tint`);
    }
  }
}

export function normalizeCliThemeConfig(value) {
  if (!isRecord(value)) throw new Error("Theme preset configuration must be an object.");
  if (value.schemaVersion !== 1) {
    throw new Error(`Unsupported Balsa theme preset schema version: ${String(value.schemaVersion)}.`);
  }
  if (!themes.has(value.base)) {
    throw new Error(`Unknown Balsa theme preset: ${String(value.base)}.`);
  }
  const options = {};
  if (value.options !== undefined && !isRecord(value.options)) {
    throw new Error("Theme options must be an object.");
  }
  for (const [key, rawEntry] of Object.entries(value.options ?? {})) {
    const entry = key === "border" && rawEntry === "subtle" ? "medium" : rawEntry;
    if (!optionValues[key]?.has(entry)) {
      throw new Error(`Theme option "${key}" is invalid.`);
    }
    options[key] = entry;
  }
  if (value.overrides !== undefined && !isRecord(value.overrides)) {
    throw new Error("Theme overrides must be an object.");
  }
  const unknownOverride = Object.keys(value.overrides ?? {})
    .find((key) => key !== "tokens");
  if (unknownOverride) {
    throw new Error(`Theme override "${unknownOverride}" is not supported by the quick preset format.`);
  }
  if (value.overrides?.tokens !== undefined && !isRecord(value.overrides.tokens)) {
    throw new Error("Theme token overrides must be an object.");
  }
  validateNumbers(value.overrides);
  if (value.overrides?.tokens) validateTokenOverrides(value.overrides.tokens);
  return compact({
    schemaVersion: 1,
    base: value.base,
    ...(Object.keys(options).length ? { options } : {}),
    ...(value.overrides?.tokens && Object.keys(value.overrides.tokens).length
      ? { overrides: { tokens: value.overrides.tokens } }
      : {}),
  });
}

function displayName(name) {
  return name.split("-").map((part) =>
    `${part.charAt(0).toUpperCase()}${part.slice(1)}`
  ).join(" ");
}

export function createThemeModuleSource(name, config) {
  const identifier = themeExportIdentifier(name);
  const definition = {
    id: name,
    name: displayName(name),
    extends: config.base,
    ...(config.options ? { options: config.options } : {}),
    ...(config.overrides ? { overrides: config.overrides } : {}),
  };
  return `import { defineTheme } from "../components/ui/theme";\n\n/** Generated by Balsa UI. Edit this definition in your application. */\nexport const ${identifier} = defineTheme(${JSON.stringify(definition, null, 2)});\n`;
}

async function readExisting(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

function contentHash(content) {
  return `sha256-${createHash("sha256").update(content).digest("hex")}`;
}

export async function createThemeConfiguration({
  name,
  cwd,
  preset,
  from,
  inlineConfig,
  force = false,
}) {
  validateThemeName(name);
  if ([preset, from, inlineConfig].filter(Boolean).length > 1) {
    throw new Error("Use only one of --preset, --from, or --config.");
  }
  const projectRoot = path.resolve(cwd ?? process.cwd());
  let input;
  if (inlineConfig) {
    input = decodeThemeInlineConfig(inlineConfig);
  } else if (from) {
    const inputPath = path.resolve(from);
    try {
      input = JSON.parse(await readFile(inputPath, "utf8"));
    } catch (error) {
      throw new Error(`Could not read theme JSON ${inputPath}: ${error.message}`);
    }
  } else {
    const base = preset ?? "modern-flat";
    if (!themes.has(base)) throw new Error(`Unknown Balsa theme preset: ${base}.`);
    input = { schemaVersion: 1, base };
  }
  const config = normalizeCliThemeConfig(input);
  const relativeTarget = path.join("src", "themes", `${name}.ts`);
  const destination = targetPath(projectRoot, relativeTarget);
  const content = createThemeModuleSource(name, config);
  const existing = await readExisting(destination);
  if (existing !== undefined && existing !== content && !force) {
    throw new Error(`Refusing to overwrite customized file: ${relativeTarget}`);
  }

  const installed = await installRegistryItems({
    names: ["balsa-theme"],
    cwd: projectRoot,
    force,
  });
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, content, "utf8");

  const manifestPath = path.join(projectRoot, ".balsa", "installed.json");
  const manifest = await readJson(manifestPath);
  const portableTarget = relativeTarget.replaceAll(path.sep, "/");
  manifest.components[`theme-${name}`] = {
    registry: "@balsa/theme-config",
    installedVersion: "1.0.0",
    sourceHash: contentHash(content),
    targetPath: portableTarget,
    files: [portableTarget],
  };
  await writeJson(manifestPath, manifest);

  return {
    config,
    destination,
    relativeTarget: portableTarget,
    identifier: themeExportIdentifier(name),
    installed,
  };
}
