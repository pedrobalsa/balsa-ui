<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import {
  TEXT_3D_DEFAULTS,
  buildText3DFallbackStyle,
  hasText3DPalette,
  matchText3DFont,
  resolveText3DConfig,
  resolveText3DPaletteColors,
  resolveText3DPaletteEnvironment,
  resolveText3DThemeFontFamily,
  text3DGradientColors,
  usesText3DCustomFontFamily,
  type BalsaText3DConfig,
  type Text3DAlignment,
  type Text3DCaptureOptions,
  type Text3DColorMode,
  type Text3DColors,
  type Text3DConfigInput,
  type Text3DDirectOverrides,
  type Text3DEnvironment,
  type Text3DFont,
  type Text3DFontMode,
  type Text3DFontWeight,
  type Text3DMaterial,
  type Text3DPose,
  type Text3DPoseMode,
  type Text3DPresetName,
  type Text3DQuality,
  type Text3DWheelZoom,
} from "./text-3d";
import { loadText3DFont, loadText3DRemoteFont } from "./text-3d-fonts";
import {
  Text3DRenderer,
  text3DGeometrySignature,
  type Text3DEnvironmentColors,
} from "./text-3d-renderer";
import GradientBackground from "./GradientBackground.vue";
import {
  gradientBackgroundPatternDefaults,
  type GradientBackgroundExposed,
} from "./gradient-background";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";

const props = withDefaults(
  defineProps<{
    preset?: Text3DPresetName;
    config?: Text3DConfigInput;
    overrides?: Text3DDirectOverrides;
    seed?: number;
    text?: string;
    fontMode?: Text3DFontMode;
    font?: Text3DFont;
    fontFamily?: string;
    fontWeight?: Text3DFontWeight;
    size?: number;
    letterSpacing?: number;
    lineHeight?: number;
    alignment?: Text3DAlignment;
    material?: Text3DMaterial;
    colorMode?: Text3DColorMode;
    colors?: readonly string[];
    metalness?: number;
    roughness?: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
    transmission?: number;
    ior?: number;
    thickness?: number;
    glow?: number;
    depth?: number;
    bevelEnabled?: boolean;
    bevelSize?: number;
    bevelThickness?: number;
    bevelSegments?: number;
    curveSegments?: number;
    environment?: Text3DEnvironment;
    lightIntensity?: number;
    ambientIntensity?: number;
    lightAngle?: number;
    reflectionStrength?: number;
    shadow?: boolean;
    rotationX?: number;
    rotationY?: number;
    rotationZ?: number;
    zoom?: number;
    interactive?: boolean;
    poseMode?: Text3DPoseMode;
    /** @deprecated Use `poseMode="auto-rotate"`. */
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    damping?: number;
    background?: boolean;
    backgroundColor?: string;
    quality?: Text3DQuality;
    paused?: boolean;
    /**
     * `modifier` (default) zooms only with Ctrl/Cmd + wheel so a hero in a
     * scrolling page never traps the reader. `always` zooms on a plain wheel;
     * 3D Text Studio opts into that because its preview fills the viewport.
     */
    wheelZoom?: Text3DWheelZoom;
  }>(),
  {
    preset: undefined,
    config: undefined,
    overrides: undefined,
    seed: undefined,
    text: undefined,
    fontMode: undefined,
    font: undefined,
    fontFamily: undefined,
    fontWeight: undefined,
    size: undefined,
    letterSpacing: undefined,
    lineHeight: undefined,
    alignment: undefined,
    material: undefined,
    colorMode: undefined,
    colors: undefined,
    metalness: undefined,
    roughness: undefined,
    clearcoat: undefined,
    clearcoatRoughness: undefined,
    transmission: undefined,
    ior: undefined,
    thickness: undefined,
    glow: undefined,
    depth: undefined,
    bevelEnabled: undefined,
    bevelSize: undefined,
    bevelThickness: undefined,
    bevelSegments: undefined,
    curveSegments: undefined,
    environment: undefined,
    lightIntensity: undefined,
    ambientIntensity: undefined,
    lightAngle: undefined,
    reflectionStrength: undefined,
    shadow: undefined,
    rotationX: undefined,
    rotationY: undefined,
    rotationZ: undefined,
    zoom: undefined,
    interactive: undefined,
    poseMode: undefined,
    autoRotate: undefined,
    autoRotateSpeed: undefined,
    damping: undefined,
    background: undefined,
    backgroundColor: undefined,
    quality: undefined,
    paused: false,
    wheelZoom: "modifier",
  },
);

