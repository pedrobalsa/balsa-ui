/**
 * Finite studio/component presets. Changing a scene here also requires
 * `npm run thumbnails:build` so the 3D Text Studio menu miniatures stay in
 * sync with the materials they represent.
 */
import presetData from "./text-3d-presets.json";
import {
  isGradientBackgroundPresetName,
  type GradientBackgroundPresetName,
} from "./gradient-background";

export const TEXT_3D_SCHEMA_VERSION = 1 as const;

export const TEXT_3D_QUALITY_VALUES = ["auto", "low", "medium", "high"] as const;
export const TEXT_3D_COLOR_MODES = ["custom", "palette"] as const;
export const TEXT_3D_FONT_MODES = ["theme", "custom"] as const;
export const TEXT_3D_MATERIALS = ["metallic", "solid", "glass"] as const;
export const TEXT_3D_ENVIRONMENTS = [
  "studio",
  "rim",
  "soft",
  "dramatic",
  "neon",
] as const;
export const TEXT_3D_ALIGNMENTS = ["left", "center", "right"] as const;
export const TEXT_3D_POSE_MODES = [
  "static",
  "pointer",
  "auto-rotate",
  "float",
] as const;
/**
 * What the painted canvas shows behind the text. `color` fills `backgroundColor`;
 * `gradient` composes a real `GradientBackground` from the scene's own color
 * stops behind a transparent canvas, which is what a glass surface needs to be
 * refracting something; `environment` shows the same lit surround the surface is
 * reflecting, so the scene reads as one room rather than as type pasted over a
 * flat swatch. All three are gated by `background`: with it off the canvas stays
 * transparent, which is how a scene authored before this field existed still
 * composites over whatever the consumer put behind it.
 */
export const TEXT_3D_BACKDROPS = ["color", "gradient", "environment"] as const;
/**
 * How the canvas treats the scroll wheel. `modifier` is the embed default:
 * Ctrl/Cmd + wheel zooms, a plain wheel scrolls the page — the same rule
 * maps and this repository's CompositionMatrix use. `always` zooms on a
 * plain wheel; 3D Text Studio opts into that because its preview fills the
 * viewport and the page does not scroll.
 */
export const TEXT_3D_WHEEL_ZOOM_MODES = ["always", "modifier"] as const;
/**
 * The practical display-weight ramp, using the conventional numeric CSS
 * weight scale: https://www.w3.org/TR/css-fonts-4/#font-weight-prop
 * Families without every member resolve to their nearest generated face in
 * `text-3d-fonts.ts` instead of duplicating outlines or requesting a 404.
 */
export const TEXT_3D_FONT_WEIGHTS = [300, 400, 500, 600, 700, 800, 900] as const;
/**
 * Families Balsa already ships through `@fontsource` (see `src/main.ts`), so a
 * 3D scene never introduces a typeface the rest of the interface cannot set.
 * The ids match the `@fontsource` package names, which is what the typeface
 * generator in `scripts/build-typeface-fonts.mjs` reads.
 *
 * The list is deliberately finite. A display face earns its place by being
 * something the text ramps cannot approximate -- Rubik Spray Paint is a stencil
 * with sprayed edges, which extrudes into a surface no weight of a grotesque
 * reaches -- and it publishes a single 400 face, so the nearest-weight
 * resolution in `text-3d-fonts.ts` is what makes it answer the whole ramp.
 */
export const TEXT_3D_FONTS = [
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
] as const;

export type Text3DPresetName = keyof typeof presetData;
export type Text3DQuality = (typeof TEXT_3D_QUALITY_VALUES)[number];
export type Text3DColorMode = (typeof TEXT_3D_COLOR_MODES)[number];
export type Text3DFontMode = (typeof TEXT_3D_FONT_MODES)[number];
export type Text3DMaterial = (typeof TEXT_3D_MATERIALS)[number];
export type Text3DEnvironment = (typeof TEXT_3D_ENVIRONMENTS)[number];
export type Text3DAlignment = (typeof TEXT_3D_ALIGNMENTS)[number];
export type Text3DPoseMode = (typeof TEXT_3D_POSE_MODES)[number];
export type Text3DBackdrop = (typeof TEXT_3D_BACKDROPS)[number];
export type Text3DWheelZoom = (typeof TEXT_3D_WHEEL_ZOOM_MODES)[number];
export type Text3DFont = (typeof TEXT_3D_FONTS)[number];
export type Text3DFontWeight = (typeof TEXT_3D_FONT_WEIGHTS)[number];
/**
 * Body, highlight, rim -- a fixed triple rather than an array, because every
 * reader indexes it by role. Consumers install this source under
 * `noUncheckedIndexedAccess`, where `string[]` would hand them
 * `string | undefined` at each of those call sites and force a null check that
 * the schema has already ruled out.
 */
export type Text3DColors = [string, string, string];

/**
 * One light source the surface reflects -- a softbox in a photographer's studio,
 * not a band of paint on the mesh. A card is authored independently of the three
 * semantic material colors: `colors` says what the letter is made of, and these
 * say what is standing around it. A polished surface shows them as separate
 * streaks; a rough one smears them together; a matte one barely records them,
 * which is exactly the difference between the presets.
 */
export interface Text3DReflection {
  /** Six-digit hex. The card's own emitted color, not a tint of the body. */
  color: string;
  /** Normalized longitude, where 0 is behind the camera and 0.25 is camera-left. */
  position: number;
  /** Angular half-width. Narrow reads as a specular streak, wide as a softbox. */
  width: number;
  /**
   * Radiance multiplier. Values above 1 are deliberately over-range so a polished
   * surface has something brighter than white paint to reflect; a value below 1
   * authors a shadow card, which is what gives chrome its dark contrast.
   */
  intensity: number;
}

/** A light card's environment-owned geometry, deliberately excluding color. */
export type Text3DReflectionLayout = Omit<Text3DReflection, "color">;

/**
 * The complete lighting recipe selected by an environment. Colors are absent:
 * they come from the scene palette and are carried onto this layout when the
 * recipe is applied.
 */
