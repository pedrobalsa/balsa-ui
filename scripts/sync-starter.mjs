import path from "node:path";
import { readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { installRegistryItems } from "./install-registry.mjs";
import {
  ensureStyleImports,
  publicBaseUrl,
} from "./agent-context.mjs";
import { readJson, rootDir, writeJson } from "./registry-lib.mjs";
import { createProjectConfiguration } from "./registry-resolve.mjs";
import {
  registryTargetConfigurations,
  starterSyncForTarget,
} from "../bin/registry-targets.mjs";
import { existingConsumerStarters } from "./run-starter.mjs";

const starterFontCss = [
  "/* Balsa starter Latin fonts. WOFF2-only sources keep the default bundle compact. */",
  "@font-face {",
  '  font-family: "Noto Sans";',
  '  src: url("@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff2") format("woff2");',
  "  font-style: normal;",
  "  font-weight: 400;",
  "  font-display: swap;",
  "}",
  "@font-face {",
  '  font-family: "Noto Sans";',
  '  src: url("@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff2") format("woff2");',
  "  font-style: normal;",
  "  font-weight: 700;",
  "  font-display: swap;",
  "}",
  "@font-face {",
  '  font-family: "Space Grotesk";',
  '  src: url("@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff2") format("woff2");',
  "  font-style: normal;",
  "  font-weight: 500;",
  "  font-display: swap;",
  "}",
  "",
].join("\n");

export function applyTextOperations(source, operations = []) {
  return operations.reduce((result, operation) => {
    if (!operation || typeof operation.find !== "string") return result;
    const replace = operation.replace ?? "";
    if (typeof operation.flags === "string") {
      return result.replace(new RegExp(operation.find, operation.flags), replace);
    }
    return operation.all ? result.replaceAll(operation.find, replace) : result.replace(operation.find, replace);
  }, source);
}

function namespaceStarterSource(source, sync) {
  return applyTextOperations(
    applyTextOperations(source, sync.utilityRenames),
    sync.utilityReplacements,
  );
}

function pruneStarterLock(lock, rootPackageName) {
  delete lock.packages?.[""]?.dependencies?.balsaui;
  delete lock.packages?.[""]?.dependencies?.[rootPackageName];
  delete lock.packages?.["../.."];
  delete lock.packages?.["node_modules/balsaui"];
  delete lock.packages?.[`node_modules/${rootPackageName}`];
  return lock;
}

export async function syncStarter({ framework, directory }) {
  const starterDir = path.join(rootDir, directory);
  const sync = starterSyncForTarget(framework);
  const displayName = registryTargetConfigurations()[framework].displayName;

  for (const relative of sync.legacyFiles ?? []) {
    await rm(path.join(starterDir, relative), { force: true });
  }

  const manifestPath = path.join(starterDir, ".balsa", "installed.json");
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    for (const key of sync.legacyManifestKeys ?? []) {
      delete manifest.components[key];
    }
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const items = await installRegistryItems({
    names: [...sync.items],
    cwd: starterDir,
    force: true,
    forceAgentSkill: true,
    framework,
  });
  await ensureStyleImports(starterDir, true);

  const starterCssPath = path.join(starterDir, sync.cssFile);
  const starterAppPath = path.join(starterDir, sync.appFile);
  const starterMainPath = path.join(starterDir, sync.mainFile);
  const starterHtmlPath = path.join(starterDir, sync.htmlFile);
  const starterFontsPath = path.join(starterDir, sync.fontsFile);

  await writeFile(starterFontsPath, starterFontCss, "utf8");
  const starterCssSource = applyTextOperations(
    await readFile(starterCssPath, "utf8"),
    sync.cssRemovals,
  );
  const starterCss = namespaceStarterSource(
    starterCssSource.includes("balsa-fonts.css")
      ? starterCssSource
      : starterCssSource.replace(
          '@import "tailwindcss";',
          '@import "tailwindcss";\n@import "./styles/balsa-fonts.css";',
        ),
    sync,
  );
  await writeFile(
    starterCssPath,
    starterCss.includes("balsa-foundation.css")
      ? starterCss
      : starterCss.replace(
          '@import "./styles/balsa-palette.css";',
          '@import "./styles/balsa-foundation.css";\n@import "./styles/balsa-palette.css";',
        ),
    "utf8",
  );
  await writeFile(
    starterAppPath,
    namespaceStarterSource(await readFile(starterAppPath, "utf8"), sync),
    "utf8",
  );
  await writeFile(
    starterMainPath,
    applyTextOperations(await readFile(starterMainPath, "utf8"), sync.mainRemovals),
    "utf8",
  );
  const starterHtml = (await readFile(starterHtmlPath, "utf8")).replace(
    /<html lang="en"(?: data-palette="[^"]+")?>/,
    '<html lang="en" data-palette="light">',
  );
  await writeFile(starterHtmlPath, starterHtml, "utf8");

  const packagePath = path.join(starterDir, "package.json");
  const packageLockPath = path.join(starterDir, "package-lock.json");
  const starterPackage = await readJson(packagePath);
  const rootPackage = await readJson(path.join(rootDir, "package.json"));
  delete starterPackage.dependencies?.balsaui;
  delete starterPackage.dependencies?.[rootPackage.name];
  for (const dependency of sync.legacyNpmDependencies ?? []) {
    delete starterPackage.dependencies?.[dependency];
  }
  starterPackage.dependencies ??= {};
  for (const dependency of Object.keys(starterPackage.devDependencies ?? {})) {
    delete starterPackage.dependencies[dependency];
  }
  for (const dependency of new Set(items.flatMap((item) => item.dependencies))) {
    if (
      starterPackage.dependencies[dependency]
      || starterPackage.devDependencies?.[dependency]
    ) {
      continue;
    }
    const version =
      rootPackage.dependencies?.[dependency]
      ?? rootPackage.devDependencies?.[dependency];
    if (!version) {
      throw new Error(
        `Starter dependency ${dependency} is missing from the root package manifest.`,
      );
    }
    starterPackage.dependencies[dependency] = version;
  }
  await writeJson(packagePath, starterPackage);

  // The starter must stay standalone: a `file:../..` self-reference leaves a link
  // entry whose target the export removes, which npm cannot reload afterwards.
  try {
    await writeJson(
      packageLockPath,
      pruneStarterLock(await readJson(packageLockPath), rootPackage.name),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!process.env.npm_execpath) {
    throw new Error("Run starter synchronization through `npm run starter:sync`.");
  }
  execFileSync(
    process.execPath,
    [
      process.env.npm_execpath,
      "install",
      "--package-lock-only",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
    ],
    { cwd: starterDir, stdio: "inherit" },
  );
  await writeJson(
    packageLockPath,
    pruneStarterLock(await readJson(packageLockPath), rootPackage.name),
  );

  const components = await createProjectConfiguration({
    stylesheet: "src/index.css",
    framework,
  });
  components.registries["@balsa"] = `${publicBaseUrl}/r/{name}.json`;
  await writeJson(path.join(starterDir, "components.json"), components);
  await writeFile(path.join(starterDir, "AGENTS.md"), sync.agents.join("\n"), "utf8");
  await writeFile(path.join(starterDir, "README.md"), sync.readme.join("\n"), "utf8");
  console.log(`Synchronized ${items.length} items into the ${displayName} starter.`);
  return items;
}

export async function syncExistingStarters() {
  const starters = existingConsumerStarters();
  if (!starters.length) {
    throw new Error("No consumer starter directories exist.");
  }
  for (const starter of starters) {
    await syncStarter(starter);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await syncExistingStarters();
}
