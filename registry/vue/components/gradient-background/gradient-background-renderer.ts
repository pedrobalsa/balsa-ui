import {
  Color,
  LinearFilter,
  Mesh,
  NearestFilter,
  NoColorSpace,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
  type IUniform,
  type Texture,
} from "three";
import type {
  BalsaBackgroundConfig,
  GradientBackgroundCaptureOptions,
  GradientBackgroundEffect,
  GradientBackgroundPattern,
  GradientBackgroundQuality,
} from "./gradient-background";
import {
  GRADIENT_BACKGROUND_EFFECT_COLOR_MODES,
  GRADIENT_BACKGROUND_EFFECT_SHAPES,
} from "./gradient-background";
import {
  buildGradientBackgroundFragmentShader,
  gradientBackgroundVertexShader,
} from "./gradient-background-shader";
import {
  buildGradientBackgroundEffectFragmentShader,
  gradientBackgroundEffectVertexShader,
  type GradientBackgroundAppliedEffect,
} from "./gradient-background-effects-shader";
import {
  GRADIENT_BACKGROUND_GLYPH_ASPECT,
  type GradientBackgroundGlyphAtlas,
} from "./gradient-background-glyphs";

interface GradientUniforms extends Record<string, IUniform> {
  uResolution: IUniform<Vector2>;
  uTime: IUniform<number>;
  uSeed: IUniform<number>;
  uScale: IUniform<number>;
  uWarp: IUniform<number>;
  uWave: IUniform<number>;
  uSoftness: IUniform<number>;
  uGrain: IUniform<number>;
  uGrainPixels: IUniform<number>;
  uSourceGrain: IUniform<number>;
  uContrast: IUniform<number>;
  uBrightness: IUniform<number>;
  uDirection: IUniform<number>;
  uFieldFrequency: IUniform<number>;
  uNoiseFrequency: IUniform<number>;
  uNoiseAmount: IUniform<number>;
  uWarpFrequency: IUniform<number>;
  uPatternDensity: IUniform<number>;
  uPatternCenter: IUniform<Vector2>;
  uPatternComplexity: IUniform<number>;
  uFieldOctaves: IUniform<number>;
  uNoiseOctaves: IUniform<number>;
  uColorCount: IUniform<number>;
  uColors: IUniform<Color[]>;
}

interface EffectUniforms extends Record<string, IUniform> {
  uSource: IUniform<Texture | null>;
  uResolution: IUniform<Vector2>;
  uCellPixels: IUniform<number>;
  uEffectAngle: IUniform<number>;
  uEffectMix: IUniform<number>;
  uEffectInvert: IUniform<number>;
  uEffectColorMode: IUniform<number>;
  uEffectShape: IUniform<number>;
  uEffectLevels: IUniform<number>;
  uInk: IUniform<Color>;
  uPaper: IUniform<Color>;
  uSeed: IUniform<number>;
  uGrain: IUniform<number>;
  uGrainPixels: IUniform<number>;
  uGlyphs: IUniform<Texture | null>;
  uGlyphColumns: IUniform<number>;
  uGlyphAspect: IUniform<number>;
  uGlyphAvailable: IUniform<number>;
}

export interface GradientBackgroundQualityProfile {
  pixelRatioScale: number;
  maxPixelRatio: number;
  framesPerSecond: number;
}

const qualityProfiles: Record<Exclude<GradientBackgroundQuality, "auto">, GradientBackgroundQualityProfile> = {
  low: { pixelRatioScale: 0.62, maxPixelRatio: 1, framesPerSecond: 24 },
  medium: { pixelRatioScale: 0.82, maxPixelRatio: 1.25, framesPerSecond: 30 },
  high: { pixelRatioScale: 1, maxPixelRatio: 1.5, framesPerSecond: 30 },
};

/**
 * A smooth gradient survives being rendered below its display size; a lattice
 * of glyphs or dots does not -- the marks land between pixels and turn to mush.
 * Effects therefore hold a higher floor on resolution and pay for it in frame
 * rate, which is already capped low.
 */
const effectPixelRatioFloor = 0.85;

const shaderSeedModulus = 65521;

