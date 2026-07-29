import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import {
  backgroundExportIdentifier,
  createBackgroundConfiguration,
  decodeBackgroundInlineConfig,
  validateBackgroundName,
} from "../scripts/background-cli.mjs";
import { encodeBackgroundInlineConfig } from "../src/background/background-studio";
import { getGradientBackgroundPreset } from "../src/components/ui/gradient-background";

const temporaryRoot = resolve(process.cwd(), ".tmp");
mkdirSync(temporaryRoot, { recursive: true });
const created: string[] = [];

function temporaryProject(): string {
  const directory = mkdtempSync(resolve(temporaryRoot, "background-cli-"));
  created.push(directory);
  return directory;
}

afterEach(() => {
  while (created.length) {
    const directory = created.pop();
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
});

describe("Balsa background CLI", () => {
  it("avoids duplicating the Background suffix in generated identifiers", () => {
    expect(backgroundExportIdentifier("hero")).toBe("heroBackground");
    expect(backgroundExportIdentifier("studio-background")).toBe("studioBackground");
  });

  it("generates a typed preset configuration and installs renderer dependencies", async () => {
    const target = temporaryProject();
    const result = await createBackgroundConfiguration({
      name: "hero-fold",
      cwd: target,
      preset: "black-silk",
    });
    expect(result.relativeTarget).toBe("src/backgrounds/hero-fold.ts");
    const source = readFileSync(result.destination, "utf8");
    expect(source).toContain(
      'import type { BalsaBackgroundConfig } from "../components/ui/gradient-background";',
    );
    expect(source).toContain("export const heroFoldBackground: BalsaBackgroundConfig");
    expect(source).toContain('"preset": "black-silk"');
    expect(existsSync(resolve(target, "src/components/ui/GradientBackground.vue"))).toBe(true);
    expect(existsSync(resolve(target, "src/components/ui/gradient-background-shader.ts"))).toBe(true);

    const manifest = JSON.parse(
      readFileSync(resolve(target, ".balsa/installed.json"), "utf8"),
    );
    expect(manifest.components["gradient-background"].registry).toBe(
      "@balsa/gradient-background",
    );
    expect(manifest.components["background-hero-fold"]).toMatchObject({
      registry: "@balsa/background-config",
      targetPath: "src/backgrounds/hero-fold.ts",
    });
    expect(result.installed.at(-1)?.dependencies).toEqual([
      "vue",
      "three",
      "@types/three",
    ]);
  });

  it("consumes Background Studio JSON without changing the visual config", async () => {
    const target = temporaryProject();
    const inputPath = resolve(target, "studio.json");
    const config = { ...getGradientBackgroundPreset("iridescent-flow"), seed: 991 };
    writeFileSync(inputPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    const result = await createBackgroundConfiguration({
      name: "launch",
      cwd: target,
      from: inputPath,
    });
    expect(result.config).toEqual(config);
    expect(readFileSync(result.destination, "utf8")).toContain('"seed": 991');
  });

  it("consumes the exact Studio configuration from one inline command payload", async () => {
    const target = temporaryProject();
    const config = { ...getGradientBackgroundPreset("smoke-field"), seed: 1776 };
    const inlineConfig = encodeBackgroundInlineConfig(config);
    expect(decodeBackgroundInlineConfig(inlineConfig)).toEqual(config);

    const result = await createBackgroundConfiguration({
      name: "studio-background",
      cwd: target,
      inlineConfig,
    });
    expect(result.config).toEqual(config);
    expect(readFileSync(result.destination, "utf8")).toContain('"seed": 1776');
  });

  it("migrates saved schema-one geometry into schema-two field controls", async () => {
    const target = temporaryProject();
    const inputPath = resolve(target, "legacy.json");
    const current = getGradientBackgroundPreset("obsidian-fold");
    const legacy: Record<string, unknown> = {
      ...current,
      schemaVersion: 1,
      noiseOctaves: 3,
      noiseFrequency: 1.45,
    };
    delete legacy.fieldOctaves;
    delete legacy.fieldFrequency;
    delete legacy.noiseAmount;
    writeFileSync(inputPath, JSON.stringify(legacy), "utf8");

    const result = await createBackgroundConfiguration({
      name: "migrated",
      cwd: target,
      from: inputPath,
    });
    expect(result.config).toMatchObject({
      schemaVersion: 2,
      fieldOctaves: 3,
      fieldFrequency: 1.45,
      noiseAmount: current.noiseAmount,
      noiseOctaves: current.noiseOctaves,
      noiseFrequency: current.noiseFrequency,
    });
  });

  it("refuses invalid names, presets, schema versions, and differing overwrites", async () => {
    expect(() => validateBackgroundName("Hero Background")).toThrow("lowercase kebab-case");
    expect(() => decodeBackgroundInlineConfig("not.valid")).toThrow(
      "valid base64url payload",
    );
    const invalidPresetTarget = temporaryProject();
    await expect(createBackgroundConfiguration({
      name: "hero",
      cwd: invalidPresetTarget,
      preset: "unknown",
    })).rejects.toThrow("Unknown Balsa background preset");
    await expect(createBackgroundConfiguration({
      name: "hero",
      cwd: invalidPresetTarget,
      preset: "obsidian-fold",
      inlineConfig: encodeBackgroundInlineConfig(
        getGradientBackgroundPreset("obsidian-fold"),
      ),
    })).rejects.toThrow("Use only one of");

    const invalidJsonTarget = temporaryProject();
    const inputPath = resolve(invalidJsonTarget, "invalid.json");
    writeFileSync(inputPath, JSON.stringify({
      ...getGradientBackgroundPreset("obsidian-fold"),
      schemaVersion: 3,
    }));
    await expect(createBackgroundConfiguration({
      name: "hero",
      cwd: invalidJsonTarget,
      from: inputPath,
    })).rejects.toThrow("Unsupported Balsa background schema version");

    const overwriteTarget = temporaryProject();
    const first = await createBackgroundConfiguration({
      name: "hero",
      cwd: overwriteTarget,
      preset: "obsidian-fold",
    });
    writeFileSync(first.destination, "// customized\n", "utf8");
    await expect(createBackgroundConfiguration({
      name: "hero",
      cwd: overwriteTarget,
      preset: "silver-dunes",
    })).rejects.toThrow("Refusing to overwrite customized file");
    expect(readFileSync(first.destination, "utf8")).toBe("// customized\n");
  });

  it("exposes the documented non-interactive command and concise usage output", () => {
    const target = temporaryProject();
    const inlineConfig = encodeBackgroundInlineConfig({
      ...getGradientBackgroundPreset("obsidian-fold"),
      seed: 314,
    });
    const result = spawnSync(
      process.execPath,
      [
        "bin/balsa.mjs",
        "background",
        "create",
        "hero",
        "--config",
        inlineConfig,
        "--cwd",
        target,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("Created src/backgrounds/hero.ts");
    expect(result.stdout).toContain(
      'import { heroBackground } from "@/backgrounds/hero";',
    );
    expect(result.stdout).toContain('<GradientBackground :config="heroBackground" />');
    expect(result.stdout).toContain("three, @types/three");
    expect(readFileSync(resolve(target, "src/backgrounds/hero.ts"), "utf8")).toContain(
      '"seed": 314',
    );
  });
});
