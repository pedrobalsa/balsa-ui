import {
  BoxGeometry,
  Color,
  DataTexture,
  DoubleSide,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  Scene,
  Vector3,
  type Material,
  type Object3D,
} from "three";
import type {
  BalsaText3DConfig,
  Text3DEnvironment,
  Text3DQuality,
  Text3DReflection,
} from "./text-3d";

export type Text3DEffectiveQuality = Exclude<Text3DQuality, "auto">;

export interface Text3DEnvironmentColors {
  background?: string;
  surface?: string;
}

export type Text3DEnvironmentColorRole =
  | "body"
  | "highlight"
  | "rim"
  | "background"
  | "surface";

export type Text3DEnvironmentCoverage =
  | "front"
  | "side"
  | "rear"
  | "overhead"
  | "floor";

export interface Text3DEnvironmentCardRecipe {
  id: string;
  kind: "plane" | "box";
  colorRole: Text3DEnvironmentColorRole;
  /** Normalized azimuth: 0 is camera/front and 0.25 is camera-left. */
  position: number;
  /** Elevation in degrees; spatial layout remains owned by the named mode. */
  elevation: number;
  distance: number;
  width: number;
  height: number;
  thickness?: number;
  roll: number;
  intensity: number;
  coverage: readonly Text3DEnvironmentCoverage[];
}

export interface Text3DAreaLightRecipe {
  id: string;
  colorRole: Text3DEnvironmentColorRole;
  position: readonly [number, number, number];
  width: number;
  height: number;
  intensity: number;
}

export interface Text3DShadowKeyRecipe {
  colorRole: Text3DEnvironmentColorRole;
  position: readonly [number, number, number];
  intensity: number;
}

export interface Text3DEnvironmentRecipe {
  mode: Text3DEnvironment;
  exposure: number;
  pmremSigma: number;
  backgroundMix: number;
  fillIntensity: number;
  cards: readonly Text3DEnvironmentCardRecipe[];
  areaLights: readonly Text3DAreaLightRecipe[];
  shadowKey: Text3DShadowKeyRecipe;
}

export interface ResolvedText3DEnvironmentCard
  extends Omit<Text3DEnvironmentCardRecipe, "position" | "width" | "intensity"> {
  position: number;
  authoredWidth: number | undefined;
  width: number;
  intensity: number;
  color: string;
}

export interface Text3DQualitySettings {
  pmremSize: 64 | 128 | 256;
  shadowMapSize: 512 | 1024 | 2048;
  transmissionResolutionScale: 0.5 | 0.75 | 1;
}

const ALL_COVERAGE = ["front", "side", "rear", "overhead", "floor"] as const;
const FEATHER_TEXTURE_SIZE = 64;

/**
 * Source scale is calibrated against Three's procedural RoomEnvironment, while
 * PMREM sigma is the documented prefilter radius in radians. Studio's 0.035
 * sigma stays inside Three's 20-sample blur budget at the 256px high-quality
 * cube size, while feathered broad sources keep chrome gradients rolling
 * without resolving the source geometry itself.
 * Sources:
 * https://github.com/mrdoob/three.js/blob/dev/examples/jsm/environments/RoomEnvironment.js
 * https://threejs.org/docs/pages/PMREMGenerator.html
 * https://threejs.org/docs/pages/RectAreaLight.html
 */
export const TEXT_3D_ENVIRONMENT_RECIPES: Readonly<
  Record<Text3DEnvironment, Text3DEnvironmentRecipe>