export function normalizeGradientBackgroundShaderSeed(seed: number): number {
  const integer = Number.isFinite(seed) ? Math.trunc(seed) : 0;
  return ((integer % shaderSeedModulus) + shaderSeedModulus)
    % shaderSeedModulus;
}

export function resolveGradientBackgroundQuality(
  quality: GradientBackgroundQuality,
  width: number,
  hasEffect = false,
): GradientBackgroundQualityProfile {
  const profile = quality === "auto"
    ? (width <= 480 ? qualityProfiles.low : qualityProfiles.medium)
    : qualityProfiles[quality];
  if (!hasEffect || profile.pixelRatioScale >= effectPixelRatioFloor) return profile;
  return { ...profile, pixelRatioScale: effectPixelRatioFloor };
}

/**
 * Cells are authored in CSS pixels so a background looks the same on any
 * display, and so a PNG exported at 1920px shows the density the preview did
 * rather than the density its own pixel count implies.
 */
export function resolveGradientBackgroundCellPixels(
  effectScale: number,
  bufferWidth: number,
  layoutWidth: number,
): number {
  return Math.max(1, effectScale * (bufferWidth / Math.max(1, layoutWidth)));
}

function blobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not encode the background PNG."));
    }, "image/png");
  });
}

function createRenderTarget(width: number, height: number, effect: GradientBackgroundEffect): WebGLRenderTarget {
  // Cell effects read one texel at a cell center; smoothing that read blurs
  // neighbouring cells into each other. Effects that sample per fragment want
  // the smoothing.
  const filter = effect === "ascii" || effect === "dots" || effect === "halftone"
    ? NearestFilter
    : LinearFilter;
  const target = new WebGLRenderTarget(Math.max(1, width), Math.max(1, height), {
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
    minFilter: filter,
    magFilter: filter,
  });
  // Neither pass is color-managed, so the round trip has to stay a plain copy.
  target.texture.colorSpace = NoColorSpace;
  return target;
}

export class GradientBackgroundRenderer {
  readonly uniforms: GradientUniforms;
  readonly effectUniforms: EffectUniforms;

  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly geometry = new PlaneGeometry(2, 2);
  private readonly materials = new Map<GradientBackgroundPattern, ShaderMaterial>();
  private readonly effectMaterials = new Map<GradientBackgroundAppliedEffect, ShaderMaterial>();
  private readonly mesh: Mesh;
  private readonly effectScene = new Scene();
  private effectMesh: Mesh | undefined;
  private target: WebGLRenderTarget | undefined;
  private config: BalsaBackgroundConfig;
  private width = 1;
  private height = 1;
  private disposed = false;
  private profile: GradientBackgroundQualityProfile;

