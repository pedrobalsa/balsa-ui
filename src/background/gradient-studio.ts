import {
  GRADIENT_BACKGROUND_EFFECTS,
  GRADIENT_BACKGROUND_PATTERNS,
  getGradientBackgroundPreset,
  gradientBackgroundPatternDefaults,
  gradientBackgroundPresetNames,
  normalizeGradientBackgroundConfig,
  parseGradientBackgroundConfig,
  randomGradientBackgroundSeed,
  serializeGradientBackgroundConfig,
  type BalsaBackgroundConfig,
  type GradientBackgroundPresetName,
} from "@/components/ui/gradient-background";
import {
  directionBlock,
  projectContextInstruction,
  type AgentCreationSource,
  type AgentProjectContext,
} from "../agent/studio-workflows";
import { frameworkProjectCopy } from "../framework/copy";

export interface GradientExportSize {
  label: string;
  value: string;
  width: number;
  height: number;
}

export const gradientExportSizes: readonly GradientExportSize[] = [
  { label: "HD landscape (1920 x 1080)", value: "1920x1080", width: 1920, height: 1080 },
  { label: "Desktop (1440 x 1000)", value: "1440x1000", width: 1440, height: 1000 },
  { label: "Square (1600 x 1600)", value: "1600x1600", width: 1600, height: 1600 },
  { label: "Portrait (1080 x 1920)", value: "1080x1920", width: 1080, height: 1920 },
  { label: "Mobile (390 x 844)", value: "390x844", width: 390, height: 844 },
] as const;

export function resetGradientStudioConfig(
  preset: GradientBackgroundPresetName,
): BalsaBackgroundConfig {
  return getGradientBackgroundPreset(preset);
}

export function randomizeGradientStudioConfig(
  value: BalsaBackgroundConfig,
  random: () => number = Math.random,
): BalsaBackgroundConfig {
  const preset = getGradientBackgroundPreset(value.preset);
  const seed = randomGradientBackgroundSeed(random);
  const sample = (): number => Math.min(1, Math.max(0, random()));
  const between = (minimum: number, maximum: number): number =>
    minimum + (maximum - minimum) * sample();
  const clamp = (candidate: number, minimum: number, maximum: number): number =>
    Math.min(maximum, Math.max(minimum, candidate));
  const rounded = (candidate: number): number =>
    Math.round(candidate * 1000) / 1000;
  const varied = (
    candidate: number,
    minimumScale: number,
    maximumScale: number,
    minimum: number,
    maximum: number,
  ): number => {
    const lower = clamp(candidate * minimumScale, minimum, maximum);
    const upper = clamp(candidate * maximumScale, lower, maximum);
    return rounded(between(lower, upper));
  };
  // Shared controls read differently per generator, so the values a pattern
  // was tuned around anchor the randomization instead of the preset's -- a
  // preset is always a ribbon recipe, and its ribbon count is a poor starting
  // point for rings or facets.
  const patternBase = gradientBackgroundPatternDefaults[value.pattern];
  // While the configuration still draws the pattern its preset was written
  // for, the preset's own tuning is the better anchor. Once the user has
  // switched generators those numbers describe something else, and the
  // pattern's defaults take over.
  const authored = value.pattern === preset.pattern;
  const baseWave = authored ? preset.wave : patternBase.wave ?? preset.wave;
  const baseDensity = authored
    ? preset.patternDensity
    : patternBase.patternDensity ?? preset.patternDensity;
  const baseComplexity = authored
    ? preset.patternComplexity
    : patternBase.patternComplexity ?? preset.patternComplexity;
  const usesCenter = value.pattern !== "ribbon" && value.pattern !== "contour";

  const waveMinimum = Math.max(0.85, baseWave * 0.78);
  const waveMaximum = Math.min(
    1.9,
    Math.max(waveMinimum + 0.28, baseWave * 1.3),
  );
  const direction = ((preset.direction + between(-75, 75) + 180) % 360) - 180;

  return normalizeGradientBackgroundConfig({
    ...value,
    seed,
    speed: varied(preset.speed, 0.7, 1.35, 0.025, 0.14),
    scale: varied(preset.scale, 0.82, 1.22, 0.65, 1.65),
    warp: varied(preset.warp, 0.84, 1.24, 0.82, 1.75),
    wave: rounded(between(waveMinimum, waveMaximum)),
    softness: rounded(clamp(
      preset.softness + between(-0.12, 0.1),
      0.48,
      0.92,
    )),
    grain: varied(preset.grain, 0.65, 1.45, 0.015, 0.095),
    grainSize: varied(preset.grainSize, 0.72, 1.35, 0.65, 2.1),
    contrast: rounded(clamp(
      preset.contrast + between(-0.08, 0.2),
      0.95,
      1.42,
    )),
    brightness: rounded(clamp(
      preset.brightness + between(-0.06, 0.08),
      -0.16,
      0.12,
    )),
    direction: rounded(direction),
    fieldOctaves: Math.round(clamp(
      preset.fieldOctaves + between(-1, 1),
      3,
      4,
    )),
    fieldFrequency: varied(
      preset.fieldFrequency,
      0.82,
      1.25,
      0.45,
      1.15,
    ),
    noiseAmount: varied(
      preset.noiseAmount,
      0.65,
      1.45,
      0.01,
      0.12,
    ),
    noiseOctaves: Math.round(clamp(
      preset.noiseOctaves + between(-1, 1),
      2,
      6,
    )),
    noiseFrequency: varied(
      preset.noiseFrequency,
      0.72,
      1.38,
      0.35,
      2.4,
    ),
    warpFrequency: varied(
      preset.warpFrequency,
      0.82,
      1.22,
      0.7,
      1.45,
    ),
    patternDensity: varied(
      baseDensity,
      0.82,
      1.28,
      Math.max(0.5, baseDensity * 0.6),
      Math.min(8, baseDensity * 1.9),
    ),
    patternComplexity: Math.round(clamp(
      baseComplexity + between(-1, 1),
      2,
      8,
    )),
    // Patterns that ignore the center keep it where it was, so randomizing a
    // ribbon does not quietly write an offset nothing reads.
    patternCenterX: usesCenter
      ? rounded(between(-0.35, 0.35))
      : value.patternCenterX,
    patternCenterY: usesCenter
      ? rounded(between(-0.35, 0.35))
      : value.patternCenterY,
  }, value.preset);
}