const emit = defineEmits<{
  "update:pose": [pose: Text3DPose];
}>();

const root = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const gradient = ref<GradientBackgroundExposed | null>(null);
const ready = ref(false);
const rendererAvailable = ref(false);
const contextLost = ref(false);
const documentVisible = ref(true);
const inViewport = ref(true);
const reducedMotion = ref(false);
const paletteAvailable = ref(false);
const paletteColors = ref<Text3DColors>([...TEXT_3D_DEFAULTS.colors]);
const paletteEnvironment = ref<Text3DEnvironmentColors>({});
const themeFontFamily = ref<string>();
const loadedFont = ref<Font>();

let renderer: Text3DRenderer | undefined;
let resizeObserver: ResizeObserver | undefined;
let intersectionObserver: IntersectionObserver | undefined;
let contextObserver: MutationObserver | undefined;
let motionQuery: MediaQueryList | undefined;
let contextFrame = 0;
let fontRequest = 0;
/**
 * Geometry rebuilds are a per-glyph Poisson/Jacobi solve, up to 640 iterations
 * at high quality. Slider drags arrive a few milliseconds apart, so 300ms
 * coalesces a continuous stream without making the last tick feel abandoned.
 * Typing has natural 150–300ms gaps between keystrokes, so that same interval
 * fires mid-word and rebuilds every glyph repeatedly. Text therefore waits
 * 700ms -- long enough to land after a pause, not between characters. One
 * timer, two intervals: the delay is chosen when scheduling by whether the
 * pending `text` differs from the last applied one. A second timer would add
 * a second flush path and put the flush-before-capture guarantee at risk.
 */
const TEXT_3D_GEOMETRY_REBUILD_DELAY_MS = 300;
const TEXT_3D_TEXT_REBUILD_DELAY_MS = 700;
// Declared and assigned through the same bare setTimeout, so the two agree
// whichever one is in scope. Assigning from window.setTimeout does not:
// `window` is `Window & typeof globalThis`, so in a project with @types/node
// the call resolves to Node's and returns a Timeout the DOM annotation rejects.
let geometryRebuildTimer: ReturnType<typeof setTimeout> | undefined;
let appliedGeometrySignature = "";
let appliedText = "";

const directOverrides = computed<Text3DDirectOverrides>(() => {
  const overrides: Text3DDirectOverrides = { ...props.overrides };
  const keys = [
    "seed", "text", "fontMode", "font", "fontFamily", "fontWeight", "size", "letterSpacing",
    "lineHeight", "alignment", "material", "colorMode", "colors", "metalness",
    "roughness", "clearcoat", "clearcoatRoughness", "transmission", "ior",
    "thickness", "glow", "depth", "bevelEnabled", "bevelSize", "bevelThickness",
    "bevelSegments", "curveSegments", "environment", "lightIntensity",
    "ambientIntensity", "lightAngle", "reflectionStrength", "shadow", "rotationX",
    "rotationY", "rotationZ", "zoom", "interactive", "poseMode", "autoRotate", "autoRotateSpeed",
    "damping", "background", "backgroundColor", "quality",
  ] as const satisfies readonly (keyof Text3DDirectOverrides)[];
  for (const key of keys) {
    const value = props[key];
    if (value !== undefined) Object.assign(overrides, { [key]: value });
  }
  return overrides;
});