> = Object.freeze({
  studio: {
    mode: "studio",
    exposure: 1.18,
    pmremSigma: 0.035,
    backgroundMix: 0.2,
    fillIntensity: 0.1,
    cards: [
      { id: "front-key", kind: "plane", colorRole: "highlight", position: 0.92, elevation: 22, distance: 8, width: 8, height: 3.4, roll: -6, intensity: 5.1, coverage: ["front", "side"] },
      { id: "front-fill", kind: "box", colorRole: "surface", position: 0.07, elevation: -7, distance: 7.5, width: 7, height: 3.4, thickness: 0.12, roll: 3, intensity: 2.1, coverage: ["front"] },
      { id: "side-rim", kind: "plane", colorRole: "rim", position: 0.24, elevation: 9, distance: 7.2, width: 5, height: 2.8, roll: 5, intensity: 4, coverage: ["side"] },
      { id: "rear-fill", kind: "box", colorRole: "body", position: 0.56, elevation: 1, distance: 8.6, width: 7, height: 2.2, thickness: 0.18, roll: -3, intensity: 1.1, coverage: ["rear"] },
      { id: "ceiling", kind: "plane", colorRole: "highlight", position: 0.03, elevation: 72, distance: 7, width: 7, height: 4, roll: 14, intensity: 2.9, coverage: ["overhead"] },
      { id: "floor-bounce", kind: "plane", colorRole: "surface", position: 0.7, elevation: -68, distance: 6.8, width: 8, height: 4.5, roll: -5, intensity: 0.75, coverage: ["floor"] },
    ],
    areaLights: [
      { id: "window-key", colorRole: "highlight", position: [0, 4.5, 5.8], width: 10, height: 2.2, intensity: 0.28 },
      { id: "side-fill", colorRole: "surface", position: [-4.5, 1.2, 3.2], width: 4.5, height: 5, intensity: 0.1 },
    ],
    shadowKey: { colorRole: "highlight", position: [4, 6, 5], intensity: 0.16 },
  },
  rim: {
    mode: "rim",
    exposure: 1.05,
    pmremSigma: 0.01,
    backgroundMix: 0.16,
    fillIntensity: 0.08,
    cards: [
      { id: "rear-left-blade", kind: "box", colorRole: "rim", position: 0.35, elevation: 17, distance: 7.4, width: 0.65, height: 6, thickness: 0.1, roll: -9, intensity: 6.2, coverage: ["side", "overhead"] },
      { id: "rear-right-blade", kind: "plane", colorRole: "highlight", position: 0.65, elevation: 2, distance: 8.2, width: 0.8, height: 5.3, roll: 11, intensity: 5.2, coverage: ["side"] },
      { id: "rear-horizon", kind: "plane", colorRole: "surface", position: 0.5, elevation: -10, distance: 9, width: 5.5, height: 0.55, roll: 0, intensity: 2.1, coverage: ["rear"] },
      { id: "dark-front", kind: "box", colorRole: "background", position: 0, elevation: 0, distance: 6.8, width: 6.5, height: 4.5, thickness: 0.2, roll: 0, intensity: 0.14, coverage: ["front"] },
      { id: "low-edge", kind: "plane", colorRole: "rim", position: 0.18, elevation: -62, distance: 6.5, width: 3.8, height: 1.1, roll: 19, intensity: 1.35, coverage: ["floor"] },
    ],
    areaLights: [
      { id: "left-rim", colorRole: "rim", position: [-4.8, 2.2, -3.8], width: 0.8, height: 5.5, intensity: 1.15 },
      { id: "right-rim", colorRole: "highlight", position: [4.3, 1.3, -4.5], width: 1, height: 4.7, intensity: 0.9 },
      { id: "front-breath", colorRole: "surface", position: [0, 1, 5.5], width: 5.8, height: 3.8, intensity: 0.12 },
    ],
    shadowKey: { colorRole: "highlight", position: [-4, 5, 3], intensity: 0.1 },
  },
  soft: {
    mode: "soft",
    exposure: 1.1,
    pmremSigma: 0.075,
    backgroundMix: 0.58,
    fillIntensity: 0.22,
    cards: [
      { id: "left-softbox", kind: "box", colorRole: "highlight", position: 0.86, elevation: 20, distance: 8.5, width: 8, height: 6, thickness: 0.2, roll: -2, intensity: 2.4, coverage: ["front", "side"] },
      { id: "right-softbox", kind: "box", colorRole: "surface", position: 0.14, elevation: 10, distance: 9.3, width: 7, height: 5.2, thickness: 0.24, roll: 3, intensity: 1.6, coverage: ["front", "side"] },
      { id: "skylight", kind: "plane", colorRole: "highlight", position: 0.48, elevation: 76, distance: 7.8, width: 8.2, height: 4.2, roll: 0, intensity: 2, coverage: ["overhead"] },
      { id: "rear-cloud", kind: "plane", colorRole: "rim", position: 0.52, elevation: 7, distance: 9.8, width: 7.5, height: 4.8, roll: -5, intensity: 0.9, coverage: ["rear"] },
      { id: "floor-cloud", kind: "box", colorRole: "surface", position: 0.29, elevation: -72, distance: 7.2, width: 8.5, height: 3.7, thickness: 0.16, roll: 6, intensity: 0.65, coverage: ["floor"] },
    ],
    areaLights: [
      { id: "large-left", colorRole: "highlight", position: [-4.5, 4.2, 5.2], width: 7, height: 5, intensity: 0.52 },
      { id: "large-right", colorRole: "surface", position: [4.8, 2, 4.5], width: 6.5, height: 4.5, intensity: 0.34 },
    ],
    shadowKey: { colorRole: "highlight", position: [3, 7, 5], intensity: 0.08 },
  },
  dramatic: {
    mode: "dramatic",
    exposure: 1,
    pmremSigma: 0.005,
    backgroundMix: 0.08,
    fillIntensity: 0.055,
    cards: [
      { id: "graphic-key", kind: "plane", colorRole: "highlight", position: 0.93, elevation: 31, distance: 7.1, width: 5, height: 0.48, roll: -16, intensity: 8, coverage: ["front"] },
      { id: "opposing-slit", kind: "box", colorRole: "rim", position: 0.31, elevation: 5, distance: 7.8, width: 0.5, height: 5.7, thickness: 0.08, roll: 13, intensity: 6, coverage: ["side"] },
      { id: "black-rear", kind: "plane", colorRole: "background", position: 0.53, elevation: -2, distance: 8.5, width: 6.2, height: 3.8, roll: 0, intensity: 0.06, coverage: ["rear"] },
      { id: "small-top", kind: "box", colorRole: "highlight", position: 0.08, elevation: 69, distance: 6.4, width: 2.1, height: 1, thickness: 0.1, roll: 27, intensity: 3.8, coverage: ["overhead"] },
      { id: "knife-floor", kind: "plane", colorRole: "rim", position: 0.73, elevation: -58, distance: 7, width: 4.3, height: 0.4, roll: -22, intensity: 2.5, coverage: ["floor", "side"] },
    ],
    areaLights: [
      { id: "hard-window", colorRole: "highlight", position: [4.8, 5, 4], width: 4.8, height: 0.55, intensity: 1.55 },
      { id: "counter-slit", colorRole: "rim", position: [-4.3, 0.6, 1.4], width: 0.55, height: 5.2, intensity: 0.48 },
    ],
    shadowKey: { colorRole: "highlight", position: [5, 7, 4], intensity: 0.24 },
  },
  neon: {
    mode: "neon",
    exposure: 1,
    pmremSigma: 0.008,
    backgroundMix: 0.12,
    fillIntensity: 0.07,
    cards: [
      { id: "cyan-tube", kind: "box", colorRole: "highlight", position: 0.83, elevation: 8, distance: 7.2, width: 0.38, height: 5.8, thickness: 0.16, roll: -7, intensity: 7.5, coverage: ["front", "side"] },
      { id: "magenta-tube", kind: "box", colorRole: "rim", position: 0.15, elevation: -4, distance: 8.1, width: 0.5, height: 6.4, thickness: 0.12, roll: 12, intensity: 7, coverage: ["side"] },
      { id: "rear-sign", kind: "plane", colorRole: "rim", position: 0.56, elevation: 13, distance: 9, width: 5.6, height: 0.62, roll: 0, intensity: 5.2, coverage: ["rear"] },
      { id: "rolled-rear", kind: "plane", colorRole: "highlight", position: 0.37, elevation: -18, distance: 7.6, width: 3.4, height: 0.5, roll: 38, intensity: 3.8, coverage: ["rear", "side"] },
      { id: "violet-crown", kind: "plane", colorRole: "body", position: 0.02, elevation: 67, distance: 6.8, width: 4.2, height: 0.72, roll: -12, intensity: 4.6, coverage: ["overhead"] },
      { id: "blue-floor", kind: "box", colorRole: "surface", position: 0.68, elevation: -66, distance: 6.5, width: 5, height: 0.55, thickness: 0.12, roll: 18, intensity: 2.2, coverage: ["floor"] },
    ],
    areaLights: [
      { id: "cyan-strip", colorRole: "highlight", position: [-4.2, 1.5, 3.2], width: 0.45, height: 5.5, intensity: 1.25 },
      { id: "magenta-strip", colorRole: "rim", position: [4.3, 0.4, 2.4], width: 0.55, height: 6, intensity: 1.15 },
      { id: "rear-bar", colorRole: "body", position: [0, 3.4, -4.5], width: 5.8, height: 0.65, intensity: 0.72 },
    ],
    shadowKey: { colorRole: "highlight", position: [-4, 6, 4], intensity: 0.12 },
  },
});