export function importGradientStudioConfig(
  source: string | unknown,
): BalsaBackgroundConfig {
  return parseGradientBackgroundConfig(source);
}

export function exportGradientStudioConfig(
  value: BalsaBackgroundConfig,
): string {
  return serializeGradientBackgroundConfig(value);
}

export function gradientStudioJsonFileName(
  value: BalsaBackgroundConfig,
): string {
  const normalized = normalizeGradientBackgroundConfig(value);
  return `balsa-${normalized.preset}-${normalized.seed}.json`;
}

export function encodeGradientInlineConfig(
  value: BalsaBackgroundConfig,
): string {
  const bytes = new TextEncoder().encode(
    serializeGradientBackgroundConfig(value),
  );
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

export function buildGradientCliCommand(
  value: BalsaBackgroundConfig,
  name = "studio-background",
): string {
  return `npx balsa-ui@latest background create ${name} --config ${encodeGradientInlineConfig(value)}`;
}

export function buildGradientCliUsage(name = "studio-background"): string {
  const identifier = name.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase());
  return `<script setup lang="ts">
import GradientBackground from "@/components/ui/GradientBackground.vue";
import { ${identifier} } from "@/backgrounds/${name}";
</script>

<template>
  <section class="relative isolate min-h-screen overflow-hidden">
    <GradientBackground :config="${identifier}" />
    <div class="relative z-10">
      <!-- Your content -->
    </div>
  </section>
</template>
`;
}

export function buildGradientAgentPrompt(
  value: BalsaBackgroundConfig,
): string {
  const serialized = serializeGradientBackgroundConfig(value);
  const projectCopy = frameworkProjectCopy();
  return `Add this exact Balsa UI procedural background to my ${projectCopy.project}.

First obtain the public GradientBackground component and its support files by running this command from ${projectCopy.projectRoot}:

\`\`\`sh
npx balsa-ui@latest add gradient-background
\`\`\`

Then import GradientBackground from "@/components/ui/GradientBackground.vue". Keep the canvas decorative and pointer-transparent, place application content above it, and preserve reduced-motion behavior. Save the configuration as a typed BalsaBackgroundConfig instead of rewriting the shader or approximating the values.

\`\`\`json
${serialized}
\`\`\``;
}

