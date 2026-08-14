import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  formatComponentMarkdown,
  publicBaseUrl,
  publicDocumentationUrl,
} from "./agent-context.mjs";
import {
  generatedDirectory,
  loadRegistry,
  localDependencyName,
  readJson,
  rootDir,
  sourcePath,
} from "./registry-lib.mjs";

const allowedTypes = new Set(["registry:theme", "registry:ui", "registry:component", "registry:block"]);
const registry = await loadRegistry();
const names = new Set();
const errors = [];
const ajv = new Ajv2020({ allErrors: true });
const validateSpec = ajv.compile(await readJson(path.join(rootDir, "specs", "component.schema.json")));
const validateCatalog = ajv.compile(await readJson(path.join(rootDir, "specs", "catalog.schema.json")));
const validateManifest = ajv.compile(await readJson(path.join(rootDir, "specs", "installed-manifest.schema.json")));

const documentationSections = [
  "## Use for",
  "## Avoid for",
  "## Accessibility",
  "## Public API",
  "## Tokens",
  "## Examples",
  "## Common mistakes",
];

function documentationProblems(item, spec) {
  const problems = [];
  let markdown;
  try {
    markdown = formatComponentMarkdown(item, spec);
  } catch (error) {
    return [`documentation generation failed (${error.message})`];
  }
  for (const section of documentationSections) {
    if (!markdown.includes(section)) {
      problems.push(`generated documentation is missing the ${section.slice(3)} section`);
    }
  }
  for (const line of markdown.split("\n")) {
    const rendered = /^- ([^:]+): undefined$/.exec(line);
    if (rendered) {
      problems.push(`generated documentation renders an undefined ${rendered[1]} value`);
    }
  }
  return problems;
}

function schemaErrors(label, validator) {
  return (validator.errors ?? []).map((error) => `${label}${error.instancePath || "/"}: ${error.message}`);
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(target) : [target];
  }));
  return nested.flat();
}

const legacyIconPackage = ["@", "mdi", "/font"].join("");
const legacyIconClass = ["mdi", "-"].join("");
const legacyIconStylesheet = ["balsa", "-icons.css"].join("");
const legacyChartPackages = [["vue", "-chartjs"].join(""), ["chart", ".js"].join("")];
const guardedFiles = [
  path.join(rootDir, "package.json"),
  path.join(rootDir, "package-lock.json"),
  path.join(rootDir, "registry.json"),
  ...await sourceFiles(path.join(rootDir, "src")),
  ...await sourceFiles(path.join(rootDir, "registry", "vue")),
  ...await sourceFiles(path.join(rootDir, "public", "r")),
  ...await sourceFiles(path.join(rootDir, "starters", "vue", "src")),
  ...await sourceFiles(path.join(rootDir, "tests", "fixtures", "registry-vue", "src")),
  path.join(rootDir, "starters", "vue", "package.json"),
  path.join(rootDir, "starters", "vue", "package-lock.json"),
  path.join(rootDir, "tests", "fixtures", "registry-vue", "package.json"),
  path.join(rootDir, "tests", "fixtures", "registry-vue", "package-lock.json"),
  ...await sourceFiles(path.join(rootDir, "bin")),
  ...await sourceFiles(path.join(rootDir, "scripts")),
].filter((file) => /\.(?:css|js|json|mjs|ts|vue)$/.test(file));
for (const file of guardedFiles) {
  const source = await readFile(file, "utf8");
  const cleanupScript = path.basename(file) === "sync-starter.mjs";
  if (source.includes(legacyIconPackage) || source.includes(legacyIconClass) || (!cleanupScript && source.includes(legacyIconStylesheet))) {
    errors.push(`${path.relative(rootDir, file)}: legacy icon-font implementation returned`);
  }
  if (source.includes(legacyChartPackages[0]) || source.includes(legacyChartPackages[1])) {
    errors.push(`${path.relative(rootDir, file)}: legacy chart dependency returned`);
  }
}

