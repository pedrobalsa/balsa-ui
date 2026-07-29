import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GRADIENT_BACKGROUND_SCHEMA_VERSION,
  getGradientBackgroundPreset,
  gradientBackgroundPresetNames,
  gradientBackgroundPresets,
  normalizeGradientBackgroundConfig,
  parseGradientBackgroundConfig,
  randomGradientBackgroundSeed,
  resolveGradientBackgroundConfig,
  resolveGradientBackgroundPaletteColors,
  serializeGradientBackgroundConfig,
  type GradientBackgroundPresetName,
} from "../src/components/ui/gradient-background";
import {
  normalizeGradientBackgroundShaderSeed,
  resolveGradientBackgroundQuality,
} from "../src/components/ui/gradient-background-renderer";

const expectedPresets: GradientBackgroundPresetName[] = [
  "obsidian-fold",
  "silver-dunes",
  "cloud-dancer",
  "holographic-flow",
  "liquid-metal",
  "smoke-field",
  "iridescent-flow",
  "void-ribbon",
  "black-silk",
  "palette-flow",
];

describe("GradientBackground configuration", () => {
  it("publishes the complete finite preset collection", () => {
    expect(gradientBackgroundPresetNames).toEqual(expectedPresets);
    expect(Object.keys(gradientBackgroundPresets)).toEqual(expectedPresets);
    for (const name of expectedPresets) {
      const preset = getGradientBackgroundPreset(name);
      expect(preset.preset).toBe(name);
      expect(preset.schemaVersion).toBe(GRADIENT_BACKGROUND_SCHEMA_VERSION);
      expect(preset.colors.length).toBeGreaterThanOrEqual(2);
      expect(preset.colors.length).toBeLessThanOrEqual(6);
      expect(Object.values(preset).every((value) => value !== undefined)).toBe(true);
    }
  });

  it("keeps the revised silk and smoke presets on the shared silver palette", () => {
    const silver = getGradientBackgroundPreset("silver-dunes").colors;
    const blackSilk = getGradientBackgroundPreset("black-silk");
    const smokeField = getGradientBackgroundPreset("smoke-field");

    expect(blackSilk.colors).toEqual(silver);
    expect(smokeField.colors).toEqual(silver);
    expect(smokeField.scale).toBe(1.9);
    expect(smokeField.speed).toBe(0.1);
  });

  it("publishes the exact Cloud Dancer recipe", () => {
    expect(getGradientBackgroundPreset("cloud-dancer")).toEqual({
      schemaVersion: 2,
      preset: "cloud-dancer",
      seed: 1847,
      colorMode: "custom",
      colors: ["#FFFFFF", "#DCDFE3", "#B7B9BE", "#A8ACB4", "#FFFFFF"],
      speed: 0.075,
      scale: 1.18,
      warp: 1.12,
      wave: 1.2,
      softness: 0.7,
      grain: 0.06,
      grainSize: 1.15,
      contrast: 1.18,
      brightness: -0.08,
      direction: 18,
      quality: "auto",
      fieldOctaves: 4,
      fieldFrequency: 0.78,
      noiseAmount: 0.05,
      noiseOctaves: 4,
      noiseFrequency: 1.1,
      warpFrequency: 1.05,
      ribbonDensity: 2.35,
    });
  });

  it("publishes the high-key holographic foil recipe", () => {
    const holographic = getGradientBackgroundPreset("holographic-flow");
    expect(holographic.colors).toEqual([
      "#FFF0CE",
      "#FADCEB",
      "#E4D7FA",
      "#D9E4FF",
      "#D6F8F7",
      "#FFFFFF",
    ]);
    expect(holographic).toMatchObject({
      colorMode: "custom",
      fieldOctaves: 4,
      noiseOctaves: 3,
      softness: 0.7,
    });
    expect(holographic.grain).toBeLessThan(0.02);
    expect(holographic.noiseAmount).toBeLessThan(0.02);
  });

  it("publishes the high-contrast liquid-metal recipe", () => {
    const metallic = getGradientBackgroundPreset("liquid-metal");
    expect(metallic.colors).toEqual([
      "#020304",
      "#191B1D",
      "#65696D",
      "#F8F9F7",
      "#34312D",
      "#FFFFFF",
    ]);
    expect(metallic).toMatchObject({
      colorMode: "custom",
      fieldOctaves: 4,
      softness: 0.68,
    });
    expect(metallic.contrast).toBeGreaterThan(1.25);
    expect(metallic.noiseAmount).toBeLessThan(0.01);
  });

  it("resolves preset, configuration, and direct prop precedence deterministically", () => {
    const input = {
      preset: "silver-dunes" as const,
      seed: 42,
      warp: 0.4,
      colors: ["#111111", "#EEEEEE"],
    };
    const first = resolveGradientBackgroundConfig({
      config: input,
      overrides: { warp: 1.2 },
    });
    const second = resolveGradientBackgroundConfig({
      config: { ...input, colors: [...input.colors] },
      overrides: { warp: 1.2 },
    });
    expect(first).toEqual(second);
    expect(first.seed).toBe(42);
    expect(first.warp).toBe(1.2);
    expect(first.scale).toBe(getGradientBackgroundPreset("silver-dunes").scale);
  });

  it("normalizes unknown fields and clamps every numeric range", () => {
    const normalized = normalizeGradientBackgroundConfig({
      preset: "obsidian-fold",
      unknown: "ignored",
      seed: -12,
      speed: 99,
      scale: 0,
      warp: -1,
      wave: 8,
      softness: 0,
      grain: 1,
      grainSize: 8,
      contrast: 9,
      brightness: -9,
      direction: 900,
      fieldOctaves: 9,
      fieldFrequency: 0,
      noiseAmount: 4,
      noiseOctaves: 3.7,
      noiseFrequency: 0,
      warpFrequency: 8,
      ribbonDensity: 0,
      colors: ["invalid", "#abcdef", "#111111", "#222222", "#333333", "#444444", "#555555"],
    });
    expect(normalized).toMatchObject({
      seed: 0,
      speed: 2,
      scale: 0.25,
      warp: 0,
      wave: 2,
      softness: 0.05,
      grain: 0.5,
      grainSize: 4,
      contrast: 2,
      brightness: -0.5,
      direction: 180,
      fieldOctaves: 4,
      fieldFrequency: 0.2,
      noiseAmount: 0.5,
      noiseOctaves: 4,
      noiseFrequency: 0.2,
      warpFrequency: 4,
      ribbonDensity: 0.5,
    });
    expect(normalized.colors).toHaveLength(6);
    expect(normalized.colors[1]).toBe("#ABCDEF");
    expect("unknown" in normalized).toBe(false);
  });

  it("round trips versioned JSON and rejects invalid versions and color limits", () => {
    const preset = getGradientBackgroundPreset("iridescent-flow");
    expect(parseGradientBackgroundConfig(serializeGradientBackgroundConfig(preset))).toEqual(preset);
    expect(() => parseGradientBackgroundConfig({ ...preset, schemaVersion: 3 })).toThrow(
      "Unsupported Balsa background schema version",
    );
    expect(() => parseGradientBackgroundConfig({ ...preset, colors: ["#000000"] })).toThrow(
      "two to six colors",
    );
    expect(() => parseGradientBackgroundConfig({
      ...preset,
      colors: Array.from({ length: 7 }, () => "#000000"),
    })).toThrow("two to six colors");
  });

  it("migrates schema-one structural noise into independent schema-two fields", () => {
    const current = getGradientBackgroundPreset("obsidian-fold");
    const legacy = {
      ...current,
      schemaVersion: 1,
      noiseOctaves: 3,
      noiseFrequency: 1.7,
    };
    delete (legacy as Partial<typeof current>).fieldOctaves;
    delete (legacy as Partial<typeof current>).fieldFrequency;
    delete (legacy as Partial<typeof current>).noiseAmount;

    const migrated = parseGradientBackgroundConfig(legacy);
    expect(migrated).toMatchObject({
      schemaVersion: 2,
      fieldOctaves: 3,
      fieldFrequency: 1.7,
      noiseAmount: current.noiseAmount,
      noiseOctaves: current.noiseOctaves,
      noiseFrequency: current.noiseFrequency,
    });
  });

  it("randomizes into the reproducible integer seed range", () => {
    expect(randomGradientBackgroundSeed(() => 0)).toBe(0);
    expect(randomGradientBackgroundSeed(() => 0.5)).toBe(1073741824);
    expect(randomGradientBackgroundSeed(() => 1)).toBeLessThanOrEqual(2147483647);
  });

  it("maps large configuration seeds into a stable shader-safe range", () => {
    expect(normalizeGradientBackgroundShaderSeed(9913)).toBe(9913);
    const maximumSeed = normalizeGradientBackgroundShaderSeed(2147483647);
    expect(maximumSeed).toBeGreaterThanOrEqual(0);
    expect(maximumSeed).toBeLessThan(65521);
    expect(normalizeGradientBackgroundShaderSeed(2147483647)).toBe(maximumSeed);
    expect(normalizeGradientBackgroundShaderSeed(-1)).toBe(65520);
  });

  it("keeps quality profiles from silently changing field or noise layers", () => {
    expect(resolveGradientBackgroundQuality("low", 390)).not.toHaveProperty(
      "octaveCap",
    );
    expect(resolveGradientBackgroundQuality("medium", 1440)).not.toHaveProperty(
      "octaveCap",
    );
    expect(resolveGradientBackgroundQuality("high", 1440)).not.toHaveProperty(
      "octaveCap",
    );
  });

  it("separates structural fBM from visible surface noise in the shader", () => {
    const shader = readFileSync(
      resolve(process.cwd(), "src/components/ui/gradient-background-shader.ts"),
      "utf8",
    );
    expect(shader).toContain("fieldFbm(warped * uFieldFrequency");
    expect(shader).not.toContain("fieldFbm(warped * uNoiseFrequency");
    expect(shader).toContain("surfaceNoiseFbm(surfaceNoisePosition)");
    expect(shader).toContain("color += surfaceNoise * uNoiseAmount");
  });

  it("resolves palette roles through CSS inheritance without site stores", () => {
    const boundary = document.createElement("div");
    boundary.style.setProperty("--balsa-color-background", "rgb(1, 2, 3)");
    boundary.style.setProperty("--balsa-color-surface", "rgb(4, 5, 6)");
    boundary.style.setProperty("--balsa-color-primary", "rgb(7, 8, 9)");
    boundary.style.setProperty("--balsa-color-secondary", "rgb(10, 11, 12)");
    boundary.style.setProperty("--balsa-color-accent", "rgb(13, 14, 15)");
    document.body.append(boundary);
    expect(resolveGradientBackgroundPaletteColors(boundary, ["#000000", "#FFFFFF"]))
      .toEqual([
        "rgb(1, 2, 3)",
        "rgb(4, 5, 6)",
        "rgb(7, 8, 9)",
        "rgb(10, 11, 12)",
        "rgb(13, 14, 15)",
      ]);
    boundary.remove();

    const source = readFileSync(
      resolve(process.cwd(), "src/components/ui/GradientBackground.vue"),
      "utf8",
    );
    expect(source).not.toContain("palette-store");
    expect(source).not.toContain("theme-store");
  });
});