export function buildGradientProjectPrompt(
  value: BalsaBackgroundConfig,
  name: string,
  context: AgentProjectContext,
): string {
  const projectCopy = frameworkProjectCopy();
  return `${projectContextInstruction(context, "gradient background")}

Use this exact Balsa UI procedural background; do not rewrite its shader or approximate its values.

Run this command from ${projectCopy.projectRoot}:

\`\`\`sh
${buildGradientCliCommand(value, name)}
\`\`\`

Then import GradientBackground from "@/components/ui/GradientBackground.vue" and the generated configuration from "@/backgrounds/${name}". Keep the canvas decorative and pointer-transparent, place application content above it, and preserve reduced-motion behavior. Review differing generated files before replacement and preserve unrelated project source.

${buildGradientCliUsage(name)}`;
}

/** Prompt an agent for the exact versioned payload Gradient Studio consumes. */
export function buildGradientCreationPrompt(
  source: AgentCreationSource,
  direction: string,
): string {
  const example = serializeGradientBackgroundConfig(
    getGradientBackgroundPreset("obsidian-fold"),
  );
  const imageInstruction = source === "image"
    ? "Extract the image's color relationships, flow direction, repetition, texture, and contrast. Do not reproduce logos, text, people, or copyrighted illustration details; map the visual character to Balsa's procedural controls."
    : "Translate the direction into a reusable procedural field, not a one-off illustration.";

  return `Create a Balsa UI GradientBackground configuration that I can paste directly into Gradient Studio.

Read the official agent instructions at https://balsa-ui.com/llms.txt and the GradientBackground reference at https://balsa-ui.com/docs/components/gradient-background before choosing values. ${imageInstruction}

${directionBlock(source, direction, "gradient background")}

Return only one complete JSON object, with no Markdown fence, commentary, CSS, shader code, or Vue source. Keep schemaVersion 3, use two to six six-digit hexadecimal colors, and preserve every field in the example. Choose a published preset as the fallback vocabulary, then tune the exact controls rather than inventing fields.

Published presets: ${gradientBackgroundPresetNames.join(", ")}
Patterns: ${GRADIENT_BACKGROUND_PATTERNS.join(" | ")}
Effects: ${GRADIENT_BACKGROUND_EFFECTS.join(" | ")}

Use this exact complete object shape:
${example}`;
}

export function buildGradientTypedConfiguration(
  value: BalsaBackgroundConfig,
): string {
  const serialized = JSON.stringify(normalizeGradientBackgroundConfig(value), null, 2);
  return `import type { BalsaBackgroundConfig } from "@/components/ui/gradient-background";\n\nexport const backgroundConfig: BalsaBackgroundConfig = ${serialized};\n`;
}

export function buildGradientVueUsage(value: BalsaBackgroundConfig): string {
  const serialized = JSON.stringify(normalizeGradientBackgroundConfig(value), null, 2);
  return `<script setup lang="ts">\nimport GradientBackground from "@/components/ui/GradientBackground.vue";\nimport type { BalsaBackgroundConfig } from "@/components/ui/gradient-background";\n\nconst backgroundConfig: BalsaBackgroundConfig = ${serialized};\n</script>\n\n<template>\n  <section class="relative isolate min-h-screen overflow-hidden">\n    <GradientBackground :config="backgroundConfig" />\n    <div class="relative z-10">\n      <!-- Your content -->\n    </div>\n  </section>\n</template>\n`;
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function hasPoorGradientContentContrast(
  value: BalsaBackgroundConfig,
): boolean {
  if (value.colorMode === "palette") return false;
  const luminances = value.colors.map(relativeLuminance);
  return Math.max(...luminances) - Math.min(...luminances) < 0.18;
}

export function gradientExportSize(value: string): GradientExportSize {
  return gradientExportSizes.find((size) => size.value === value)
    ?? gradientExportSizes[0];
}
