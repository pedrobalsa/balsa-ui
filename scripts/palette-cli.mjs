import { readFile } from "node:fs/promises";
import path from "node:path";
import { ensureStyleImports } from "./agent-context.mjs";
import { installRegistryItems } from "./install-registry.mjs";
import { readJson, writeJson } from "./registry-lib.mjs";
import { validateThemeName } from "./theme-cli.mjs";
import {
  contentHash,
  createPaletteStylesheet,
  decodeDesignSystemInlineConfig,
  normalizeCliPaletteConfig,
  writeGenerated,
} from "./design-system-cli.mjs";

/**
 * The palette half of `design-system create`, on its own. A palette carries the
 * seven source colors and any token overrides, so it only ever writes a
 * stylesheet -- there is no theme module and nothing to register in code.
 */
export async function createPaletteConfiguration({
  name,
  cwd,
  from,
  inlineConfig,
  force = false,
}) {
  validateThemeName(name, "Palette");
  if (from && inlineConfig) throw new Error("Use only one of --from or --config.");
  if (!from && !inlineConfig) {
    throw new Error("A palette needs --config <payload> or --from <file>.");
  }
  const projectRoot = path.resolve(cwd ?? process.cwd());

  let input;
  if (inlineConfig) {
    input = decodeDesignSystemInlineConfig(inlineConfig);
  } else {
    const inputPath = path.resolve(from);
    try {
      input = JSON.parse(await readFile(inputPath, "utf8"));
    } catch (error) {
      throw new Error(`Could not read palette JSON ${inputPath}: ${error.message}`);
    }
  }
  const config = normalizeCliPaletteConfig(input);

  const paletteSource = createPaletteStylesheet(name, config);
  // `design-system create` suffixes `-palette` to distinguish the stylesheet from
  // its sibling theme module. A standalone palette has no sibling, so the name
  // stands alone rather than reading as `my-palette-palette.css`.
  const paletteTarget = path.join("src", "styles", `${name}.css`);

  const installed = await installRegistryItems({
    names: ["balsa-palette"],
    cwd: projectRoot,
    force,
  });
  const paletteFile = await writeGenerated(projectRoot, paletteTarget, paletteSource, force);
  // A standalone palette installs the foundation but no theme, so the theme
  // import is omitted rather than pointing the stylesheet at a missing file.
  const stylesheet = await ensureStyleImports(projectRoot, {
    includeTheme: false,
    generated: [`${name}.css`],
  });

  const manifestPath = path.join(projectRoot, ".balsa", "installed.json");
  const manifest = await readJson(manifestPath);
  const generatedHash = contentHash(paletteSource);
  manifest.components[`@balsa/palette-${name}`] = {
    registry: `@balsa/palette-${name}`,
    namespace: "@balsa",
    installedVersion: "1.0.0",
    designSystemVersion: manifest.components["@balsa/balsa-palette"]?.designSystemVersion,
    originalSourceHash: generatedHash,
    installedSourceHash: generatedHash,
    targetPath: paletteFile,
    files: [paletteFile],
  };
  await writeJson(manifestPath, manifest);

  return {
    config,
    paletteTarget: paletteFile,
    paletteId: name,
    installed,
    stylesheet,
    projectRoot,
  };
}
