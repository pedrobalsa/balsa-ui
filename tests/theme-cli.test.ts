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
  createThemeConfiguration,
  decodeThemeInlineConfig,
  normalizeCliThemeConfig,
  optionValues,
  themeExportIdentifier,
  validateThemeName,
} from "../scripts/theme-cli.mjs";
import { themeOptionDefinitions } from "@/components/ui/theme";

const temporaryRoot = resolve(process.cwd(), ".tmp");
mkdirSync(temporaryRoot, { recursive: true });
const created: string[] = [];

function temporaryProject(): string {
  const directory = mkdtempSync(resolve(temporaryRoot, "theme-cli-"));
  created.push(directory);
  return directory;
}

function payload(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

afterEach(() => {
  while (created.length) {
    const directory = created.pop();
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
});

/**
 * The CLI keeps its own copy of the recipe dimensions, because it is plain ESM
 * and the definitions are TypeScript. A copy that falls behind does not fail
 * loudly — it rejects a valid payload as invalid, so a design system authored in
 * the Studio cannot be exported. That is what happened to `spacing`: it became a
 * dimension and was never added here.
 */
describe("recipe dimensions", () => {
  it("accepts exactly the dimensions the design system defines", () => {
    expect(Object.keys(optionValues).sort())
      .toEqual(themeOptionDefinitions.map((definition) => definition.key).sort());
  });

  it("accepts exactly the values each dimension defines", () => {
    for (const definition of themeOptionDefinitions) {
      expect([...optionValues[definition.key]].sort(), `${definition.key} values`)
        .toEqual([...definition.values].sort());
    }
  });
});

describe("Balsa theme CLI", () => {
  it("normalizes preset configurations and stable identifiers", () => {
    expect(themeExportIdentifier("product-dark")).toBe("productDarkTheme");
    expect(themeExportIdentifier("product-theme")).toBe("productTheme");
    expect(normalizeCliThemeConfig({
      schemaVersion: 1,
      base: "modern-flat",
      options: { shape: "square" },
      overrides: { tokens: { radius: { control: 3 } } },
    })).toEqual({
      schemaVersion: 1,
      base: "modern-flat",
      options: { shape: "square" },
      overrides: { tokens: { radius: { control: 3 } } },
    });
    expect(normalizeCliThemeConfig({
      schemaVersion: 1,
      base: "modern-flat",
      options: { border: "none" },
    }).options).toEqual({ border: "none" });
    expect(normalizeCliThemeConfig({
      schemaVersion: 1,
      base: "modern-flat",
      options: { border: "subtle" },
    }).options).toEqual({ border: "medium" });
    expect(normalizeCliThemeConfig({
      schemaVersion: 1,
      base: "modern-flat",
      overrides: { tokens: { border: { opacity: 0.4 } } },
    }).overrides?.tokens.border).toEqual({ opacity: 0.4 });
  });

  it("supports preset, file, and inline generation and records provenance", async () => {
    const presetTarget = temporaryProject();
    const preset = await createThemeConfiguration({
      name: "product-flat",
      cwd: presetTarget,
      preset: "modern-flat",
    });
    const source = readFileSync(preset.destination, "utf8");
    expect(source).toContain('import { defineTheme } from "../components/ui/theme";');
    expect(source).toContain("export const productFlatTheme = defineTheme");
    expect(source).toContain('"extends": "modern-flat"');
    expect(existsSync(resolve(presetTarget, "src/theme/theme-store.ts"))).toBe(true);
    const manifest = JSON.parse(
      readFileSync(resolve(presetTarget, ".balsa/installed.json"), "utf8"),
    );
    expect(manifest.components["@balsa/balsa-theme"].registry).toBe("@balsa/balsa-theme");
    expect(manifest.components["@balsa/theme-product-flat"]).toMatchObject({
      registry: "@balsa/theme-product-flat",
      targetPath: "src/themes/product-flat.ts",
    });

    const config = {
      schemaVersion: 1,
      base: "brutalism",
      options: { material: "glass" },
      overrides: { tokens: { effects: { backdropBlur: 12 } } },
    };
    const fileTarget = temporaryProject();
    const inputPath = resolve(fileTarget, "theme.json");
    writeFileSync(inputPath, JSON.stringify(config), "utf8");
    const fromFile = await createThemeConfiguration({
      name: "from-file",
      cwd: fileTarget,
      from: inputPath,
    });
    expect(fromFile.config).toEqual(config);

    const inlineTarget = temporaryProject();
    const inlineConfig = payload(config);
    expect(decodeThemeInlineConfig(inlineConfig)).toEqual(config);
    const inline = await createThemeConfiguration({
      name: "from-editor",
      cwd: inlineTarget,
      inlineConfig,
    });
    expect(readFileSync(inline.destination, "utf8")).toContain('"backdropBlur": 12');
  }, 20000);

  it("rejects invalid input and protects differing modules", async () => {
    expect(() => validateThemeName("Product Theme")).toThrow("lowercase kebab-case");
    expect(() => decodeThemeInlineConfig("not.valid")).toThrow("valid base64url");
    expect(() => normalizeCliThemeConfig({
      schemaVersion: 2,
      base: "modern-flat",
    })).toThrow("Unsupported Balsa theme preset schema version");
    expect(() => normalizeCliThemeConfig({
      schemaVersion: 1,
      base: "unknown",
    })).toThrow("Unknown Balsa theme preset");
    expect(() => normalizeCliThemeConfig({
      schemaVersion: 1,
      base: "modern-flat",
      options: { material: "holographic" },
    })).toThrow("Theme option");
    expect(() => normalizeCliThemeConfig({
      schemaVersion: 1,
      base: "modern-flat",
      overrides: { tokens: { border: { opacity: 1.1 } } },
    })).toThrow("between 0 and 1");
    expect(() => normalizeCliThemeConfig({
      schemaVersion: 1,
      base: "modern-flat",
      overrides: { tokens: { materials: { surface: { role: "#ffffff" } } } },
    })).toThrow("semantic palette role");

    const target = temporaryProject();
    const first = await createThemeConfiguration({
      name: "protected",
      cwd: target,
      preset: "modern-flat",
    });
    writeFileSync(first.destination, "// customized\n", "utf8");
    await expect(createThemeConfiguration({
      name: "protected",
      cwd: target,
      preset: "brutalism",
    })).rejects.toThrow("Refusing to overwrite customized file");
    expect(readFileSync(first.destination, "utf8")).toBe("// customized\n");
  }, 20000);

  it("documents and prints the non-mutating registration handoff", () => {
    const help = spawnSync(process.execPath, ["bin/balsa.mjs", "help"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(help.status, help.stderr).toBe(0);
    expect(help.stdout).toContain("balsa theme create <name>");

    const target = temporaryProject();
    const command = spawnSync(process.execPath, [
      "bin/balsa.mjs", "theme", "create", "product", "--preset",
      "glassmorphism", "--cwd", target,
    ], { cwd: process.cwd(), encoding: "utf8" });
    expect(command.status, command.stderr).toBe(0);
    expect(command.stdout).toContain("Created src/themes/product.ts");
    expect(command.stdout).toContain(
      'import { productTheme } from "@/themes/product";',
    );
    expect(command.stdout).toContain(
      "createDesignThemeStore({ themes: [productTheme] });",
    );
  });
});
