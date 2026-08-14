import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { installRegistryItems } from "./install-registry.mjs";
import {
  readJson,
  rootDir,
  targetPath,
  writeJson,
} from "./registry-lib.mjs";

const schemaVersion = 1;
const presetPath = path.join(
  rootDir,
  "src",
  "components",
  "ui",
  "text-3d-presets.json",
);
const gradientPresetPath = path.join(
  rootDir,
  "src",
  "components",
  "ui",
  "gradient-background-presets.json",
);
const hexColor = /^#[\da-f]{6}$/i;
const qualityValues = new Set(["auto", "low", "medium", "high"]);
const colorModeValues = new Set(["custom", "palette"]);
const fontModeValues = new Set(["theme", "custom"]);
const materialValues = new Set(["metallic", "solid", "glass"]);
const environmentValues = new Set(["studio", "rim", "soft", "dramatic", "neon"]);
const alignmentValues = new Set(["left", "center", "right"]);
const poseModeValues = new Set(["static", "pointer", "auto-rotate", "float"]);
const backdropValues = new Set(["color", "gradient", "environment"]);
const fontValues = new Set([
  "space-grotesk",
  "inter",
  "noto-sans",
  "roboto",
  "open-sans",
  "source-sans-3",
  "lato",
  "montserrat",
  "poppins",
  "raleway",
  "oswald",
  "playfair-display",
  "rubik-spray-paint",
]);
// Mirrors `normalizeText3DFontFamily`: an arbitrary Google Fonts family name is
// carried through a saved configuration, and anything that is not a usable
// family name clears back to the shipped typeface named by `font`.
const maximumFontFamilyLength = 64;
// Mirrors the serialized public union in `src/components/ui/text-3d.ts`.
// The CLI cannot import that TypeScript module, but must normalize saved input
// onto the same ramp before it writes a consumer-owned configuration.
const fontWeightValues = [300, 400, 500, 600, 700, 800, 900];
const colorCount = 3;
const maximumReflections = 4;
const maximumCharacters = 64;
const maximumLines = 4;
const maximumNameLength = 48;
const ranges = Object.freeze({
  seed: { min: 0, max: 2147483647 },
  size: { min: 0.25, max: 4 },
  letterSpacing: { min: -0.1, max: 0.5 },
  lineHeight: { min: 0.7, max: 2.5 },
  metalness: { min: 0, max: 1 },
  roughness: { min: 0, max: 1 },
  clearcoat: { min: 0, max: 1 },
  clearcoatRoughness: { min: 0, max: 1 },
  transmission: { min: 0, max: 1 },
  ior: { min: 1, max: 2.5 },
  thickness: { min: 0, max: 5 },
  glow: { min: 0, max: 1 },
  depth: { min: 0, max: 1.5 },
  bevelSize: { min: 0, max: 0.08 },
  bevelThickness: { min: 0, max: 0.2 },
  bevelSegments: { min: 1, max: 8 },
  curveSegments: { min: 2, max: 24 },
  lightIntensity: { min: 0, max: 4 },
  ambientIntensity: { min: 0, max: 2 },
  lightAngle: { min: -180, max: 180 },
  reflectionStrength: { min: 0, max: 2 },
  environmentRotation: { min: -180, max: 180 },
  environmentContrast: { min: 0, max: 2 },
  rotationX: { min: -90, max: 90 },
  rotationY: { min: -180, max: 180 },
  rotationZ: { min: -45, max: 45 },
  zoom: { min: 0.25, max: 4 },
  autoRotateSpeed: { min: 0, max: 1 },
  damping: { min: 0, max: 1 },
});
const reflectionRanges = Object.freeze({
  position: { min: 0, max: 1 },
  width: { min: 0.02, max: 0.5 },
  intensity: { min: 0, max: 4 },
});
const reflectionDefault = Object.freeze({
  color: "#FFFFFF",
  position: 0.18,
  width: 0.06,
  intensity: 2,
});
let gradientPresetNames = new Set();

function namedGradientPreset(value) {
  return typeof value === "string" && gradientPresetNames.has(value) ? value : "";
}

function option(value, allowed, fallback) {
  return allowed.has(value) ? value : fallback;
}

function clamp(value, fallback, minimum, maximum) {
  const candidate = typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
  return Math.min(maximum, Math.max(minimum, candidate));
}

function integer(value, fallback, minimum, maximum) {
  return Math.round(clamp(value, fallback, minimum, maximum));
}

function ranged(key, value, fallback) {
  const range = ranges[key];
  return clamp(value, fallback, range.min, range.max);
}

function integerRanged(key, value, fallback) {
  const range = ranges[key];
  return integer(value, fallback, range.min, range.max);
}

function boolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function color(value, fallback) {
  return typeof value === "string" && hexColor.test(value.trim())
    ? value.trim().toUpperCase()
    : fallback;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function reflections(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maximumReflections).map((candidate) => {
    const reflection = isRecord(candidate) ? candidate : {};
    return {
      color: color(reflection.color, reflectionDefault.color),
      position: clamp(
        reflection.position,
        reflectionDefault.position,
        reflectionRanges.position.min,
        reflectionRanges.position.max,
      ),
      width: clamp(
        reflection.width,
        reflectionDefault.width,
        reflectionRanges.width.min,
        reflectionRanges.width.max,
      ),
      intensity: clamp(
        reflection.intensity,
        reflectionDefault.intensity,
        reflectionRanges.intensity.min,
        reflectionRanges.intensity.max,
      ),
    };
  });
}

function text(value, fallback) {
  if (typeof value !== "string") return fallback;
  const normalized = value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .slice(0, maximumLines)
    .map((line) => line.slice(0, maximumCharacters))
    .join("\n");
  return normalized.trim().length > 0 ? normalized : fallback;
}

function fontFamily(value) {
  if (typeof value !== "string") return "";
  const family = value.replace(/["']/g, " ").replace(/\s+/g, " ").trim();
  if (family.length === 0 || family.length > maximumFontFamilyLength) return "";
  return /^[A-Za-z0-9][A-Za-z0-9 .-]*$/.test(family) ? family : "";
}

function fontWeight(value, fallback) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return fontWeightValues.reduce((nearest, weight) =>
    Math.abs(weight - value) < Math.abs(nearest - value) ? weight : nearest,
  );
}

export function validateText3DName(name) {
  if (
    typeof name !== "string"
    || name.length > maximumNameLength
    || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)
  ) {
    throw new Error(
      "3D text names must use lowercase kebab-case, begin with a letter, and be at most 48 characters.",
    );
  }
  return name;
}

export function text3DExportIdentifier(name) {
  return name.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase());
}

export function decodeText3DInlineConfig(payload) {
  if (
    typeof payload !== "string"
    || payload.length === 0
    || payload.length > 16384
    || !/^[A-Za-z0-9_-]+$/.test(payload)
  ) {
    throw new Error("Inline 3D text configuration must be a valid base64url payload.");
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Could not decode the inline 3D text configuration.");
  }
}

export async function loadText3DPresets() {
  const [presets, gradientPresets] = await Promise.all([
    readJson(presetPath),
    readJson(gradientPresetPath),
  ]);
  gradientPresetNames = new Set(Object.keys(gradientPresets));
  return presets;
}

export function normalizeCliText3DConfig(value, presets) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("3D text configuration must be an object.");
  }
  if (value.schemaVersion !== schemaVersion) {
    throw new Error(
      `Unsupported Balsa 3D text schema version: ${String(value.schemaVersion)}.`,
    );
  }
  if (typeof value.preset !== "string" || !presets[value.preset]) {
    throw new Error(`Unknown Balsa 3D text preset: ${String(value.preset)}.`);
  }
  if (!Array.isArray(value.colors) || value.colors.length !== colorCount) {
    throw new Error(
      `A Balsa 3D text configuration requires exactly ${colorCount} colors.`,
    );
  }
  if (value.colors.some((entry) => typeof entry !== "string" || !hexColor.test(entry))) {
    throw new Error("3D text colors must use six-digit hexadecimal values.");
  }
  if (
    value.reflections !== undefined
    && (!Array.isArray(value.reflections)
      || value.reflections.some((reflection) => !isRecord(reflection)))
  ) {
    throw new Error("3D text reflections must be an array of reflection cards.");
  }

  const defaults = presets["liquid-chrome"];
  const fallback = { ...defaults, ...presets[value.preset] };
  const poseMode = option(
    value.poseMode === "pose" ? "static" : value.poseMode,
    poseModeValues,
    value.autoRotate === true ? "auto-rotate" : "static",
  );
  return {
    schemaVersion,
    preset: value.preset,
    seed: integerRanged("seed", value.seed, fallback.seed),
    text: text(value.text, fallback.text),
    fontMode: option(value.fontMode, fontModeValues, fallback.fontMode),
    font: option(value.font, fontValues, fallback.font),
    fontFamily: fontFamily(
      typeof value.fontFamily === "string" ? value.fontFamily : fallback.fontFamily,
    ),
    fontWeight: fontWeight(value.fontWeight, fallback.fontWeight),
    size: ranged("size", value.size, fallback.size),
    letterSpacing: ranged("letterSpacing", value.letterSpacing, fallback.letterSpacing),
    lineHeight: ranged("lineHeight", value.lineHeight, fallback.lineHeight),
    alignment: option(value.alignment, alignmentValues, fallback.alignment),
    material: option(value.material, materialValues, fallback.material),
    colorMode: option(value.colorMode, colorModeValues, fallback.colorMode),
    colors: value.colors.map((entry, index) => color(entry, fallback.colors[index])),
    metalness: ranged("metalness", value.metalness, fallback.metalness),
    roughness: ranged("roughness", value.roughness, fallback.roughness),
    clearcoat: ranged("clearcoat", value.clearcoat, fallback.clearcoat),
    clearcoatRoughness: ranged(
      "clearcoatRoughness",
      value.clearcoatRoughness,
      fallback.clearcoatRoughness,
    ),
    transmission: ranged("transmission", value.transmission, fallback.transmission),
    ior: ranged("ior", value.ior, fallback.ior),
    thickness: ranged("thickness", value.thickness, fallback.thickness),
    glow: ranged("glow", value.glow, fallback.glow),
    depth: ranged("depth", value.depth, fallback.depth),
    bevelEnabled: boolean(value.bevelEnabled, fallback.bevelEnabled),
    bevelSize: ranged("bevelSize", value.bevelSize, fallback.bevelSize),
    bevelThickness: ranged(
      "bevelThickness",
      value.bevelThickness,
      fallback.bevelThickness,
    ),
    bevelSegments: integerRanged(
      "bevelSegments",
      value.bevelSegments,
      fallback.bevelSegments,
    ),
    curveSegments: integerRanged(
      "curveSegments",
      value.curveSegments,
      fallback.curveSegments,
    ),
    environment: option(value.environment, environmentValues, fallback.environment),
    lightIntensity: ranged("lightIntensity", value.lightIntensity, fallback.lightIntensity),
    ambientIntensity: ranged(
      "ambientIntensity",
      value.ambientIntensity,
      fallback.ambientIntensity,
    ),
    lightAngle: ranged("lightAngle", value.lightAngle, fallback.lightAngle),
    reflectionStrength: ranged(
      "reflectionStrength",
      value.reflectionStrength,
      fallback.reflectionStrength,
    ),
    reflections: reflections(value.reflections),
    environmentRotation: ranged(
      "environmentRotation",
      value.environmentRotation,
      0,
    ),
    environmentContrast: ranged(
      "environmentContrast",
      value.environmentContrast,
      0.35,
    ),
    shadow: boolean(value.shadow, fallback.shadow),
    rotationX: ranged("rotationX", value.rotationX, fallback.rotationX),
    rotationY: ranged("rotationY", value.rotationY, fallback.rotationY),
    rotationZ: ranged("rotationZ", value.rotationZ, fallback.rotationZ),
    zoom: ranged("zoom", value.zoom, 1),
    interactive: boolean(value.interactive, fallback.interactive),
    poseMode,
    autoRotate: poseMode === "auto-rotate",
    autoRotateSpeed: ranged(
      "autoRotateSpeed",
      value.autoRotateSpeed,
      fallback.autoRotateSpeed,
    ),
    damping: ranged("damping", value.damping, fallback.damping),
    background: boolean(value.background, false),
    backgroundColor: color(value.backgroundColor, fallback.backgroundColor),
    backdrop: option(value.backdrop, backdropValues, "color"),
    gradientPreset: namedGradientPreset(value.gradientPreset),
    quality: option(value.quality, qualityValues, fallback.quality),
  };
}

