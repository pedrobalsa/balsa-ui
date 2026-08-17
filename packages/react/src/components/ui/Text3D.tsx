import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeClasses } from "./classes";
import { GradientBackground, type GradientBackgroundHandle } from "./GradientBackground";
import {
  gradientBackgroundPatternDefaults,
} from "./gradient-background";
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
  type Text3DExposed,
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
import type { ThemeInput } from "./theme";

export type Text3DHandle = Text3DExposed;

export interface Text3DProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  "data-balsa"?: string;
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
  wheelZoom?: Text3DWheelZoom;
  theme?: ThemeInput;
  onPoseChange?: (pose: Text3DPose) => void;
}

const TEXT_3D_GEOMETRY_REBUILD_DELAY_MS = 300;
const TEXT_3D_TEXT_REBUILD_DELAY_MS = 700;

const overlayStyle = `.text-3d-fallback-text{font-size:clamp(2rem,12vw,9rem)}
[data-balsa="text-3d"] canvas{touch-action:none}
@media (forced-colors: active){
  [data-balsa="text-3d"] canvas{display:none}
  [data-balsa="text-3d"] .text-3d-fallback-text{background:none;color:CanvasText}
}`;

const overrideKeys = [
  "seed", "text", "fontMode", "font", "fontFamily", "fontWeight", "size", "letterSpacing",
  "lineHeight", "alignment", "material", "colorMode", "colors", "metalness",
  "roughness", "clearcoat", "clearcoatRoughness", "transmission", "ior",
  "thickness", "glow", "depth", "bevelEnabled", "bevelSize", "bevelThickness",
  "bevelSegments", "curveSegments", "environment", "lightIntensity",
  "ambientIntensity", "lightAngle", "reflectionStrength", "shadow", "rotationX",
  "rotationY", "rotationZ", "zoom", "interactive", "poseMode", "autoRotate",
  "autoRotateSpeed", "damping", "background", "backgroundColor", "quality",
] as const satisfies readonly (keyof Text3DDirectOverrides)[];

const gradientBlobs = {
  pattern: "blobs" as const,
  ...gradientBackgroundPatternDefaults.blobs,
  patternComplexity: 4,
  scale: 0.7,
  softness: 0.95,
  warp: 0.5,
  wave: 0.9,
};

interface ContextSnapshot {
  paletteAvailable: boolean;
  paletteColors: Text3DColors;
  paletteEnvironment: Text3DEnvironmentColors;
  themeFontFamily?: string;
}

interface RuntimeState {
  renderer?: Text3DRenderer;
  loadedFont?: Font;
  fontRequest: number;
  contextFrame: number;
  geometryRebuildTimer?: ReturnType<typeof setTimeout>;
  appliedGeometrySignature: string;
  appliedText: string;
  resizeObserver?: ResizeObserver;
  intersectionObserver?: IntersectionObserver;
  contextObserver?: MutationObserver;
  motionQuery?: MediaQueryList;
  documentVisible: boolean;
  inViewport: boolean;
  reducedMotion: boolean;
  rendererAvailable: boolean;
}

function directOverridesFrom(
  props: Text3DDirectOverrides & { overrides?: Text3DDirectOverrides },
): Text3DDirectOverrides {
  const overrides: Text3DDirectOverrides = { ...props.overrides };
  for (const key of overrideKeys) {
    const value = props[key];
    if (value !== undefined) Object.assign(overrides, { [key]: value });
  }
  return overrides;
}

