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
import { mergeClasses } from "./classes";
import {
  GRADIENT_BACKGROUND_SCRIM_OPACITY,
  applyGradientBackgroundContentContrast,
  applyGradientBackgroundEffectContrast,
  buildGradientBackgroundFallback,
  hasGradientBackgroundPalette,
  resolveGradientBackgroundConfig,
  resolveGradientBackgroundContentColor,
  resolveGradientBackgroundPaletteBackground,
  resolveGradientBackgroundPaletteColors,
  type BalsaBackgroundConfig,
  type GradientBackgroundCaptureOptions,
  type GradientBackgroundColorMode,
  type GradientBackgroundConfigInput,
  type GradientBackgroundDirectOverrides,
  type GradientBackgroundEffect,
  type GradientBackgroundEffectColorMode,
  type GradientBackgroundEffectShape,
  type GradientBackgroundExposed,
  type GradientBackgroundPattern,
  type GradientBackgroundPresetName,
  type GradientBackgroundQuality,
} from "./gradient-background";
import {
  createGradientBackgroundGlyphAtlas,
  type GradientBackgroundGlyphAtlas,
} from "./gradient-background-glyphs";
import { GradientBackgroundRenderer } from "./gradient-background-renderer";
import type { ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";

export type GradientBackgroundHandle = GradientBackgroundExposed;

export interface GradientBackgroundProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  "data-balsa"?: string;
  preset?: GradientBackgroundPresetName;
  config?: GradientBackgroundConfigInput;
  seed?: number;
  colorMode?: GradientBackgroundColorMode;
  colors?: readonly string[];
  contentContrast?: boolean;
  contentColor?: string;
  scrim?: boolean | number;
  scrimColor?: string;
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
  pattern?: GradientBackgroundPattern;
  patternDensity?: number;
  patternCenterX?: number;
  patternCenterY?: number;
  patternComplexity?: number;
  effect?: GradientBackgroundEffect;
  effectScale?: number;
  effectAngle?: number;
  effectMix?: number;
  effectColorMode?: GradientBackgroundEffectColorMode;
  effectInk?: string;
  effectPaper?: string;
  effectInvert?: boolean;
  effectLevels?: number;
  effectShape?: GradientBackgroundEffectShape;
  effectCharacters?: string;
  quality?: GradientBackgroundQuality;
  paused?: boolean;
  theme?: ThemeInput;
}

const forcedColorsStyle = `@media (forced-colors: active) {
  [data-balsa="gradient-background"] { background: Canvas; }
  [data-balsa="gradient-background"] canvas { display: none; }
}`;

function directOverridesFrom(props: {
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
  pattern?: GradientBackgroundPattern;
  patternDensity?: number;
  patternCenterX?: number;
  patternCenterY?: number;
  patternComplexity?: number;
  effect?: GradientBackgroundEffect;
  effectScale?: number;
  effectAngle?: number;
  effectMix?: number;
  effectColorMode?: GradientBackgroundEffectColorMode;
  effectInk?: string;
  effectPaper?: string;
  effectInvert?: boolean;
  effectLevels?: number;
  effectShape?: GradientBackgroundEffectShape;
  effectCharacters?: string;
  quality?: GradientBackgroundQuality;
}): GradientBackgroundDirectOverrides {
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
  if (props.pattern !== undefined) overrides.pattern = props.pattern;
  if (props.patternDensity !== undefined) overrides.patternDensity = props.patternDensity;
  if (props.patternCenterX !== undefined) overrides.patternCenterX = props.patternCenterX;
  if (props.patternCenterY !== undefined) overrides.patternCenterY = props.patternCenterY;
  if (props.patternComplexity !== undefined) overrides.patternComplexity = props.patternComplexity;
  if (props.effect !== undefined) overrides.effect = props.effect;
  if (props.effectScale !== undefined) overrides.effectScale = props.effectScale;
  if (props.effectAngle !== undefined) overrides.effectAngle = props.effectAngle;
  if (props.effectMix !== undefined) overrides.effectMix = props.effectMix;
  if (props.effectColorMode !== undefined) overrides.effectColorMode = props.effectColorMode;
  if (props.effectInk !== undefined) overrides.effectInk = props.effectInk;
  if (props.effectPaper !== undefined) overrides.effectPaper = props.effectPaper;
  if (props.effectInvert !== undefined) overrides.effectInvert = props.effectInvert;
  if (props.effectLevels !== undefined) overrides.effectLevels = props.effectLevels;
  if (props.effectShape !== undefined) overrides.effectShape = props.effectShape;
  if (props.effectCharacters !== undefined) overrides.effectCharacters = props.effectCharacters;
  if (props.quality !== undefined) overrides.quality = props.quality;
  return overrides;
}