export interface Text3DEnvironmentDefaults {
  lightIntensity: number;
  ambientIntensity: number;
  lightAngle: number;
  environmentRotation: number;
  environmentContrast: number;
  reflections: readonly Text3DReflectionLayout[];
}

export interface BalsaText3DConfig {
  schemaVersion: typeof TEXT_3D_SCHEMA_VERSION;
  preset: Text3DPresetName;
  seed: number;

  /** Newlines split lines; everything else is laid out on one baseline. */
  text: string;
  /**
   * `theme` resolves the family from the inherited `--balsa-font-title`, which
   * is what makes a scene follow the active Balsa theme without being told.
   * `custom` pins `font` regardless of theme. Both paths end at the same
   * loader, so the only difference is where the family name comes from.
   */
  fontMode: Text3DFontMode;
  font: Text3DFont;
  /**
   * An arbitrary Google Fonts family name, drawn at runtime instead of `font`.
   * Empty -- the default -- means the scene uses the shipped typeface named by
   * `font`, which is the only path that works offline. A name here is honoured
   * only under `fontMode: "custom"`, so following the theme still resolves
   * through `matchText3DFont`, and a failed remote load falls back to `font`.
   */
  fontFamily: string;
  fontWeight: Text3DFontWeight;
  /** Cap height in world units; the camera frames the laid-out text either way. */
  size: number;
  /** Fraction of `size` added between glyph advances. */
  letterSpacing: number;
  /** Multiple of `size` between baselines. */
  lineHeight: number;
  alignment: Text3DAlignment;

  material: Text3DMaterial;
  /**
   * `palette` takes the three colors from the inherited Balsa palette roles, so
   * a metallic surface reflects the product's own accents rather than a generic
   * chrome. `custom` uses `colors` as authored.
   */
  colorMode: Text3DColorMode;
  /**
   * Exactly three, in role order: body, highlight, rim. The highlight and rim
   * are what a metallic or glass surface reflects; a solid surface spends only
   * the body and takes its shading from the lights.
   */
  colors: Text3DColors;
  metalness: number;
  roughness: number;
  /** Physical-material clearcoat, the wet lacquer over the body color. */
  clearcoat: number;
  clearcoatRoughness: number;
  /** Glass only: how much light passes through the extrusion. */
  transmission: number;
  /** Glass only: index of refraction, 1 = air, 1.5 = window glass, 2.4 = diamond. */
  ior: number;
  /** Glass only: the volume light travels through, in `size` units. */
  thickness: number;
  /** Emissive lift as a fraction of the highlight color. */
  glow: number;

  /** Extrusion depth as a fraction of `size`. */
  depth: number;
  bevelEnabled: boolean;
  /** Both as a fraction of `size`, so a bevel survives a size change. */
  bevelSize: number;
  bevelThickness: number;
  bevelSegments: number;
  /** Subdivisions per glyph outline curve. The cost driver for sharp type. */
  curveSegments: number;

  environment: Text3DEnvironment;
  lightIntensity: number;
  ambientIntensity: number;
  /** Degrees, orbiting the text; 0 places the key light behind the camera. */
  lightAngle: number;
  /** Strength of the palette-tinted reflection environment, 0 disables it. */
  reflectionStrength: number;
  /**
   * Up to `TEXT_3D_MAXIMUM_REFLECTIONS` cards in the Environment's authored
   * lighting layout. An empty list is deliberate, not missing: a matte cast has
   * nothing to reflect.
   */
  reflections: readonly Text3DReflection[];
  /** Degrees the whole surround is turned by, cards included. */
  environmentRotation: number;
  /**
   * Separation between the surround's darkest and brightest areas. Below 1
   * flattens it toward an even wash; above 1 pushes the cards apart, which is
   * what keeps a reflection reading as a reflection rather than as ambient light.
   */
  environmentContrast: number;
  shadow: boolean;

  /** Authored base pose in degrees. A drag in any mode commits back into it. */
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  /**
   * Camera framing multiplier. `1` is the default fit, so a payload saved
   * before this field existed renders exactly as it does today. Larger values
   * dolly the camera in; smaller values pull it back. This is not `size`:
   * changing size rebuilds glyph geometry, while zoom only reframes.
   */
  zoom: number;
  /** Whether pose drag and pointer-follow interaction are enabled. */
  interactive: boolean;
  /** The one active static, pointer-follow, automatic, or floating motion. */
  poseMode: Text3DPoseMode;
  /** @deprecated Read-only compatibility mirror for schema-one scenes. */
  autoRotate: boolean;
  /** Revolutions per second in `auto-rotate` mode. */
  autoRotateSpeed: number;
  /**
   * Smoothing for `pointer` and `float`; higher values follow and drift more
   * softly. Pose drags are authored directly and do not spring back.
   */
  damping: number;

  /** `true` paints the `backdrop`; `false` leaves the canvas transparent. */
  background: boolean;
  /** What `background` paints when `backdrop` is `color`. */
  backgroundColor: string;
  backdrop: Text3DBackdrop;
  /**
   * Names a `GradientBackground` preset for the painted gradient backdrop.
   * Empty -- the default -- keeps the derived blobs room built from this
   * scene's own reflection and material colours. A named preset replaces that
   * derived field; unknown names normalize away rather than reaching the
   * component.
   */
  gradientPreset: GradientBackgroundPresetName | "";
  quality: Text3DQuality;
}

/**
 * A partially authored card. Every field is normalized, so a config carrying
 * only a color still resolves to a complete, safely bounded reflection.
 */
export type Text3DReflectionInput = Partial<Text3DReflection>;

export type Text3DConfigInput = Partial<
  Omit<BalsaText3DConfig, "schemaVersion" | "colors" | "reflections">
> & {
  schemaVersion?: number;
  colors?: readonly string[];
  reflections?: readonly Text3DReflectionInput[];
};

export interface Text3DDirectOverrides
  extends Partial<
    Omit<BalsaText3DConfig, "schemaVersion" | "preset" | "colors" | "reflections">
  > {
  colors?: readonly string[];
  reflections?: readonly Text3DReflectionInput[];
}

