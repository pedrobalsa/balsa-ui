import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { installRegistryItems } from "./install-registry.mjs";
import {
  readJson,
  sourcePath,
  targetPath,
  writeJson,
} from "./registry-lib.mjs";

const schemaVersion = 3;
const legacySchemaVersions = new Set([1, 2]);
const presetPath = sourcePath("src/components/ui/gradient-background-presets.json");
const hexColor = /^#[\da-f]{6}$/i;
const qualityValues = new Set(["auto", "low", "medium", "high"]);
const colorModeValues = new Set(["custom", "palette"]);
const patternValues = new Set([
  "ribbon",
  "radial",
  "conic",
  "blobs",
  "contour",
  "cellular",
]);
const effectValues = new Set([
  "none",
  "ascii",
  "halftone",
  "dots",
  "lines",
  "dither",
  "crosshatch",
]);
const effectColorModeValues = new Set(["gradient", "duotone", "ink"]);
const effectShapeValues = new Set(["round", "square", "cross"]);
const maximumCharacters = 64;

function characters(value, fallback) {
  if (typeof value !== "string") return fallback;
  const printable = Array.from(value).filter((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code >= 0x20 && code !== 0x7f;
  });
  if (printable.length < 2) return fallback;
  return printable.slice(0, maximumCharacters).join("");
}

function option(value, allowed, fallback) {
  return allowed.has(value) ? value : fallback;
}

function clamp(value, fallback, min, max) {
  const number = typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
  return Math.min(max, Math.max(min, number));
}

function integer(value, fallback, min, max) {
  return Math.round(clamp(value, fallback, min, max));
}

export function validateBackgroundName(name) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(
      "Background names must use lowercase kebab-case and begin with a letter.",
    );
  }
  return name;
}

export function backgroundExportIdentifier(name) {
  const camel = name.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase());
  return camel.endsWith("Background") ? camel : `${camel}Background`;
}

export function decodeBackgroundInlineConfig(payload) {
  if (
    typeof payload !== "string"
    || payload.length === 0
    || payload.length > 16384
    || !/^[A-Za-z0-9_-]+$/.test(payload)
  ) {
    throw new Error("Inline background configuration must be a valid base64url payload.");
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Could not decode the inline background configuration.");
  }
}

export async function loadBackgroundPresets() {
  return readJson(presetPath);
}

export function normalizeCliBackgroundConfig(value, presets) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Background configuration must be an object.");
  }
  if (
    value.schemaVersion !== schemaVersion
    && !legacySchemaVersions.has(value.schemaVersion)
  ) {
    throw new Error(`Unsupported Balsa background schema version: ${String(value.schemaVersion)}.`);
  }
  if (typeof value.preset !== "string" || !presets[value.preset]) {
    throw new Error(`Unknown Balsa background preset: ${String(value.preset)}.`);
  }
  if (!Array.isArray(value.colors) || value.colors.length < 2 || value.colors.length > 6) {
    throw new Error("A Balsa background configuration requires two to six colors.");
  }
  if (value.colors.some((color) => typeof color !== "string" || !hexColor.test(color))) {
    throw new Error("Background colors must use six-digit hexadecimal values.");
  }
  const fallback = presets[value.preset];
  const legacy = value.schemaVersion === 1;
  const patternDensity = value.patternDensity ?? value.ribbonDensity;
  return {
    schemaVersion,
    preset: value.preset,
    seed: integer(value.seed, fallback.seed, 0, 2147483647),
    colorMode: colorModeValues.has(value.colorMode) ? value.colorMode : fallback.colorMode,
    colors: value.colors.map((color) => color.toUpperCase()),
    speed: clamp(value.speed, fallback.speed, 0, 2),
    scale: clamp(value.scale, fallback.scale, 0.25, 4),
    warp: clamp(value.warp, fallback.warp, 0, 2),
    wave: clamp(value.wave, fallback.wave, 0, 2),
    softness: clamp(value.softness, fallback.softness, 0.05, 1),
    grain: clamp(value.grain, fallback.grain, 0, 0.5),
    grainSize: clamp(value.grainSize, fallback.grainSize, 0.25, 4),
    contrast: clamp(value.contrast, fallback.contrast, 0.5, 2),
    brightness: clamp(value.brightness, fallback.brightness, -0.5, 0.5),
    direction: clamp(value.direction, fallback.direction, -180, 180),
    quality: qualityValues.has(value.quality) ? value.quality : fallback.quality,
    fieldOctaves: integer(
      legacy ? value.noiseOctaves : value.fieldOctaves,
      fallback.fieldOctaves,
      1,
      4,
    ),
    fieldFrequency: clamp(
      legacy ? value.noiseFrequency : value.fieldFrequency,
      fallback.fieldFrequency,
      0.2,
      4,
    ),
    noiseAmount: clamp(value.noiseAmount, fallback.noiseAmount, 0, 0.5),
    noiseOctaves: integer(
      legacy ? undefined : value.noiseOctaves,
      fallback.noiseOctaves,
      1,
      6,
    ),
    noiseFrequency: clamp(
      legacy ? undefined : value.noiseFrequency,
      fallback.noiseFrequency,
      0.2,
      4,
    ),
    warpFrequency: clamp(value.warpFrequency, fallback.warpFrequency, 0.2, 4),
    pattern: option(value.pattern, patternValues, fallback.pattern),
    patternDensity: clamp(patternDensity, fallback.patternDensity, 0.5, 8),
    patternCenterX: clamp(value.patternCenterX, fallback.patternCenterX, -1, 1),
    patternCenterY: clamp(value.patternCenterY, fallback.patternCenterY, -1, 1),
    patternComplexity: integer(
      value.patternComplexity,
      fallback.patternComplexity,
      1,
      8,
    ),
    effect: option(value.effect, effectValues, fallback.effect),
    effectScale: clamp(value.effectScale, fallback.effectScale, 2, 48),
    effectAngle: clamp(value.effectAngle, fallback.effectAngle, -180, 180),
    effectMix: clamp(value.effectMix, fallback.effectMix, 0, 1),
    effectColorMode: option(
      value.effectColorMode,
      effectColorModeValues,
      fallback.effectColorMode,
    ),
    effectInk: hexColor.test(String(value.effectInk))
      ? String(value.effectInk).toUpperCase()
      : fallback.effectInk,
    effectPaper: hexColor.test(String(value.effectPaper))
      ? String(value.effectPaper).toUpperCase()
      : fallback.effectPaper,
    effectInvert: typeof value.effectInvert === "boolean"
      ? value.effectInvert
      : fallback.effectInvert,
    effectLevels: integer(value.effectLevels, fallback.effectLevels, 2, 8),
    effectShape: option(value.effectShape, effectShapeValues, fallback.effectShape),
    effectCharacters: characters(value.effectCharacters, fallback.effectCharacters),
  };
}

