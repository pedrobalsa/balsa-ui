import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  defaultRegistryTarget,
  generatedDirectory,
  namespace,
  parseTargetAddress,
  registryTargetConfigurations,
  route,
} from "../bin/registry-targets.mjs";
import {
  formatComponentMarkdown,
  publicBaseUrl,
  publicDocumentationUrl,
} from "./agent-context.mjs";
import { catalogInvariantErrors, itemSpecificationPath } from "./catalog.mjs";
import { parseItemReference } from "./registry-resolve.mjs";
import {
  generatedItemDirectory,
  itemPath,
  loadRegistry,
  loadTargetRegistry,
  readJson,
  repoPath,
  rootDir,
} from "./registry-lib.mjs";

const allowedTypes = new Set(["registry:theme", "registry:ui", "registry:component", "registry:block"]);
const target = defaultRegistryTarget;
const targetNamespace = namespace(target);
const generatedRoot = path.join(rootDir, "registry", generatedDirectory(target));
const publicArtifactPath = (name) => path.join(
  rootDir,
  "public",
  ...route(target, name).split("/").filter(Boolean),
);
const publicRegistryRoot = path.dirname(publicArtifactPath("registry"));
const registry = await loadRegistry();
const names = new Set();
const errors = [];
const ajv = new Ajv2020({ allErrors: true });
const validateSpec = ajv.compile(await readJson(path.join(rootDir, "specs", "component.schema.json")));
const validateCatalog = ajv.compile(await readJson(path.join(rootDir, "specs", "catalog.schema.json")));
const validateManifest = ajv.compile(await readJson(path.join(rootDir, "specs", "installed-manifest.schema.json")));

