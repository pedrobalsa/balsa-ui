import path from "node:path";
import { readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { installRegistryItems } from "./install-registry.mjs";
import {
  ensureStyleImports,
  publicBaseUrl,
} from "./agent-context.mjs";
import { readJson, rootDir, writeJson } from "./registry-lib.mjs";
import { createProjectConfiguration } from "./registry-resolve.mjs";

const starterDir = path.join(rootDir, "starters", "vue");
const legacyIconPackage = ["@", "mdi", "/font"].join("");
await rm(path.join(starterDir, "src", "styles", "balsa.css"), { force: true });
await rm(path.join(starterDir, "src", "styles", "balsa-icons.css"), { force: true });
await rm(path.join(starterDir, "src", "components", "compositions", "FormField.vue"), {
  force: true,
});
await rm(path.join(starterDir, "src", "components", "blocks", "PageHeader.vue"), {
  force: true,
});
const manifestPath = path.join(starterDir, ".balsa", "installed.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
delete manifest.components["form-field"];
delete manifest.components["page-header"];
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
const items = await installRegistryItems({
  names: [
    "balsa-palette",
    "button",
    "input",
    "modal",
    "textarea",
    "breadcrumb",
  ],
  cwd: starterDir,
  force: true,
  forceAgentSkill: true,
});
await ensureStyleImports(starterDir, true);
const starterCssPath = path.join(starterDir, "src", "index.css");
const starterAppPath = path.join(starterDir, "src", "App.vue");
const starterMainPath = path.join(starterDir, "src", "main.ts");
const starterHtmlPath = path.join(starterDir, "index.html");
const starterFontsPath = path.join(
  starterDir,
  "src",
  "styles",
  "balsa-fonts.css",
);
const utilityRenames = new Map([
  ["border-border", "border-balsa-border"],
  ["bg-background", "bg-balsa-background"],
  ["text-foreground", "text-balsa-foreground"],
  ["text-muted-foreground", "text-balsa-muted-foreground"],
  ["bg-surface", "bg-balsa-surface"],
  ["text-surface-foreground", "text-balsa-surface-foreground"],
  ["rounded-surface", "rounded-balsa-surface"],
  ["shadow-surface", "shadow-balsa-surface"],
  ["font-body", "font-balsa-body"],
  ["font-title", "font-balsa-title"],
]);

function namespaceStarterUtilities(source) {
  const namespaced = [...utilityRenames].reduce(
    (result, [legacy, namespaced]) => result.replaceAll(legacy, namespaced),
    source,
  );
  return namespaced
    .replace(
      "@apply border-balsa-border;",
      "border-color: var(--color-balsa-border);",
    )
    .replace(
      "@apply m-0 min-w-80 bg-balsa-background font-balsa-body text-balsa-foreground antialiased;",
      "@apply m-0 min-w-80 antialiased;\n    background-color: var(--color-balsa-background);\n    color: var(--color-balsa-foreground);\n    font-family: var(--font-balsa-body);",
    )
    .replace(
      "@apply font-balsa-title text-4xl font-medium leading-tight tracking-tight md:text-5xl;",
      "@apply text-4xl font-medium leading-tight tracking-tight md:text-5xl;\n    font-family: var(--font-balsa-title);",
    );
}

await writeFile(
  starterFontsPath,
  [
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
  ].join("\n"),
  "utf8",
);
const starterCssSource = (await readFile(starterCssPath, "utf8"))
  .replace(/^@import ["']\.\/styles\/balsa-icons\.css["'];\r?\n/gm, "");
const starterCss = namespaceStarterUtilities(
  starterCssSource.includes('balsa-fonts.css')
    ? starterCssSource
    : starterCssSource.replace(
        '@import "tailwindcss";',
        '@import "tailwindcss";\n@import "./styles/balsa-fonts.css";',
      ),
);
await writeFile(
  starterCssPath,
  starterCss.includes('balsa-foundation.css')
    ? starterCss
    : starterCss.replace(
        '@import "./styles/balsa-palette.css";',
        '@import "./styles/balsa-foundation.css";\n@import "./styles/balsa-palette.css";',
  ),
  "utf8",
);
await writeFile(
  starterAppPath,
  namespaceStarterUtilities(await readFile(starterAppPath, "utf8")),
  "utf8",
);
const starterMain = (await readFile(starterMainPath, "utf8"))
  .replace(`import "${legacyIconPackage}/css/materialdesignicons.css";\n`, "")
  .replace(/^import "@fontsource\/[^"]+";\r?\n/gm, "");
await writeFile(
  starterMainPath,
  starterMain,
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
delete starterPackage.dependencies?.[legacyIconPackage];
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

function pruneStarterLock(lock) {
  delete lock.packages?.[""]?.dependencies?.balsaui;
  delete lock.packages?.[""]?.dependencies?.[rootPackage.name];
  delete lock.packages?.["../.."];
  delete lock.packages?.["node_modules/balsaui"];
  delete lock.packages?.[`node_modules/${rootPackage.name}`];
  return lock;
}

// The starter must stay standalone: a `file:../..` self-reference leaves a link
// entry whose target the export removes, which npm cannot reload afterwards.
await writeJson(packageLockPath, pruneStarterLock(await readJson(packageLockPath)));
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

await writeJson(packageLockPath, pruneStarterLock(await readJson(packageLockPath)));

const componentsPath = path.join(starterDir, "components.json");
const components = await createProjectConfiguration({ stylesheet: "src/index.css" });
components.registries["@balsa"] = `${publicBaseUrl}/r/{name}.json`;
await writeJson(componentsPath, components);
await writeFile(
  path.join(starterDir, "AGENTS.md"),
  [
    "# Balsa Vue starter agent rules",
    "",
    "- Before writing common UI, run `npx balsa-ui@latest search \"<intent>\"`; use `.balsa/catalog-index.json` only when CLI search is unavailable.",
    "- Read only the selected `.balsa/specs/components/<name>.json`, then install missing items with `npx balsa-ui@latest add <name>` before implementation.",
    "- Prefer installed Balsa components over rebuilding controls. The specification is sufficient for normal use; inspect component source only when changing behavior.",
    "- Preserve local edits and never use `--force` without reviewing differences.",
    "- Use Vue 3 `<script setup lang=\"ts\">`, typed public APIs, semantic `balsa` color utilities for theme-aware UI, and existing accessible behavior. Standard Tailwind colors remain available for product-specific decoration.",
    "- The starter activates the Light palette on `<html>`. Keep palette, semantic content colors, and Balsa component surfaces consistent.",
    "- Keep labels, keyboard behavior, focus visibility, accessible names, and state announcements intact.",
    "- Validate changes with `npm run lint`, `npm run test`, and `npm run build`.",
    "",
  ].join("\n"),
  "utf8",
);
await writeFile(
  path.join(starterDir, "README.md"),
  [
    "# Balsa UI Vue starter",
    "",
    "A standalone Vue 3, strict TypeScript, Vite, and Tailwind CSS 4 starting point with Balsa's foundation, palette, themes, representative editable components, validation, and local agent context.",
    "",
    "```sh",
    "npm install",
    "npm run dev",
    "npm run check",
    "```",
    "",
    "Agents search by intent first, then read only the selected specification and add the matching editable components before writing raw controls:",
    "",
    "```sh",
    'npx balsa-ui@latest search "settings form"',
    "npx balsa-ui@latest info input --markdown",
    "npx balsa-ui@latest add input button modal",
    "```",
    "",
    "The starter has no dependency on the Balsa monorepo. Installed Balsa files are ordinary application source; preserve local changes when adding or updating items. The generated font stylesheet keeps the Latin application fonts on modern WOFF2 assets, while icons are tree-shaken Vue components.",
    "",
  ].join("\n"),
  "utf8",
);
console.log(`Synchronized ${items.length} items into the Vue starter.`);