export const TEXT_3D_ENVIRONMENT_COVERAGE = ALL_COVERAGE;

export function text3DQualitySettings(
  quality: Text3DEffectiveQuality,
): Text3DQualitySettings {
  if (quality === "low") {
    return { pmremSize: 64, shadowMapSize: 512, transmissionResolutionScale: 0.5 };
  }
  if (quality === "medium") {
    return { pmremSize: 128, shadowMapSize: 1024, transmissionResolutionScale: 0.75 };
  }
  return { pmremSize: 256, shadowMapSize: 2048, transmissionResolutionScale: 1 };
}

export function resolveText3DEnvironmentColor(
  role: Text3DEnvironmentColorRole,
  config: BalsaText3DConfig,
  environment: Text3DEnvironmentColors,
): string {
  if (role === "body") return config.colors[0];
  if (role === "highlight") return config.colors[1];
  if (role === "rim") return config.colors[2];
  if (role === "surface") return environment.surface ?? config.colors[0];
  return environment.background ?? config.backgroundColor;
}

function authoredCardWidth(width: number, recipeWidth: number, distance: number): number {
  // The authored value is an angular share of the surrounding half-turn. Its
  // physical span at the recipe's distance follows the perspective projection
  // 2d*tan(theta/2). A small floor keeps minimum-width cards visible, while the
  // recipe-relative cap avoids the tan(PI / 2) singularity at the public max.
  // Source: https://threejs.org/manual/en/cameras.html
  const angle = Math.min(0.49, Math.max(0.02, width)) * Math.PI;
  return Math.min(
    recipeWidth * 1.35,
    Math.max(0.8, 2 * distance * Math.tan(angle / 2)),
  );
}