export function createBackgroundModuleSource(name, config) {
  const identifier = backgroundExportIdentifier(name);
  return `import type { BalsaBackgroundConfig } from "../components/ui/gradient-background";\n\n/** Generated by Balsa UI. Edit this configuration in your application. */\nexport const ${identifier}: BalsaBackgroundConfig = ${JSON.stringify(config, null, 2)};\n`;
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

export async function createBackgroundConfiguration({
  name,
  cwd,
  preset,
  from,
  inlineConfig,
  /**
   * An already-decoded configuration, for a caller that holds the object rather
   * than a payload — `design-system create` carrying a preset's gradient. Still
   * normalized against the published presets, so it is validated on exactly the
   * same path as a payload arriving from the Studio.
   */
  config: providedConfig,
  force = false,
}) {
  validateBackgroundName(name);
  if ([preset, from, inlineConfig, providedConfig].filter(Boolean).length > 1) {
    throw new Error("Use only one of --preset, --from, or --config.");
  }
  const projectRoot = path.resolve(cwd ?? process.cwd());
  const presets = await loadBackgroundPresets();
  let config;

  if (providedConfig) {
    config = normalizeCliBackgroundConfig(providedConfig, presets);
  } else if (inlineConfig) {
    config = normalizeCliBackgroundConfig(
      decodeBackgroundInlineConfig(inlineConfig),
      presets,
    );
  } else if (from) {
    const inputPath = path.resolve(from);
    let input;
    try {
      input = JSON.parse(await readFile(inputPath, "utf8"));
    } catch (error) {
      throw new Error(`Could not read background JSON ${inputPath}: ${error.message}`);
    }
    config = normalizeCliBackgroundConfig(input, presets);
  } else {
    const selectedPreset = preset ?? "obsidian-fold";
    if (!presets[selectedPreset]) {
      throw new Error(`Unknown Balsa background preset: ${selectedPreset}.`);
    }
    config = normalizeCliBackgroundConfig(presets[selectedPreset], presets);
  }

  const relativeTarget = path.join("src", "backgrounds", `${name}.ts`);
  const destination = targetPath(projectRoot, relativeTarget);
  const content = createBackgroundModuleSource(name, config);
  const existing = await readExisting(destination);
  if (existing !== undefined && existing !== content && !force) {
    throw new Error(`Refusing to overwrite customized file: ${relativeTarget}`);
  }

  const installed = await installRegistryItems({
    names: ["gradient-background"],
    cwd: projectRoot,
    force,
  });
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, content, "utf8");

  const manifestPath = path.join(projectRoot, ".balsa", "installed.json");
  const manifest = await readJson(manifestPath);
  const generatedHash = contentHash(content);
  manifest.components[`@balsa/background-${name}`] = {
    registry: `@balsa/background-${name}`,
    namespace: "@balsa",
    installedVersion: "1.0.0",
    originalSourceHash: generatedHash,
    installedSourceHash: generatedHash,
    targetPath: relativeTarget.replaceAll(path.sep, "/"),
    files: [relativeTarget.replaceAll(path.sep, "/")],
  };
  await writeJson(manifestPath, manifest);

  return {
    config,
    destination,
    relativeTarget: relativeTarget.replaceAll(path.sep, "/"),
    identifier: backgroundExportIdentifier(name),
    installed,
  };
}