  constructor(
    canvas: HTMLCanvasElement,
    config: BalsaBackgroundConfig,
    colors: readonly string[],
    glyphs?: GradientBackgroundGlyphAtlas,
    /**
     * `preserveDrawingBuffer` is off for the live canvas, where the buffer is
     * composited every frame and keeping it costs memory for nothing. Callers
     * that read pixels back outside the render call -- a thumbnail sheet
     * reading `toDataURL` -- need it on.
     */
    options: { preserveDrawingBuffer?: boolean } = {},
  ) {
    this.config = config;
    this.profile = resolveGradientBackgroundQuality(
      config.quality,
      1,
      config.effect !== "none",
    );
    this.uniforms = {
      uResolution: { value: new Vector2(1, 1) },
      uTime: { value: 0 },
      uSeed: { value: normalizeGradientBackgroundShaderSeed(config.seed) },
      uScale: { value: config.scale },
      uWarp: { value: config.warp },
      uWave: { value: config.wave },
      uSoftness: { value: config.softness },
      uGrain: { value: config.grain },
      uGrainPixels: { value: config.grainSize },
      uSourceGrain: { value: config.effect === "none" ? 1 : 0 },
      uContrast: { value: config.contrast },
      uBrightness: { value: config.brightness },
      uDirection: { value: config.direction },
      uFieldFrequency: { value: config.fieldFrequency },
      uNoiseFrequency: { value: config.noiseFrequency },
      uNoiseAmount: { value: config.noiseAmount },
      uWarpFrequency: { value: config.warpFrequency },
      uPatternDensity: { value: config.patternDensity },
      uPatternCenter: { value: new Vector2(config.patternCenterX, config.patternCenterY) },
      uPatternComplexity: { value: config.patternComplexity },
      uFieldOctaves: { value: config.fieldOctaves },
      uNoiseOctaves: { value: config.noiseOctaves },
      uColorCount: { value: colors.length },
      uColors: { value: Array.from({ length: 6 }, () => new Color("#000000")) },
    };
    this.effectUniforms = {
      uSource: { value: null },
      uResolution: { value: new Vector2(1, 1) },
      uCellPixels: { value: config.effectScale },
      uEffectAngle: { value: config.effectAngle },
      uEffectMix: { value: config.effectMix },
      uEffectInvert: { value: config.effectInvert ? 1 : 0 },
      uEffectColorMode: { value: 0 },
      uEffectShape: { value: 0 },
      uEffectLevels: { value: config.effectLevels },
      uInk: { value: new Color(config.effectInk) },
      uPaper: { value: new Color(config.effectPaper) },
      uSeed: { value: normalizeGradientBackgroundShaderSeed(config.seed) },
      uGrain: { value: config.grain },
      uGrainPixels: { value: config.grainSize },
      uGlyphs: { value: glyphs?.texture ?? null },
      uGlyphColumns: { value: glyphs?.columns ?? 1 },
      uGlyphAspect: { value: glyphs?.aspect ?? GRADIENT_BACKGROUND_GLYPH_ASPECT },
      uGlyphAvailable: { value: glyphs ? 1 : 0 },
    };
    this.mesh = new Mesh(this.geometry, this.patternMaterial(config.pattern));
    this.scene.add(this.mesh);
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
    });
    this.renderer.setClearAlpha(1);
    this.update(config, colors, glyphs);
  }

  get framesPerSecond(): number {
    return this.profile.framesPerSecond;
  }

  update(
    config: BalsaBackgroundConfig,
    colors: readonly string[],
    glyphs?: GradientBackgroundGlyphAtlas,
  ): void {
    if (this.disposed) return;
    const previousEffect = this.config.effect;
    this.config = config;
    this.profile = resolveGradientBackgroundQuality(
      config.quality,
      this.width,
      config.effect !== "none",
    );
    this.uniforms.uSeed.value = normalizeGradientBackgroundShaderSeed(
      config.seed,
    );
    this.uniforms.uScale.value = config.scale;
    this.uniforms.uWarp.value = config.warp;
    this.uniforms.uWave.value = config.wave;
    this.uniforms.uSoftness.value = config.softness;
    this.uniforms.uGrain.value = config.grain;
    this.uniforms.uSourceGrain.value = config.effect === "none" ? 1 : 0;
    this.uniforms.uContrast.value = config.contrast;
    this.uniforms.uBrightness.value = config.brightness;
    this.uniforms.uDirection.value = config.direction;
    this.uniforms.uFieldFrequency.value = config.fieldFrequency;
    this.uniforms.uNoiseFrequency.value = config.noiseFrequency;
    this.uniforms.uNoiseAmount.value = config.noiseAmount;
    this.uniforms.uWarpFrequency.value = config.warpFrequency;
    this.uniforms.uPatternDensity.value = config.patternDensity;
    this.uniforms.uPatternCenter.value.set(
      config.patternCenterX,
      config.patternCenterY,
    );
    this.uniforms.uPatternComplexity.value = config.patternComplexity;
    this.uniforms.uFieldOctaves.value = config.fieldOctaves;
    this.uniforms.uNoiseOctaves.value = config.noiseOctaves;
    this.uniforms.uColorCount.value = Math.max(2, Math.min(6, colors.length));
    for (let index = 0; index < 6; index += 1) {
      this.uniforms.uColors.value[index].setStyle(
        colors[Math.min(index, colors.length - 1)] ?? "#000000",
      );
    }
    this.mesh.material = this.patternMaterial(config.pattern);

    this.effectUniforms.uEffectAngle.value = config.effectAngle;
    this.effectUniforms.uEffectMix.value = config.effectMix;
    this.effectUniforms.uEffectInvert.value = config.effectInvert ? 1 : 0;
    this.effectUniforms.uEffectColorMode.value =
      GRADIENT_BACKGROUND_EFFECT_COLOR_MODES.indexOf(config.effectColorMode);
    this.effectUniforms.uEffectShape.value =
      GRADIENT_BACKGROUND_EFFECT_SHAPES.indexOf(config.effectShape);
    this.effectUniforms.uEffectLevels.value = config.effectLevels;
    this.effectUniforms.uInk.value.setStyle(config.effectInk);
    this.effectUniforms.uPaper.value.setStyle(config.effectPaper);
    this.effectUniforms.uSeed.value = normalizeGradientBackgroundShaderSeed(
      config.seed,
    );
    this.effectUniforms.uGrain.value = config.grain;
    this.effectUniforms.uGlyphs.value = glyphs?.texture ?? null;
    this.effectUniforms.uGlyphColumns.value = glyphs?.columns ?? 1;
    this.effectUniforms.uGlyphAspect.value = glyphs?.aspect
      ?? GRADIENT_BACKGROUND_GLYPH_ASPECT;
    this.effectUniforms.uGlyphAvailable.value = glyphs ? 1 : 0;

    const effect = config.effect;
    if (effect === "none") {
      this.releaseTarget();
    } else {
      // The target's filtering depends on the effect, so a change of effect
      // needs a fresh one rather than a resize.
      if (previousEffect !== effect) this.releaseTarget();
      this.effectMesh = this.ensureEffectMesh(effect);
    }
    this.applySize();
  }

  resize(width: number, height: number): void {
    if (this.disposed) return;
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    this.profile = resolveGradientBackgroundQuality(
      this.config.quality,
      this.width,
      this.config.effect !== "none",
    );
    this.applySize();
  }

  render(time: number): void {
    if (this.disposed) return;
    this.uniforms.uTime.value = time;
    if (this.config.effect === "none" || !this.effectMesh) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    const target = this.ensureTarget();
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.effectUniforms.uSource.value = target.texture;
    this.renderer.render(this.effectScene, this.camera);
  }

  async capturePng(options: GradientBackgroundCaptureOptions = {}): Promise<Blob> {
    if (this.disposed) throw new Error("The background renderer is no longer available.");
    const width = Math.min(4096, Math.max(320, Math.round(options.width ?? this.width)));
    const height = Math.min(4096, Math.max(320, Math.round(options.height ?? this.height)));
    const canvas = document.createElement("canvas");
    const captureRenderer = new WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: true,
    });
    const previousWidth = this.uniforms.uResolution.value.x;
    const previousHeight = this.uniforms.uResolution.value.y;
    const previousCellPixels = this.effectUniforms.uCellPixels.value;
    const previousGrainPixels = this.uniforms.uGrainPixels.value;
    const previousSource = this.effectUniforms.uSource.value;
    const previousEffectWidth = this.effectUniforms.uResolution.value.x;
    const previousEffectHeight = this.effectUniforms.uResolution.value.y;
    // Render targets carry per-context state, so the capture renderer cannot
    // borrow the live one.
    let captureTarget: WebGLRenderTarget | undefined;
    try {
      captureRenderer.setPixelRatio(1);
      captureRenderer.setSize(width, height, false);
      this.uniforms.uResolution.value.set(width, height);
      // Grain scales with the capture the same way cells do, so an export
      // carries the grain the preview showed rather than a finer one.
      const captureGrainPixels = resolveGradientBackgroundCellPixels(
        this.config.grainSize,
        width,
        this.width,
      );
      this.uniforms.uGrainPixels.value = captureGrainPixels;
      this.effectUniforms.uGrainPixels.value = captureGrainPixels;
      if (this.config.effect === "none" || !this.effectMesh) {
        captureRenderer.render(this.scene, this.camera);
      } else {
        captureTarget = createRenderTarget(width, height, this.config.effect);
        this.effectUniforms.uResolution.value.set(width, height);
        this.effectUniforms.uCellPixels.value = resolveGradientBackgroundCellPixels(
          this.config.effectScale,
          width,
          this.width,
        );
        captureRenderer.setRenderTarget(captureTarget);
        captureRenderer.render(this.scene, this.camera);
        captureRenderer.setRenderTarget(null);
        this.effectUniforms.uSource.value = captureTarget.texture;
        captureRenderer.render(this.effectScene, this.camera);
      }
      return await blobFromCanvas(canvas);
    } finally {
      this.uniforms.uResolution.value.set(previousWidth, previousHeight);
      this.effectUniforms.uResolution.value.set(
        previousEffectWidth,
        previousEffectHeight,
      );
      this.effectUniforms.uCellPixels.value = previousCellPixels;
      this.uniforms.uGrainPixels.value = previousGrainPixels;
      this.effectUniforms.uGrainPixels.value = previousGrainPixels;
      this.effectUniforms.uSource.value = previousSource;
      captureTarget?.dispose();
      captureRenderer.dispose();
      captureRenderer.forceContextLoss();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.remove(this.mesh);
    if (this.effectMesh) this.effectScene.remove(this.effectMesh);
    this.releaseTarget();
    this.geometry.dispose();
    for (const material of this.materials.values()) material.dispose();
    for (const material of this.effectMaterials.values()) material.dispose();
    this.materials.clear();
    this.effectMaterials.clear();
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  /**
   * One compiled program per pattern the user has visited. They share a single
   * uniforms object, so switching pattern swaps the material and nothing else.
   */
  private patternMaterial(pattern: GradientBackgroundPattern): ShaderMaterial {
    const existing = this.materials.get(pattern);
    if (existing) return existing;
    const material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: gradientBackgroundVertexShader,
      fragmentShader: buildGradientBackgroundFragmentShader(pattern),
      depthTest: false,
      depthWrite: false,
    });
    this.materials.set(pattern, material);
    return material;
  }

  private ensureEffectMesh(effect: GradientBackgroundAppliedEffect): Mesh {
    let material = this.effectMaterials.get(effect);
    if (!material) {
      material = new ShaderMaterial({
        uniforms: this.effectUniforms,
        vertexShader: gradientBackgroundEffectVertexShader,
        fragmentShader: buildGradientBackgroundEffectFragmentShader(effect),
        depthTest: false,
        depthWrite: false,
      });
      this.effectMaterials.set(effect, material);
    }
    if (!this.effectMesh) {
      this.effectMesh = new Mesh(this.geometry, material);
      this.effectScene.add(this.effectMesh);
    } else {
      this.effectMesh.material = material;
    }
    return this.effectMesh;
  }

  private ensureTarget(): WebGLRenderTarget {
    const width = Math.max(1, Math.round(this.width * this.pixelRatio()));
    const height = Math.max(1, Math.round(this.height * this.pixelRatio()));
    if (!this.target) {
      this.target = createRenderTarget(width, height, this.config.effect);
    } else if (this.target.width !== width || this.target.height !== height) {
      this.target.setSize(width, height);
    }
    return this.target;
  }

  private releaseTarget(): void {
    this.target?.dispose();
    this.target = undefined;
  }

  private pixelRatio(): number {
    const devicePixelRatio = typeof window === "undefined"
      ? 1
      : window.devicePixelRatio || 1;
    return Math.min(devicePixelRatio, this.profile.maxPixelRatio)
      * this.profile.pixelRatioScale;
  }

  private applySize(): void {
    const pixelRatio = this.pixelRatio();
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(this.width, this.height, false);
    this.uniforms.uResolution.value.set(this.width, this.height);

    const bufferWidth = Math.max(1, Math.round(this.width * pixelRatio));
    const bufferHeight = Math.max(1, Math.round(this.height * pixelRatio));
    this.effectUniforms.uResolution.value.set(bufferWidth, bufferHeight);
    this.effectUniforms.uCellPixels.value = resolveGradientBackgroundCellPixels(
      this.config.effectScale,
      bufferWidth,
      this.width,
    );
    // Grain is authored in CSS pixels for the same reason cells are: otherwise
    // a 2x display halves its size and it fades to almost nothing.
    const grainPixels = resolveGradientBackgroundCellPixels(
      this.config.grainSize,
      bufferWidth,
      this.width,
    );
    this.uniforms.uGrainPixels.value = grainPixels;
    this.effectUniforms.uGrainPixels.value = grainPixels;
    if (this.target) this.target.setSize(bufferWidth, bufferHeight);
  }
}
