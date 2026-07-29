<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import type { ThemeInput } from "./theme";
import { useComponentTheme } from "./theme-context";
import {
  buildGradientBackgroundFallback,
  resolveGradientBackgroundConfig,
  resolveGradientBackgroundPaletteColors,
  type BalsaBackgroundConfig,
  type GradientBackgroundCaptureOptions,
  type GradientBackgroundColorMode,
  type GradientBackgroundConfigInput,
  type GradientBackgroundDirectOverrides,
  type GradientBackgroundPresetName,
  type GradientBackgroundQuality,
} from "./gradient-background";
import { GradientBackgroundRenderer } from "./gradient-background-renderer";

const props = withDefaults(
  defineProps<{
    preset?: GradientBackgroundPresetName;
    config?: GradientBackgroundConfigInput;
    seed?: number;
    colorMode?: GradientBackgroundColorMode;
    colors?: readonly string[];
    speed?: number;
    scale?: number;
    warp?: number;
    wave?: number;
    softness?: number;
    grain?: number;
    grainSize?: number;
    contrast?: number;
    brightness?: number;
    direction?: number;
    fieldOctaves?: number;
    fieldFrequency?: number;
    noiseAmount?: number;
    noiseOctaves?: number;
    noiseFrequency?: number;
    warpFrequency?: number;
    ribbonDensity?: number;
    quality?: GradientBackgroundQuality;
    paused?: boolean;
    theme?: ThemeInput;
  }>(),
  {
    config: undefined,
    preset: undefined,
    seed: undefined,
    colorMode: undefined,
    colors: undefined,
    speed: undefined,
    scale: undefined,
    warp: undefined,
    wave: undefined,
    softness: undefined,
    grain: undefined,
    grainSize: undefined,
    contrast: undefined,
    brightness: undefined,
    direction: undefined,
    fieldOctaves: undefined,
    fieldFrequency: undefined,
    noiseAmount: undefined,
    noiseOctaves: undefined,
    noiseFrequency: undefined,
    warpFrequency: undefined,
    ribbonDensity: undefined,
    quality: undefined,
    paused: false,
    theme: undefined,
  },
);
const theme = useComponentTheme(
  "gradient-background",
  "surfaces",
  () => props.theme,
);

const root = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);
const rendererAvailable = ref(false);
const contextLost = ref(false);
const documentVisible = ref(true);
const inViewport = ref(true);
const reducedMotion = ref(false);
const resolvedColors = ref<string[]>([]);

let renderer: GradientBackgroundRenderer | undefined;
let resizeObserver: ResizeObserver | undefined;
let intersectionObserver: IntersectionObserver | undefined;
let paletteObserver: MutationObserver | undefined;
let motionQuery: MediaQueryList | undefined;
let animationFrame = 0;
let lastFrameTimestamp = 0;
let lastRenderTimestamp = 0;
let elapsedTime = 0;
let paletteFrame = 0;

const directOverrides = computed<GradientBackgroundDirectOverrides>(() => {
  const overrides: GradientBackgroundDirectOverrides = {};
  if (props.seed !== undefined) overrides.seed = props.seed;
  if (props.colorMode !== undefined) overrides.colorMode = props.colorMode;
  if (props.colors !== undefined) overrides.colors = props.colors;
  if (props.speed !== undefined) overrides.speed = props.speed;
  if (props.scale !== undefined) overrides.scale = props.scale;
  if (props.warp !== undefined) overrides.warp = props.warp;
  if (props.wave !== undefined) overrides.wave = props.wave;
  if (props.softness !== undefined) overrides.softness = props.softness;
  if (props.grain !== undefined) overrides.grain = props.grain;
  if (props.grainSize !== undefined) overrides.grainSize = props.grainSize;
  if (props.contrast !== undefined) overrides.contrast = props.contrast;
  if (props.brightness !== undefined) overrides.brightness = props.brightness;
  if (props.direction !== undefined) overrides.direction = props.direction;
  if (props.fieldOctaves !== undefined) overrides.fieldOctaves = props.fieldOctaves;
  if (props.fieldFrequency !== undefined) overrides.fieldFrequency = props.fieldFrequency;
  if (props.noiseAmount !== undefined) overrides.noiseAmount = props.noiseAmount;
  if (props.noiseOctaves !== undefined) overrides.noiseOctaves = props.noiseOctaves;
  if (props.noiseFrequency !== undefined) overrides.noiseFrequency = props.noiseFrequency;
  if (props.warpFrequency !== undefined) overrides.warpFrequency = props.warpFrequency;
  if (props.ribbonDensity !== undefined) overrides.ribbonDensity = props.ribbonDensity;
  if (props.quality !== undefined) overrides.quality = props.quality;
  return overrides;
});