const configuration = computed<BalsaText3DConfig>(() =>
  resolveText3DConfig({
    preset: props.preset,
    config: props.config,
    overrides: directOverrides.value,
  }),
);
const activeColors = computed(() =>
  configuration.value.colorMode === "palette" && paletteAvailable.value
    ? paletteColors.value
    : configuration.value.colors,
);
const activeFont = computed<Text3DFont>(() =>
  configuration.value.fontMode === "theme"
    ? matchText3DFont(themeFontFamily.value, configuration.value.font)
    : configuration.value.font,
);
/**
 * The remote family this scene draws, or `""` for a shipped typeface. Only a
 * pinned family qualifies: `fontMode: "theme"` resolves through the generated
 * set, which cannot name a face the project has not installed.
 */
const activeFontFamily = computed(() =>
  usesText3DCustomFontFamily(configuration.value) ? configuration.value.fontFamily : "",
);
const activeConfiguration = computed<BalsaText3DConfig>(() => ({
  ...configuration.value,
  colors: [...activeColors.value],
  font: activeFont.value,
}));
/**
 * A real gradient field, not a painted approximation: the WebGL text sits over
 * an actual `GradientBackground`, which is the only way the backdrop a glass
 * surface refracts is the same field a consumer gets outside the studio.
 */
const gradientBackdrop = computed(() =>
  configuration.value.background && configuration.value.backdrop === "gradient",
);
/**
 * The field is the room made visible: the light cards first, then as many
 * material colours as the stop budget still has room for. Truncating the
 * other way dropped the pink card from liquid-chrome's surround.
 */
const gradientColors = computed(() =>
  text3DGradientColors(activeColors.value, configuration.value.reflections),
);
/**
 * Softboxes, not wallpaper. Specular metal is a mirror of large diffused
 * area lights — the same key/fill/rim/accent set `TEXT_3D_MAXIMUM_REFLECTIONS`
 * already encodes as four cards — so the field uses `blobs` rather than the
 * ribbon default. Starting from `gradientBackgroundPatternDefaults.blobs`,
 * complexity drops so each pool is a fixture rather than a scatter, scale
 * drops so they fill the frame like a cyc wall, and warp/wave drop so the
 * pools stay round and out of focus instead of streaking into a pattern.
 */
const gradientBlobs = {
  pattern: "blobs" as const,
  ...gradientBackgroundPatternDefaults.blobs,
  patternComplexity: 4,
  scale: 0.7,
  softness: 0.95,
  warp: 0.5,
  wave: 0.9,
};
/**
 * A named gradient preset replaces the derived blobs room. Empty/absent keeps
 * today's immersive light-source field built from this scene's own colours.
 */
const namedGradientPreset = computed(() =>
  configuration.value.gradientPreset || undefined,
);
const gradientBackdropBind = computed(() =>
  namedGradientPreset.value
    ? { preset: namedGradientPreset.value }
    : {
        colorMode: "custom" as const,
        colors: gradientColors.value,
        pattern: gradientBlobs.pattern,
        patternComplexity: gradientBlobs.patternComplexity,
        scale: gradientBlobs.scale,
        softness: gradientBlobs.softness,
        warp: gradientBlobs.warp,
        wave: gradientBlobs.wave,
        seed: configuration.value.seed,
      },
);
/**
 * What the renderer is actually given. Under a gradient backdrop the canvas has
 * to clear to transparent so the field below shows through, and `background`
 * is exactly the flag the renderer reads to decide that -- so it is turned off
 * here rather than in the configuration the rest of the component reports.
 */
