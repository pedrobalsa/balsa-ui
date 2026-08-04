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

/**
 * All six tonal roles, the shader's maximum. `muted` anchors the neutral end so
 * a light palette's saturated accents read as tint rather than a dark mass, and
 * keeping all three accents preserves the mid-tones that give a dark palette its
 * depth -- dropping one leaves those fields collapsing toward flat black.
 */
const paletteRoles = [
  "--balsa-color-background",
  "--balsa-color-surface",
  "--balsa-color-muted",
  "--balsa-color-primary",
  "--balsa-color-secondary",
  "--balsa-color-accent",
] as const;

const paletteBackgroundRole = "--balsa-color-background";
/**
 * Overlaid text is rarely the full-strength foreground -- ledes and eyebrows use
 * dimmer roles. Holding the floor against the dimmest of them keeps the ones
 * above it readable too.
 */
const paletteTextRoles = [
  "--balsa-color-muted-foreground",
  "--balsa-color-foreground",
] as const;

/** WCAG AA for body text: the floor the palette's own -foreground tokens use. */
export const GRADIENT_BACKGROUND_MINIMUM_CONTRAST = 4.5;

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

/**
 * Hex and rgb() only. Palettes emit hex, but a project may override a role with
 * a color this cannot read -- those stops are left untouched rather than
 * guessed at, so an unparseable value degrades to today's behavior.
 */
function parseColor(value: string): RgbColor | undefined {
  const input = value.trim();
  const hex = input.startsWith("#") ? input.slice(1) : undefined;
  if (hex && (hex.length === 3 || hex.length === 6)) {
    const width = hex.length / 3;
    const channel = (index: number): number => {
      const part = hex.slice(index * width, index * width + width);
      const parsed = Number.parseInt(width === 1 ? part + part : part, 16);
      return Number.isNaN(parsed) ? Number.NaN : parsed;
    };
    const color = { red: channel(0), green: channel(1), blue: channel(2) };
    return Number.isNaN(color.red + color.green + color.blue) ? undefined : color;
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(input);
  if (!rgb) return undefined;
  return {
    red: Number.parseFloat(rgb[1]),
    green: Number.parseFloat(rgb[2]),
    blue: Number.parseFloat(rgb[3]),
  };
}

function channel(value: number): number {
  return Math.round(Math.min(255, Math.max(0, value)));
}

function toHex({ red, green, blue }: RgbColor): string {
  return `#${[red, green, blue].map((value) => channel(value).toString(16).padStart(2, "0")).join("")}`
    .toUpperCase();
}

/**
 * Rounds to the 8-bit values the stop will actually be emitted as. Searching on
 * unrounded channels lands just under the floor once the result is quantized.
 */
function mix(from: RgbColor, to: RgbColor, amount: number): RgbColor {
  return {
    red: channel(from.red + (to.red - from.red) * amount),
    green: channel(from.green + (to.green - from.green) * amount),
    blue: channel(from.blue + (to.blue - from.blue) * amount),
  };
}

function relativeLuminance({ red, green, blue }: RgbColor): number {
  const [r, g, b] = [red, green, blue].map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function contrastRatio(first: RgbColor, second: RgbColor): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * Nudges one gradient stop away from the text that will sit on top of it.
 *
 * Palette roles are generated to contrast with `background`, not with each
 * other, so `primary` frequently lands on or near `foreground` -- the stock
 * dark palette has them identical. Left alone, text over the gradient
 * disappears wherever that stop dominates. Each failing stop is mixed toward
 * whichever of black or white reaches the target first, which preserves as much
 * of the authored hue as the contrast floor allows.
 */
function contrastingStop(
  color: string,
  textColor: RgbColor,
  background?: RgbColor,
): string {
  const parsed = parseColor(color);
  if (!parsed) return color;
  if (contrastRatio(textColor, parsed) >= GRADIENT_BACKGROUND_MINIMUM_CONTRAST) {
    return toHex(parsed);
  }

  // The palette's own background is the preferred direction: text is already
  // guaranteed to read against it, and moving that way is self-correcting per
  // scheme -- a light palette's saturated blue rises toward near-white, a dark
  // palette's bright accent sinks toward near-black and keeps its glow. Black
  // and white are fallbacks for palettes whose background cannot reach the floor.
  const candidates: RgbColor[] = [
    ...(background ? [background] : []),
    { red: 0, green: 0, blue: 0 },
    { red: 255, green: 255, blue: 255 },
  ];
  const target = candidates.find(
    (candidate) =>
      contrastRatio(textColor, candidate) >= GRADIENT_BACKGROUND_MINIMUM_CONTRAST,
  );
  if (!target) return toHex(parsed);

  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 20; iteration += 1) {
    const middle = (low + high) / 2;
    if (
      contrastRatio(textColor, mix(parsed, target, middle))
      >= GRADIENT_BACKGROUND_MINIMUM_CONTRAST
    ) {
      high = middle;
    } else {
      low = middle;
    }
  }
  return toHex(mix(parsed, target, high));
}

/**
 * Rewrites the stops that would swallow text drawn in `textColor`. Pure, so the
 * inherited-palette path and the opt-in `contentColor` prop share one behavior.
 */
export function applyGradientBackgroundContentContrast(
  colors: readonly string[],
  textColor: string,
  background?: string,
): string[] {
  const parsed = parseColor(textColor);
  if (!parsed) return [...colors];
  const toward = background ? parseColor(background) : undefined;
  return colors.map((color) => contrastingStop(color, parsed, toward));
}

/**
 * The text color the gradient's own box inherits. Content usually sits in a
 * sibling layer under the same ancestor, so this is the closest the background
 * can get to "what will be drawn on me" without inspecting the consumer's tree.
 * `contentColor` exists for the cases where that guess is wrong.
 */
export function resolveGradientBackgroundContentColor(
  element: Element,
): string | undefined {
  return getComputedStyle(element).color.trim() || undefined;
}

interface PaletteRoles {
  colors: string[];
  textColor?: string;
  background?: string;
}

function readPaletteRoles(element: Element): PaletteRoles {
  const styles = getComputedStyle(element);
  const read = (role: string): string | undefined =>
    styles.getPropertyValue(role).trim() || undefined;
  return {
    colors: paletteRoles.map(read).filter((value): value is string => Boolean(value)),
    textColor: paletteTextRoles.map(read).find(Boolean),
    background: read(paletteBackgroundRole),
  };
}

/** Whether this element sits inside a Balsa palette, so colors can be inherited. */
export function hasGradientBackgroundPalette(element: Element): boolean {
  return readPaletteRoles(element).colors.length >= 2;
}

/** The inherited palette background, the preferred direction for stop repair. */
export function resolveGradientBackgroundPaletteBackground(
  element: Element,
): string | undefined {
  return readPaletteRoles(element).background;
}

/** Opacity used when `scrim` is enabled without a value of its own. */
export const GRADIENT_BACKGROUND_SCRIM_OPACITY = 0.65;

export function resolveGradientBackgroundPaletteColors(
  element: Element,
  fallback: readonly string[],
): string[] {
  const { colors, textColor, background } = readPaletteRoles(element);
  if (colors.length < 2) return [...fallback];
  return textColor
    ? applyGradientBackgroundContentContrast(colors, textColor, background)
    : colors;
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