export const TEXT_3D_CAPTURE_LAYERS = ["composite", "text", "gradient"] as const;
export type Text3DCaptureLayer = (typeof TEXT_3D_CAPTURE_LAYERS)[number];

export interface Text3DCaptureOptions {
  width?: number;
  height?: number;
  /** Capture over `backgroundColor` even when `background` is off. */
  opaque?: boolean;
  /**
   * Which picture to encode. `composite` is the on-screen stack and the default.
   * `text` is the glyphs with alpha and no backdrop. `gradient` is the backdrop
   * field alone.
   */
  layer?: Text3DCaptureLayer;
}

export interface Text3DPose {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  zoom: number;
}

export interface Text3DExposed {
  capturePng: (options?: Text3DCaptureOptions) => Promise<Blob>;
  renderStill: () => void;
  /** Returns to the configured rotation and zoom and clears transient motion. */
  resetPose: () => void;
}

export const text3DPresetNames = Object.freeze(
  Object.keys(presetData) as Text3DPresetName[],
);

const HEX_COLOR = /^#[\da-f]{6}$/i;
const DEFAULT_PRESET: Text3DPresetName = "liquid-chrome";
/** Three tonal roles: body, highlight, rim. */
export const TEXT_3D_COLOR_COUNT = 3;
/**
 * How many palette colors one scene edits as a single strip: up to three
 * material roles followed by up to three reflection colors. It is an editing
 * bound rather than a schema field -- `colors` stays exactly three, and the
 * remaining stops are cycled across the Environment's cards -- so the strip
 * can grow without the public material tuple or light-card layout growing.
 */
export const TEXT_3D_MAXIMUM_COLOR_STOPS = 6;
/**
 * The gradient field is the room made visible. Reflection cards are that
 * room's lights, so they occupy the stop budget first; material colours
 * ground the field only if stops remain. A chrome preset authors 3 material
 * roles plus 4 cards, which is 7, and without this order the last light is
 * the one `TEXT_3D_MAXIMUM_COLOR_STOPS` drops.
 */
export function text3DGradientColors(
  colors: readonly string[],
  reflections: readonly Pick<Text3DReflection, "color">[],
): string[] {
  return [
    ...reflections.map(({ color }) => color),
    ...colors,
  ].slice(0, TEXT_3D_MAXIMUM_COLOR_STOPS);
}

export const TEXT_3D_MAXIMUM_CHARACTERS = 64;
export const TEXT_3D_MAXIMUM_LINES = 4;
/**
 * Long enough for every family Google publishes -- the longest is well under
 * half of this -- and short enough that the field cannot be used to smuggle a
 * URL into the loader's query string.
 */
export const TEXT_3D_MAXIMUM_FONT_FAMILY_LENGTH = 64;
/**
 * Four cards is a key, a fill, a rim, and one accent -- the working set of a
 * physical lighting setup. The cap is what keeps the surround a finite,
 * inspectable contract rather than an open scene graph in a JSON field.
 */
export const TEXT_3D_MAXIMUM_REFLECTIONS = 4;

export const text3DRanges = Object.freeze({
  seed: { min: 0, max: 2147483647, step: 1 },
  size: { min: 0.25, max: 4, step: 0.01 },
  letterSpacing: { min: -0.1, max: 0.5, step: 0.005 },
  lineHeight: { min: 0.7, max: 2.5, step: 0.01 },
  metalness: { min: 0, max: 1, step: 0.01 },
  roughness: { min: 0, max: 1, step: 0.01 },
  clearcoat: { min: 0, max: 1, step: 0.01 },
  clearcoatRoughness: { min: 0, max: 1, step: 0.01 },
  transmission: { min: 0, max: 1, step: 0.01 },
  ior: { min: 1, max: 2.5, step: 0.01 },
  thickness: { min: 0, max: 5, step: 0.05 },
  glow: { min: 0, max: 1, step: 0.01 },
  depth: { min: 0, max: 1.5, step: 0.01 },
  // Capped well below the depth range on purpose: past roughly a tenth of the
  // cap height a bevel starts eating the counters of tight glyphs, and the
  // wide-bevel look that invites is the one that stops reading as type.
  bevelSize: { min: 0, max: 0.08, step: 0.002 },
  bevelThickness: { min: 0, max: 0.2, step: 0.002 },
  bevelSegments: { min: 1, max: 8, step: 1 },
  curveSegments: { min: 2, max: 24, step: 1 },
  lightIntensity: { min: 0, max: 4, step: 0.05 },
  ambientIntensity: { min: 0, max: 2, step: 0.05 },
  lightAngle: { min: -180, max: 180, step: 1 },
  reflectionStrength: { min: 0, max: 2, step: 0.05 },
  environmentRotation: { min: -180, max: 180, step: 1 },
  environmentContrast: { min: 0, max: 2, step: 0.05 },
  rotationX: { min: -90, max: 90, step: 1 },
  rotationY: { min: -180, max: 180, step: 1 },
  rotationZ: { min: -45, max: 45, step: 1 },
  // 1 is today's framing. 0.25–4 is a 4× pull-back to a 4× close-up, the
  // same window Chrome's page zoom offers at the 25% floor
  // (https://support.google.com/chrome/answer/96810) and the same numeric
  // span as `size`, so the studio slider feels familiar. Capped at 4 rather
  // than Chrome's 500% so the dolly stays in front of the near-plane floor
  // for typical glyph bounds.
  zoom: { min: 0.25, max: 4, step: 0.01 },
  autoRotateSpeed: { min: 0, max: 1, step: 0.005 },
  damping: { min: 0, max: 1, step: 0.01 },
  captureWidth: { min: 320, max: 4096, step: 1 },
  captureHeight: { min: 320, max: 4096, step: 1 },
} as const);

/**
 * The per-card ranges, kept beside `text3DRanges` rather than inside it: those
 * keys name top-level configuration fields, and a studio slider bound to
 * `position` would otherwise look like a field the config does not have.
 */
export const text3DReflectionRanges = Object.freeze({
  position: { min: 0, max: 1, step: 0.01 },
  width: { min: 0.02, max: 0.5, step: 0.01 },
  intensity: { min: 0, max: 4, step: 0.1 },
} as const);

