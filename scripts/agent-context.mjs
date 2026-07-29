import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  readJson,
  rootDir,
  sourcePath,
  writeJson,
} from "./registry-lib.mjs";

export const publicBaseUrl = "https://balsa-ui.com";
export const catalogPath = path.join(rootDir, ".balsa", "catalog.json");
export const catalogIndexPath = path.join(rootDir, ".balsa", "catalog-index.json");

const agentBlockStart = "<!-- balsa-ui-agent-context:start -->";
const agentBlockEnd = "<!-- balsa-ui-agent-context:end -->";
const stylesheetCandidates = [
  "src/index.css",
  "src/style.css",
  "src/styles.css",
  "src/assets/main.css",
];

export function createCatalogIndex(catalog) {
  return {
    schemaVersion: catalog.schemaVersion,
    framework: catalog.framework,
    itemCount: catalog.items.length,
    items: catalog.items.map((item) => ({
      name: item.name,
      title: item.title,
      category: item.category,
      description: item.description,
      status: item.status,
    })),
  };
}

export async function loadCatalog() {
  return readJson(catalogPath);
}

function searchableText(item) {
  return [
    item.name,
    item.title,
    item.category,
    item.description,
    ...(item.registryDependencies ?? []),
    ...(item.npmDependencies ?? []),
  ].join(" ").toLocaleLowerCase();
}

export function searchCatalog(catalog, query) {
  const terms = query
    .toLocaleLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);
  if (!terms.length) return catalog.items;

  return catalog.items
    .map((item) => {
      const name = item.name.toLocaleLowerCase();
      const title = item.title.toLocaleLowerCase();
      const text = searchableText(item);
      const matchedTerms = terms.filter((term) => text.includes(term));
      if (!matchedTerms.length) return undefined;
      const score = terms.reduce((total, term) => {
        if (name === term) return total + 12;
        if (name.startsWith(term)) return total + 8;
        if (title.includes(term)) return total + 4;
        if (text.includes(term)) return total + 1;
        return total;
      }, matchedTerms.length === terms.length ? 6 : 0);
      return { item, score };
    })
    .filter(Boolean)
    .sort((left, right) =>
      right.score - left.score || left.item.name.localeCompare(right.item.name)
    )
    .map(({ item }) => item);
}

export function compactCatalogItem(item) {
  return {
    name: item.name,
    title: item.title,
    category: item.category,
    description: item.description,
    status: item.status,
    version: item.version,
    install: `npx balsa-ui@latest add ${item.name}`,
    documentation: `${publicBaseUrl}/docs/components/${item.name}`,
    markdown: `${publicBaseUrl}/docs/components/${item.name}.md`,
    specification: `${publicBaseUrl}/specs/components/${item.name}.json`,
    registryDependencies: item.registryDependencies,
    npmDependencies: item.npmDependencies,
  };
}

function listLines(items) {
  return items.map(
    (item) =>
      `${item.name.padEnd(20)} ${item.category.padEnd(12)} ${item.description}`,
  );
}

export function formatCatalogList(items) {
  return listLines(items).join("\n");
}

export function formatComponentMarkdown(item, spec) {
  const lines = [
    `# ${spec.title}`,
    "",
    spec.purpose,
    "",
    `Install: \`npx balsa-ui@latest add ${item.name}\``,
    `Documentation: ${publicBaseUrl}/docs/components/${item.name}`,
    "",
    "## Use for",
    "",
    ...spec.useFor.map((value) => `- ${value}`),
    "",
    "## Avoid for",
    "",
    ...spec.avoidFor.map((value) => `- ${value}`),
    "",
    "## Accessibility",
    "",
    ...spec.accessibility.map((value) => `- ${value}`),
    "",
    "## Public API",
    "",
    `- Props: ${spec.publicApi.props.join(", ") || "None"}`,
    `- Events: ${spec.publicApi.events.join(", ") || "None"}`,
    `- Slots: ${spec.publicApi.slots.join(", ") || "None"}`,
    "",
    "## Common mistakes",
    "",
    ...spec.commonMistakes.map((value) => `- ${value}`),
    "",
  ];
  return lines.join("\n");
}