const rendererConfiguration = computed<BalsaText3DConfig>(() =>
  gradientBackdrop.value
    ? { ...activeConfiguration.value, background: false }
    : activeConfiguration.value,
);
const fallbackStyle = computed(() => ({
  ...buildText3DFallbackStyle(activeColors.value),
  // A pinned remote family is named here too, so the flat text a reader sees
  // before -- or instead of -- the geometry is set in the family they asked
  // for whenever the browser has it. It is a companion to the real outlines,
  // never a substitute for them.
  fontFamily: activeFontFamily.value
    ? `${JSON.stringify(activeFontFamily.value)}, sans-serif`
    : configuration.value.fontMode === "theme"
      ? themeFontFamily.value
      : undefined,
}));
const lines = computed(() => configuration.value.text.split("\n"));
const canvasClasses = computed(() => [
  "absolute inset-0 block size-full transition-opacity",
  ready.value && !contextLost.value ? "opacity-100" : "opacity-0",
]);
const fallbackClasses = computed(() => [
  "text-3d-fallback absolute inset-0 grid place-items-center transition-opacity",
  ready.value && !contextLost.value ? "pointer-events-none opacity-0" : "opacity-100",
]);
const shouldAnimate = computed(() =>
  Boolean(
    rendererAvailable.value
    && ready.value
    && !contextLost.value
    && !props.paused
    && documentVisible.value
    && inViewport.value
    && configuration.value.poseMode !== "static",
  ),
);

function updateContext(): void {
  const element = root.value;
  if (!element) return;
  paletteAvailable.value = hasText3DPalette(element);
  paletteColors.value = resolveText3DPaletteColors(element, configuration.value.colors);
  paletteEnvironment.value = resolveText3DPaletteEnvironment(element);
  themeFontFamily.value = resolveText3DThemeFontFamily(element);
}

function queueContextUpdate(): void {
  if (contextFrame) return;
  contextFrame = requestAnimationFrame(() => {
    contextFrame = 0;
    updateContext();
  });
}

function resizeRenderer(width?: number, height?: number): void {
  if (!renderer || !root.value) return;
  const bounds = root.value.getBoundingClientRect();
  renderer.resize(width ?? bounds.width, height ?? bounds.height);
  renderer.render();
}

function synchronizeAnimation(): void {
  renderer?.setAnimationActive(shouldAnimate.value, reducedMotion.value);
  if (!shouldAnimate.value) renderer?.render();
}

function cancelPendingGeometryRebuild(): void {
  if (geometryRebuildTimer === undefined) return;
  clearTimeout(geometryRebuildTimer);
  geometryRebuildTimer = undefined;
}

function applyRendererUpdate(): void {
  cancelPendingGeometryRebuild();
  if (!renderer || !loadedFont.value) return;
  renderer.update(rendererConfiguration.value, loadedFont.value, paletteEnvironment.value);
  appliedGeometrySignature = text3DGeometrySignature(rendererConfiguration.value);
  appliedText = rendererConfiguration.value.text;
  resizeRenderer();
  synchronizeAnimation();
}

function flushPendingGeometryRebuild(): void {
  if (geometryRebuildTimer === undefined) return;
  applyRendererUpdate();
}

function scheduleRendererUpdate(): void {
  if (!renderer || !loadedFont.value || contextLost.value) return;
  if (text3DGeometrySignature(rendererConfiguration.value) === appliedGeometrySignature) {
    applyRendererUpdate();
    return;
  }
  cancelPendingGeometryRebuild();
  const delayMs = rendererConfiguration.value.text !== appliedText
    ? TEXT_3D_TEXT_REBUILD_DELAY_MS
    : TEXT_3D_GEOMETRY_REBUILD_DELAY_MS;
  geometryRebuildTimer = setTimeout(() => {
    geometryRebuildTimer = undefined;
    applyRendererUpdate();
  }, delayMs);
}