/** The card an empty slot starts from: a neutral key light beside the camera. */
export const TEXT_3D_REFLECTION_DEFAULT: Readonly<Text3DReflection> = Object.freeze({
  color: "#FFFFFF",
  position: 0.18,
  width: 0.06,
  intensity: 2,
});

/** Fallbacks for fields a preset or an agent-written config may omit. */
export const TEXT_3D_DEFAULTS = Object.freeze({
  seed: 1024,
  text: "Hello\nWorld!",
  fontMode: "theme" as Text3DFontMode,
  font: "space-grotesk" as Text3DFont,
  fontFamily: "",
  fontWeight: 700 as Text3DFontWeight,
  size: 1,
  letterSpacing: 0.02,
  lineHeight: 1.15,
  alignment: "center" as Text3DAlignment,
  material: "metallic" as Text3DMaterial,
  colorMode: "palette" as Text3DColorMode,
  colors: ["#B8BCC4", "#F5F5F4", "#5B6068"] as Text3DColors,
  metalness: 1,
  roughness: 0.08,
  clearcoat: 0.25,
  clearcoatRoughness: 0.1,
  transmission: 0,
  ior: 1.5,
  thickness: 0.6,
  glow: 0,
  depth: 0.24,
  bevelEnabled: true,
  bevelSize: 0.034,
  bevelThickness: 0.03,
  bevelSegments: 3,
  curveSegments: 12,
  environment: "studio" as Text3DEnvironment,
  lightIntensity: 1.6,
  ambientIntensity: 0.45,
  lightAngle: 28,
  reflectionStrength: 1.6,
  reflections: [] as readonly Text3DReflection[],
  environmentRotation: 0,
  environmentContrast: 0.35,
  shadow: false,
  rotationX: -8,
  rotationY: -18,
  rotationZ: 0,
  zoom: 1,
  interactive: true,
  poseMode: "pointer" as Text3DPoseMode,
  autoRotate: false,
  autoRotateSpeed: 0.06,
  damping: 0.6,
  background: false,
  backgroundColor: "#0A0A0B",
  backdrop: "color" as Text3DBackdrop,
  gradientPreset: "" as const,
  quality: "auto" as Text3DQuality,
});

/**
 * What a material wants when the user switches to it. Applied by the studio
 * rather than by `normalize`: rewriting an authored config on every parse would
 * make a saved scene unstable, and metallic controls describe something quite
 * different once the surface starts transmitting light.
 */
export const text3DMaterialDefaults: Readonly<
  Record<Text3DMaterial, Partial<BalsaText3DConfig>>
> = Object.freeze({
  metallic: {
    metalness: 1,
    roughness: 0.08,
    clearcoat: 0.25,
    clearcoatRoughness: 0.1,
    transmission: 0,
    reflectionStrength: 1.6,
    environmentContrast: 0.8,
    bevelEnabled: true,
    bevelSize: 0.034,
    bevelThickness: 0.03,
    bevelSegments: 3,
    curveSegments: 12,
    glow: 0,
  },
  solid: {
    metalness: 0,
    roughness: 0.45,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    transmission: 0,
    reflectionStrength: 0.6,
    environmentContrast: 0.3,
    bevelEnabled: true,
    bevelSize: 0.022,
    bevelThickness: 0.02,
    bevelSegments: 4,
    curveSegments: 12,
    glow: 0,
  },
  glass: {
    metalness: 0,
    roughness: 0.03,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    transmission: 1,
    ior: 1.52,
    thickness: 1.2,
    reflectionStrength: 1.4,
    environmentContrast: 0.65,
    bevelEnabled: true,
    bevelSize: 0.045,
    bevelThickness: 0.038,
    bevelSegments: 5,
    curveSegments: 16,
    glow: 0,
  },
});

/**
 * What an environment wants when the user switches to it -- the counterpart of
 * `text3DMaterialDefaults`, and applied by the studio for the same reason.
 *
 * The split between the two is the whole point: a material says what the letter
 * is made of, and an environment says what is standing around it. So the light
 * cards' count, position, width and intensity are authored here, and their
 * colors are not. `applyText3DEnvironmentDefaults` cycles the scene's existing
 * card colors over the new layout, which is what lets a user relight a scene
 * without repainting it -- and lets a palette repaint it without relighting it.
 */
export const text3DEnvironmentDefaults: Readonly<
  Record<Text3DEnvironment, Text3DEnvironmentDefaults>
