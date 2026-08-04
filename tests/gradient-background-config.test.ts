import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GRADIENT_BACKGROUND_MINIMUM_CONTRAST,
  GRADIENT_BACKGROUND_SCHEMA_VERSION,
  applyGradientBackgroundContentContrast,
  getGradientBackgroundPreset,
  hasGradientBackgroundPalette,
  resolveGradientBackgroundContentColor,
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

function relativeLuminance(color: string): number {
  const match = color.match(/^#([\da-f]{6})$/i);
  if (!match) throw new Error(`Unreadable color: ${color}`);
  const channels = match[1].match(/[\da-f]{2}/gi)?.map((channel) => {
    const normalized = Number.parseInt(channel, 16) / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  if (!channels || channels.length !== 3) throw new Error(`Unreadable color: ${color}`);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Independent WCAG math keeps the public configuration test self-contained. */
function contrast(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function luminance(color: string): number {
  return relativeLuminance(color);
}

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
    // All six tonal roles: three neutrals anchor the field, three accents keep
    // the mid-tones that stop a dark palette collapsing toward flat black.
    boundary.style.setProperty("--balsa-color-background", "rgb(1, 2, 3)");
    boundary.style.setProperty("--balsa-color-surface", "rgb(4, 5, 6)");
    boundary.style.setProperty("--balsa-color-muted", "rgb(7, 8, 9)");
    boundary.style.setProperty("--balsa-color-primary", "rgb(10, 11, 12)");
    boundary.style.setProperty("--balsa-color-secondary", "rgb(13, 14, 15)");
    boundary.style.setProperty("--balsa-color-accent", "rgb(16, 17, 18)");
    document.body.append(boundary);
    expect(resolveGradientBackgroundPaletteColors(boundary, ["#000000", "#FFFFFF"]))
      .toEqual([
        "rgb(1, 2, 3)",
        "rgb(4, 5, 6)",
        "rgb(7, 8, 9)",
        "rgb(10, 11, 12)",
        "rgb(13, 14, 15)",
        "rgb(16, 17, 18)",
      ]);
    boundary.remove();

    const source = readFileSync(
      resolve(process.cwd(), "src/components/ui/GradientBackground.vue"),
      "utf8",
    );
    expect(source).not.toContain("palette-store");
    expect(source).not.toContain("theme-store");
  });

  function paletteBoundary(roles: Record<string, string>): HTMLElement {
    const boundary = document.createElement("div");
    for (const [role, value] of Object.entries(roles)) {
      boundary.style.setProperty(role, value);
    }
    document.body.append(boundary);
    return boundary;
  }

  it("keeps inherited palette stops readable against the dimmest text role", () => {
    // The stock dark palette sets primary to its own foreground, so an
    // unrepaired gradient hides any text sitting on that stop.
    const text = "#A1A1AA";
    const boundary = paletteBoundary({
      "--balsa-color-foreground": "#F4F4F5",
      "--balsa-color-muted-foreground": text,
      "--balsa-color-background": "#0F1012",
      "--balsa-color-surface": "#191A1C",
      "--balsa-color-muted": "#2B2C2E",
      "--balsa-color-primary": "#F4F4F5",
      "--balsa-color-secondary": "#A1A1AA",
      "--balsa-color-accent": "#CBD5E1",
    });

    const stops = resolveGradientBackgroundPaletteColors(boundary, ["#000000", "#FFFFFF"]);
    expect(stops).toHaveLength(6);
    // The floor holds against muted-foreground, so full-strength foreground clears it too.
    for (const stop of stops) {
      expect(contrast(stop, text))
        .toBeGreaterThanOrEqual(GRADIENT_BACKGROUND_MINIMUM_CONTRAST - 0.01);
      expect(contrast(stop, "#F4F4F5"))
        .toBeGreaterThanOrEqual(GRADIENT_BACKGROUND_MINIMUM_CONTRAST - 0.01);
    }
    expect(stops[0]).toBe("#0F1012");
    expect(stops[3]).not.toBe("#F4F4F5");

    boundary.remove();
  });

  it("repairs toward the palette background so light and dark schemes self-correct", () => {
    // A light palette's accents are saturated mid-tones. Repairing toward black
    // would darken them further under near-black text; toward the near-white
    // background they lighten and stay in the interface's own lightness family.
    const light = paletteBoundary({
      "--balsa-color-foreground": "#0F172A",
      "--balsa-color-muted-foreground": "#475569",
      "--balsa-color-background": "#F4F8FC",
      "--balsa-color-surface": "#EDF2F8",
      "--balsa-color-muted": "#DDE3EC",
      "--balsa-color-primary": "#6082E4",
      "--balsa-color-accent": "#9975D1",
    });
    const lightStops = resolveGradientBackgroundPaletteColors(light, ["#000000", "#FFFFFF"]);
    for (const stop of lightStops) {
      expect(luminance(stop)).toBeGreaterThan(luminance("#6082E4"));
    }
    light.remove();

    // The same repair on a dark palette moves the other way, keeping the glow.
    const dark = paletteBoundary({
      "--balsa-color-foreground": "#F4F4F5",
      "--balsa-color-muted-foreground": "#A1A1AA",
      "--balsa-color-background": "#0A0812",
      "--balsa-color-surface": "#151221",
      "--balsa-color-muted": "#21182E",
      "--balsa-color-primary": "#7E53DF",
      "--balsa-color-accent": "#875CB1",
    });
    const darkStops = resolveGradientBackgroundPaletteColors(dark, ["#000000", "#FFFFFF"]);
    for (const stop of darkStops) {
      expect(luminance(stop)).toBeLessThan(luminance("#7E53DF"));
    }
    dark.remove();
  });

  it("reports whether an element inherits a palette at all", () => {
    const bare = document.createElement("div");
    document.body.append(bare);
    expect(hasGradientBackgroundPalette(bare)).toBe(false);

    const palette = document.createElement("div");
    palette.style.setProperty("--balsa-color-background", "#0F1012");
    palette.style.setProperty("--balsa-color-surface", "#191A1C");
    document.body.append(palette);
    expect(hasGradientBackgroundPalette(palette)).toBe(true);

    bare.remove();
    palette.remove();
  });

  it("repairs authored stops against an opt-in content color", () => {
    // obsidian-fold under default light-scheme text is the out-of-the-box
    // mismatch: a near-black stop beneath near-black body copy.
    const authored = getGradientBackgroundPreset("obsidian-fold").colors;
    expect(contrast(authored[0]!, "#18181B")).toBeLessThan(2);

    const repaired = applyGradientBackgroundContentContrast(authored, "#18181B");
    expect(repaired).toHaveLength(authored.length);
    for (const stop of repaired) {
      expect(contrast(stop, "#18181B"))
        .toBeGreaterThanOrEqual(GRADIENT_BACKGROUND_MINIMUM_CONTRAST - 0.01);
    }
    // Stops that already cleared the floor are preserved exactly.
    expect(repaired.at(-1)).toBe(authored.at(-1));
  });

  it("leaves authored stops alone when no content color is given", () => {
    const authored = getGradientBackgroundPreset("obsidian-fold").colors;
    expect(applyGradientBackgroundContentContrast(authored, "not-a-color"))
      .toEqual([...authored]);
  });

  it("reads the ambient text color the gradient box inherits", () => {
    const section = document.createElement("section");
    section.style.color = "rgb(9, 8, 7)";
    const host = document.createElement("div");
    section.append(host);
    document.body.append(section);

    expect(resolveGradientBackgroundContentColor(host)).toBe("rgb(9, 8, 7)");

    section.remove();
  });

  it("leaves colors it cannot parse untouched rather than guessing", () => {
    const boundary = document.createElement("div");
    boundary.style.setProperty("--balsa-color-foreground", "#FFFFFF");
    boundary.style.setProperty("--balsa-color-background", "oklch(0.2 0.02 250)");
    boundary.style.setProperty("--balsa-color-surface", "#FFFFFF");
    document.body.append(boundary);

    const stops = resolveGradientBackgroundPaletteColors(boundary, ["#000000", "#FFFFFF"]);
    expect(stops[0]).toBe("oklch(0.2 0.02 250)");
    // The parseable stop still gets repaired away from white.
    expect(stops[1]).not.toBe("#FFFFFF");

    boundary.remove();
  });
});
