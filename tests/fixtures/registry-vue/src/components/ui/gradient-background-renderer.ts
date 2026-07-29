import {
  Color,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  type IUniform,
} from "three";
import type {
  BalsaBackgroundConfig,
  GradientBackgroundCaptureOptions,
  GradientBackgroundQuality,
} from "./gradient-background";
import {
  gradientBackgroundFragmentShader,
  gradientBackgroundVertexShader,
} from "./gradient-background-shader";

interface GradientUniforms extends Record<string, IUniform> {
  uResolution: IUniform<Vector2>;
  uTime: IUniform<number>;
  uSeed: IUniform<number>;
  uScale: IUniform<number>;
  uWarp: IUniform<number>;
  uWave: IUniform<number>;
  uSoftness: IUniform<number>;
  uGrain: IUniform<number>;
  uGrainSize: IUniform<number>;
  uContrast: IUniform<number>;
  uBrightness: IUniform<number>;
  uDirection: IUniform<number>;
  uFieldFrequency: IUniform<number>;
  uNoiseFrequency: IUniform<number>;
  uNoiseAmount: IUniform<number>;
  uWarpFrequency: IUniform<number>;
  uRibbonDensity: IUniform<number>;
  uFieldOctaves: IUniform<number>;
  uNoiseOctaves: IUniform<number>;
  uColorCount: IUniform<number>;
  uColors: IUniform<Color[]>;
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

const shaderSeedModulus = 65521;

export function normalizeGradientBackgroundShaderSeed(seed: number): number {
  const integer = Number.isFinite(seed) ? Math.trunc(seed) : 0;
  return ((integer % shaderSeedModulus) + shaderSeedModulus)
    % shaderSeedModulus;
}

export function resolveGradientBackgroundQuality(
  quality: GradientBackgroundQuality,
  width: number,
): GradientBackgroundQualityProfile {
  if (quality !== "auto") return qualityProfiles[quality];
  return width <= 480 ? qualityProfiles.low : qualityProfiles.medium;
}

function blobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not encode the background PNG."));
    }, "image/png");
  });
}

export class GradientBackgroundRenderer {
  readonly uniforms: GradientUniforms;

  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly geometry = new PlaneGeometry(2, 2);
  private readonly material: ShaderMaterial;
  private readonly mesh: Mesh;
  private config: BalsaBackgroundConfig;
  private width = 1;
  private height = 1;
  private disposed = false;
  private profile: GradientBackgroundQualityProfile;

  constructor(
    canvas: HTMLCanvasElement,
    config: BalsaBackgroundConfig,
    colors: readonly string[],
  ) {
    this.config = config;
    this.profile = resolveGradientBackgroundQuality(config.quality, 1);
    this.uniforms = {
      uResolution: { value: new Vector2(1, 1) },
      uTime: { value: 0 },
      uSeed: { value: normalizeGradientBackgroundShaderSeed(config.seed) },
      uScale: { value: config.scale },
      uWarp: { value: config.warp },
      uWave: { value: config.wave },
      uSoftness: { value: config.softness },
      uGrain: { value: config.grain },
      uGrainSize: { value: config.grainSize },
      uContrast: { value: config.contrast },
      uBrightness: { value: config.brightness },
      uDirection: { value: config.direction },
      uFieldFrequency: { value: config.fieldFrequency },
      uNoiseFrequency: { value: config.noiseFrequency },
      uNoiseAmount: { value: config.noiseAmount },
      uWarpFrequency: { value: config.warpFrequency },
      uRibbonDensity: { value: config.ribbonDensity },
      uFieldOctaves: { value: config.fieldOctaves },
      uNoiseOctaves: { value: config.noiseOctaves },
      uColorCount: { value: colors.length },
      uColors: { value: Array.from({ length: 6 }, () => new Color("#000000")) },
    };
    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: gradientBackgroundVertexShader,
      fragmentShader: gradientBackgroundFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
    this.renderer.setClearAlpha(1);
    this.update(config, colors);
  }

  get framesPerSecond(): number {
    return this.profile.framesPerSecond;
  }

  update(config: BalsaBackgroundConfig, colors: readonly string[]): void {
    if (this.disposed) return;
    this.config = config;
    this.profile = resolveGradientBackgroundQuality(config.quality, this.width);
    this.uniforms.uSeed.value = normalizeGradientBackgroundShaderSeed(
      config.seed,
    );
    this.uniforms.uScale.value = config.scale;
    this.uniforms.uWarp.value = config.warp;
    this.uniforms.uWave.value = config.wave;
    this.uniforms.uSoftness.value = config.softness;
    this.uniforms.uGrain.value = config.grain;
    this.uniforms.uGrainSize.value = config.grainSize;
    this.uniforms.uContrast.value = config.contrast;
    this.uniforms.uBrightness.value = config.brightness;
    this.uniforms.uDirection.value = config.direction;
    this.uniforms.uFieldFrequency.value = config.fieldFrequency;
    this.uniforms.uNoiseFrequency.value = config.noiseFrequency;
    this.uniforms.uNoiseAmount.value = config.noiseAmount;
    this.uniforms.uWarpFrequency.value = config.warpFrequency;
    this.uniforms.uRibbonDensity.value = config.ribbonDensity;
    this.uniforms.uFieldOctaves.value = config.fieldOctaves;
    this.uniforms.uNoiseOctaves.value = config.noiseOctaves;
    this.uniforms.uColorCount.value = Math.max(2, Math.min(6, colors.length));
    for (let index = 0; index < 6; index += 1) {
      this.uniforms.uColors.value[index].setStyle(
        colors[Math.min(index, colors.length - 1)] ?? "#000000",
      );
    }
    this.applySize();
  }

  resize(width: number, height: number): void {
    if (this.disposed) return;
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    this.profile = resolveGradientBackgroundQuality(this.config.quality, this.width);
    this.applySize();
  }

  render(time: number): void {
    if (this.disposed) return;
    this.uniforms.uTime.value = time;
    this.renderer.render(this.scene, this.camera);
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
    try {
      captureRenderer.setPixelRatio(1);
      captureRenderer.setSize(width, height, false);
      this.uniforms.uResolution.value.set(width, height);
      captureRenderer.render(this.scene, this.camera);
      return await blobFromCanvas(canvas);
    } finally {
      this.uniforms.uResolution.value.set(previousWidth, previousHeight);
      captureRenderer.dispose();
      captureRenderer.forceContextLoss();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private applySize(): void {
    const devicePixelRatio = typeof window === "undefined"
      ? 1
      : window.devicePixelRatio || 1;
    const pixelRatio = Math.min(devicePixelRatio, this.profile.maxPixelRatio)
      * this.profile.pixelRatioScale;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(this.width, this.height, false);
    this.uniforms.uResolution.value.set(this.width, this.height);
  }
}