for (const item of registry.items) {
  if (names.has(item.name)) errors.push(`Duplicate item: ${item.name}`);
  names.add(item.name);
  if (!allowedTypes.has(item.type)) errors.push(`${item.name}: unsupported type ${item.type}`);
  if (!item.description || !item.files?.length) errors.push(`${item.name}: description and files are required`);
  if (item.meta?.framework !== "vue") errors.push(`${item.name}: framework must be vue`);

  for (const dependency of item.registryDependencies ?? []) {
    const localName = localDependencyName(dependency);
    if (localName && !registry.items.some((candidate) => candidate.name === localName)) {
      errors.push(`${item.name}: missing registry dependency ${dependency}`);
    }
  }

  for (const file of item.files ?? []) {
    // A consumer running the official create-vue ESLint configuration enforces
    // vue/multi-word-component-names. Installed single-word files satisfy it
    // through an explicit component name rather than a consumer rule override.
    if (file.path.endsWith(".vue")) {
      const base = path.basename(file.path, ".vue");
      if (/^[A-Z][a-z0-9]*$/.test(base)) {
        const source = await readFile(sourcePath(file.path), "utf8");
        if (!/defineOptions\(\{[^}]*name:\s*"[A-Z][a-z0-9]*[A-Z]/.test(source)) {
          errors.push(
            `${item.name}: ${base}.vue is single-word and must declare a multi-word defineOptions name`,
          );
        }
      }
    }
    try {
      const canonical = await readFile(sourcePath(file.path));
      const mirror = await readFile(path.join(rootDir, generatedDirectory(item), path.basename(file.target)));
      if (!canonical.equals(mirror)) errors.push(`${item.name}: generated mirror is stale for ${file.path}`);
    } catch (error) {
      errors.push(`${item.name}: cannot read ${file.path} (${error.message})`);
    }
  }

  if (item.meta?.spec) {
    try {
      const spec = await readJson(sourcePath(item.meta.spec));
      if (!validateSpec(spec)) errors.push(...schemaErrors(`${item.name} spec`, validateSpec));
      if (spec.schemaVersion !== 1 || spec.name !== item.name) errors.push(`${item.name}: spec identity mismatch`);
      await access(sourcePath(item.meta.documentation));
      await access(sourcePath(item.meta.example));
    } catch (error) {
      errors.push(`${item.name}: invalid metadata reference (${error.message})`);
    }
  }

  try {
    const built = await readJson(path.join(rootDir, "public", "r", `${item.name}.json`));
    if (built.name !== item.name || built.files.length !== item.files.length) {
      errors.push(`${item.name}: built registry JSON is stale`);
    }
    // A published payload must be identical whatever platform built it.
    if (built.files.some((file) => file.content?.includes("\r\n"))) {
      errors.push(
        `${item.name}: built registry JSON embeds CRLF line endings, so the published payload depends on the build machine`,
      );
    }
  } catch (error) {
    errors.push(`${item.name}: built registry JSON is missing (${error.message})`);
  }
}

const catalog = await readJson(path.join(rootDir, ".balsa", "catalog.json"));
if (!validateCatalog(catalog)) errors.push(...schemaErrors("catalog", validateCatalog));
const expectedCatalogCount = registry.items.filter((item) => item.meta?.spec).length;
if (catalog.items.length !== expectedCatalogCount) errors.push("Catalog item count does not match public specs");
try {
  const publicCatalog = await readJson(path.join(rootDir, "public", "catalog.json"));
  const publicIndex = await readJson(path.join(rootDir, "public", "catalog-index.json"));
  if (JSON.stringify(publicCatalog) !== JSON.stringify(catalog)) {
    errors.push("Public agent catalog is stale");
  }
  if (publicIndex.itemCount !== expectedCatalogCount || publicIndex.items.length !== expectedCatalogCount) {
    errors.push("Public compact catalog is stale");
  }
  const llms = await readFile(path.join(rootDir, "public", "llms.txt"), "utf8");
  const llmsFull = await readFile(
    path.join(rootDir, "public", "llms-full.txt"),
    "utf8",
  );
  const robots = await readFile(path.join(rootDir, "public", "robots.txt"), "utf8");
  const sitemap = await readFile(path.join(rootDir, "public", "sitemap.xml"), "utf8");
  if (!llms.includes(publicBaseUrl) || llms.includes("balsa-ui.dev")) {
    errors.push("llms.txt: public URLs do not use the canonical production domain");
  }
  if (!llms.includes(`${publicBaseUrl}/llms-full.txt`) || llms.length > 4000) {
    errors.push("llms.txt: compact entry point is missing the full-document link or is too large");
  }
  if (!llmsFull.includes(publicBaseUrl) || llmsFull.includes("balsa-ui.dev")) {
    errors.push("llms-full.txt: public URLs do not use the canonical production domain");
  }
  if (!robots.includes(`Sitemap: ${publicBaseUrl}/sitemap.xml`)) {
    errors.push("robots.txt: canonical sitemap URL is missing");
  }
  if (
    !sitemap.includes(`<loc>${publicBaseUrl}/</loc>`) ||
    !sitemap.includes(`<loc>${publicBaseUrl}/docs</loc>`)
  ) {
    errors.push("sitemap.xml: canonical root and documentation URLs are missing");
  }
  for (const item of catalog.items) {
    const canonicalSpec = await readJson(
      sourcePath(`specs/components/${item.name}.json`),
    );
    const publicSpec = await readJson(
      path.join(rootDir, "public", "specs", "components", `${item.name}.json`),
    );
    const canonicalDocs = await readFile(
      sourcePath(item.documentation),
    );
    const publicDocs = await readFile(
      path.join(rootDir, "public", "docs", "components", `${item.name}.md`),
    );
    if (JSON.stringify(canonicalSpec) !== JSON.stringify(publicSpec)) {
      errors.push(`${item.name}: public agent specification is stale`);
    }
    if (!canonicalDocs.equals(publicDocs)) {
      errors.push(`${item.name}: public Markdown documentation is stale`);
    }
    for (const problem of documentationProblems(item, canonicalSpec)) {
      errors.push(`${item.name}: ${problem}`);
    }
    if (!llmsFull.includes(`/docs/components/${item.name}.md`)) {
      errors.push(`${item.name}: missing from llms-full.txt`);
    }
    if (!sitemap.includes(`<loc>${publicDocumentationUrl(item)}</loc>`)) {
      errors.push(`${item.name}: missing from sitemap.xml`);
    }
  }
} catch (error) {
  errors.push(`Agent-readable public documentation is missing (${error.message})`);
}

for (const manifestPath of [
  path.join(rootDir, "starters", "vue", ".balsa", "installed.json"),
  path.join(rootDir, "tests", "fixtures", "registry-vue", ".balsa", "installed.json"),
]) {
  try {
    const manifest = await readJson(manifestPath);
    if (!validateManifest(manifest)) {
      errors.push(...schemaErrors(`${path.relative(rootDir, manifestPath)} manifest`, validateManifest));
    }
  } catch (error) {
    errors.push(`Missing generated installation manifest ${path.relative(rootDir, manifestPath)} (${error.message})`);
  }
}

try {
  const starterPackage = await readJson(path.join(rootDir, "starters", "vue", "package.json"));
  const starterPackageLock = await readJson(
    path.join(rootDir, "starters", "vue", "package-lock.json"),
  );
  const starterRegistry = await readJson(path.join(rootDir, "starters", "vue", "components.json"));
  const starterCatalog = await readJson(
    path.join(rootDir, "starters", "vue", ".balsa", "catalog.json"),
  );
  const starterMain = await readFile(
    path.join(rootDir, "starters", "vue", "src", "main.ts"),
    "utf8",
  );
  const starterCss = await readFile(
    path.join(rootDir, "starters", "vue", "src", "index.css"),
    "utf8",
  );
  const starterFonts = await readFile(
    path.join(rootDir, "starters", "vue", "src", "styles", "balsa-fonts.css"),
    "utf8",
  );
  const starterHtml = await readFile(
    path.join(rootDir, "starters", "vue", "index.html"),
    "utf8",
  );
  if (starterPackage.dependencies?.balsaui) {
    errors.push("Vue starter still depends on the monorepo filesystem");
  }
  if (JSON.stringify(starterPackageLock).includes('"balsaui"')) {
    errors.push("Vue starter lockfile still contains the monorepo filesystem dependency");
  }
  if (starterRegistry.registries?.["@balsa"] !== `${publicBaseUrl}/r/{name}.json`) {
    errors.push("Vue starter does not use the public Balsa registry");
  }
  if (starterCatalog.items.length !== expectedCatalogCount) {
    errors.push("Vue starter agent catalog is stale");
  }
  if (starterMain.includes("@fontsource/")) {
    errors.push("Vue starter does not use the lean font entry point");
  }
  if (
    !starterCss.includes('balsa-fonts.css')
    || !starterFonts.includes("noto-sans-latin-400-normal.woff2")
    || /normal\.woff["?)]/.test(starterFonts)
  ) {
    errors.push("Vue starter optimized font stylesheet is missing or references legacy formats");
  }
  if (!starterHtml.includes('<html lang="en" data-palette="light">')) {
    errors.push("Vue starter does not activate its explicit Light palette");
  }
  await access(
    path.join(rootDir, "starters", "vue", ".agents", "skills", "balsa-ui", "SKILL.md"),
  );
  await access(
    path.join(
      rootDir,
      "starters",
      "vue",
      ".agents",
      "skills",
      "balsa-template-design",
      "SKILL.md",
    ),
  );
  await access(
    path.join(
      rootDir,
      "starters",
      "vue",
      ".balsa",
      "skills",
      "balsa-template-design",
      "LICENSE.txt",
    ),
  );
} catch (error) {
  errors.push(`Vue starter agent context is incomplete (${error.message})`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${registry.items.length} registry items and ${expectedCatalogCount} component specifications.`);
}
