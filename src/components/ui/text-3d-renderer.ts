import {
  AgXToneMapping,
  Box3,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhysicalMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RectAreaLight,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
  type Texture,
  type WebGLRenderTarget,
} from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import {
  TEXT_3D_ENVIRONMENT_RECIPES,
  buildText3DBackdropGroup,
  buildText3DEnvironmentScene,
  disposeText3DObjectResources,
  resolveText3DEnvironmentColor,
  text3DBackdropSignature,
  text3DEnvironmentSignature,
  text3DLightSignature,
  text3DLightingRotation,
  text3DQualitySettings,
  type Text3DEffectiveQuality,
  type Text3DEnvironmentColors,
} from "./text-3d-environments";
import {
  normalizeText3DConfig,
  text3DRanges,
  type BalsaText3DConfig,
  type Text3DAlignment,
  type Text3DCaptureOptions,
  type Text3DPose,
  type Text3DWheelZoom,
} from "./text-3d";
import { buildText3DLiquidGeometry } from "./text-3d-liquid-geometry";

export type { Text3DEnvironmentColors } from "./text-3d-environments";

export interface Text3DGlyphLayout {
  character: string;
  line: number;
  x: number;
  y: number;
}

export interface Text3DLayout {
  glyphs: Text3DGlyphLayout[];
  lineWidths: number[];
  width: number;
  height: number;
}

/** Pure layout shared by the renderer and unit tests. */
export function layoutText3DGlyphs(
  text: string,
  measure: (character: string) => number,
  options: {
    size: number;
    letterSpacing: number;
    lineHeight: number;
    alignment: Text3DAlignment;
  },
): Text3DLayout {
  const lines = text.split("\n");
  const spacing = options.letterSpacing * options.size;
  const lineWidths = lines.map((line) => {
    const characters = Array.from(line);
    return characters.reduce((sum, character) => sum + measure(character), 0)
      + Math.max(0, characters.length - 1) * spacing;
  });
  const width = Math.max(0, ...lineWidths);
  const baselineGap = options.lineHeight * options.size;
  const glyphs: Text3DGlyphLayout[] = [];

  lines.forEach((line, lineIndex) => {
    const lineWidth = lineWidths[lineIndex] ?? 0;
    let cursor = options.alignment === "center"
      ? (width - lineWidth) / 2
      : options.alignment === "right"
        ? width - lineWidth
        : 0;
    Array.from(line).forEach((character, characterIndex, characters) => {
      glyphs.push({
        character,
        line: lineIndex,
        x: cursor,
        y: lineIndex === 0 ? 0 : -lineIndex * baselineGap,
      });
      cursor += measure(character);
      if (characterIndex < characters.length - 1) cursor += spacing;
    });
  });

  return {
    glyphs,
    lineWidths,
    width,
    height: options.size + Math.max(0, lines.length - 1) * baselineGap,
  };
}

function radians(degrees: number): number {
  return degrees * Math.PI / 180;
}

