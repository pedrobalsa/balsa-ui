import path from "node:path";
import { readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { installRegistryItems } from "./install-registry.mjs";
import { publicBaseUrl } from "./agent-context.mjs";
import { readJson, rootDir, writeJson } from "./registry-lib.mjs";

const starterDir = path.join(rootDir, "starters", "vue");
await rm(path.join(starterDir, "src", "styles", "balsa.css"), { force: true });
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
  names: ["button", "input", "modal", "textarea", "breadcrumb"],
  cwd: starterDir,
  force: true,
  forceAgentSkill: true,
});
const starterCssPath = path.join(starterDir, "src", "index.css");
const starterAppPath = path.join(starterDir, "src", "App.vue");
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

const starterCss = namespaceStarterUtilities(await readFile(starterCssPath, "utf8"));
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

const packagePath = path.join(starterDir, "package.json");
const packageLockPath = path.join(starterDir, "package-lock.json");
const starterPackage = await readJson(packagePath);
const rootPackage = await readJson(path.join(rootDir, "package.json"));
delete starterPackage.dependencies?.balsaui;
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

const starterPackageLock = await readJson(packageLockPath);
delete starterPackageLock.packages?.[""]?.dependencies?.balsaui;
delete starterPackageLock.packages?.["../.."];
delete starterPackageLock.packages?.["node_modules/balsaui"];
await writeJson(packageLockPath, starterPackageLock);

const componentsPath = path.join(starterDir, "components.json");
const components = await readJson(componentsPath);
components.registries = {
  ...(components.registries ?? {}),
  "@balsa": `${publicBaseUrl}/r/{name}.json`,
};
await writeJson(componentsPath, components);
await writeFile(
  path.join(starterDir, "AGENTS.md"),
  [
    "# Balsa Vue starter agent rules",
    "",
    "- Start with `.balsa/catalog-index.json`; read `.balsa/catalog.json` only for dependency, token, documentation, or source metadata.",
    "- Read only the selected `.balsa/specs/components/<name>.json` before creating UI. Prefer installed Balsa components over rebuilding controls.",
    "- Install missing items with `npx balsa-ui@latest add <name>` and preserve local edits. Never use `--force` without reviewing differences.",
    "- Use Vue 3 `<script setup lang=\"ts\">`, typed public APIs, semantic Balsa tokens, and existing accessible behavior.",
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
    "Agents start with `.balsa/catalog-index.json`, then read only the selected specification. Add missing editable components with:",
    "",
    "```sh",
    'npx balsa-ui@latest search "settings form"',
    "npx balsa-ui@latest info input --markdown",
    "npx balsa-ui@latest add input",
    "```",
    "",
    "The starter has no dependency on the Balsa monorepo. Installed Balsa files are ordinary application source; preserve local changes when adding or updating items.",
    "",
  ].join("\n"),
  "utf8",
);
console.log(`Synchronized ${items.length} items into the Vue starter.`);