const configuration = computed<BalsaBackgroundConfig>(() =>
  resolveGradientBackgroundConfig({
    preset: props.preset,
    config: props.config,
    overrides: directOverrides.value,
  }),
);

const activeColors = computed(() =>
  configuration.value.colorMode === "palette"
    ? resolvedColors.value.length >= 2
      ? resolvedColors.value
      : configuration.value.colors
    : configuration.value.colors,
);
const fallbackStyle = computed(() => ({
  backgroundImage: buildGradientBackgroundFallback(
    activeColors.value,
    configuration.value.direction,
  ),
}));
const canvasClasses = computed(() => [
  "absolute inset-0 block size-full transition-opacity",
  ready.value && !contextLost.value ? "opacity-100" : "opacity-0",
]);
const fallbackClasses = computed(() => [
  "absolute inset-0 transition-opacity",
  ready.value && !contextLost.value ? "opacity-0" : "opacity-100",
]);
const shouldAnimate = computed(() =>
  Boolean(
    rendererAvailable.value
    && ready.value
    && !contextLost.value
    && !props.paused
    && !reducedMotion.value
    && documentVisible.value
    && inViewport.value,
  ),
);

function updatePaletteColors(): void {
  if (!root.value) return;
  resolvedColors.value = resolveGradientBackgroundPaletteColors(
    root.value,
    configuration.value.colors,
  );
}

function queuePaletteUpdate(): void {
  if (paletteFrame) return;
  paletteFrame = requestAnimationFrame(() => {
    paletteFrame = 0;
    updatePaletteColors();
    updateRenderer();
  });
}

function renderStill(): void {
  if (!renderer || contextLost.value) return;
  renderer.render(elapsedTime * configuration.value.speed);
}

function animationLoop(timestamp: number): void {
  animationFrame = 0;
  if (!shouldAnimate.value || !renderer) return;
  const delta = lastFrameTimestamp
    ? Math.min(0.1, (timestamp - lastFrameTimestamp) / 1000)
    : 0;
  lastFrameTimestamp = timestamp;
  elapsedTime += delta;
  const interval = 1000 / renderer.framesPerSecond;
  if (!lastRenderTimestamp || timestamp - lastRenderTimestamp >= interval) {
    renderer.render(elapsedTime * configuration.value.speed);
    lastRenderTimestamp = timestamp;
  }
  animationFrame = requestAnimationFrame(animationLoop);
}

function synchronizeAnimation(): void {
  if (shouldAnimate.value) {
    if (!animationFrame) animationFrame = requestAnimationFrame(animationLoop);
    return;
  }
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  lastFrameTimestamp = 0;
  lastRenderTimestamp = 0;
  renderStill();
}

function resizeRenderer(width?: number, height?: number): void {
  if (!renderer || !root.value) return;
  const bounds = root.value.getBoundingClientRect();
  renderer.resize(width ?? bounds.width, height ?? bounds.height);
  renderStill();
}

function updateRenderer(): void {
  if (!renderer) return;
  renderer.update(configuration.value, activeColors.value);
  resizeRenderer();
  synchronizeAnimation();
}

