import presetData from "./gradient-background-presets.json";

export const GRADIENT_BACKGROUND_SCHEMA_VERSION = 2 as const;
const LEGACY_GRADIENT_BACKGROUND_SCHEMA_VERSION = 1;
export const GRADIENT_BACKGROUND_QUALITY_VALUES = [
  "auto",
  "low",
  "medium",
  "high",
] as const;
export const GRADIENT_BACKGROUND_COLOR_MODES = ["custom", "palette"] as const;

export type GradientBackgroundPresetName = keyof typeof presetData;
export type GradientBackgroundQuality =
  (typeof GRADIENT_BACKGROUND_QUALITY_VALUES)[number];
export type GradientBackgroundColorMode =
  (typeof GRADIENT_BACKGROUND_COLOR_MODES)[number];

export interface BalsaBackgroundConfig {
  schemaVersion: typeof GRADIENT_BACKGROUND_SCHEMA_VERSION;
  preset: GradientBackgroundPresetName;
  seed: number;
  colorMode: GradientBackgroundColorMode;
  colors: string[];
  speed: number;
  scale: number;
  warp: number;
  wave: number;
  softness: number;
  grain: number;
  grainSize: number;
  contrast: number;
  brightness: number;
  direction: number;
  quality: GradientBackgroundQuality;
  fieldOctaves: number;
  fieldFrequency: number;
  noiseAmount: number;
  noiseOctaves: number;
  noiseFrequency: number;
  warpFrequency: number;
  ribbonDensity: number;
}

export type GradientBackgroundConfigInput = Partial<
  Omit<BalsaBackgroundConfig, "schemaVersion" | "colors">
> & {
  schemaVersion?: number;
  colors?: readonly string[];
};

export interface GradientBackgroundDirectOverrides
  extends Partial<
    Omit<BalsaBackgroundConfig, "schemaVersion" | "preset" | "colors">
  > {
  colors?: readonly string[];
}

export interface GradientBackgroundCaptureOptions {
  width?: number;
  height?: number;
}

export interface GradientBackgroundExposed {
  capturePng: (options?: GradientBackgroundCaptureOptions) => Promise<Blob>;
  renderStill: () => void;
}

export const gradientBackgroundPresetNames = Object.freeze(
  Object.keys(presetData) as GradientBackgroundPresetName[],
);

const HEX_COLOR = /^#[\da-f]{6}$/i;
const DEFAULT_PRESET: GradientBackgroundPresetName = "obsidian-fold";

export const gradientBackgroundRanges = Object.freeze({
  seed: { min: 0, max: 2147483647, step: 1 },
  speed: { min: 0, max: 2, step: 0.005 },
  scale: { min: 0.25, max: 4, step: 0.01 },
  warp: { min: 0, max: 2, step: 0.01 },
  wave: { min: 0, max: 2, step: 0.01 },
  softness: { min: 0.05, max: 1, step: 0.01 },
  grain: { min: 0, max: 0.5, step: 0.005 },
  grainSize: { min: 0.25, max: 4, step: 0.05 },
  contrast: { min: 0.5, max: 2, step: 0.01 },
  brightness: { min: -0.5, max: 0.5, step: 0.01 },
  direction: { min: -180, max: 180, step: 1 },
  fieldOctaves: { min: 1, max: 4, step: 1 },
  fieldFrequency: { min: 0.2, max: 4, step: 0.01 },
  noiseAmount: { min: 0, max: 0.5, step: 0.005 },
  noiseOctaves: { min: 1, max: 6, step: 1 },
  noiseFrequency: { min: 0.2, max: 4, step: 0.01 },
  warpFrequency: { min: 0.2, max: 4, step: 0.01 },
  ribbonDensity: { min: 0.5, max: 8, step: 0.05 },
  captureWidth: { min: 320, max: 4096, step: 1 },
  captureHeight: { min: 320, max: 4096, step: 1 },
} as const);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: unknown, fallback: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, finiteNumber(value, fallback)));
}

function clampInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  return Math.round(clamp(value, fallback, min, max));
}

function normalizedColor(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_COLOR.test(value)
    ? value.toUpperCase()
    : fallback.toUpperCase();
}

function normalizedColors(value: unknown, fallback: readonly string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  const bounded = value.slice(0, 6);
  if (bounded.length < 2) return [...fallback];
  return bounded.map((color, index) =>
    normalizedColor(color, fallback[index % fallback.length] ?? "#000000"),
  );
}

export function isGradientBackgroundPresetName(
  value: unknown,
): value is GradientBackgroundPresetName {
  return typeof value === "string" && value in presetData;
}

export function isGradientBackgroundQuality(
  value: unknown,
): value is GradientBackgroundQuality {
  return GRADIENT_BACKGROUND_QUALITY_VALUES.includes(
    value as GradientBackgroundQuality,
  );
}

export function isGradientBackgroundColorMode(
  value: unknown,
): value is GradientBackgroundColorMode {
  return GRADIENT_BACKGROUND_COLOR_MODES.includes(
    value as GradientBackgroundColorMode,
  );
}

export function getGradientBackgroundPreset(
  name: GradientBackgroundPresetName,
): BalsaBackgroundConfig {
  return normalizeGradientBackgroundConfig(presetData[name]);
}

export function normalizeGradientBackgroundConfig(
  value: unknown,
  fallbackPreset: GradientBackgroundPresetName = DEFAULT_PRESET,
): BalsaBackgroundConfig {
  const input = isRecord(value) ? value : {};
  const preset = isGradientBackgroundPresetName(input.preset)
    ? input.preset
    : fallbackPreset;
  const fallback = presetData[preset];
  const legacy = input.schemaVersion === LEGACY_GRADIENT_BACKGROUND_SCHEMA_VERSION;

  return {
    schemaVersion: GRADIENT_BACKGROUND_SCHEMA_VERSION,
    preset,
    seed: clampInteger(
      input.seed,
      fallback.seed,
      gradientBackgroundRanges.seed.min,
      gradientBackgroundRanges.seed.max,
    ),
    colorMode: isGradientBackgroundColorMode(input.colorMode)
      ? input.colorMode
      : (fallback.colorMode as GradientBackgroundColorMode),
    colors: normalizedColors(input.colors, fallback.colors),
    speed: clamp(input.speed, fallback.speed, 0, 2),
    scale: clamp(input.scale, fallback.scale, 0.25, 4),
    warp: clamp(input.warp, fallback.warp, 0, 2),
    wave: clamp(input.wave, fallback.wave, 0, 2),
    softness: clamp(input.softness, fallback.softness, 0.05, 1),
    grain: clamp(input.grain, fallback.grain, 0, 0.5),
    grainSize: clamp(input.grainSize, fallback.grainSize, 0.25, 4),
    contrast: clamp(input.contrast, fallback.contrast, 0.5, 2),
    brightness: clamp(input.brightness, fallback.brightness, -0.5, 0.5),
    direction: clamp(input.direction, fallback.direction, -180, 180),
    quality: isGradientBackgroundQuality(input.quality)
      ? input.quality
      : (fallback.quality as GradientBackgroundQuality),
    fieldOctaves: clampInteger(
      legacy ? input.noiseOctaves : input.fieldOctaves,
      fallback.fieldOctaves,
      1,
      4,
    ),
    fieldFrequency: clamp(
      legacy ? input.noiseFrequency : input.fieldFrequency,
      fallback.fieldFrequency,
      0.2,
      4,
    ),
    noiseAmount: clamp(input.noiseAmount, fallback.noiseAmount, 0, 0.5),
    noiseOctaves: clampInteger(
      legacy ? undefined : input.noiseOctaves,
      fallback.noiseOctaves,
      1,
      6,
    ),
    noiseFrequency: clamp(
      legacy ? undefined : input.noiseFrequency,
      fallback.noiseFrequency,
      0.2,
      4,
    ),
    warpFrequency: clamp(input.warpFrequency, fallback.warpFrequency, 0.2, 4),
    ribbonDensity: clamp(input.ribbonDensity, fallback.ribbonDensity, 0.5, 8),
  };
}