export async function loadComponentSpec(item) {
  return readJson(sourcePath(`specs/components/${item.name}.json`));
}

async function copyAgentSpecs(targetRoot, catalog) {
  for (const item of catalog.items) {
    const source = sourcePath(`specs/components/${item.name}.json`);
    const target = path.join(
      targetRoot,
      ".balsa",
      "specs",
      "components",
      `${item.name}.json`,
    );
    await writeJson(target, await readJson(source));
  }
}

async function copyAgentSkill(targetRoot, force = false) {
  const source = await readFile(sourcePath("skills/balsa-ui/SKILL.md"), "utf8");
  const canonicalTarget = path.join(
    targetRoot,
    ".balsa",
    "skills",
    "balsa-ui",
    "SKILL.md",
  );
  await mkdir(path.dirname(canonicalTarget), { recursive: true });
  await writeFile(canonicalTarget, source, "utf8");

  const discoveryTarget = path.join(
    targetRoot,
    ".agents",
    "skills",
    "balsa-ui",
    "SKILL.md",
  );
  if (!force) {
    try {
      const existing = await readFile(discoveryTarget, "utf8");
      if (existing !== source) return;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  await mkdir(path.dirname(discoveryTarget), { recursive: true });
  await writeFile(discoveryTarget, source, "utf8");
}

export async function syncAgentContext(targetRoot, { forceSkill = false } = {}) {
  const catalog = await loadCatalog();
  await writeJson(path.join(targetRoot, ".balsa", "catalog.json"), catalog);
  await writeJson(
    path.join(targetRoot, ".balsa", "catalog-index.json"),
    createCatalogIndex(catalog),
  );
  await copyAgentSpecs(targetRoot, catalog);
  await copyAgentSkill(targetRoot, forceSkill);
  await mkdir(path.join(targetRoot, ".balsa"), { recursive: true });
  await writeFile(
    path.join(targetRoot, ".balsa", "README.md"),
    [
      "# Balsa agent context",
      "",
      "Use the CLI to search by intent before loading catalog files into context. Then read only the selected specification under `specs/components/`.",
      "Use `catalog-index.json` only when CLI search is unavailable, and `catalog.json` only for dependency, token, documentation, or source metadata.",
      "",
      "```sh",
      'npx balsa-ui@latest search "settings form"',
      "npx balsa-ui@latest info input --markdown",
      "npx balsa-ui@latest add input button",
      "```",
      "",
      "Installed source belongs to this application. Preserve local changes and do not use `--force` without reviewing the diff.",
      "",
    ].join("\n"),
    "utf8",
  );
  return catalog;
}

function agentInstructions() {
  return [
    agentBlockStart,
    "## Balsa UI",
    "",
    "- Before writing common controls or surfaces, run `npx balsa-ui@latest search \"<intent>\"`, then read only the selected `.balsa/specs/components/<name>.json`.",
    "- Install matching items with `npx balsa-ui@latest add <name>` before implementing the interface. Do not rebuild a Balsa-covered control with raw HTML and CSS.",
    "- The specification is sufficient for normal composition. Inspect installed component source only when changing its behavior.",
    "- Use semantic Balsa tokens and preserve component accessibility behavior and typed APIs.",
    "- Treat installed files as application source. Never use `--force` without reviewing local differences.",
    "- Validate application changes with the repository's existing lint, test, typecheck, and build commands.",
    agentBlockEnd,
  ].join("\n");
}

export async function ensureAgentInstructions(targetRoot) {
  const target = path.join(targetRoot, "AGENTS.md");
  let source = "";
  try {
    source = await readFile(target, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const block = agentInstructions();
  const start = source.indexOf(agentBlockStart);
  const end = source.indexOf(agentBlockEnd);
  const next = start >= 0 && end > start
    ? `${source.slice(0, start)}${block}${source.slice(end + agentBlockEnd.length)}`
    : `${source.trimEnd()}${source.trim() ? "\n\n" : ""}${block}\n`;
  await writeFile(target, next, "utf8");
  return target;
}

async function existingStylesheet(targetRoot) {
  for (const candidate of stylesheetCandidates) {
    const target = path.join(targetRoot, candidate);
    try {
      await access(target);
      return target;
    } catch {
      // Continue through the finite supported entrypoint list.
    }
  }
  return undefined;
}

export async function ensureStyleImports(targetRoot, includePalette = false) {
  const target = await existingStylesheet(targetRoot);
  if (!target) return undefined;

  const styleImport = (fileName) => {
    const relative = path
      .relative(path.dirname(target), path.join(targetRoot, "src", "styles", fileName))
      .replaceAll(path.sep, "/");
    return `@import "${relative.startsWith(".") ? relative : `./${relative}`}";`;
  };
  const imports = [
    styleImport("balsa-foundation.css"),
    ...(includePalette ? [styleImport("balsa-palette.css")] : []),
    styleImport("balsa-theme.css"),
  ];
  let source = await readFile(target, "utf8");
  const missing = imports.filter((value) => !source.includes(value));
  if (!missing.length) return target;

  const tailwind = /@import\s+["']tailwindcss["'];?/;
  const matched = source.match(tailwind);
  if (matched?.index !== undefined) {
    const insertion = matched.index + matched[0].length;
    source = `${source.slice(0, insertion)}\n${missing.join("\n")}${source.slice(insertion)}`;
  } else {
    source = `${missing.join("\n")}\n${source}`;
  }
  await writeFile(target, source, "utf8");
  return target;
}

function optimizedMdiStylesheet(source) {
  const version = source.match(/materialdesignicons-webfont\.woff2\?v=([\d.]+)/)?.[1]
    ?? "7.4.47";
  const fontFace = [
    "/* Generated by Balsa UI from @mdi/font. Keep the complete icon map while shipping only WOFF2. */",
    "@font-face {",
    '  font-family: "Material Design Icons";',
    `  src: url("@mdi/font/fonts/materialdesignicons-webfont.woff2?v=${version}") format("woff2");`,
    "  font-weight: normal;",
    "  font-style: normal;",
    "  font-display: block;",
    "}",
    "",
  ].join("\n");
  return source.replace(
    /\/\* MaterialDesignIcons\.com \*\/\s*@font-face\s*\{[\s\S]*?\}\s*/,
    fontFace,
  );
}

export async function ensureIconStyles(targetRoot, items) {
  if (!items.some((item) => item.dependencies?.includes("@mdi/font"))) {
    return undefined;
  }
  const target = path.join(targetRoot, "src", "styles", "balsa-icons.css");
  try {
    await access(target);
    return target;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const source = await readFile(
    sourcePath("node_modules/@mdi/font/css/materialdesignicons.css"),
    "utf8",
  );
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, optimizedMdiStylesheet(source), "utf8");
  return target;
}

export async function ensureIconStyleImport(targetRoot, iconStylesheet) {
  if (!iconStylesheet) return undefined;
  const target = await existingStylesheet(targetRoot);
  if (!target) return undefined;
  const relative = path
    .relative(path.dirname(target), iconStylesheet)
    .replaceAll(path.sep, "/");
  const importValue = `@import "${relative.startsWith(".") ? relative : `./${relative}`}";`;
  let source = await readFile(target, "utf8");
  if (source.includes(importValue)) return target;

  const tailwind = /@import\s+["']tailwindcss["'];?/;
  const matched = source.match(tailwind);
  if (matched?.index !== undefined) {
    const insertion = matched.index + matched[0].length;
    source = `${source.slice(0, insertion)}\n${importValue}${source.slice(insertion)}`;
  } else {
    source = `${importValue}\n${source}`;
  }
  await writeFile(target, source, "utf8");
  return target;
}

export async function missingNpmDependencies(targetRoot, items) {
  let packageJson;
  try {
    packageJson = await readJson(path.join(targetRoot, "package.json"));
  } catch (error) {
    if (error.code === "ENOENT") return [...new Set(items.flatMap((item) => item.dependencies ?? []))];
    throw error;
  }
  const installed = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
  ]);
  return [...new Set(items.flatMap((item) => item.dependencies ?? []))]
    .filter((dependency) => !installed.has(dependency));
}
