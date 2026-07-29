import { access, readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { publicBaseUrl } from "./agent-context.mjs";
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

function schemaErrors(label, validator) {
  return (validator.errors ?? []).map((error) => `${label}${error.instancePath || "/"}: ${error.message}`);
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
      sourcePath(`docs/components/${item.name}.md`),
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
    if (!llmsFull.includes(`/docs/components/${item.name}.md`)) {
      errors.push(`${item.name}: missing from llms-full.txt`);
    }
    if (!sitemap.includes(`<loc>${publicBaseUrl}/docs/components/${item.name}</loc>`)) {
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
  const starterIcons = await readFile(
    path.join(rootDir, "starters", "vue", "src", "styles", "balsa-icons.css"),
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
  if (
    starterMain.includes("@fontsource/")
    || starterMain.includes("@mdi/font/css/materialdesignicons")
  ) {
    errors.push("Vue starter does not use the lean font and icon entry points");
  }
  if (
    !starterCss.includes('balsa-icons.css')
    || !starterCss.includes('balsa-fonts.css')
    || !starterIcons.includes("materialdesignicons-webfont.woff2")
    || /materialdesignicons-webfont\.(?:eot|ttf|woff)\?/.test(starterIcons)
    || !starterFonts.includes("noto-sans-latin-400-normal.woff2")
    || /normal\.woff["?)]/.test(starterFonts)
  ) {
    errors.push("Vue starter optimized font or icon stylesheet is missing or references legacy formats");
  }
  if (!starterHtml.includes('<html lang="en" data-palette="light">')) {
    errors.push("Vue starter does not activate its explicit Light palette");
  }
  await access(
    path.join(rootDir, "starters", "vue", ".agents", "skills", "balsa-ui", "SKILL.md"),
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