> = Object.freeze({
  studio: {
    lightIntensity: 1.7,
    ambientIntensity: 0.4,
    lightAngle: 28,
    environmentRotation: 0,
    environmentContrast: 1.1,
    reflections: [
      { position: 0.18, width: 0.05, intensity: 3.2 },
      { position: 0.42, width: 0.07, intensity: 2.4 },
      { position: 0.68, width: 0.04, intensity: 2 },
      { position: 0.96, width: 0.24, intensity: 2.6 },
    ],
  },
  rim: {
    lightIntensity: 1.35,
    ambientIntensity: 0.55,
    lightAngle: -42,
    environmentRotation: -18,
    environmentContrast: 0.65,
    reflections: [
      { position: 0.12, width: 0.025, intensity: 3.4 },
      { position: 0.62, width: 0.035, intensity: 2.6 },
      { position: 0.92, width: 0.16, intensity: 2 },
      { position: 0.98, width: 0.3, intensity: 1.6 },
    ],
  },
  soft: {
    lightIntensity: 1.5,
    ambientIntensity: 0.7,
    lightAngle: 18,
    environmentRotation: 12,
    environmentContrast: 0.2,
    // One wide, low card: a softbox close enough that the surface records a
    // wash rather than a streak, which is what makes this the matte setup.
    reflections: [
      { position: 0.34, width: 0.4, intensity: 1.4 },
    ],
  },
  dramatic: {
    lightIntensity: 2.2,
    ambientIntensity: 0.28,
    lightAngle: 54,
    environmentRotation: 8,
    environmentContrast: 1.2,
    // A broad, low-intensity middle card breaks up the two hard streaks. Its
    // color still comes from the palette, like every other card.
    reflections: [
      { position: 0.1, width: 0.04, intensity: 3.8 },
      { position: 0.5, width: 0.18, intensity: 0.1 },
      { position: 0.8, width: 0.06, intensity: 3 },
    ],
  },
  neon: {
    lightIntensity: 1.8,
    ambientIntensity: 0.5,
    lightAngle: -24,
    environmentRotation: -12,
    environmentContrast: 1.1,
    reflections: [
      { position: 0.14, width: 0.04, intensity: 4 },
      { position: 0.45, width: 0.05, intensity: 3.6 },
      { position: 0.72, width: 0.035, intensity: 3.2 },
      { position: 0.96, width: 0.22, intensity: 1.8 },
    ],
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const candidate = typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
  return Math.min(maximum, Math.max(minimum, candidate));
}

function clampInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  return Math.round(clamp(value, fallback, minimum, maximum));
}

function clampRange(
  key: keyof typeof text3DRanges,
  value: unknown,
  fallback: number,
): number {
  const range = text3DRanges[key];
  return clamp(value, fallback, range.min, range.max);
}

function clampIntegerRange(
  key: keyof typeof text3DRanges,
  value: unknown,
  fallback: number,
): number {
  const range = text3DRanges[key];
  return clampInteger(value, fallback, range.min, range.max);
}

function normalizedBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizedColor(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_COLOR.test(value.trim())
    ? value.trim().toUpperCase()
    : fallback;
}

/**
 * Always three colors. A config carrying fewer repeats its last role rather
 * than failing, so a two-color import still renders; extra entries are dropped.
 */
function normalizedColors(
  value: unknown,
  fallback: Text3DColors,
): Text3DColors {
  const source: readonly unknown[] =
    Array.isArray(value) && value.length > 0 ? value : fallback;
  const at = (index: 0 | 1 | 2): string =>
    normalizedColor(source[Math.min(index, source.length - 1)], fallback[index]);
  return [at(0), at(1), at(2)];
}

function normalizedReflections(value: unknown): readonly Text3DReflection[] {
  if (!Array.isArray(value)) return TEXT_3D_DEFAULTS.reflections;
  return value
    .slice(0, TEXT_3D_MAXIMUM_REFLECTIONS)
    .map((candidate): Text3DReflection => {
      const reflection = isRecord(candidate) ? candidate : {};
      return {
        color: normalizedColor(
          reflection.color,
          TEXT_3D_REFLECTION_DEFAULT.color,
        ),
        position: clamp(
          reflection.position,
          TEXT_3D_REFLECTION_DEFAULT.position,
          text3DReflectionRanges.position.min,
          text3DReflectionRanges.position.max,
        ),
        width: clamp(
          reflection.width,
          TEXT_3D_REFLECTION_DEFAULT.width,
          text3DReflectionRanges.width.min,
          text3DReflectionRanges.width.max,
        ),
        intensity: clamp(
          reflection.intensity,
          TEXT_3D_REFLECTION_DEFAULT.intensity,
          text3DReflectionRanges.intensity.min,
          text3DReflectionRanges.intensity.max,
        ),
      };
    });
}

function normalizedText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const lines = value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .slice(0, TEXT_3D_MAXIMUM_LINES)
    .map((line) => line.slice(0, TEXT_3D_MAXIMUM_CHARACTERS));
  const text = lines.join("\n");
  return text.trim().length > 0 ? text : fallback;
}

export function isText3DPresetName(value: unknown): value is Text3DPresetName {
  return typeof value === "string" && value in presetData;
}

export function isText3DQuality(value: unknown): value is Text3DQuality {
  return typeof value === "string"
    && (TEXT_3D_QUALITY_VALUES as readonly string[]).includes(value);
}

export function isText3DColorMode(value: unknown): value is Text3DColorMode {
  return typeof value === "string"
    && (TEXT_3D_COLOR_MODES as readonly string[]).includes(value);
}

export function isText3DFontMode(value: unknown): value is Text3DFontMode {
  return typeof value === "string"
    && (TEXT_3D_FONT_MODES as readonly string[]).includes(value);
}

export function isText3DMaterial(value: unknown): value is Text3DMaterial {
  return typeof value === "string"
    && (TEXT_3D_MATERIALS as readonly string[]).includes(value);
}

export function isText3DEnvironment(value: unknown): value is Text3DEnvironment {
  return typeof value === "string"
    && (TEXT_3D_ENVIRONMENTS as readonly string[]).includes(value);
}

export function isText3DAlignment(value: unknown): value is Text3DAlignment {
  return typeof value === "string"
    && (TEXT_3D_ALIGNMENTS as readonly string[]).includes(value);
}

export function isText3DPoseMode(value: unknown): value is Text3DPoseMode {
  return typeof value === "string"
    && (TEXT_3D_POSE_MODES as readonly string[]).includes(value);
}

function normalizedText3DPoseMode(value: unknown): Text3DPoseMode | undefined {
  // `pose` was briefly written by schema-one builds before the mode was named
  // `static`. Keep those saved scenes readable without retaining it publicly.
  if (value === "pose") return "static";
  return isText3DPoseMode(value) ? value : undefined;
}

export function isText3DBackdrop(value: unknown): value is Text3DBackdrop {
  return typeof value === "string"
    && (TEXT_3D_BACKDROPS as readonly string[]).includes(value);
}

export function isText3DWheelZoom(value: unknown): value is Text3DWheelZoom {
  return typeof value === "string"
    && (TEXT_3D_WHEEL_ZOOM_MODES as readonly string[]).includes(value);
}

export function isText3DFont(value: unknown): value is Text3DFont {
  return typeof value === "string"
    && (TEXT_3D_FONTS as readonly string[]).includes(value);
}

/**
 * Every Google Fonts family name is letters, digits and spaces, with the
 * occasional hyphen or period -- so that is exactly what is accepted here.
 * Anything else is not a family the loader could ask for, and rejecting it
 * rather than escaping it is what keeps the name safe to place in a query
 * string. Whitespace is collapsed and quotes are stripped so a value pasted
 * out of a CSS declaration still resolves. An unusable name normalizes to the
 * empty string, which is the schema's "use the shipped typeface" value.
 */