function contrastedIntensity(intensity: number, contrast: number): number {
  const middleGrey = 0.35;
  const amount = Math.min(2, Math.max(0, contrast));
  return Math.max(0.01, middleGrey + (intensity - middleGrey) * amount);
}

export function resolveText3DEnvironmentCards(
  config: BalsaText3DConfig,
  environment: Text3DEnvironmentColors = {},
): ResolvedText3DEnvironmentCard[] {
  const recipe = TEXT_3D_ENVIRONMENT_RECIPES[config.environment];
  return recipe.cards.map((card, index) => {
    const authored: Text3DReflection | undefined = config.reflections[index];
    return {
      ...card,
      position: authored?.position ?? card.position,
      authoredWidth: authored?.width,
      width: authored
        ? authoredCardWidth(authored.width, card.width, card.distance)
        : card.width,
      intensity: contrastedIntensity(
        authored?.intensity ?? card.intensity,
        config.environmentContrast,
      ),
      color: authored?.color
        ?? resolveText3DEnvironmentColor(card.colorRole, config, environment),
    };
  });
}

function sphericalCardPosition(
  position: number,
  elevation: number,
  distance: number,
): Vector3 {
  const azimuth = position * Math.PI * 2;
  const elevationRadians = elevation * Math.PI / 180;
  const horizontalDistance = Math.cos(elevationRadians) * distance;
  return new Vector3(
    -Math.sin(azimuth) * horizontalDistance,
    Math.sin(elevationRadians) * distance,
    Math.cos(azimuth) * horizontalDistance,
  );
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const amount = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return amount * amount * (3 - 2 * amount);
}