function createRenderer(): void {
  if (!canvas.value || !root.value) return;
  try {
    renderer?.dispose();
    renderer = new GradientBackgroundRenderer(
      canvas.value,
      configuration.value,
      activeColors.value,
    );
    const bounds = root.value.getBoundingClientRect();
    renderer.resize(bounds.width, bounds.height);
    renderer.render(elapsedTime * configuration.value.speed);
    ready.value = true;
    rendererAvailable.value = true;
    contextLost.value = false;
    synchronizeAnimation();
  } catch {
    renderer?.dispose();
    renderer = undefined;
    ready.value = false;
    rendererAvailable.value = false;
  }
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
  contextLost.value = true;
  synchronizeAnimation();
}

function handleContextRestored(): void {
  try {
    contextLost.value = false;
    updateRenderer();
    renderStill();
    ready.value = true;
  } catch {
    ready.value = false;
    void nextTick(createRenderer);
  }
}

async function captureFallbackPng(
  options: GradientBackgroundCaptureOptions,
): Promise<Blob> {
  const width = Math.min(4096, Math.max(320, Math.round(
    options.width ?? root.value?.clientWidth ?? 1920,
  )));
  const height = Math.min(4096, Math.max(320, Math.round(
    options.height ?? root.value?.clientHeight ?? 1080,
  )));
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const context = output.getContext("2d");
  if (!context) throw new Error("PNG export is unavailable in this browser.");
  const gradient = context.createLinearGradient(0, 0, width, height);
  activeColors.value.forEach((color, index, colors) => {
    gradient.addColorStop(index / Math.max(1, colors.length - 1), color);
  });
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  return new Promise((resolve, reject) => {
    output.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not encode the fallback PNG."));
    }, "image/png");
  });
}

async function capturePng(
  options: GradientBackgroundCaptureOptions = {},
): Promise<Blob> {
  return renderer
    ? renderer.capturePng(options)
    : captureFallbackPng(options);
}

defineExpose({ capturePng, renderStill });

watch(
  [configuration, activeColors],
  () => updateRenderer(),
  { deep: true },
);
watch(shouldAnimate, synchronizeAnimation);

onMounted(() => {
  documentVisible.value = document.visibilityState !== "hidden";
  updatePaletteColors();
  canvas.value?.addEventListener("webglcontextlost", handleContextLost);
  canvas.value?.addEventListener("webglcontextrestored", handleContextRestored);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotion.value = motionQuery.matches;
  motionQuery.addEventListener("change", handleMotionChange);

  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry) resizeRenderer(entry.contentRect.width, entry.contentRect.height);
  });
  if (root.value) resizeObserver.observe(root.value);

  intersectionObserver = new IntersectionObserver((entries) => {
    inViewport.value = entries[0]?.isIntersecting ?? true;
    synchronizeAnimation();
  }, { rootMargin: "96px" });
  if (root.value) intersectionObserver.observe(root.value);

  paletteObserver = new MutationObserver(queuePaletteUpdate);
  let paletteBoundary: HTMLElement | null = root.value;
  while (paletteBoundary) {
    paletteObserver.observe(paletteBoundary, {
      attributes: true,
      attributeFilter: ["data-palette", "class", "style"],
    });
    paletteBoundary = paletteBoundary.parentElement;
  }

  createRenderer();
});

onBeforeUnmount(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (paletteFrame) cancelAnimationFrame(paletteFrame);
  animationFrame = 0;
  paletteFrame = 0;
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  paletteObserver?.disconnect();
  motionQuery?.removeEventListener("change", handleMotionChange);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  canvas.value?.removeEventListener("webglcontextlost", handleContextLost);
  canvas.value?.removeEventListener("webglcontextrestored", handleContextRestored);
  renderer?.dispose();
  renderer = undefined;
  rendererAvailable.value = false;
});
</script>

<template>
  <div
    ref="root"
    data-balsa="gradient-background"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :style="theme.explicitPresentation.value?.style"
    class="pointer-events-none absolute inset-0 isolate overflow-hidden"
    aria-hidden="true"
  >
    <div :class="fallbackClasses" :style="fallbackStyle" />
    <canvas ref="canvas" :class="canvasClasses" />
  </div>
</template>

<style scoped>
@media (forced-colors: active) {
  [data-balsa="gradient-background"] {
    background: Canvas;
  }

  canvas {
    display: none;
  }
}
</style>
