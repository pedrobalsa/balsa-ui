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
    "Balsa UI is an agent-native, open-code Vue 3 component system. Install only the source an application needs.",
    "",
    "## Existing Vue project",
    "",
    "```sh",
    "npx balsa-ui@latest init",
    'npx balsa-ui@latest search "settings form"',
    "npx balsa-ui@latest info input --markdown",
    "npx balsa-ui@latest add input button",
    "```",
    "",
    "Read `.balsa/catalog-index.json`, then only the selected `.balsa/specs/components/<name>.json`. Preserve local changes to installed source.",
    "",
    "## Public machine-readable sources",
    "",
    `- Catalog index: ${publicBaseUrl}/catalog-index.json`,
    `- Complete catalog: ${publicBaseUrl}/catalog.json`,
    `- Component specification: ${publicBaseUrl}/specs/components/<name>.json`,
    `- Component Markdown: ${publicBaseUrl}/docs/components/<name>.md`,
    `- Registry item: ${publicBaseUrl}/r/<name>.json`,
    "",
  ].join("\n");
}

function llmsText(catalog) {
  return [
    "# Balsa UI",
    "",
    "> Agent-native, open-code Vue 3 components with independent palettes, design themes, and gradient backgrounds.",
    "",
    "Use Balsa when building Vue 3 + TypeScript + Tailwind CSS 4 interfaces. Prefer a matching Balsa item instead of regenerating common UI controls.",
    "",
    "## Start",
    "",
    `- [Agent quick start](${publicBaseUrl}/agent/quick-start.md)`,
    `- [Installation](${publicBaseUrl}/docs/installation)`,
    `- [CLI](${publicBaseUrl}/docs/cli)`,
    `- [Compact catalog](${publicBaseUrl}/catalog-index.json)`,
    `- [Complete catalog](${publicBaseUrl}/catalog.json)`,
    "",
    "## Commands",
    "",
    "- `npx balsa-ui@latest init`",
    '- `npx balsa-ui@latest search "settings form"`',
    "- `npx balsa-ui@latest info select --markdown`",
    "- `npx balsa-ui@latest add select button`",
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
  await writeFile(path.join(publicDir, "llms.txt"), llmsText(catalog), "utf8");
  console.log(`Built agent-readable docs for ${catalog.items.length} public items.`);
  return catalog;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildAgentDocs();
}