export function resolveGradientBackgroundConfig(options: {
  preset?: GradientBackgroundPresetName;
  config?: GradientBackgroundConfigInput;
  overrides?: GradientBackgroundDirectOverrides;
} = {}): BalsaBackgroundConfig {
  const selectedPreset = options.preset
    ?? (isGradientBackgroundPresetName(options.config?.preset)
      ? options.config.preset
      : DEFAULT_PRESET);
  const base = presetData[selectedPreset];
  const config = options.config?.schemaVersion === LEGACY_GRADIENT_BACKGROUND_SCHEMA_VERSION
    ? normalizeGradientBackgroundConfig(options.config, selectedPreset)
    : options.config;
  return normalizeGradientBackgroundConfig({
    ...base,
    ...config,
    ...options.overrides,
    preset: selectedPreset,
    schemaVersion: GRADIENT_BACKGROUND_SCHEMA_VERSION,
  }, selectedPreset);
}

export function parseGradientBackgroundConfig(
  value: string | unknown,
): BalsaBackgroundConfig {
  const parsed: unknown = typeof value === "string" ? JSON.parse(value) : value;
  if (!isRecord(parsed)) throw new Error("Background configuration must be an object.");
  if (
    parsed.schemaVersion !== GRADIENT_BACKGROUND_SCHEMA_VERSION
    && parsed.schemaVersion !== LEGACY_GRADIENT_BACKGROUND_SCHEMA_VERSION
  ) {
    throw new Error(
      `Unsupported Balsa background schema version: ${String(parsed.schemaVersion)}.`,
    );
  }
  if (!isGradientBackgroundPresetName(parsed.preset)) {
    throw new Error(`Unknown Balsa background preset: ${String(parsed.preset)}.`);
  }
  if (!Array.isArray(parsed.colors) || parsed.colors.length < 2 || parsed.colors.length > 6) {
    throw new Error("A Balsa background configuration requires two to six colors.");
  }
  if (parsed.colors.some((color) => typeof color !== "string" || !HEX_COLOR.test(color))) {
    throw new Error("Background colors must use six-digit hexadecimal values.");
  }
  return normalizeGradientBackgroundConfig(parsed, parsed.preset);
}

export function serializeGradientBackgroundConfig(
  value: unknown,
): string {
  return `${JSON.stringify(normalizeGradientBackgroundConfig(value), null, 2)}\n`;
}

export function randomGradientBackgroundSeed(
  random: () => number = Math.random,
): number {
  return Math.floor(Math.min(0.999999999, Math.max(0, random())) * 2147483648);
}

const paletteRoles = [
  "--balsa-color-background",
  "--balsa-color-surface",
  "--balsa-color-primary",
  "--balsa-color-secondary",
  "--balsa-color-accent",
] as const;

export function resolveGradientBackgroundPaletteColors(
  element: Element,
  fallback: readonly string[],
): string[] {
  const styles = getComputedStyle(element);
  const resolved = paletteRoles
    .map((role) => styles.getPropertyValue(role).trim())
    .filter(Boolean);
  return resolved.length >= 2 ? resolved : [...fallback];
}

export function buildGradientBackgroundFallback(
  colors: readonly string[],
  direction: number,
): string {
  const stops = colors
    .slice(0, 6)
    .map((color, index, values) =>
      `${color} ${Math.round((index / Math.max(1, values.length - 1)) * 100)}%`,
    )
    .join(", ");
  return `linear-gradient(${direction + 90}deg, ${stops})`;
}

export const gradientBackgroundPresets = Object.freeze(
  Object.fromEntries(
    gradientBackgroundPresetNames.map((name) => [
      name,
      getGradientBackgroundPreset(name),
    ]),
  ) as Record<GradientBackgroundPresetName, BalsaBackgroundConfig>,
);