export function normalizeText3DFontFamily(value: unknown): string {
  if (typeof value !== "string") return "";
  const family = value
    .replace(/["']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (family.length === 0 || family.length > TEXT_3D_MAXIMUM_FONT_FAMILY_LENGTH) {
    return "";
  }
  return /^[A-Za-z0-9][A-Za-z0-9 .-]*$/.test(family) ? family : "";
}

/**
 * Whether the scene draws from a remote family rather than from a shipped
 * typeface. Pinned families only: following the theme resolves through
 * `matchText3DFont`, which cannot name a font the project does not ship.
 */
export function usesText3DCustomFontFamily(
  config: Pick<BalsaText3DConfig, "fontMode" | "fontFamily">,
): boolean {
  return config.fontMode === "custom" && config.fontFamily.length > 0;
}

/** Snaps an arbitrary CSS weight onto the nearest supported Studio weight. */
export function normalizeText3DFontWeight(
  value: unknown,
  fallback: Text3DFontWeight = TEXT_3D_DEFAULTS.fontWeight,
): Text3DFontWeight {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  let nearest: Text3DFontWeight = TEXT_3D_FONT_WEIGHTS[0];
  for (const weight of TEXT_3D_FONT_WEIGHTS) {
    if (Math.abs(weight - value) < Math.abs(nearest - value)) nearest = weight;
  }
  return nearest;
}

export function getText3DPreset(name: Text3DPresetName): BalsaText3DConfig {
  const preset = presetData[name];
  return normalizeText3DConfig({
    ...preset,
    poseMode: normalizedText3DPoseMode(preset.poseMode) ?? TEXT_3D_DEFAULTS.poseMode,
  });
}

export function normalizeText3DConfig(
  value: unknown,
  fallbackPreset: Text3DPresetName = DEFAULT_PRESET,
): BalsaText3DConfig {
  const input = isRecord(value) ? value : {};
  const preset = isText3DPresetName(input.preset) ? input.preset : fallbackPreset;
  // The preset data is plain JSON, so its `colors` widens to `string[]` and its
  // enum fields to `string`. Normalizing every field below is exactly what
  // re-narrows them, so the merged object is asserted through `unknown` rather
  // than each preset being retyped.
  const fallback = { ...TEXT_3D_DEFAULTS, ...presetData[preset] } as unknown as
    typeof TEXT_3D_DEFAULTS;
  const poseMode = normalizedText3DPoseMode(input.poseMode)
    ?? (input.poseMode === "pose"
      ? "static"
      : input.schemaVersion === TEXT_3D_SCHEMA_VERSION
        || typeof input.autoRotate === "boolean"
        ? input.autoRotate === true ? "auto-rotate" : "static"
        : TEXT_3D_DEFAULTS.poseMode);

  return {
    schemaVersion: TEXT_3D_SCHEMA_VERSION,
    preset,
    seed: clampIntegerRange("seed", input.seed, fallback.seed),

    text: normalizedText(input.text, fallback.text),
    fontMode: isText3DFontMode(input.fontMode) ? input.fontMode : fallback.fontMode,
    font: isText3DFont(input.font) ? input.font : fallback.font,
    // A typed name that is not a usable family clears the field rather than
    // silently reinstating the preset's, so the studio's Input shows the user
    // that what they entered was rejected.
    fontFamily: normalizeText3DFontFamily(
      typeof input.fontFamily === "string" ? input.fontFamily : fallback.fontFamily,
    ),
    fontWeight: normalizeText3DFontWeight(input.fontWeight, fallback.fontWeight),
    size: clampRange("size", input.size, fallback.size),
    letterSpacing: clampRange("letterSpacing", input.letterSpacing, fallback.letterSpacing),
    lineHeight: clampRange("lineHeight", input.lineHeight, fallback.lineHeight),
    alignment: isText3DAlignment(input.alignment)
      ? input.alignment
      : fallback.alignment,

    material: isText3DMaterial(input.material) ? input.material : fallback.material,
    colorMode: isText3DColorMode(input.colorMode)
      ? input.colorMode
      : fallback.colorMode,
    colors: normalizedColors(input.colors, fallback.colors),
    metalness: clampRange("metalness", input.metalness, fallback.metalness),
    roughness: clampRange("roughness", input.roughness, fallback.roughness),
    clearcoat: clampRange("clearcoat", input.clearcoat, fallback.clearcoat),
    clearcoatRoughness: clampRange(
      "clearcoatRoughness",
      input.clearcoatRoughness,
      fallback.clearcoatRoughness,
    ),
    transmission: clampRange("transmission", input.transmission, fallback.transmission),
    ior: clampRange("ior", input.ior, fallback.ior),
    thickness: clampRange("thickness", input.thickness, fallback.thickness),
    glow: clampRange("glow", input.glow, fallback.glow),

    depth: clampRange("depth", input.depth, fallback.depth),
    bevelEnabled: normalizedBoolean(input.bevelEnabled, fallback.bevelEnabled),
    bevelSize: clampRange("bevelSize", input.bevelSize, fallback.bevelSize),
    bevelThickness: clampRange(
      "bevelThickness",
      input.bevelThickness,
      fallback.bevelThickness,
    ),
    bevelSegments: clampIntegerRange(
      "bevelSegments",
      input.bevelSegments,
      fallback.bevelSegments,
    ),
    curveSegments: clampIntegerRange(
      "curveSegments",
      input.curveSegments,
      fallback.curveSegments,
    ),

    environment: isText3DEnvironment(input.environment)
      ? input.environment
      : fallback.environment,
    lightIntensity: clampRange(
      "lightIntensity",
      input.lightIntensity,
      fallback.lightIntensity,
    ),
    ambientIntensity: clampRange(
      "ambientIntensity",
      input.ambientIntensity,
      fallback.ambientIntensity,
    ),
    lightAngle: clampRange("lightAngle", input.lightAngle, fallback.lightAngle),
    reflectionStrength: clampRange(
      "reflectionStrength",
      input.reflectionStrength,
      fallback.reflectionStrength,
    ),
    reflections: normalizedReflections(input.reflections),
    environmentRotation: clampRange(
      "environmentRotation",
      input.environmentRotation,
      TEXT_3D_DEFAULTS.environmentRotation,
    ),
    environmentContrast: clampRange(
      "environmentContrast",
      input.environmentContrast,
      TEXT_3D_DEFAULTS.environmentContrast,
    ),
    shadow: normalizedBoolean(input.shadow, fallback.shadow),

    rotationX: clampRange("rotationX", input.rotationX, fallback.rotationX),
    rotationY: clampRange("rotationY", input.rotationY, fallback.rotationY),
    rotationZ: clampRange("rotationZ", input.rotationZ, fallback.rotationZ),
    // Additive: a payload saved before `zoom` existed must keep today's
    // framing, not inherit a later preset's authored close-up.
    zoom: clampRange("zoom", input.zoom, TEXT_3D_DEFAULTS.zoom),
    interactive: normalizedBoolean(input.interactive, fallback.interactive),
    poseMode,
    // Schema one is additive. Keep the old boolean synchronized so code that
    // still reads it sees the same scene while all behavior keys off poseMode.
    autoRotate: poseMode === "auto-rotate",
    autoRotateSpeed: clampRange(
      "autoRotateSpeed",
      input.autoRotateSpeed,
      fallback.autoRotateSpeed,
    ),
    damping: clampRange("damping", input.damping, fallback.damping),

    // `background` predates the styled backdrop union. A schema-one scene that
    // omitted it must keep the original transparent behavior even though new
    // presets now opt into a painted background.
    background: normalizedBoolean(input.background, TEXT_3D_DEFAULTS.background),
    backgroundColor: normalizedColor(
      input.backgroundColor,
      fallback.backgroundColor,
    ),
    backdrop: isText3DBackdrop(input.backdrop)
      ? input.backdrop
      : TEXT_3D_DEFAULTS.backdrop,
    // Additive on schema one: a payload that omitted this field, or named a
    // gradient preset that does not exist, keeps the derived blobs room.
    gradientPreset: isGradientBackgroundPresetName(input.gradientPreset)
      ? input.gradientPreset
      : TEXT_3D_DEFAULTS.gradientPreset,
    quality: isText3DQuality(input.quality) ? input.quality : fallback.quality,
  };
}

export function applyText3DMaterialDefaults(
  config: BalsaText3DConfig,
  material: Text3DMaterial,
): BalsaText3DConfig {
  return normalizeText3DConfig(
    { ...config, ...text3DMaterialDefaults[material], material },
    config.preset,
  );
}

/**
 * The light cards an environment stands up, as authored -- the layout a studio
 * needs when it adds a card the environment has a place for but the scene has
 * not filled yet.
 */
export function text3DEnvironmentReflections(
  environment: Text3DEnvironment,
  colors: readonly string[] = [TEXT_3D_REFLECTION_DEFAULT.color],
): readonly Text3DReflection[] {
  const palette = colors.length > 0
    ? colors
    : [TEXT_3D_REFLECTION_DEFAULT.color];
  return text3DEnvironmentDefaults[environment].reflections.map((card, index) => ({
    ...card,
    color: normalizedColor(
      palette[index % palette.length],
      TEXT_3D_REFLECTION_DEFAULT.color,
    ),
  }));
}

/**
 * Relights a scene without repainting it. The new environment brings the whole
 * recipe -- key strength, ambient fill, angle, surround rotation and contrast,
 * and how many cards stand where -- then cycles the scene's authored card
 * colors over those positions.
 */
export function applyText3DEnvironmentDefaults(
  config: BalsaText3DConfig,
  environment: Text3DEnvironment,
): BalsaText3DConfig {
  // Card colors are palette state, so a larger environment cycles the colors
  // the scene already owns. A scene with no cards uses its material palette as
  // the only available authored color source; the environment never injects a
  // color of its own.
  const cardColors = config.reflections.length > 0
    ? config.reflections.map(({ color }) => color)
    : config.colors;
  const layout = text3DEnvironmentReflections(environment, cardColors);
  return normalizeText3DConfig(
    {
      ...config,
      ...text3DEnvironmentDefaults[environment],
      reflections: layout,
      environment,
    },
    config.preset,
  );
}

export function resolveText3DConfig(
  options: {
    preset?: Text3DPresetName;
    config?: Text3DConfigInput;
    overrides?: Text3DDirectOverrides;
  } = {},
): BalsaText3DConfig {
  const selectedPreset = options.preset
    ?? (isText3DPresetName(options.config?.preset)
      ? options.config.preset
      : DEFAULT_PRESET);
  const selectedPresetConfig = presetData[selectedPreset];
  const presetPoseMode = normalizedText3DPoseMode(selectedPresetConfig.poseMode)
    ?? TEXT_3D_DEFAULTS.poseMode;
  // A schema-one object may have been saved before the additive reflection
  // fields existed. Preserve that scene's old lighting instead of silently
  // adopting the selected preset's newly authored cards.
  const legacyReflectionDefaults = options.config?.schemaVersion === TEXT_3D_SCHEMA_VERSION
    ? {
        reflections: options.config.reflections ?? TEXT_3D_DEFAULTS.reflections,
        environmentRotation: options.config.environmentRotation
          ?? TEXT_3D_DEFAULTS.environmentRotation,
        environmentContrast: options.config.environmentContrast
          ?? TEXT_3D_DEFAULTS.environmentContrast,
        background: options.config.background ?? TEXT_3D_DEFAULTS.background,
        backdrop: options.config.backdrop ?? TEXT_3D_DEFAULTS.backdrop,
        gradientPreset: options.config.gradientPreset
          ?? TEXT_3D_DEFAULTS.gradientPreset,
      }
    : {};
  const configPoseMode = normalizedText3DPoseMode(options.config?.poseMode)
    ?? (options.config?.schemaVersion === TEXT_3D_SCHEMA_VERSION
      ? options.config.autoRotate === true ? "auto-rotate" : "static"
      : typeof options.config?.autoRotate === "boolean"
        ? options.config.autoRotate ? "auto-rotate" : "static"
        : undefined);
  const overridePoseMode = normalizedText3DPoseMode(options.overrides?.poseMode)
    ?? (typeof options.overrides?.autoRotate === "boolean"
      ? options.overrides.autoRotate ? "auto-rotate" : "static"
      : undefined);
  return normalizeText3DConfig(
    {
      ...selectedPresetConfig,
      poseMode: presetPoseMode,
      ...options.config,
      ...legacyReflectionDefaults,
      ...(configPoseMode ? { poseMode: configPoseMode } : {}),
      ...options.overrides,
      ...(overridePoseMode ? { poseMode: overridePoseMode } : {}),
      preset: selectedPreset,
      schemaVersion: TEXT_3D_SCHEMA_VERSION,
    },
    selectedPreset,
  );
}

export function parseText3DConfig(value: string | unknown): BalsaText3DConfig {
  const parsed: unknown = typeof value === "string" ? JSON.parse(value) : value;
  if (!isRecord(parsed)) throw new Error("3D text configuration must be an object.");
  if (parsed.schemaVersion !== TEXT_3D_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported Balsa 3D text schema version: ${String(parsed.schemaVersion)}.`,
    );
  }
  if (!isText3DPresetName(parsed.preset)) {
    throw new Error(`Unknown Balsa 3D text preset: ${String(parsed.preset)}.`);
  }
  if (!Array.isArray(parsed.colors) || parsed.colors.length !== TEXT_3D_COLOR_COUNT) {
    throw new Error(
      `A Balsa 3D text configuration requires exactly ${TEXT_3D_COLOR_COUNT} colors.`,
    );
  }
  if (
    parsed.colors.some((color) => typeof color !== "string" || !HEX_COLOR.test(color))
  ) {
    throw new Error("3D text colors must use six-digit hexadecimal values.");
  }
  if (
    parsed.reflections !== undefined
    && (!Array.isArray(parsed.reflections)
      || parsed.reflections.some((reflection) => !isRecord(reflection)))
  ) {
    throw new Error("3D text reflections must be an array of reflection cards.");
  }
  return normalizeText3DConfig(parsed, parsed.preset);
}

export function serializeText3DConfig(value: unknown): string {
  return `${JSON.stringify(normalizeText3DConfig(value), null, 2)}\n`;
}

export function randomText3DSeed(random: () => number = Math.random): number {
  return Math.floor(Math.min(0.999999999, Math.max(0, random())) * 2147483648);
}

/**
 * Body, highlight and rim, in that order.
 *
 * `primary` carries the product's identity, so it is the mass of the letter.
 * The reflection roles are the point of the palette binding the user asked
 * for -- a chrome surface lit by `accent` and `secondary` is recognizably the
 * product's chrome rather than a stock studio's. `background` is deliberately
 * absent: a rim that matches the page behind the text erases the silhouette.
 */
const paletteRoles = [
  "--balsa-color-primary",
  "--balsa-color-accent",
  "--balsa-color-secondary",
] as const;

const paletteBackgroundRole = "--balsa-color-background";
const paletteSurfaceRole = "--balsa-color-surface";

function readPaletteRole(element: Element, role: string): string | undefined {
  return getComputedStyle(element).getPropertyValue(role).trim() || undefined;
}

/** Whether this element sits inside a Balsa palette, so colors can be inherited. */
export function hasText3DPalette(element: Element): boolean {
  return paletteRoles.every((role) => Boolean(readPaletteRole(element, role)));
}

export function resolveText3DPaletteColors(
  element: Element,
  fallback: Text3DColors,
): Text3DColors {
  const [body, highlight, rim] = paletteRoles.map((role) =>
    readPaletteRole(element, role),
  );
  return body && highlight && rim ? [body, highlight, rim] : [...fallback];
}

/**
 * The ground the reflection environment is built over. A metallic surface with
 * nothing to reflect reads as flat paint, and the palette's own background and
 * surface are what the text would actually be sitting in front of.
 */
export function resolveText3DPaletteEnvironment(
  element: Element,
): { background?: string; surface?: string } {
  return {
    background: readPaletteRole(element, paletteBackgroundRole),
    surface: readPaletteRole(element, paletteSurfaceRole),
  };
}

/**
 * The family name the active theme sets for display type. `fontMode: "theme"`
 * resolves through this, which is what ties a scene to the theme without the
 * consumer restating the font.
 */
export function resolveText3DThemeFontFamily(
  element: Element,
): string | undefined {
  const declared = getComputedStyle(element)
    .getPropertyValue("--balsa-font-title")
    .trim();
  if (!declared) return undefined;
  const first = declared.split(",")[0]?.trim().replace(/^["']|["']$/g, "");
  return first || undefined;
}

/** Maps a CSS family name onto a generated typeface, for `fontMode: "theme"`. */
export function matchText3DFont(
  family: string | undefined,
  fallback: Text3DFont = TEXT_3D_DEFAULTS.font,
): Text3DFont {
  if (!family) return fallback;
  const slug = family.trim().toLowerCase().replace(/\s+/g, "-");
  return isText3DFont(slug) ? slug : fallback;
}

/**
 * The flat rendering shown before the typeface loads, when WebGL is
 * unavailable, and under `prefers-reduced-motion` with no pose to animate.
 * Text stays selectable and legible; only the dimensionality is lost.
 */
export function buildText3DFallbackStyle(
  colors: readonly string[],
): Record<string, string> {
  const [body, highlight, rim] = normalizedColors(colors, TEXT_3D_DEFAULTS.colors);
  return {
    backgroundImage: `linear-gradient(160deg, ${highlight} 0%, ${body} 45%, ${rim} 100%)`,
    backgroundClip: "text",
    color: "transparent",
  };
}

export const text3DPresets = Object.freeze(
  Object.fromEntries(
    text3DPresetNames.map((name) => [name, getText3DPreset(name)]),
  ) as Record<Text3DPresetName, BalsaText3DConfig>,
);