function createRenderer(): void {
  if (!canvas.value || !root.value || !loadedFont.value) return;
  cancelPendingGeometryRebuild();
  try {
    renderer?.dispose();
    renderer = new Text3DRenderer(
      canvas.value,
      rendererConfiguration.value,
      loadedFont.value,
      paletteEnvironment.value,
      (pose) => emit("update:pose", pose),
      props.wheelZoom,
    );
    const bounds = root.value.getBoundingClientRect();
    renderer.resize(bounds.width, bounds.height);
    renderer.render();
    ready.value = true;
    rendererAvailable.value = true;
    contextLost.value = false;
    appliedGeometrySignature = text3DGeometrySignature(rendererConfiguration.value);
    appliedText = rendererConfiguration.value.text;
    synchronizeAnimation();
  } catch {
    renderer?.dispose();
    renderer = undefined;
    ready.value = false;
    rendererAvailable.value = false;
    appliedGeometrySignature = "";
    appliedText = "";
  }
}

/**
 * The outlines this scene needs. A pinned remote family is fetched, subset to
 * the scene's own characters, and converted to a typeface at runtime; anything
 * that goes wrong on that path -- an unknown family, a blocked request, an
 * offline browser -- falls back to the shipped typeface rather than to no
 * geometry at all, so the user keeps a legible 3D scene while they correct the
 * name.
 */
async function loadActiveFont(): Promise<Font> {
  const family = activeFontFamily.value;
  const weight = configuration.value.fontWeight;
  if (!family) return loadText3DFont(activeFont.value, weight);
  try {
    return await loadText3DRemoteFont(family, weight, configuration.value.text);
  } catch {
    return loadText3DFont(activeFont.value, weight);
  }
}

async function synchronizeFont(): Promise<void> {
  const request = ++fontRequest;
  ready.value = false;
  try {
    const font = await loadActiveFont();
    if (request !== fontRequest) return;
    loadedFont.value = font;
    if (renderer) {
      applyRendererUpdate();
      // `ready` was cleared above to hide a stale letterform while the new
      // typeface loads, and only `createRenderer` used to restore it -- so the
      // first font or preset change after mount left the canvas faded out and
      // the flat fallback showing, with a perfectly good scene rendering
      // underneath it. Re-arming here is what makes the swap survivable.
      ready.value = true;
    } else {
      createRenderer();
    }
  } catch {
    if (request !== fontRequest) return;
    cancelPendingGeometryRebuild();
    loadedFont.value = undefined;
    renderer?.dispose();
    renderer = undefined;
    rendererAvailable.value = false;
    ready.value = false;
    appliedGeometrySignature = "";
    appliedText = "";
  }
}

function renderStill(): void {
  flushPendingGeometryRebuild();
  renderer?.render();
}

function resetPose(): void {
  renderer?.resetPose();
}

function handleVisibilityChange(): void {
  documentVisible.value = document.visibilityState !== "hidden";
  synchronizeAnimation();
}

function handleMotionChange(event: MediaQueryListEvent | MediaQueryList): void {
  reducedMotion.value = event.matches;
  synchronizeAnimation();
}

function handleContextLost(event: Event): void {
  event.preventDefault();
  cancelPendingGeometryRebuild();
  contextLost.value = true;
  ready.value = false;
  synchronizeAnimation();
}

function handleContextRestored(): void {
  contextLost.value = false;
  void nextTick(createRenderer);
}

async function captureFallbackPng(options: Text3DCaptureOptions): Promise<Blob> {
  const layer = options.layer ?? "composite";
  const { width, height } = captureSize(options);
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const context = output.getContext("2d");
  if (!context) throw new Error("PNG export is unavailable in this browser.");
  if (layer !== "text") {
    if (gradientBackdrop.value) {
      await drawGradientBackdrop(context, width, height);
    } else if (options.opaque || configuration.value.background) {
      context.fillStyle = configuration.value.backgroundColor;
      context.fillRect(0, 0, width, height);
    }
  }
  if (layer !== "gradient") {
    context.fillStyle = activeColors.value[0];
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `700 ${Math.max(32, height / Math.max(2, lines.value.length + 1))}px ${themeFontFamily.value ?? "sans-serif"}`;
    const gap = height / Math.max(2, lines.value.length + 1);
    lines.value.forEach((line, index) => context.fillText(line, width / 2, gap * (index + 1)));
  }
  return new Promise((resolve, reject) => output.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("The browser could not encode the fallback PNG."));
  }, "image/png"));
}

