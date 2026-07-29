import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createCatalogIndex,
  publicBaseUrl,
} from "./agent-context.mjs";
import { buildCatalog } from "./build-catalog.mjs";
import { readJson, rootDir, sourcePath, writeJson } from "./registry-lib.mjs";

const publicDir = path.join(rootDir, "public");
const publicDocsDir = path.join(publicDir, "docs", "components");
const publicSpecsDir = path.join(publicDir, "specs", "components");
const publicAgentDir = path.join(publicDir, "agent");
const publicPagePaths = [
  "/",
  "/docs",
  "/docs/installation",
  "/docs/cli",
  "/docs/open-code",
  "/docs/palette",
  "/docs/themes",
  "/docs/accessibility",
  "/docs/agents",
  "/docs/registry",
  "/docs/starter",
  "/docs/catalog",
  "/docs/source-updates",
  "/docs/changelog",
  "/tools/background-studio",
];

function assertGeneratedTarget(target) {
  const resolved = path.resolve(target);
  if (!resolved.startsWith(`${publicDir}${path.sep}`)) {
    throw new Error(`Generated agent target escapes public/: ${target}`);
  }
}

async function resetGeneratedDirectory(target) {
  assertGeneratedTarget(target);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
}

function quickStartMarkdown() {
  return [
    "# Balsa UI agent quick start",
    "",
    "Balsa UI is an agent-native, open-code Vue 3 component system. In an existing Vue project, install and select components before writing common controls or surfaces.",
    "",
    "## Required workflow",
    "",
    "```sh",
    "npx balsa-ui@latest init",
    'npx balsa-ui@latest search "settings form"',
    "npx balsa-ui@latest info input --markdown",
    "npx balsa-ui@latest add input button",
    "```",
    "",
    "Do not recreate a Balsa-covered button, field, dialog, menu, card, navigation region, or feedback control with raw HTML and CSS. Read only the selected `.balsa/specs/components/<name>.json`; inspect component source only when changing its behavior. Preserve local changes to installed source.",
    "",
    "Use `.balsa/catalog-index.json` only when CLI search is unavailable. Do not load `.balsa/catalog.json` unless dependency, token, documentation, or source metadata is required.",
    "",
    "## Public machine-readable sources",
    "",
    `- Compact agent entry: ${publicBaseUrl}/llms.txt`,
    `- Optional complete component listing: ${publicBaseUrl}/llms-full.txt`,
    `- Catalog index: ${publicBaseUrl}/catalog-index.json`,
    `- Complete catalog: ${publicBaseUrl}/catalog.json`,
    `- Component specification: ${publicBaseUrl}/specs/components/<name>.json`,
    `- Component Markdown: ${publicBaseUrl}/docs/components/<name>.md`,
    `- Registry item: ${publicBaseUrl}/r/<name>.json`,
    "",
  ].join("\n");
}

function llmsText() {
  return [
    "# Balsa UI",
    "",
    "> Agent-native, open-code Vue 3 components with independent palettes, design themes, and gradient backgrounds.",
    "",
    "Use Balsa when building Vue 3 + TypeScript + Tailwind CSS 4 interfaces.",
    "",
    "## Required agent workflow",
    "",
    "In an existing Vue project, run these commands before writing common controls or surfaces:",
    "",
    "```sh",
    "npx balsa-ui@latest init",
    'npx balsa-ui@latest search "settings form"',
    "npx balsa-ui@latest info input --markdown",
    "npx balsa-ui@latest add input button modal",
    "```",
    "",
    "Do not rebuild a matching Balsa component with raw HTML and CSS. The selected specification is sufficient for normal composition; inspect installed source only when changing component behavior.",
    "",
    "## Focused references",
    "",
    `- [Agent quick start](${publicBaseUrl}/agent/quick-start.md)`,
    `- [Compact catalog](${publicBaseUrl}/catalog-index.json)`,
    `- [Optional complete component listing](${publicBaseUrl}/llms-full.txt)`,
    `- [Installation](${publicBaseUrl}/docs/installation)`,
    `- [CLI](${publicBaseUrl}/docs/cli)`,
    "",
  ].join("\n");
}

function llmsFullText(catalog) {
  return [
    llmsText().trimEnd(),
    "",
    "## Components",
    "",
    ...catalog.items.map(
      (item) =>
        `- [${item.title}](${publicBaseUrl}/docs/components/${item.name}.md): ${item.description}`,
    ),
    "",
  ].join("\n");
}

function robotsText() {
  return [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${publicBaseUrl}/sitemap.xml`,
    "",
  ].join("\n");
}

function sitemapXml(catalog) {
  const paths = [
    ...publicPagePaths,
    ...catalog.items.map((item) => `/docs/components/${item.name}`),
  ];
  const urls = [...new Set(paths)].map(
    (pagePath) => `  <url><loc>${new URL(pagePath, `${publicBaseUrl}/`).href}</loc></url>`,
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export async function buildAgentDocs() {
  const catalog = await buildCatalog();
  await resetGeneratedDirectory(publicDocsDir);
  await resetGeneratedDirectory(publicSpecsDir);
  await resetGeneratedDirectory(publicAgentDir);

  await writeJson(path.join(publicDir, "catalog.json"), catalog);
  await writeJson(
    path.join(publicDir, "catalog-index.json"),
    createCatalogIndex(catalog),
  );

  for (const item of catalog.items) {
    await copyFile(
      sourcePath(`docs/components/${item.name}.md`),
      path.join(publicDocsDir, `${item.name}.md`),
    );
    await writeJson(
      path.join(publicSpecsDir, `${item.name}.json`),
      await readJson(sourcePath(`specs/components/${item.name}.json`)),
    );
  }

  await writeFile(
    path.join(publicAgentDir, "quick-start.md"),
    quickStartMarkdown(),
    "utf8",
  );
  await writeFile(path.join(publicDir, "llms.txt"), llmsText(), "utf8");
  await writeFile(
    path.join(publicDir, "llms-full.txt"),
    llmsFullText(catalog),
    "utf8",
  );
  await writeFile(path.join(publicDir, "robots.txt"), robotsText(), "utf8");
  await writeFile(path.join(publicDir, "sitemap.xml"), sitemapXml(catalog), "utf8");
  console.log(`Built agent-readable docs for ${catalog.items.length} public items.`);
  return catalog;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildAgentDocs();
}