interface PaletteSnapshot {
  available: boolean;
  background?: string;
  colors: string[];
  ambientText?: string;
}

interface RuntimeState {
  renderer?: GradientBackgroundRenderer;
  glyphs?: GradientBackgroundGlyphAtlas;
  glyphSignature: string;
  animationFrame: number;
  lastFrameTimestamp: number;
  lastRenderTimestamp: number;
  elapsedTime: number;
  paletteFrame: number;
  resizeObserver?: ResizeObserver;
  intersectionObserver?: IntersectionObserver;
  paletteObserver?: MutationObserver;
  motionQuery?: MediaQueryList;
  documentVisible: boolean;
  inViewport: boolean;
  reducedMotion: boolean;
  rendererAvailable: boolean;
}

export const GradientBackground = forwardRef<
  GradientBackgroundHandle,
  GradientBackgroundProps
>(function GradientBackground(rawProps, forwardedRef) {
  const { props, theme } = useResolvedThemeProps(
    "gradient-background",
    "surfaces",
    rawProps,
    {} as const,
  );
  const {
    preset,
    config,
    seed,
    colorMode,
    colors,
    contentContrast = false,
    contentColor,
    scrim = false,
    scrimColor,
    speed,
    scale,
    warp,
    wave,
    softness,
    grain,
    grainSize,
    contrast,
    brightness,
    direction,
    fieldOctaves,
    fieldFrequency,
    noiseAmount,
    noiseOctaves,
    noiseFrequency,
    warpFrequency,
    pattern,
    patternDensity,
    patternCenterX,
    patternCenterY,
    patternComplexity,
    effect,
    effectScale,
    effectAngle,
    effectMix,
    effectColorMode,
    effectInk,
    effectPaper,
    effectInvert,
    effectLevels,
    effectShape,
    effectCharacters,
    quality,
    paused = false,
    theme: _themeInput,
    className,
    style,
    "data-balsa": _dataBalsa,
    ...domProps
  } = props;
  void _themeInput;
  void _dataBalsa;

  const configuration = useMemo(
    () =>
      resolveGradientBackgroundConfig({
        preset,
        config,
        overrides: directOverridesFrom({
          seed,
          colorMode,
          colors,
          speed,
          scale,
          warp,
          wave,
          softness,
          grain,
          grainSize,
          contrast,
          brightness,
          direction,
          fieldOctaves,
          fieldFrequency,
          noiseAmount,
          noiseOctaves,
          noiseFrequency,
          warpFrequency,
          pattern,
          patternDensity,
          patternCenterX,
          patternCenterY,
          patternComplexity,
          effect,
          effectScale,
          effectAngle,
          effectMix,
          effectColorMode,
          effectInk,
          effectPaper,
          effectInvert,
          effectLevels,
          effectShape,
          effectCharacters,
          quality,
        }),
      }),
    [
      preset,
      config,
      seed,
      colorMode,
      colors,
      speed,
      scale,
      warp,
      wave,
      softness,
      grain,
      grainSize,
      contrast,
      brightness,
      direction,
      fieldOctaves,
      fieldFrequency,
      noiseAmount,
      noiseOctaves,
      noiseFrequency,
      warpFrequency,
      pattern,
      patternDensity,
      patternCenterX,
      patternCenterY,
      patternComplexity,
      effect,
      effectScale,
      effectAngle,
      effectMix,
      effectColorMode,
      effectInk,
      effectPaper,
      effectInvert,
      effectLevels,
      effectShape,
      effectCharacters,
      quality,
    ],
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const readyRef = useRef(false);
  const contextLostRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [palette, setPalette] = useState<PaletteSnapshot>({
    available: false,
    colors: [],
  });
  const paletteRef = useRef<PaletteSnapshot>(palette);
  const runtime = useRef<RuntimeState>({
    glyphSignature: "",
    animationFrame: 0,
    lastFrameTimestamp: 0,
    lastRenderTimestamp: 0,
    elapsedTime: 0,
    paletteFrame: 0,
    documentVisible: true,
    inViewport: true,
    reducedMotion: false,
    rendererAvailable: false,
  });
  const latest = useRef({
    configuration,
    preset,
    config,
    colorMode,
    contentContrast,
    contentColor,
    paused,
  });
  latest.current = {
    configuration,
    preset,
    config,
    colorMode,
    contentContrast,
    contentColor,
    paused,
  };

  function setReadyState(value: boolean): void {
    readyRef.current = value;
    setReady(value);
  }

  function setContextLostState(value: boolean): void {
    contextLostRef.current = value;
    setContextLost(value);
  }

  function activeFrom(
    snapshot: PaletteSnapshot,
    source: BalsaBackgroundConfig,
  ): { colors: string[]; configuration: BalsaBackgroundConfig } {
    const current = latest.current;
    const explicitColorMode = current.colorMode ?? current.config?.colorMode;
    const namedPreset = Boolean(current.preset ?? current.config?.preset);
    const effectiveColorMode: GradientBackgroundColorMode = explicitColorMode
      ?? (!namedPreset && snapshot.available ? "palette" : source.colorMode);
    const paletteColors = effectiveColorMode === "palette"
      ? snapshot.colors.length >= 2
        ? snapshot.colors
        : source.colors
      : source.colors;
    const contentTextColor = current.contentColor
      ?? (current.contentContrast ? snapshot.ambientText : undefined);
    const activeColors = contentTextColor
      ? applyGradientBackgroundContentContrast(
          paletteColors,
          contentTextColor,
          snapshot.background,
        )
      : paletteColors;
    if (source.effectColorMode === "gradient" || !contentTextColor) {
      return { colors: activeColors, configuration: source };
    }
    const { ink, paper } = applyGradientBackgroundEffectContrast(
      source.effectInk,
      source.effectPaper,
      contentTextColor,
      snapshot.background,
    );
    if (ink === source.effectInk && paper === source.effectPaper) {
      return { colors: activeColors, configuration: source };
    }
    return { colors: activeColors, configuration: { ...source, effectInk: ink, effectPaper: paper } };
  }

  function updatePaletteColors(): void {
    const root = rootRef.current;
    if (!root) return;
    const next: PaletteSnapshot = {
      available: hasGradientBackgroundPalette(root),
      background: resolveGradientBackgroundPaletteBackground(root),
      colors: resolveGradientBackgroundPaletteColors(root, latest.current.configuration.colors),
      ambientText: latest.current.contentContrast
        ? resolveGradientBackgroundContentColor(root)
        : undefined,
    };
    paletteRef.current = next;
    setPalette(next);
  }

  function renderStill(): void {
    const { renderer, elapsedTime } = runtime.current;
    if (!renderer || contextLostRef.current) return;
    renderer.render(elapsedTime * latest.current.configuration.speed);
  }

  function shouldAnimate(): boolean {
    return Boolean(
      runtime.current.rendererAvailable
      && readyRef.current
      && !contextLostRef.current
      && !latest.current.paused
      && !runtime.current.reducedMotion
      && runtime.current.documentVisible
      && runtime.current.inViewport,
    );
  }

  function animationLoop(timestamp: number): void {
    runtime.current.animationFrame = 0;
    if (!shouldAnimate() || !runtime.current.renderer) return;
    const delta = runtime.current.lastFrameTimestamp
      ? Math.min(0.1, (timestamp - runtime.current.lastFrameTimestamp) / 1000)
      : 0;
    runtime.current.lastFrameTimestamp = timestamp;
    runtime.current.elapsedTime += delta;
    const interval = 1000 / runtime.current.renderer.framesPerSecond;
    if (
      !runtime.current.lastRenderTimestamp
      || timestamp - runtime.current.lastRenderTimestamp >= interval
    ) {
      runtime.current.renderer.render(
        runtime.current.elapsedTime * latest.current.configuration.speed,
      );
      runtime.current.lastRenderTimestamp = timestamp;
    }
    runtime.current.animationFrame = requestAnimationFrame(animationLoop);
  }

  function synchronizeAnimation(): void {
    if (shouldAnimate()) {
      if (!runtime.current.animationFrame) {
        runtime.current.animationFrame = requestAnimationFrame(animationLoop);
      }
      return;
    }
    if (runtime.current.animationFrame) {
      cancelAnimationFrame(runtime.current.animationFrame);
    }
    runtime.current.animationFrame = 0;
    runtime.current.lastFrameTimestamp = 0;
    runtime.current.lastRenderTimestamp = 0;
    renderStill();
  }

  function resizeRenderer(width?: number, height?: number): void {
    const { renderer } = runtime.current;
    const root = rootRef.current;
    if (!renderer || !root) return;
    const bounds = root.getBoundingClientRect();
    renderer.resize(width ?? bounds.width, height ?? bounds.height);
    renderStill();
  }

  function synchronizeGlyphs(): void {
    const { effect: currentEffect, effectCharacters } = latest.current.configuration;
    const signature = currentEffect === "ascii" ? effectCharacters : "";
    if (signature === runtime.current.glyphSignature) return;
    runtime.current.glyphSignature = signature;
    runtime.current.glyphs?.dispose();
    runtime.current.glyphs = signature
      ? createGradientBackgroundGlyphAtlas(signature)
      : undefined;
  }

  function updateRenderer(): void {
    if (!runtime.current.renderer) return;
    synchronizeGlyphs();
    const active = activeFrom(paletteRef.current, latest.current.configuration);
    runtime.current.renderer.update(
      active.configuration,
      active.colors,
      runtime.current.glyphs,
    );
    resizeRenderer();
    synchronizeAnimation();
  }

  function createRenderer(): void {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    try {
      runtime.current.renderer?.dispose();
      synchronizeGlyphs();
      const active = activeFrom(paletteRef.current, latest.current.configuration);
      runtime.current.renderer = new GradientBackgroundRenderer(
        canvas,
        active.configuration,
        active.colors,
        runtime.current.glyphs,
      );
      const bounds = root.getBoundingClientRect();
      runtime.current.renderer.resize(bounds.width, bounds.height);
      runtime.current.renderer.render(
        runtime.current.elapsedTime * latest.current.configuration.speed,
      );
      setReadyState(true);
      runtime.current.rendererAvailable = true;
      setContextLostState(false);
      synchronizeAnimation();
    } catch {
      runtime.current.renderer?.dispose();
      runtime.current.renderer = undefined;
      setReadyState(false);
      runtime.current.rendererAvailable = false;
    }
  }

  function queuePaletteUpdate(): void {
    if (runtime.current.paletteFrame) return;
    runtime.current.paletteFrame = requestAnimationFrame(() => {
      runtime.current.paletteFrame = 0;
      updatePaletteColors();
      updateRenderer();
    });
  }

  async function captureFallbackPng(
    options: GradientBackgroundCaptureOptions,
  ): Promise<Blob> {
    const width = Math.min(4096, Math.max(320, Math.round(
      options.width ?? rootRef.current?.clientWidth ?? 1920,
    )));
    const height = Math.min(4096, Math.max(320, Math.round(
      options.height ?? rootRef.current?.clientHeight ?? 1080,
    )));
    const output = document.createElement("canvas");
    output.width = width;
    output.height = height;
    const context = output.getContext("2d");
    if (!context) throw new Error("PNG export is unavailable in this browser.");
    const active = activeFrom(paletteRef.current, latest.current.configuration);
    const gradient = context.createLinearGradient(0, 0, width, height);
    active.colors.forEach((color, index, stops) => {
      gradient.addColorStop(index / Math.max(1, stops.length - 1), color);
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
    return runtime.current.renderer
      ? runtime.current.renderer.capturePng(options)
      : captureFallbackPng(options);
  }

  useImperativeHandle(forwardedRef, () => ({ capturePng, renderStill }));

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    runtime.current.documentVisible = document.visibilityState !== "hidden";
    updatePaletteColors();

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
      setContextLostState(true);
      synchronizeAnimation();
    }
    function handleContextRestored(): void {
      try {
        setContextLostState(false);
        updateRenderer();
        renderStill();
        setReadyState(true);
      } catch {
        setReadyState(false);
        queueMicrotask(createRenderer);
      }
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

    runtime.current.paletteObserver = new MutationObserver(queuePaletteUpdate);
    let paletteBoundary: HTMLElement | null = root;
    while (paletteBoundary) {
      runtime.current.paletteObserver.observe(paletteBoundary, {
        attributes: true,
        attributeFilter: ["data-palette", "class", "style"],
      });
      paletteBoundary = paletteBoundary.parentElement;
    }

    createRenderer();

    return () => {
      if (runtime.current.animationFrame) cancelAnimationFrame(runtime.current.animationFrame);
      if (runtime.current.paletteFrame) cancelAnimationFrame(runtime.current.paletteFrame);
      runtime.current.animationFrame = 0;
      runtime.current.paletteFrame = 0;
      runtime.current.resizeObserver?.disconnect();
      runtime.current.intersectionObserver?.disconnect();
      runtime.current.paletteObserver?.disconnect();
      runtime.current.motionQuery?.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas?.removeEventListener("webglcontextlost", handleContextLost);
      canvas?.removeEventListener("webglcontextrestored", handleContextRestored);
      runtime.current.renderer?.dispose();
      runtime.current.renderer = undefined;
      runtime.current.glyphs?.dispose();
      runtime.current.glyphs = undefined;
      runtime.current.glyphSignature = "";
      runtime.current.rendererAvailable = false;
    };
  }, []);

  useLayoutEffect(() => {
    updateRenderer();
    synchronizeAnimation();
  }, [configuration, palette, contentColor, contentContrast, colorMode, preset, config, paused]);

  const explicitColorMode = colorMode ?? config?.colorMode;
  const namedPreset = Boolean(preset ?? config?.preset);
  const effectiveColorMode: GradientBackgroundColorMode = explicitColorMode
    ?? (!namedPreset && palette.available ? "palette" : configuration.colorMode);
  const paletteColors = effectiveColorMode === "palette"
    ? palette.colors.length >= 2
      ? palette.colors
      : configuration.colors
    : configuration.colors;
  const contentTextColor = contentColor ?? (contentContrast ? palette.ambientText : undefined);
  const activeColors = contentTextColor
    ? applyGradientBackgroundContentContrast(
        paletteColors,
        contentTextColor,
        palette.background,
      )
    : paletteColors;

  const scrimOpacity = scrim === true
    ? GRADIENT_BACKGROUND_SCRIM_OPACITY
    : typeof scrim === "number" && Number.isFinite(scrim)
      ? Math.min(1, Math.max(0, scrim))
      : 0;
  const canvasVisible = ready && !contextLost;
  const classes = mergeClasses(
    "pointer-events-none absolute inset-0 isolate overflow-hidden",
    className,
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <style>{forcedColorsStyle}</style>
      <div
        ref={rootRef}
        {...domProps}
        data-balsa="gradient-background"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        className={classes}
        style={
          {
            ...style,
            ...theme.explicitPresentation?.style,
          } as CSSProperties
        }
        aria-hidden="true"
      >
        <div
          className={mergeClasses(
            "absolute inset-0 transition-opacity",
            canvasVisible ? "opacity-0" : "opacity-100",
          )}
          style={{
            backgroundImage: buildGradientBackgroundFallback(
              activeColors,
              configuration.direction,
            ),
          }}
        />
        <canvas
          ref={canvasRef}
          className={mergeClasses(
            "absolute inset-0 block size-full transition-opacity",
            canvasVisible ? "opacity-100" : "opacity-0",
          )}
        />
        {scrimOpacity > 0 ? (
          <div
            data-balsa-gradient-scrim=""
            className="absolute inset-0"
            style={{
              backgroundColor: scrimColor ?? "var(--color-balsa-background)",
              opacity: String(scrimOpacity),
            }}
          />
        ) : null}
      </div>
    </BalsaThemeContext.Provider>
  );
});