export function createText3DModuleSource(name, config) {
  const identifier = text3DExportIdentifier(name);
  return `import type { BalsaText3DConfig } from "../components/ui/text-3d";\n\n/** Generated by Balsa UI. Edit this configuration in your application. */\nexport const ${identifier}: BalsaText3DConfig = ${JSON.stringify(config, null, 2)};\n`;
}

async function readExisting(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function createText3DConfiguration({
  name,
  cwd,
  preset,
  from,
  inlineConfig,
  force = false,
}) {
  validateText3DName(name);
  if ([preset, from, inlineConfig].filter(Boolean).length > 1) {
    throw new Error("Use only one of --preset, --from, or --config.");
  }
  const projectRoot = path.resolve(cwd ?? process.cwd());
  const presets = await loadText3DPresets();
  let config;

  if (inlineConfig) {
    config = normalizeCliText3DConfig(
      decodeText3DInlineConfig(inlineConfig),
      presets,
    );
  } else if (from) {
    const inputPath = path.resolve(from);
    let input;
    try {
      input = JSON.parse(await readFile(inputPath, "utf8"));
    } catch (error) {
      throw new Error(`Could not read 3D text JSON ${inputPath}: ${error.message}`);
    }
    config = normalizeCliText3DConfig(input, presets);
  } else {
    const selectedPreset = preset ?? "liquid-chrome";
    if (!presets[selectedPreset]) {
      throw new Error(`Unknown Balsa 3D text preset: ${selectedPreset}.`);
    }
    config = normalizeCliText3DConfig(presets[selectedPreset], presets);
  }

  const relativeTarget = path.join("src", "text-3d", `${name}.ts`);
  const destination = targetPath(projectRoot, relativeTarget);
  const content = createText3DModuleSource(name, config);
  const existing = await readExisting(destination);
  if (existing !== undefined && existing !== content && !force) {
    throw new Error(`Refusing to overwrite customized file: ${relativeTarget}`);
  }

  const installed = await installRegistryItems({
    names: ["text-3d"],
    cwd: projectRoot,
    force,
  });
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, content, "utf8");

  const manifestPath = path.join(projectRoot, ".balsa", "installed.json");
  const manifest = await readJson(manifestPath);
  const generatedHash = `sha256-${createHash("sha256").update(content).digest("hex")}`;
  manifest.components[`@balsa/text-3d-${name}`] = {
    registry: `@balsa/text-3d-${name}`,
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
    identifier: text3DExportIdentifier(name),
    installed,
  };
}