/**
 * A neutral opacity field for HDR source cards. The superellipse is fully
 * transparent at every geometric edge and starts rolling off well before it,
 * so PMREM never receives a recognizable plane/box silhouette.
 */
export function createText3DEnvironmentFeatherTexture(
  size = FEATHER_TEXTURE_SIZE,
): DataTexture {
  const dimension = Math.max(4, Math.round(size));
  const pixels = new Uint8Array(dimension * dimension * 4);
  for (let y = 0; y < dimension; y += 1) {
    const vertical = y / (dimension - 1) * 2 - 1;
    for (let x = 0; x < dimension; x += 1) {
      const horizontal = x / (dimension - 1) * 2 - 1;
      const distance = (Math.abs(horizontal) ** 3.2 + Math.abs(vertical) ** 3.2) ** (1 / 3.2);
      const luminance = 1 - smoothstep(0.12, 1, distance);
      const offset = (y * dimension + x) * 4;
      pixels[offset] = 255;
      pixels[offset + 1] = 255;
      pixels[offset + 2] = 255;
      pixels[offset + 3] = Math.round(luminance * 255);
    }
  }
  const texture = new DataTexture(pixels, dimension, dimension, RGBAFormat);
  texture.name = "text-3d-environment-feather";
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/** Build the short-lived scene consumed by `PMREMGenerator.fromScene`. */
export function buildText3DEnvironmentScene(
  config: BalsaText3DConfig,
  environment: Text3DEnvironmentColors = {},
): Scene {
  const scene = new Scene();
  const recipe = TEXT_3D_ENVIRONMENT_RECIPES[config.environment];
  const background = new Color(
    resolveText3DEnvironmentColor("background", config, environment),
  );
  const surface = new Color(
    resolveText3DEnvironmentColor("surface", config, environment),
  );
  const body = new Color(resolveText3DEnvironmentColor("body", config, environment));
  // A weak omnidirectional field keeps frontal metal alive between softboxes.
  // The 0.35 factor caps even Soft's floor below 8%, while Studio lands at 8.4%.
  scene.background = background
    .lerp(surface, recipe.backgroundMix)
    .lerp(body, Math.min(0.1, recipe.fillIntensity * 0.35));

  for (const card of resolveText3DEnvironmentCards(config, environment)) {
    const geometry = card.kind === "box"
      ? new BoxGeometry(card.width, card.height, card.thickness ?? 0.1)
      : new PlaneGeometry(card.width, card.height);
    const feather = createText3DEnvironmentFeatherTexture();
    const material = new MeshBasicMaterial({
      color: new Color(card.color).multiplyScalar(card.intensity),
      map: feather,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `text-3d-environment-${card.id}`;
    mesh.position.copy(sphericalCardPosition(card.position, card.elevation, card.distance));
    mesh.lookAt(0, 0, 0);
    mesh.rotateZ(card.roll * Math.PI / 180);
    scene.add(mesh);
  }
  return scene;
}

export interface Text3DBackdropDimensions {
  width: number;
  height: number;
  z: number;
}

/**
 * Build bounded opaque panels for transmission. They are scene geometry, not a
 * PMREM skybox, because WebGL cannot refract DOM content behind the canvas.
 */
export function buildText3DBackdropGroup(
  config: BalsaText3DConfig,
  environment: Text3DEnvironmentColors,
  dimensions: Text3DBackdropDimensions,
): Group {
  const group = new Group();
  group.name = "text-3d-backdrop";
  const cards = resolveText3DEnvironmentCards(config, environment);
  const background = resolveText3DEnvironmentColor("background", config, environment);
  const surface = resolveText3DEnvironmentColor("surface", config, environment);
  const textureWidth = 256;
  const textureHeight = 128;
  const pixels = new Uint8Array(textureWidth * textureHeight * 4);
  const backgroundColor = new Color(background);
  const surfaceColor = new Color(surface);
  const sourceColors = cards.slice(0, 4).map((card) => new Color(card.color));
  const centers = [
    [0.18, 0.28, 0.16, 0.28],
    [0.46, 0.7, 0.24, 0.2],
    [0.72, 0.38, 0.14, 0.3],
    [0.88, 0.76, 0.2, 0.18],
  ] as const;
  const color = new Color();
  const encoded = new Color();
  const horizonColor = sourceColors[3] ?? new Color(config.colors[1]);
  for (let y = 0; y < textureHeight; y += 1) {
    const vertical = y / (textureHeight - 1);
    for (let x = 0; x < textureWidth; x += 1) {
      const horizontal = x / (textureWidth - 1);
      color.copy(backgroundColor).lerp(surfaceColor, 0.14 + vertical * 0.24);
      for (const [index, source] of sourceColors.entries()) {
        const center = centers[index];
        if (!center) continue;
        const [centerX, centerY, radiusX, radiusY] = center;
        const dx = (horizontal - centerX) / radiusX;
        const dy = (vertical - centerY) / radiusY;
        const weight = Math.exp(-(dx * dx + dy * dy) * 1.5)
          * Math.min(0.82, 0.25 + (cards[index]?.intensity ?? 1) * 0.14);
        color.lerp(source, weight);
      }
      const horizon = 0.72 + Math.sin(horizontal * Math.PI * 2.2) * 0.035;
      const horizonWeight = Math.exp(-((vertical - horizon) ** 2) / 0.0018) * 0.42;
      color.lerp(horizonColor, horizonWeight);
      encoded.copy(color).convertLinearToSRGB();
      const offset = (y * textureWidth + x) * 4;
      pixels[offset] = Math.round(Math.min(1, encoded.r) * 255);
      pixels[offset + 1] = Math.round(Math.min(1, encoded.g) * 255);
      pixels[offset + 2] = Math.round(Math.min(1, encoded.b) * 255);
      pixels[offset + 3] = 255;
    }
  }
  const texture = new DataTexture(pixels, textureWidth, textureHeight, RGBAFormat);
  texture.name = "text-3d-backdrop-texture";
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  const material = new MeshBasicMaterial({ map: texture, toneMapped: false });
  const backdrop = new Mesh(new PlaneGeometry(dimensions.width, dimensions.height), material);
  backdrop.name = "text-3d-backdrop-field";
  backdrop.position.z = dimensions.z;
  group.add(backdrop);
  return group;
}

export function disposeText3DObjectResources(root: Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    const materials: Material[] = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      if (material instanceof MeshBasicMaterial) material.map?.dispose();
      material.dispose();
    }
  });
}