async function assertBalsaDependencyExists(label, dependency, currentTarget, currentRegistry) {
  if (/^https?:\/\//.test(dependency)) return;
  const parsed = parseItemReference(dependency);
  if (parsed.namespace !== targetNamespace) return;
  let dependencyTarget;
  let itemName;
  try {
    ({ target: dependencyTarget, itemName } = parseTargetAddress(parsed.name));
  } catch {
    errors.push(`${label}: missing registry dependency ${dependency}`);
    return;
  }
  const source = dependencyTarget === currentTarget
    ? currentRegistry
    : await loadTargetRegistry(dependencyTarget);
  if (!source?.items.some((candidate) => candidate.name === itemName)) {
    errors.push(`${label}: missing registry dependency ${dependency}`);
  }
}

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
  // Guarded roots differ by layout: the public export flattens Vue to the
  // repository root, so `packages/vue/src` exists only in the private checkout.
  // A missing root means nothing to scan, not a broken validator.
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
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
  ...await sourceFiles(path.join(rootDir, "packages", "vue", "src")),
  ...await sourceFiles(path.join(rootDir, "packages", "shared", "src")),
  ...await sourceFiles(generatedRoot),
  ...await sourceFiles(publicRegistryRoot),
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
  if (item.meta?.framework !== target) {
    errors.push(`${item.name}: framework must be ${target}`);
  }

  for (const dependency of item.registryDependencies ?? []) {
    await assertBalsaDependencyExists(item.name, dependency, target, registry);
  }

  for (const file of item.files ?? []) {
    // A consumer running the official create-vue ESLint configuration enforces
    // vue/multi-word-component-names. Installed single-word files satisfy it
    // through an explicit component name rather than a consumer rule override.
    if (file.path.endsWith(".vue")) {
      const base = path.basename(file.path, ".vue");
      if (/^[A-Z][a-z0-9]*$/.test(base)) {
        const source = await readFile(itemPath(file.path, { target }), "utf8");
        if (!/defineOptions\(\{[^}]*name:\s*"[A-Z][a-z0-9]*[A-Z]/.test(source)) {
          errors.push(
            `${item.name}: ${base}.vue is single-word and must declare a multi-word defineOptions name`,
          );
        }
      }
    }
    try {
      const canonical = await readFile(itemPath(file.path, { target }));
      const mirror = await readFile(
        path.join(rootDir, generatedItemDirectory(item, target), path.basename(file.target)),
      );
      if (!canonical.equals(mirror)) errors.push(`${item.name}: generated mirror is stale for ${file.path}`);
    } catch (error) {
      errors.push(`${item.name}: cannot read ${file.path} (${error.message})`);
    }
  }

  if (item.meta?.spec) {
    try {
      const spec = await readJson(repoPath(item.meta.spec));
      if (!validateSpec(spec)) errors.push(...schemaErrors(`${item.name} spec`, validateSpec));
      if (spec.schemaVersion !== 1 || spec.name !== item.name) errors.push(`${item.name}: spec identity mismatch`);
      await access(repoPath(item.meta.documentation));
      await access(repoPath(item.meta.example));
    } catch (error) {
      errors.push(`${item.name}: invalid metadata reference (${error.message})`);
    }
  }

  try {
    const built = await readJson(publicArtifactPath(item.name));
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
errors.push(...catalogInvariantErrors(catalog));
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
  if (JSON.stringify(publicIndex.frameworks) !== JSON.stringify(catalog.frameworks)) {
    errors.push("Public compact catalog frameworks do not match the complete catalog");
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
    const specPath = itemSpecificationPath(item);
    const canonicalSpec = await readJson(repoPath(specPath));
    const publicSpec = await readJson(path.join(rootDir, "public", specPath));
    const canonicalDocs = await readFile(
      repoPath(item.documentation),
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
  if (starterRegistry.registries?.[targetNamespace] !== `${publicBaseUrl}${route(target, "{name}")}`) {
    errors.push("Vue starter does not use the public Balsa registry");
  }
  if (starterCatalog.items.length !== expectedCatalogCount) {
    errors.push("Vue starter agent catalog is stale");
  }
  if (starterCatalog.schemaVersion !== catalog.schemaVersion) {
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

for (const [targetName, configuration] of Object.entries(registryTargetConfigurations())) {
  if (targetName === defaultRegistryTarget || !configuration.itemSource) continue;
  const targetRegistry = await loadTargetRegistry(targetName);
  if (!targetRegistry?.items?.length) continue;
  const hostedPath = (name) => path.join(
    rootDir,
    "public",
    ...route(targetName, name).split("/").filter(Boolean),
  );
  const seen = new Set();
  for (const item of targetRegistry.items) {
    if (seen.has(item.name)) errors.push(`${targetName}/${item.name}: duplicate item`);
    seen.add(item.name);
    if (!allowedTypes.has(item.type)) {
      errors.push(`${targetName}/${item.name}: unsupported type ${item.type}`);
    }
    if (!item.description || !item.files?.length) {
      errors.push(`${targetName}/${item.name}: description and files are required`);
    }
    if (item.meta?.framework !== targetName) {
      errors.push(`${targetName}/${item.name}: framework must be ${targetName}`);
    }
    for (const dependency of item.registryDependencies ?? []) {
      await assertBalsaDependencyExists(
        `${targetName}/${item.name}`,
        dependency,
        targetName,
        targetRegistry,
      );
    }
    for (const file of item.files ?? []) {
      try {
        const canonical = await readFile(itemPath(file.path, { target: targetName }));
        const mirror = await readFile(
          path.join(rootDir, generatedItemDirectory(item, targetName), path.basename(file.target)),
        );
        if (!canonical.equals(mirror)) {
          errors.push(`${targetName}/${item.name}: generated mirror is stale for ${file.path}`);
        }
      } catch (error) {
        errors.push(`${targetName}/${item.name}: cannot read ${file.path} (${error.message})`);
      }
    }
    try {
      const built = await readJson(hostedPath(item.name));
      if (built.$schema !== configuration.itemSchemaUrl) {
        errors.push(`${targetName}/${item.name}: hosted item schema does not match the target`);
      }
      if (built.name !== item.name || built.files.length !== item.files.length) {
        errors.push(`${targetName}/${item.name}: built registry JSON is stale`);
      }
      if (built.files.some((file) => file.content?.includes("\r\n"))) {
        errors.push(
          `${targetName}/${item.name}: built registry JSON embeds CRLF line endings, so the published payload depends on the build machine`,
        );
      }
    } catch (error) {
      errors.push(`${targetName}/${item.name}: built registry JSON is missing (${error.message})`);
    }
  }
  try {
    const index = await readJson(hostedPath("registry"));
    if (index.$schema !== configuration.indexSchemaUrl) {
      errors.push(`${targetName}: hosted index schema does not match the target`);
    }
  } catch (error) {
    errors.push(`${targetName}: hosted registry index is missing (${error.message})`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${registry.items.length} registry items and ${expectedCatalogCount} component specifications.`);
}