function captureSize(options: Text3DCaptureOptions): { width: number; height: number } {
  const bound = (value: number): number =>
    Math.min(4096, Math.max(320, Math.round(value)));
  return {
    width: bound(options.width ?? root.value?.clientWidth ?? 1280),
    height: bound(options.height ?? root.value?.clientHeight ?? 720),
  };
}

interface DecodedPng {
  source: ImageBitmap | HTMLImageElement;
  close: () => void;
}

/** Decode a captured layer on browsers both with and without ImageBitmap. */
async function decodePng(blob: Blob): Promise<DecodedPng> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    return { source: bitmap, close: () => bitmap.close() };
  }
  const url = URL.createObjectURL(blob);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The captured PNG could not be decoded."));
      image.src = url;
    });
    return { source: image, close: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function drawGradientBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): Promise<void> {
  await nextTick();
  const field = gradient.value;
  if (!field) throw new Error("The gradient backdrop is not ready for capture.");
  const image = await decodePng(await field.capturePng({ width, height }));
  try {
    context.drawImage(image.source, 0, 0, width, height);
  } finally {
    image.close();
  }
}

/**
 * A gradient backdrop lives in the DOM behind a transparent canvas, so the
 * canvas alone is not the picture. Both layers are captured at the export size
 * and composited in the same order they stack on screen, which is what makes an
 * exported still match the preview rather than arrive with a hole behind the
 * type.
 */
async function captureGradientPng(
  options: Text3DCaptureOptions,
  scene: Text3DRenderer,
): Promise<Blob> {
  const layer = options.layer ?? "composite";
  const { width, height } = captureSize(options);
  const field = gradient.value;
  if (!field) throw new Error("The gradient backdrop is not ready for capture.");
  if (layer === "gradient") return field.capturePng({ width, height });
  if (layer === "text") {
    return scene.capturePng({ ...options, width, height, opaque: false });
  }
  const [fieldBlob, textBlob] = await Promise.all([
    field.capturePng({ width, height }),
    scene.capturePng({ ...options, width, height, opaque: false }),
  ]);
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const context = output.getContext("2d");
  if (!context) throw new Error("PNG export is unavailable in this browser.");
  const [fieldImage, textImage] = await Promise.all([
    decodePng(fieldBlob),
    decodePng(textBlob),
  ]);
  try {
    context.drawImage(fieldImage.source, 0, 0, width, height);
    context.drawImage(textImage.source, 0, 0, width, height);
  } finally {
    fieldImage.close();
    textImage.close();
  }
  return new Promise((resolve, reject) => output.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("The browser could not encode the 3D text PNG."));
  }, "image/png"));
}

async function capturePng(options: Text3DCaptureOptions = {}): Promise<Blob> {
  flushPendingGeometryRebuild();
  const layer = options.layer ?? "composite";
  if (!renderer) return captureFallbackPng(options);
  if (layer === "text") {
    return renderer.capturePng({ ...options, opaque: false });
  }
  if (layer === "gradient") {
    if (gradientBackdrop.value) {
      const field = gradient.value;
      if (!field) throw new Error("The gradient backdrop is not ready for capture.");
      const { width, height } = captureSize(options);
      return field.capturePng({ width, height });
    }
    return captureFallbackPng({ ...options, layer: "gradient" });
  }
  if (gradientBackdrop.value) return captureGradientPng(options, renderer);
  return renderer.capturePng(options);
}

defineExpose({ capturePng, renderStill, resetPose });