function degrees(radiansValue: number): number {
  return radiansValue * 180 / Math.PI;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizedWheelDelta(event: WheelEvent): number {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * 800;
  return event.deltaY;
}

export interface Text3DMotionFrame {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  positionX: number;
  positionY: number;
}

interface Text3DPointerBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Motion state is independent of Three.js so pointer handoff, reduced motion,
 * and the four exclusive modes can be verified without a WebGL context.
 */
export class Text3DMotionController {
  private config: BalsaText3DConfig;
  private reducedMotion = false;
  private dragging = false;
  private pointerId?: number;
  private pointerX = 0;
  private pointerY = 0;
  private dragX = 0;
  private dragY = 0;
  private pointerTargetX = 0;
  private pointerTargetY = 0;
  private pointerTargetZ = 0;
  private pointerOffsetX = 0;
  private pointerOffsetY = 0;
  private pointerOffsetZ = 0;
  private autoRotation = 0;
  private floatTime = 0;
  private floatRotationX = 0;
  private floatRotationY = 0;
  private floatRotationZ = 0;
  private floatPositionX = 0;
  private floatPositionY = 0;
  private zoom: number;
  private committedZoom: number;

  constructor(config: BalsaText3DConfig) {
    this.config = config;
    this.zoom = config.zoom;
    this.committedZoom = config.zoom;
  }

  get isDragging(): boolean {
    return this.dragging;
  }

  get currentZoom(): number {
    return this.zoom;
  }

  updateConfig(config: BalsaText3DConfig): void {
    if (config.poseMode !== this.config.poseMode) this.resetDynamicMotion();
    // Adopt a parent-authored zoom (slider, reset, preset) without clobbering
    // a live wheel gesture whose commit has not reached the parent yet.
    if (config.zoom !== this.committedZoom) {
      this.zoom = config.zoom;
      this.committedZoom = config.zoom;
    }
    this.config = config;
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (reduced) this.resetDynamicMotion();
  }

  beginPoseDrag(pointerId: number, clientX: number, clientY: number): boolean {
    if (!this.config.interactive) return false;
    this.dragging = true;
    this.pointerId = pointerId;
    this.pointerX = clientX;
    this.pointerY = clientY;
    return true;
  }

  movePoseDrag(
    pointerId: number,
    clientX: number,
    clientY: number,
    width: number,
    height: number,
  ): boolean {
    if (!this.dragging || pointerId !== this.pointerId) return false;
    const sensitivity = Math.PI / Math.max(240, Math.min(width, height));
    const baseX = radians(this.config.rotationX);
    const baseY = radians(this.config.rotationY);
    this.dragX = clamp(
      baseX + this.dragX + (clientY - this.pointerY) * sensitivity,
      radians(text3DRanges.rotationX.min),
      radians(text3DRanges.rotationX.max),
    ) - baseX;
    this.dragY = clamp(
      baseY + this.dragY + (clientX - this.pointerX) * sensitivity,
      radians(text3DRanges.rotationY.min),
      radians(text3DRanges.rotationY.max),
    ) - baseY;
    this.pointerX = clientX;
    this.pointerY = clientY;
    return true;
  }

  endPoseDrag(pointerId: number): Text3DPose | undefined {
    if (!this.dragging || pointerId !== this.pointerId) return undefined;
    const baseRotationX = radians(this.config.rotationX) + this.dragX;
    const baseRotationY = radians(this.config.rotationY) + this.dragY;
    const pose = this.commitScenePose({
      rotationX: degrees(baseRotationX),
      rotationY: degrees(baseRotationY),
      rotationZ: this.config.rotationZ,
      zoom: this.zoom,
    });
    // Adopt only the normalized base pose before clearing the drag offsets.
    // The active motion offset remains separate, so release cannot absorb an
    // accumulated spin, cursor tilt, or float drift into the saved config.
    this.dragX = 0;
    this.dragY = 0;
    this.dragging = false;
    this.pointerId = undefined;
    return pose;
  }

  /**
   * Applies one wheel delta to the live zoom. Returns whether the value moved,
   * so the renderer can skip `preventDefault` at the range limit when a plain
   * wheel should keep scrolling the page.
   */
  applyWheelZoom(deltaY: number): boolean {
    if (!this.config.interactive) return false;
    const factor = Math.exp(-clamp(deltaY, -120, 120) * 0.001);
    const next = clamp(
      this.zoom * factor,
      text3DRanges.zoom.min,
      text3DRanges.zoom.max,
    );
    if (next === this.zoom) return false;
    this.zoom = next;
    return true;
  }

  commitWheelZoom(): Text3DPose | undefined {
    if (this.zoom === this.committedZoom) return undefined;
    return this.commitScenePose({ zoom: this.zoom });
  }

  private commitScenePose(overrides: Partial<BalsaText3DConfig>): Text3DPose {
    const committed = normalizeText3DConfig(
      { ...this.config, ...overrides },
      this.config.preset,
    );
    const pose: Text3DPose = {
      rotationX: committed.rotationX,
      rotationY: committed.rotationY,
      rotationZ: committed.rotationZ,
      zoom: committed.zoom,
    };
    this.config = { ...this.config, ...pose };
    this.zoom = committed.zoom;
    this.committedZoom = committed.zoom;
    return pose;
  }

  followPointer(clientX: number, clientY: number, bounds: Text3DPointerBounds): void {
    if (
      this.reducedMotion
      || !this.config.interactive
      || this.config.poseMode !== "pointer"
    ) return;
    const normalizedX = clamp(
      ((clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1,
      -1,
      1,
    );
    const normalizedY = clamp(
      ((clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1,
      -1,
      1,
    );
    this.pointerTargetX = -normalizedY * radians(10);
    this.pointerTargetY = normalizedX * radians(14);
    this.pointerTargetZ = -normalizedX * radians(4);
  }

  leavePointer(): void {
    this.pointerTargetX = 0;
    this.pointerTargetY = 0;
    this.pointerTargetZ = 0;
  }

  tick(delta: number): void {
    if (this.reducedMotion) return;
    if (this.config.poseMode === "auto-rotate") {
      this.autoRotation += delta * this.config.autoRotateSpeed * Math.PI * 2;
      return;
    }
    const amount = this.smoothingAmount(delta);
    if (this.config.poseMode === "pointer") {
      this.pointerOffsetX += (this.pointerTargetX - this.pointerOffsetX) * amount;
      this.pointerOffsetY += (this.pointerTargetY - this.pointerOffsetY) * amount;
      this.pointerOffsetZ += (this.pointerTargetZ - this.pointerOffsetZ) * amount;
      return;
    }
    if (this.config.poseMode !== "float") return;

    this.floatTime += delta;
    const time = this.floatTime;
    const phase = (this.config.seed % 360) * Math.PI / 180;
    const targetPositionX = this.config.size * (
      Math.sin(time * 0.43 + phase) * 0.034
      + Math.sin(time * 0.19 + 1.7) * 0.014
    );
    const targetPositionY = this.config.size * (
      Math.sin(time * 0.31 + phase * 0.7 + 0.8) * 0.047
      + Math.sin(time * 0.13 + 2.4) * 0.017
    );
    const targetRotationX = radians(
      Math.sin(time * 0.37 + phase) * 3.6
      + Math.sin(time * 0.17 + 1.3) * 1.4,
    );
    const targetRotationY = radians(
      Math.sin(time * 0.23 + phase * 0.5 + 2.1) * 4.7
      + Math.sin(time * 0.11 + 0.4) * 1.8,
    );
    const targetRotationZ = radians(Math.sin(time * 0.29 + 2.8) * 1.8);
    this.floatPositionX += (targetPositionX - this.floatPositionX) * amount;
    this.floatPositionY += (targetPositionY - this.floatPositionY) * amount;
    this.floatRotationX += (targetRotationX - this.floatRotationX) * amount;
    this.floatRotationY += (targetRotationY - this.floatRotationY) * amount;
    this.floatRotationZ += (targetRotationZ - this.floatRotationZ) * amount;
  }

  frame(): Text3DMotionFrame {
    const base = {
      rotationX: radians(this.config.rotationX) + this.dragX,
      rotationY: radians(this.config.rotationY) + this.dragY,
      rotationZ: radians(this.config.rotationZ),
      positionX: 0,
      positionY: 0,
    };
    if (this.reducedMotion || this.config.poseMode === "static") return base;
    if (this.config.poseMode === "pointer") {
      return {
        ...base,
        rotationX: base.rotationX + this.pointerOffsetX,
        rotationY: base.rotationY + this.pointerOffsetY,
        rotationZ: base.rotationZ + this.pointerOffsetZ,
      };
    }
    if (this.config.poseMode === "auto-rotate") {
      return { ...base, rotationY: base.rotationY + this.autoRotation };
    }
    return {
      rotationX: base.rotationX + this.floatRotationX,
      rotationY: base.rotationY + this.floatRotationY,
      rotationZ: base.rotationZ + this.floatRotationZ,
      positionX: this.floatPositionX,
      positionY: this.floatPositionY,
    };
  }

  resetPose(): void {
    this.resetDynamicMotion();
    this.zoom = this.config.zoom;
    this.committedZoom = this.config.zoom;
  }

  private smoothingAmount(delta: number): number {
    if (this.config.damping <= 0) return 1;
    const response = 14 - this.config.damping * 11;
    return 1 - Math.exp(-Math.max(0, delta) * response);
  }

  private resetDynamicMotion(): void {
    this.dragging = false;
    this.pointerId = undefined;
    this.dragX = 0;
    this.dragY = 0;
    this.pointerTargetX = 0;
    this.pointerTargetY = 0;
    this.pointerTargetZ = 0;
    this.pointerOffsetX = 0;
    this.pointerOffsetY = 0;
    this.pointerOffsetZ = 0;
    this.autoRotation = 0;
    this.floatTime = 0;
    this.floatRotationX = 0;
    this.floatRotationY = 0;
    this.floatRotationZ = 0;
    this.floatPositionX = 0;
    this.floatPositionY = 0;
  }
}

/** Pose commits on pointerup. A wheel burst has no discrete end, so wait until it settles. */
const TEXT_3D_ZOOM_COMMIT_DELAY_MS = 150;

/**
 * Whether this wheel event should zoom the 3D text rather than scroll the page.
 * Plain wheel over an embedded canvas must never be captured: Text3D is a
 * hero wordmark in a scrolling document. Ctrl/Cmd + wheel is the maps and
 * CompositionMatrix convention; `always` is the studio opt-in.
 */
export function shouldHandleText3DWheel(
  event: Pick<WheelEvent, "ctrlKey" | "metaKey">,
  options: { interactive: boolean; wheelZoom: Text3DWheelZoom },
): boolean {
  if (!options.interactive) return false;
  if (options.wheelZoom === "modifier" && !event.ctrlKey && !event.metaKey) {
    return false;
  }
  return true;
}

export function text3DGeometrySignature(config: BalsaText3DConfig): string {
  return JSON.stringify([
    config.preset,
    config.text,
    config.font,
    config.fontWeight,
    config.size,
    config.letterSpacing,
    config.lineHeight,
    config.alignment,
    config.depth,
    config.bevelEnabled,
    config.bevelSize,
    config.bevelThickness,
    config.bevelSegments,
    config.curveSegments,
    config.quality,
  ]);
}

/** Pure preset routing keeps every non-profiled glyph on native TextGeometry. */
export function resolveText3DGlyphGeometry(
  source: TextGeometry,
  preset: BalsaText3DConfig["preset"],
  size: number,
  quality: Text3DEffectiveQuality,
): BufferGeometry {
  if (preset === "liquid-chrome") {
    return buildText3DLiquidGeometry(source, size, quality, "liquid");
  }
  if (preset === "chrome-balloon") {
    return buildText3DLiquidGeometry(source, size, quality, "balloon");
  }
  return source;
}

/** Keep the loaded font identity independent from the authored font name. */
export function text3DGeometryNeedsRebuild(
  config: BalsaText3DConfig,
  currentSignature: string,
  font: Font,
  geometryFont: Font | undefined,
): boolean {
  return text3DGeometrySignature(config) !== currentSignature || font !== geometryFont;
}

/** Preset changes establish a new deterministic pose; same-preset edits do not. */
export function text3DPresetChanged(
  previous: BalsaText3DConfig,
  next: BalsaText3DConfig,
): boolean {
  return previous.preset !== next.preset;
}

function materialList(material: Material | Material[]): Material[] {
  return Array.isArray(material) ? material : [material];
}

export interface Text3DPhysicalMaterialState {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  ior: number;
  thickness: number;
  emissive: string;
  emissiveIntensity: number;
  envMapIntensity: number;
  transparent: false;
  opacity: 1;
  attenuationColor: string;
  attenuationDistance: number;
  dispersion: number;
}

/** Pure physical-material projection, intentionally testable without WebGL. */
export function text3DPhysicalMaterialState(
  config: BalsaText3DConfig,
): Text3DPhysicalMaterialState {
  const glass = config.material === "glass";
  const thickness = glass ? config.thickness * config.size : 0;
  return {
    // Keep the interface clear and put the authored body tint into Beer-Lambert
    // attenuation, where a volume color physically belongs.
    color: glass ? "#FFFFFF" : config.colors[0],
    metalness: config.metalness,
    roughness: config.roughness,
    clearcoat: config.clearcoat,
    clearcoatRoughness: config.clearcoatRoughness,
    transmission: glass ? config.transmission : 0,
    ior: glass ? config.ior : 1.5,
    thickness,
    emissive: config.colors[1],
    emissiveIntensity: config.glow,
    envMapIntensity: config.reflectionStrength,
    transparent: false,
    opacity: 1,
    attenuationColor: config.colors[0],
    attenuationDistance: glass ? Math.max(0.5, thickness * 1.5) : Number.POSITIVE_INFINITY,
    dispersion: glass
      ? config.environment === "dramatic"
        ? 0.35
        : config.environment === "neon"
          ? 0.18
          : 0
      : 0,
  };
}

let rectAreaLightUniformsInitialized = false;

function initializeRectAreaLights(): void {
  if (rectAreaLightUniformsInitialized) return;
  RectAreaLightUniformsLib.init();
  rectAreaLightUniformsInitialized = true;
}

export class Text3DRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(36, 1, 0.01, 1000);
  private readonly textRoot = new Group();
  private readonly lights = new Group();
  private readonly pmrem: PMREMGenerator;
  private readonly pointerHandlers: Record<string, EventListener>;
  private readonly wheelHandler: EventListener;
  private config: BalsaText3DConfig;
  private font: Font;
  private geometryFont?: Font;
  private environmentColors: Text3DEnvironmentColors;
  private material = new MeshPhysicalMaterial();
  private environmentTarget?: WebGLRenderTarget<Texture>;
  private backdropGroup?: Group;
  private shadowPlane?: Mesh<PlaneGeometry, ShadowMaterial>;
  private geometryKey = "";
  private environmentKey = "";
  private lightKey = "";
  private backdropKey = "";
  private materialProgramKey = "";
  private width = 1;
  private height = 1;
  private animationFrame = 0;
  private lastTimestamp = 0;
  private animationActive = false;
  private readonly motion: Text3DMotionController;
  private readonly onPoseCommit?: (pose: Text3DPose) => void;
  private wheelZoom: Text3DWheelZoom;
  private zoomCommitTimer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;

  constructor(
    canvas: HTMLCanvasElement,
    config: BalsaText3DConfig,
    font: Font,
    environmentColors: Text3DEnvironmentColors = {},
    onPoseCommit?: (pose: Text3DPose) => void,
    wheelZoom: Text3DWheelZoom = "modifier",
  ) {
    this.canvas = canvas;
    this.config = config;
    this.font = font;
    this.environmentColors = environmentColors;
    this.motion = new Text3DMotionController(config);
    this.onPoseCommit = onPoseCommit;
    this.wheelZoom = wheelZoom;
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: config.quality !== "low",
      powerPreference: config.quality === "high" ? "high-performance" : "default",
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = AgXToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.updateQualitySettings();
    initializeRectAreaLights();
    this.pmrem = new PMREMGenerator(this.renderer);
    this.scene.add(this.textRoot, this.lights);

    this.pointerHandlers = {
      pointerdown: this.handlePointerDown as EventListener,
      pointermove: this.handlePointerMove as EventListener,
      pointerup: this.handlePointerUp as EventListener,
      pointercancel: this.handlePointerUp as EventListener,
      pointerleave: this.handlePointerLeave as EventListener,
    };
    for (const [name, handler] of Object.entries(this.pointerHandlers)) {
      canvas.addEventListener(name, handler);
    }
    this.wheelHandler = this.handleWheel as EventListener;
    canvas.addEventListener("wheel", this.wheelHandler, { passive: false });
    canvas.style.touchAction = "none";
    this.updateCursor();
    this.rebuildGeometry();
    this.updateMaterial();
    this.rebuildEnvironment();
    this.rebuildLights();
    this.rebuildBackdrop();
    this.applyLightingRotation();
    this.applyPose();
  }

  get framesPerSecond(): number {
    const quality = this.effectiveQuality();
    return quality === "low" ? 30 : quality === "medium" ? 45 : 60;
  }

  update(
    config: BalsaText3DConfig,
    font: Font,
    environmentColors: Text3DEnvironmentColors = {},
  ): void {
    const presetChanged = text3DPresetChanged(this.config, config);
    this.config = config;
    this.motion.updateConfig(config);
    this.font = font;
    this.environmentColors = environmentColors;
    if (presetChanged) {
      this.cancelZoomCommit();
      this.motion.resetPose();
    }
    this.updateQualitySettings();
    if (text3DGeometryNeedsRebuild(config, this.geometryKey, font, this.geometryFont)) {
      this.rebuildGeometry();
    }
    this.updateMaterial();
    const quality = this.effectiveQuality();
    if (text3DEnvironmentSignature(config, environmentColors, quality) !== this.environmentKey) {
      this.rebuildEnvironment();
    }
    if (text3DLightSignature(config, environmentColors, quality, this.geometryKey) !== this.lightKey) {
      this.rebuildLights();
    }
    if (text3DBackdropSignature(config, environmentColors, this.geometryKey) !== this.backdropKey) {
      this.rebuildBackdrop();
    }
    this.applyLightingRotation();
    this.updateCursor();
    this.applyPose();
    this.frameCamera();
    this.render();
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    const quality = this.effectiveQuality();
    const maximumRatio = quality === "low"
      ? 1
      : quality === "medium"
        ? 1.5
        : 2;
    const ratio = typeof window === "undefined"
      ? 1
      : Math.min(maximumRatio, window.devicePixelRatio || 1);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.frameCamera();
  }

  setAnimationActive(active: boolean, reducedMotion = false): void {
    this.motion.setReducedMotion(reducedMotion);
    this.animationActive = active && !reducedMotion;
    if (this.animationActive && !this.animationFrame) {
      this.animationFrame = requestAnimationFrame(this.animate);
    } else if (!this.animationActive && this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
      this.lastTimestamp = 0;
    }
    this.applyPose();
    this.render();
  }

  render(): void {
    if (this.disposed) return;
    this.renderer.setClearColor(
      this.config.backgroundColor,
      this.config.background ? 1 : 0,
    );
    this.renderer.render(this.scene, this.camera);
  }

  resetPose(): void {
    this.cancelZoomCommit();
    this.motion.resetPose();
    this.applyPose();
    this.frameCamera();
    this.render();
  }

  async capturePng(options: Text3DCaptureOptions = {}): Promise<Blob> {
    const previousWidth = this.width;
    const previousHeight = this.height;
    const width = Math.min(4096, Math.max(320, Math.round(options.width ?? previousWidth)));
    const height = Math.min(4096, Math.max(320, Math.round(options.height ?? previousHeight)));
    const previousBackground = this.config.background;
    const forceOpaqueBackdrop = options.opaque === true && !previousBackground;
    try {
      this.resize(width, height);
      if (forceOpaqueBackdrop) {
        this.config = { ...this.config, background: true };
        this.rebuildBackdrop();
      }
      this.render();
      return await new Promise<Blob>((resolve, reject) => {
        this.canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("The browser could not encode the 3D text PNG."));
        }, "image/png");
      });
    } finally {
      if (forceOpaqueBackdrop) {
        this.config = { ...this.config, background: previousBackground };
        this.rebuildBackdrop();
      }
      this.resize(previousWidth, previousHeight);
      this.render();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.setAnimationActive(false);
    for (const [name, handler] of Object.entries(this.pointerHandlers)) {
      this.canvas.removeEventListener(name, handler);
    }
    this.canvas.removeEventListener("wheel", this.wheelHandler);
    this.cancelZoomCommit();
    this.disposeText();
    this.material.dispose();
    this.disposeEnvironment();
    this.disposeLights();
    this.disposeBackdrop();
    this.pmrem.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.style.cursor = "";
    this.canvas.style.touchAction = "";
  }

  private readonly animate = (timestamp: number): void => {
    this.animationFrame = 0;
    if (!this.animationActive || this.disposed) return;
    const interval = 1000 / this.framesPerSecond;
    if (this.lastTimestamp && timestamp - this.lastTimestamp < interval) {
      this.animationFrame = requestAnimationFrame(this.animate);
      return;
    }
    const delta = this.lastTimestamp ? Math.min(0.1, (timestamp - this.lastTimestamp) / 1000) : 0;
    this.lastTimestamp = timestamp;
    this.motion.tick(delta);
    this.applyPose();
    this.render();
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private effectiveQuality(): Text3DEffectiveQuality {
    if (this.config.quality !== "auto") return this.config.quality;
    if (typeof navigator === "undefined") return "low";
    const capability = navigator as Navigator & { deviceMemory?: number };
    const memory = capability.deviceMemory ?? 8;
    const cores = capability.hardwareConcurrency || 8;
    if (memory <= 2 || cores <= 2) return "low";
    if (memory <= 4 || cores <= 4) return "medium";
    return "high";
  }

  private updateQualitySettings(): void {
    const settings = text3DQualitySettings(this.effectiveQuality());
    this.renderer.transmissionResolutionScale = settings.transmissionResolutionScale;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.motion.beginPoseDrag(event.pointerId, event.clientX, event.clientY)) return;
    this.canvas.setPointerCapture(event.pointerId);
    this.updateCursor();
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.motion.movePoseDrag(
      event.pointerId,
      event.clientX,
      event.clientY,
      this.width,
      this.height,
    )) {
      this.applyPose();
      this.render();
      return;
    }
    if (!this.animationActive) return;
    this.motion.followPointer(
      event.clientX,
      event.clientY,
      this.canvas.getBoundingClientRect(),
    );
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    const pose = this.motion.endPoseDrag(event.pointerId);
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    if (!pose) return;
    this.config = { ...this.config, ...pose };
    this.motion.updateConfig(this.config);
    this.applyPose();
    this.render();
    this.updateCursor();
    this.onPoseCommit?.(pose);
  };

  private readonly handlePointerLeave = (): void => {
    this.motion.leavePointer();
  };

  setWheelZoom(wheelZoom: Text3DWheelZoom): void {
    this.wheelZoom = wheelZoom;
  }

  private readonly handleWheel = (event: WheelEvent): void => {
    if (!shouldHandleText3DWheel(event, {
      interactive: this.config.interactive,
      wheelZoom: this.wheelZoom,
    })) return;
    const changed = this.motion.applyWheelZoom(normalizedWheelDelta(event));
    // Modifier-held wheel would otherwise zoom the browser. At the range
    // limit a plain `always` wheel is left to the page so a reader is never
    // trapped on an embedded canvas.
    if (changed || event.ctrlKey || event.metaKey) event.preventDefault();
    if (!changed) return;
    this.frameCamera();
    this.render();
    this.scheduleZoomCommit();
  };

  private scheduleZoomCommit(): void {
    this.cancelZoomCommit();
    this.zoomCommitTimer = setTimeout(() => {
      this.zoomCommitTimer = undefined;
      if (this.disposed) return;
      const pose = this.motion.commitWheelZoom();
      if (!pose) return;
      this.config = { ...this.config, ...pose };
      this.motion.updateConfig(this.config);
      this.onPoseCommit?.(pose);
    }, TEXT_3D_ZOOM_COMMIT_DELAY_MS);
  }

  private cancelZoomCommit(): void {
    if (this.zoomCommitTimer === undefined) return;
    clearTimeout(this.zoomCommitTimer);
    this.zoomCommitTimer = undefined;
  }

  private updateCursor(): void {
    this.canvas.style.cursor = this.config.interactive
      ? this.motion.isDragging ? "grabbing" : "grab"
      : "";
  }

  private applyPose(): void {
    const frame = this.motion.frame();
    this.textRoot.rotation.set(
      frame.rotationX,
      frame.rotationY,
      frame.rotationZ,
    );
    this.textRoot.position.set(frame.positionX, frame.positionY, 0);
  }

  private glyphAdvance(character: string): number {
    const data = this.font.data;
    const glyph = data.glyphs[character] ?? data.glyphs["?"];
    return glyph ? glyph.ha * this.config.size / data.resolution : 0;
  }

  private disposeText(): void {
    for (const child of [...this.textRoot.children]) {
      this.textRoot.remove(child);
      if (child instanceof Mesh) {
        child.geometry.dispose();
        for (const item of materialList(child.material)) {
          if (item !== this.material) item.dispose();
        }
      }
    }
  }

  private rebuildGeometry(): void {
    this.disposeText();
    const layout = layoutText3DGlyphs(
      this.config.text,
      (character) => this.glyphAdvance(character),
      this.config,
    );
    for (const glyph of layout.glyphs) {
      if (/\s/u.test(glyph.character)) continue;
      const sourceGeometry = new TextGeometry(glyph.character, {
        font: this.font,
        size: this.config.size,
        depth: this.config.depth * this.config.size,
        curveSegments: this.config.curveSegments,
        bevelEnabled: this.config.bevelEnabled,
        bevelThickness: this.config.bevelThickness * this.config.size,
        bevelSize: this.config.bevelSize * this.config.size,
        bevelSegments: this.config.bevelSegments,
      });
      const geometry = resolveText3DGlyphGeometry(
        sourceGeometry,
        this.config.preset,
        this.config.size,
        this.effectiveQuality(),
      );
      if (geometry !== sourceGeometry) sourceGeometry.dispose();
      const mesh = new Mesh(geometry, this.material);
      mesh.position.set(glyph.x, glyph.y, 0);
      mesh.castShadow = true;
      this.textRoot.add(mesh);
    }
    // Geometry centering must not inherit the pose of the preset we just left.
    // Measuring in object space makes Liquid -> Poster -> Liquid rebuild the
    // same mesh and camera frame as a fresh Liquid mount.
    const bounds = this.neutralTextBounds();
    if (!bounds.isEmpty()) {
      const center = bounds.getCenter(new Vector3());
      for (const child of this.textRoot.children) child.position.sub(center);
    }
    this.geometryKey = text3DGeometrySignature(this.config);
    this.geometryFont = this.font;
    this.frameCamera();
  }

  private neutralTextBounds(): Box3 {
    const rotation = this.textRoot.rotation.clone();
    this.textRoot.rotation.set(0, 0, 0);
    this.textRoot.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(this.textRoot);
    this.textRoot.rotation.copy(rotation);
    this.textRoot.updateMatrixWorld(true);
    return bounds;
  }

  private frameCamera(): void {
    // Pose changes rotate the text inside a stable camera; they must not zoom
    // the camera according to the temporary world-space depth of that angle.
    const bounds = this.neutralTextBounds();
    if (bounds.isEmpty()) return;
    const size = bounds.getSize(new Vector3());
    // PerspectiveCamera defines fov vertically and width as height * aspect,
    // so both axes need their own fit distance before taking the larger one.
    // Source: https://threejs.org/manual/en/cameras.html
    const verticalFov = radians(this.camera.fov);
    const distanceForHeight = (size.y * 0.62) / Math.tan(verticalFov / 2);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);
    const distanceForWidth = (size.x * 0.62) / Math.tan(horizontalFov / 2);
    const fitDistance = Math.max(distanceForHeight, distanceForWidth, size.z * 4, 1);
    const distance = fitDistance / this.motion.currentZoom;
    this.camera.position.set(0, 0, distance + size.z * 0.5);
    this.camera.near = Math.max(0.01, distance / 100);
    this.camera.far = distance * 20 + size.z * 4;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
  }

  private updateMaterial(): void {
    const state = text3DPhysicalMaterialState(this.config);
    this.material.color.set(state.color);
    this.material.metalness = state.metalness;
    this.material.roughness = state.roughness;
    this.material.clearcoat = state.clearcoat;
    this.material.clearcoatRoughness = state.clearcoatRoughness;
    this.material.transmission = state.transmission;
    this.material.ior = state.ior;
    this.material.thickness = state.thickness;
    this.material.emissive.set(state.emissive);
    this.material.emissiveIntensity = state.emissiveIntensity;
    this.material.envMapIntensity = state.envMapIntensity;
    this.material.transparent = state.transparent;
    this.material.opacity = state.opacity;
    this.material.attenuationColor.set(state.attenuationColor);
    this.material.attenuationDistance = state.attenuationDistance;
    this.material.dispersion = state.dispersion;

    const nextProgramKey = JSON.stringify([
      state.transmission > 0,
      state.clearcoat > 0,
      state.dispersion > 0,
    ]);
    if (nextProgramKey !== this.materialProgramKey) {
      this.material.needsUpdate = true;
      this.materialProgramKey = nextProgramKey;
    }
    for (const child of this.textRoot.children) child.castShadow = this.config.shadow;
  }

  private disposeEnvironment(): void {
    this.scene.environment = null;
    this.environmentTarget?.dispose();
    this.environmentTarget = undefined;
  }

  private rebuildEnvironment(): void {
    const quality = this.effectiveQuality();
    const settings = text3DQualitySettings(quality);
    const recipe = TEXT_3D_ENVIRONMENT_RECIPES[this.config.environment];
    const environmentScene = buildText3DEnvironmentScene(this.config, this.environmentColors);
    let nextTarget: WebGLRenderTarget<Texture>;
    try {
      // EmissiveIntensity stays open-domain through this scene capture, unlike
      // the former Uint8 equirectangular texture. PMREM retains the HDR result.
      nextTarget = this.pmrem.fromScene(
        environmentScene,
        recipe.pmremSigma,
        0.1,
        30,
        { size: settings.pmremSize },
      );
    } finally {
      disposeText3DObjectResources(environmentScene);
      environmentScene.clear();
    }

    const previousTarget = this.environmentTarget;
    this.environmentTarget = nextTarget;
    this.scene.environment = nextTarget.texture;
    this.renderer.toneMappingExposure = recipe.exposure;
    previousTarget?.dispose();
    this.environmentKey = text3DEnvironmentSignature(
      this.config,
      this.environmentColors,
      quality,
    );
  }

  private disposeLights(): void {
    this.lights.clear();
    if (this.shadowPlane) {
      this.scene.remove(this.shadowPlane);
      this.shadowPlane.geometry.dispose();
      this.shadowPlane.material.dispose();
      this.shadowPlane = undefined;
    }
  }

  private rebuildLights(): void {
    this.disposeLights();
    const quality = this.effectiveQuality();
    const recipe = TEXT_3D_ENVIRONMENT_RECIPES[this.config.environment];
    const fill = new HemisphereLight(
      0xffffff,
      0x303034,
      this.config.ambientIntensity * recipe.fillIntensity,
    );
    fill.name = "text-3d-neutral-fill";
    this.lights.add(fill);

    for (const source of recipe.areaLights) {
      const light = new RectAreaLight(
        resolveText3DEnvironmentColor(source.colorRole, this.config, this.environmentColors),
        this.config.lightIntensity * source.intensity,
        source.width,
        source.height,
      );
      light.name = `text-3d-area-${source.id}`;
      light.position.set(...source.position);
      light.lookAt(0, 0, 0);
      this.lights.add(light);
    }

    if (this.config.shadow && this.config.background) {
      const bounds = new Box3().setFromObject(this.textRoot);
      const emptyBounds = bounds.isEmpty();
      const size = emptyBounds ? new Vector3(2, 1, 0.25) : bounds.getSize(new Vector3());
      const shadowKey = recipe.shadowKey;
      const light = new DirectionalLight(
        resolveText3DEnvironmentColor(shadowKey.colorRole, this.config, this.environmentColors),
        this.config.lightIntensity * shadowKey.intensity,
      );
      light.name = "text-3d-shadow-key";
      light.position.set(...shadowKey.position);
      light.castShadow = true;
      light.shadow.mapSize.setScalar(text3DQualitySettings(quality).shadowMapSize);
      light.shadow.bias = -0.0004;
      light.shadow.normalBias = Math.max(0.006, size.z * 0.04);
      const shadowExtent = Math.max(2, size.x, size.y) * 0.9;
      light.shadow.camera.left = -shadowExtent;
      light.shadow.camera.right = shadowExtent;
      light.shadow.camera.top = shadowExtent;
      light.shadow.camera.bottom = -shadowExtent;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 30;
      light.shadow.camera.updateProjectionMatrix();
      light.target.position.set(0, 0, 0);
      this.lights.add(light, light.target);

      const geometry = new PlaneGeometry(Math.max(8, size.x * 3), Math.max(8, size.y * 3));
      const material = new ShadowMaterial({ opacity: 0.18 });
      this.shadowPlane = new Mesh(geometry, material);
      this.shadowPlane.rotation.x = -Math.PI / 2;
      this.shadowPlane.position.y = (emptyBounds ? -0.5 : bounds.min.y)
        - Math.max(0.2, size.y * 0.15);
      this.shadowPlane.receiveShadow = true;
      this.scene.add(this.shadowPlane);
    }
    this.renderer.shadowMap.needsUpdate = true;
    this.lightKey = text3DLightSignature(
      this.config,
      this.environmentColors,
      quality,
      this.geometryKey,
    );
  }

  private disposeBackdrop(): void {
    this.scene.background = null;
    if (!this.backdropGroup) return;
    this.scene.remove(this.backdropGroup);
    disposeText3DObjectResources(this.backdropGroup);
    this.backdropGroup.clear();
    this.backdropGroup = undefined;
  }

  private rebuildBackdrop(): void {
    this.disposeBackdrop();
    if (this.config.background && this.config.backdrop === "environment") {
      const bounds = new Box3().setFromObject(this.textRoot);
      const emptyBounds = bounds.isEmpty();
      const size = emptyBounds ? new Vector3(4, 2, 0.25) : bounds.getSize(new Vector3());
      const background = new Color(
        resolveText3DEnvironmentColor("background", this.config, this.environmentColors),
      );
      const surface = new Color(
        resolveText3DEnvironmentColor("surface", this.config, this.environmentColors),
      );
      this.scene.background = background.lerp(surface, 0.18);
      this.backdropGroup = buildText3DBackdropGroup(
        this.config,
        this.environmentColors,
        {
          width: Math.max(12, size.x * 3),
          height: Math.max(8, size.y * 3),
          z: (emptyBounds ? -0.5 : bounds.min.z) - Math.max(1.5, size.z * 4),
        },
      );
      this.scene.add(this.backdropGroup);
    }
    this.backdropKey = text3DBackdropSignature(
      this.config,
      this.environmentColors,
      this.geometryKey,
    );
  }

  private applyLightingRotation(): void {
    const rotation = text3DLightingRotation(this.config);
    this.scene.environmentRotation.y = rotation;
    this.lights.rotation.y = rotation;
  }
}