export function text3DEnvironmentSignature(
  config: BalsaText3DConfig,
  environment: Text3DEnvironmentColors,
  quality: Text3DEffectiveQuality,
): string {
  return JSON.stringify([
    config.environment,
    config.reflections.map(({ color, position, width, intensity }) => [color, position, width, intensity]),
    config.colors,
    environment.background ?? config.backgroundColor,
    environment.surface ?? config.colors[0],
    config.environmentContrast,
    quality,
  ]);
}

export function text3DLightSignature(
  config: BalsaText3DConfig,
  environment: Text3DEnvironmentColors,
  quality: Text3DEffectiveQuality,
  shadowGeometrySignature = "",
): string {
  return JSON.stringify([
    config.environment,
    config.colors,
    environment.background ?? config.backgroundColor,
    environment.surface ?? config.colors[0],
    config.lightIntensity,
    config.ambientIntensity,
    config.shadow,
    config.background,
    quality,
    config.shadow && config.background ? shadowGeometrySignature : "",
  ]);
}

export function text3DBackdropSignature(
  config: BalsaText3DConfig,
  environment: Text3DEnvironmentColors,
  geometrySignature: string,
): string {
  if (!config.background || config.backdrop === "color") {
    return JSON.stringify([config.background, config.backdrop, config.backgroundColor]);
  }
  return JSON.stringify([
    config.background,
    config.backdrop,
    config.environment,
    config.reflections.map(({ color, position, width, intensity }) => [color, position, width, intensity]),
    config.colors,
    environment.background ?? config.backgroundColor,
    environment.surface ?? config.colors[0],
    config.environmentContrast,
    geometrySignature,
  ]);
}

export function text3DLightingRotation(config: BalsaText3DConfig): number {
  return (config.lightAngle + config.environmentRotation) * Math.PI / 180;
}