/**
 * What identifies the outlines the scene needs. The text is part of it only
 * under a remote family, whose download is subset to those characters -- a
 * shipped typeface carries the whole charset, so retyping the wordmark there
 * must not reload anything.
 */
const fontRequestKey = computed(() => [
  activeFontFamily.value,
  activeFont.value,
  configuration.value.fontWeight,
  activeFontFamily.value ? configuration.value.text : "",
].join("|"));

watch(fontRequestKey, () => void synchronizeFont());
watch([rendererConfiguration, paletteEnvironment], scheduleRendererUpdate, { deep: true });
watch(shouldAnimate, synchronizeAnimation);
watch(() => props.wheelZoom, (mode) => renderer?.setWheelZoom(mode));

onMounted(() => {
  documentVisible.value = document.visibilityState !== "hidden";
  updateContext();
  canvas.value?.addEventListener("webglcontextlost", handleContextLost);
  canvas.value?.addEventListener("webglcontextrestored", handleContextRestored);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  if (typeof window.matchMedia === "function") {
    motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.value = motionQuery.matches;
    motionQuery.addEventListener("change", handleMotionChange);
  }
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) resizeRenderer(entry.contentRect.width, entry.contentRect.height);
    });
    if (root.value) resizeObserver.observe(root.value);
  }
  if (typeof IntersectionObserver !== "undefined") {
    intersectionObserver = new IntersectionObserver((entries) => {
      inViewport.value = entries[0]?.isIntersecting ?? true;
      synchronizeAnimation();
    }, { rootMargin: "96px" });
    if (root.value) intersectionObserver.observe(root.value);
  }
  contextObserver = new MutationObserver(queueContextUpdate);
  let boundary: HTMLElement | null = root.value;
  while (boundary) {
    contextObserver.observe(boundary, {
      attributes: true,
      attributeFilter: ["data-palette", "data-balsa-theme", "class", "style"],
    });
    boundary = boundary.parentElement;
  }
  void synchronizeFont();
});

onBeforeUnmount(() => {
  fontRequest += 1;
  cancelPendingGeometryRebuild();
  if (contextFrame) cancelAnimationFrame(contextFrame);
  contextFrame = 0;
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  contextObserver?.disconnect();
  motionQuery?.removeEventListener("change", handleMotionChange);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  canvas.value?.removeEventListener("webglcontextlost", handleContextLost);
  canvas.value?.removeEventListener("webglcontextrestored", handleContextRestored);
  renderer?.dispose();
  renderer = undefined;
  loadedFont.value = undefined;
  rendererAvailable.value = false;
  appliedGeometrySignature = "";
  appliedText = "";
});
</script>

<template>
  <div
    ref="root"
    data-balsa="text-3d"
    class="relative isolate grid h-full w-full place-items-center overflow-hidden"
  >
    <span class="sr-only">{{ configuration.text }}</span>
    <!-- Behind everything, including the flat fallback: it is the room the
         scene is in, not a decoration on the canvas. -->
    <GradientBackground
      v-if="gradientBackdrop"
      ref="gradient"
      data-balsa-text-3d-gradient
      v-bind="gradientBackdropBind"
      :quality="configuration.quality"
      :paused="paused"
      class="absolute inset-0 -z-10"
    />
    <div :class="fallbackClasses" aria-hidden="true">
      <p class="text-3d-fallback-text m-0 select-text text-center font-balsa-title font-semibold leading-tight" :style="fallbackStyle">
        <span v-for="(line, index) in lines" :key="index" class="block">{{ line }}</span>
      </p>
    </div>
    <canvas ref="canvas" :class="canvasClasses" aria-hidden="true" />
  </div>
</template>

<style scoped>
.text-3d-fallback-text {
  font-size: clamp(2rem, 12vw, 9rem);
}

canvas {
  touch-action: none;
}

@media (forced-colors: active) {
  canvas {
    display: none;
  }

  .text-3d-fallback-text {
    background: none;
    color: CanvasText;
  }
}
</style>