export const Text3D = forwardRef<Text3DHandle, Text3DProps>(function Text3D(
  rawProps,
  forwardedRef,
) {
  const {
    preset,
    config,
    overrides,
    seed,
    text,
    fontMode,
    font,
    fontFamily,
    fontWeight,
    size,
    letterSpacing,
    lineHeight,
    alignment,
    material,
    colorMode,
    colors,
    metalness,
    roughness,
    clearcoat,
    clearcoatRoughness,
    transmission,
    ior,
    thickness,
    glow,
    depth,
    bevelEnabled,
    bevelSize,
    bevelThickness,
    bevelSegments,
    curveSegments,
    environment,
    lightIntensity,
    ambientIntensity,
    lightAngle,
    reflectionStrength,
    shadow,
    rotationX,
    rotationY,
    rotationZ,
    zoom,
    interactive,
    poseMode,
    autoRotate,
    autoRotateSpeed,
    damping,
    background,
    backgroundColor,
    quality,
    paused = false,
    wheelZoom = "modifier",
    theme: _themeInput,
    onPoseChange,
    className,
    style,
    "data-balsa": _dataBalsa,
    ...domProps
  } = rawProps;
  void _themeInput;
  void _dataBalsa;

  const configuration = useMemo(
    () =>
      resolveText3DConfig({
        preset,
        config,
        overrides: directOverridesFrom({
          overrides,
          seed,
          text,
          fontMode,
          font,
          fontFamily,
          fontWeight,
          size,
          letterSpacing,
          lineHeight,
          alignment,
          material,
          colorMode,
          colors,
          metalness,
          roughness,
          clearcoat,
          clearcoatRoughness,
          transmission,
          ior,
          thickness,
          glow,
          depth,
          bevelEnabled,
          bevelSize,
          bevelThickness,
          bevelSegments,
          curveSegments,
          environment,
          lightIntensity,
          ambientIntensity,
          lightAngle,
          reflectionStrength,
          shadow,
          rotationX,
          rotationY,
          rotationZ,
          zoom,
          interactive,
          poseMode,
          autoRotate,
          autoRotateSpeed,
          damping,
          background,
          backgroundColor,
          quality,
        }),
      }),
    [
      preset, config, overrides, seed, text, fontMode, font, fontFamily, fontWeight,
      size, letterSpacing, lineHeight, alignment, material, colorMode, colors,
      metalness, roughness, clearcoat, clearcoatRoughness, transmission, ior,
      thickness, glow, depth, bevelEnabled, bevelSize, bevelThickness, bevelSegments,
      curveSegments, environment, lightIntensity, ambientIntensity, lightAngle,
      reflectionStrength, shadow, rotationX, rotationY, rotationZ, zoom, interactive,
      poseMode, autoRotate, autoRotateSpeed, damping, background, backgroundColor,
      quality,
    ],
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gradientRef = useRef<GradientBackgroundHandle | null>(null);
  const readyRef = useRef(false);
  const contextLostRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [snapshot, setSnapshot] = useState<ContextSnapshot>({
    paletteAvailable: false,
    paletteColors: [...TEXT_3D_DEFAULTS.colors],
    paletteEnvironment: {},
  });
  const snapshotRef = useRef(snapshot);
  const onPoseChangeRef = useRef(onPoseChange);
  onPoseChangeRef.current = onPoseChange;
  const runtime = useRef<RuntimeState>({
    fontRequest: 0,
    contextFrame: 0,
    appliedGeometrySignature: "",
    appliedText: "",
    documentVisible: true,
    inViewport: true,
    reducedMotion: false,
    rendererAvailable: false,
  });
  const latest = useRef({ configuration, paused, wheelZoom });
  latest.current = { configuration, paused, wheelZoom };

  function setReadyState(value: boolean): void {
    readyRef.current = value;
    setReady(value);
  }

  function setContextLostState(value: boolean): void {
    contextLostRef.current = value;
    setContextLost(value);
  }

  function derived(source: BalsaText3DConfig, context: ContextSnapshot) {
    const activeColors = source.colorMode === "palette" && context.paletteAvailable
      ? context.paletteColors
      : source.colors;
    const activeFont = source.fontMode === "theme"
      ? matchText3DFont(context.themeFontFamily, source.font)
      : source.font;
    const activeFontFamily = usesText3DCustomFontFamily(source) ? source.fontFamily : "";
    const activeConfiguration: BalsaText3DConfig = {
      ...source,
      colors: [...activeColors],
      font: activeFont,
    };
    const gradientBackdrop = Boolean(source.background && source.backdrop === "gradient");
    const rendererConfiguration: BalsaText3DConfig = gradientBackdrop
      ? { ...activeConfiguration, background: false }
      : activeConfiguration;
    return {
      activeColors,
      activeFont,
      activeFontFamily,
      activeConfiguration,
      gradientBackdrop,
      rendererConfiguration,
    };
  }

  function updateContext(): void {
    const element = rootRef.current;
    if (!element) return;
    const next: ContextSnapshot = {
      paletteAvailable: hasText3DPalette(element),
      paletteColors: resolveText3DPaletteColors(element, latest.current.configuration.colors),
      paletteEnvironment: resolveText3DPaletteEnvironment(element),
      themeFontFamily: resolveText3DThemeFontFamily(element),
    };
    snapshotRef.current = next;
    setSnapshot(next);
  }

  function shouldAnimate(): boolean {
    return Boolean(
      runtime.current.rendererAvailable
      && readyRef.current
      && !contextLostRef.current
      && !latest.current.paused
      && runtime.current.documentVisible
      && runtime.current.inViewport
      && latest.current.configuration.poseMode !== "static",
    );
  }

  function resizeRenderer(width?: number, height?: number): void {
    const { renderer } = runtime.current;
    const root = rootRef.current;
    if (!renderer || !root) return;
    const bounds = root.getBoundingClientRect();
    renderer.resize(width ?? bounds.width, height ?? bounds.height);
    renderer.render();
  }

  function synchronizeAnimation(): void {
    runtime.current.renderer?.setAnimationActive(shouldAnimate(), runtime.current.reducedMotion);
    if (!shouldAnimate()) runtime.current.renderer?.render();
  }

  function cancelPendingGeometryRebuild(): void {
    if (runtime.current.geometryRebuildTimer === undefined) return;
    clearTimeout(runtime.current.geometryRebuildTimer);
    runtime.current.geometryRebuildTimer = undefined;
  }

  function applyRendererUpdate(): void {
    cancelPendingGeometryRebuild();
    const { renderer, loadedFont } = runtime.current;
    if (!renderer || !loadedFont) return;
    const current = derived(latest.current.configuration, snapshotRef.current);
    renderer.update(
      current.rendererConfiguration,
      loadedFont,
      snapshotRef.current.paletteEnvironment,
    );
    runtime.current.appliedGeometrySignature = text3DGeometrySignature(
      current.rendererConfiguration,
    );
    runtime.current.appliedText = current.rendererConfiguration.text;
    resizeRenderer();
    synchronizeAnimation();
  }

  function flushPendingGeometryRebuild(): void {
    if (runtime.current.geometryRebuildTimer === undefined) return;
    applyRendererUpdate();
  }

  function scheduleRendererUpdate(): void {
    const { renderer, loadedFont } = runtime.current;
    if (!renderer || !loadedFont || contextLostRef.current) return;
    const current = derived(latest.current.configuration, snapshotRef.current);
    if (text3DGeometrySignature(current.rendererConfiguration) === runtime.current.appliedGeometrySignature) {
      applyRendererUpdate();
      return;
    }
    cancelPendingGeometryRebuild();
    const delayMs = current.rendererConfiguration.text !== runtime.current.appliedText
      ? TEXT_3D_TEXT_REBUILD_DELAY_MS
      : TEXT_3D_GEOMETRY_REBUILD_DELAY_MS;
    runtime.current.geometryRebuildTimer = setTimeout(() => {
      runtime.current.geometryRebuildTimer = undefined;
      applyRendererUpdate();
    }, delayMs);
  }

  function createRenderer(): void {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const loadedFont = runtime.current.loadedFont;
    if (!canvas || !root || !loadedFont) return;
    cancelPendingGeometryRebuild();
    const current = derived(latest.current.configuration, snapshotRef.current);
    try {
      runtime.current.renderer?.dispose();
      runtime.current.renderer = new Text3DRenderer(
        canvas,
        current.rendererConfiguration,
        loadedFont,
        snapshotRef.current.paletteEnvironment,
        (pose) => onPoseChangeRef.current?.(pose),
        latest.current.wheelZoom,
      );
      const bounds = root.getBoundingClientRect();
      runtime.current.renderer.resize(bounds.width, bounds.height);
      runtime.current.renderer.render();
      setReadyState(true);
      runtime.current.rendererAvailable = true;
      setContextLostState(false);
      runtime.current.appliedGeometrySignature = text3DGeometrySignature(
        current.rendererConfiguration,
      );
      runtime.current.appliedText = current.rendererConfiguration.text;
      synchronizeAnimation();
    } catch {
      runtime.current.renderer?.dispose();
      runtime.current.renderer = undefined;
      setReadyState(false);
      runtime.current.rendererAvailable = false;
      runtime.current.appliedGeometrySignature = "";
      runtime.current.appliedText = "";
    }
  }

  async function loadActiveFont(): Promise<Font> {
    const current = derived(latest.current.configuration, snapshotRef.current);
    const family = current.activeFontFamily;
    const weight = latest.current.configuration.fontWeight;
    if (!family) return loadText3DFont(current.activeFont, weight);
    try {
      return await loadText3DRemoteFont(family, weight, latest.current.configuration.text);
    } catch {
      return loadText3DFont(current.activeFont, weight);
    }
  }

  async function synchronizeFont(): Promise<void> {
    const request = ++runtime.current.fontRequest;
    setReadyState(false);
    try {
      const loaded = await loadActiveFont();
      if (request !== runtime.current.fontRequest) return;
      runtime.current.loadedFont = loaded;
      if (runtime.current.renderer) {
        applyRendererUpdate();
        setReadyState(true);
      } else {
        createRenderer();
      }
    } catch {
      if (request !== runtime.current.fontRequest) return;
      cancelPendingGeometryRebuild();
      runtime.current.loadedFont = undefined;
      runtime.current.renderer?.dispose();
      runtime.current.renderer = undefined;
      runtime.current.rendererAvailable = false;
      setReadyState(false);
      runtime.current.appliedGeometrySignature = "";
      runtime.current.appliedText = "";
    }
  }

  function renderStill(): void {
    flushPendingGeometryRebuild();
    runtime.current.renderer?.render();
  }

  function resetPose(): void {
    runtime.current.renderer?.resetPose();
  }

  function captureSize(options: Text3DCaptureOptions): { width: number; height: number } {
    const bound = (value: number): number => Math.min(4096, Math.max(320, Math.round(value)));
    return {
      width: bound(options.width ?? rootRef.current?.clientWidth ?? 1280),
      height: bound(options.height ?? rootRef.current?.clientHeight ?? 720),
    };
  }

  interface DecodedPng {
    source: ImageBitmap | HTMLImageElement;
    close: () => void;
  }

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
    await Promise.resolve();
    const field = gradientRef.current;
    if (!field) throw new Error("The gradient backdrop is not ready for capture.");
    const image = await decodePng(await field.capturePng({ width, height }));
    try {
      context.drawImage(image.source, 0, 0, width, height);
    } finally {
      image.close();
    }
  }

  async function captureFallbackPng(options: Text3DCaptureOptions): Promise<Blob> {
    const layer = options.layer ?? "composite";
    const { width, height } = captureSize(options);
    const output = document.createElement("canvas");
    output.width = width;
    output.height = height;
    const context = output.getContext("2d");
    if (!context) throw new Error("PNG export is unavailable in this browser.");
    const current = derived(latest.current.configuration, snapshotRef.current);
    const lines = latest.current.configuration.text.split("\n");
    if (layer !== "text") {
      if (current.gradientBackdrop) {
        await drawGradientBackdrop(context, width, height);
      } else if (options.opaque || latest.current.configuration.background) {
        context.fillStyle = latest.current.configuration.backgroundColor;
        context.fillRect(0, 0, width, height);
      }
    }
    if (layer !== "gradient") {
      context.fillStyle = current.activeColors[0] ?? "#000000";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `700 ${Math.max(32, height / Math.max(2, lines.length + 1))}px ${snapshotRef.current.themeFontFamily ?? "sans-serif"}`;
      const gap = height / Math.max(2, lines.length + 1);
      lines.forEach((line, index) => context.fillText(line, width / 2, gap * (index + 1)));
    }
    return new Promise((resolve, reject) => output.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not encode the fallback PNG."));
    }, "image/png"));
  }

  async function captureGradientPng(
    options: Text3DCaptureOptions,
    scene: Text3DRenderer,
  ): Promise<Blob> {
    const layer = options.layer ?? "composite";
    const { width, height } = captureSize(options);
    const field = gradientRef.current;
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
    const current = derived(latest.current.configuration, snapshotRef.current);
    if (!runtime.current.renderer) return captureFallbackPng(options);
    if (layer === "text") {
      return runtime.current.renderer.capturePng({ ...options, opaque: false });
    }
    if (layer === "gradient") {
      if (current.gradientBackdrop) {
        const field = gradientRef.current;
        if (!field) throw new Error("The gradient backdrop is not ready for capture.");
        const { width, height } = captureSize(options);
        return field.capturePng({ width, height });
      }
      return captureFallbackPng({ ...options, layer: "gradient" });
    }
    if (current.gradientBackdrop) return captureGradientPng(options, runtime.current.renderer);
    return runtime.current.renderer.capturePng(options);
  }

  useImperativeHandle(forwardedRef, () => ({ capturePng, renderStill, resetPose }));

  const current = derived(configuration, snapshot);
  const fontRequestKey = [
    current.activeFontFamily,
    current.activeFont,
    configuration.fontWeight,
    current.activeFontFamily ? configuration.text : "",
  ].join("|");

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    runtime.current.documentVisible = document.visibilityState !== "hidden";
    updateContext();

    function handleVisibilityChange(): void {
      runtime.current.documentVisible = document.visibilityState !== "hidden";
      synchronizeAnimation();
    }
    function handleMotionChange(event: MediaQueryListEvent | MediaQueryList): void {
      runtime.current.reducedMotion = event.matches;
      synchronizeAnimation();
    }
    function handleContextLost(event: Event): void {
      event.preventDefault();
      cancelPendingGeometryRebuild();
      setContextLostState(true);
      setReadyState(false);
      synchronizeAnimation();
    }
    function handleContextRestored(): void {
      setContextLostState(false);
      queueMicrotask(createRenderer);
    }
    function queueContextUpdate(): void {
      if (runtime.current.contextFrame) return;
      runtime.current.contextFrame = requestAnimationFrame(() => {
        runtime.current.contextFrame = 0;
        updateContext();
      });
    }

    canvas?.addEventListener("webglcontextlost", handleContextLost);
    canvas?.addEventListener("webglcontextrestored", handleContextRestored);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (typeof window.matchMedia === "function") {
      runtime.current.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      runtime.current.reducedMotion = runtime.current.motionQuery.matches;
      runtime.current.motionQuery.addEventListener("change", handleMotionChange);
    }
    if (typeof ResizeObserver !== "undefined") {
      runtime.current.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) resizeRenderer(entry.contentRect.width, entry.contentRect.height);
      });
      if (root) runtime.current.resizeObserver.observe(root);
    }
    if (typeof IntersectionObserver !== "undefined") {
      runtime.current.intersectionObserver = new IntersectionObserver((entries) => {
        runtime.current.inViewport = entries[0]?.isIntersecting ?? true;
        synchronizeAnimation();
      }, { rootMargin: "96px" });
      if (root) runtime.current.intersectionObserver.observe(root);
    }
    runtime.current.contextObserver = new MutationObserver(queueContextUpdate);
    let boundary: HTMLElement | null = root;
    while (boundary) {
      runtime.current.contextObserver.observe(boundary, {
        attributes: true,
        attributeFilter: ["data-palette", "data-balsa-theme", "class", "style"],
      });
      boundary = boundary.parentElement;
    }
    void synchronizeFont();

    return () => {
      runtime.current.fontRequest += 1;
      cancelPendingGeometryRebuild();
      if (runtime.current.contextFrame) cancelAnimationFrame(runtime.current.contextFrame);
      runtime.current.contextFrame = 0;
      runtime.current.resizeObserver?.disconnect();
      runtime.current.intersectionObserver?.disconnect();
      runtime.current.contextObserver?.disconnect();
      runtime.current.motionQuery?.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas?.removeEventListener("webglcontextlost", handleContextLost);
      canvas?.removeEventListener("webglcontextrestored", handleContextRestored);
      runtime.current.renderer?.dispose();
      runtime.current.renderer = undefined;
      runtime.current.loadedFont = undefined;
      runtime.current.rendererAvailable = false;
      runtime.current.appliedGeometrySignature = "";
      runtime.current.appliedText = "";
    };
  }, []);

  const skipFontWatch = useRef(true);
  useLayoutEffect(() => {
    if (skipFontWatch.current) {
      skipFontWatch.current = false;
      return;
    }
    void synchronizeFont();
  }, [fontRequestKey]);

  const skipConfigWatch = useRef(true);
  useLayoutEffect(() => {
    if (skipConfigWatch.current) {
      skipConfigWatch.current = false;
      return;
    }
    scheduleRendererUpdate();
    synchronizeAnimation();
    runtime.current.renderer?.setWheelZoom(wheelZoom);
  }, [configuration, snapshot, paused, wheelZoom]);

  const namedGradientPreset = configuration.gradientPreset || undefined;
  const gradientBackdropBind = namedGradientPreset
    ? { preset: namedGradientPreset }
    : {
        colorMode: "custom" as const,
        colors: text3DGradientColors(current.activeColors, configuration.reflections),
        pattern: gradientBlobs.pattern,
        patternComplexity: gradientBlobs.patternComplexity,
        scale: gradientBlobs.scale,
        softness: gradientBlobs.softness,
        warp: gradientBlobs.warp,
        wave: gradientBlobs.wave,
        seed: configuration.seed,
      };
  const lines = configuration.text.split("\n");
  const canvasVisible = ready && !contextLost;
  const fallbackStyle = {
    ...buildText3DFallbackStyle(current.activeColors),
    fontFamily: current.activeFontFamily
      ? `${JSON.stringify(current.activeFontFamily)}, sans-serif`
      : configuration.fontMode === "theme"
        ? snapshot.themeFontFamily
        : undefined,
  } as CSSProperties;

  return (
    <>
      <style>{overlayStyle}</style>
      <div
        ref={rootRef}
        {...domProps}
        data-balsa="text-3d"
        className={mergeClasses(
          "relative isolate grid h-full w-full place-items-center overflow-hidden",
          className,
        )}
        style={style}
      >
        <span className="sr-only">{configuration.text}</span>
        {current.gradientBackdrop ? (
          <GradientBackground
            ref={gradientRef}
            data-balsa-text-3d-gradient=""
            {...gradientBackdropBind}
            quality={configuration.quality}
            paused={paused}
            className="absolute inset-0 -z-10"
          />
        ) : null}
        <div
          className={mergeClasses(
            "text-3d-fallback absolute inset-0 grid place-items-center transition-opacity",
            canvasVisible ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          aria-hidden="true"
        >
          <p
            className="text-3d-fallback-text m-0 select-text text-center font-balsa-title font-semibold leading-tight"
            style={fallbackStyle}
          >
            {lines.map((line, index) => (
              <span key={`${index}-${line}`} className="block">{line}</span>
            ))}
          </p>
        </div>
        <canvas
          ref={canvasRef}
          className={mergeClasses(
            "absolute inset-0 block size-full transition-opacity",
            canvasVisible ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
        />
      </div>
    </>
  );
});
