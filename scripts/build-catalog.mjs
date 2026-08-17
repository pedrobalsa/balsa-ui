import path from "node:path";
import { fileURLToPath } from "node:url";
import { address, defaultRegistryTarget } from "../bin/registry-targets.mjs";
import { createCatalogIndex } from "./agent-context.mjs";
import { catalogSchemaVersion } from "./catalog.mjs";
import { loadRegistry, readJson, repoPath, rootDir, writeJson } from "./registry-lib.mjs";

export async function buildCatalog() {
  const target = defaultRegistryTarget;
  const registry = await loadRegistry();
  const publicItems = registry.items.filter((item) => item.meta?.spec);
  const items = [];

  for (const item of publicItems) {
    const spec = await readJson(repoPath(item.meta.spec));
    items.push({
      name: spec.name,
      title: spec.title,
      category: spec.category,
      classification: spec.classification,
      ...(spec.upstream ? { upstream: spec.upstream } : {}),
      description: item.description,
      status: spec.status,
      version: spec.version,
      registry: address(target, item.name),
      registryDependencies: item.registryDependencies,
      npmDependencies: item.dependencies,
      tokens: spec.tokens,
      documentation: item.meta.documentation,
      example: item.meta.documentation,
      source: item.files.map((file) => file.path),
      framework: item.meta.framework,
      specification: item.meta.spec,
    });
  }

  // Stamping the npm version into the catalog is what lets an installed project
  // tell which Balsa release produced its agent context, and lets the release
  // gate prove the registry and the package ship together.
  const packageJson = await readJson(path.join(rootDir, "package.json"));
  const catalog = {
    schemaVersion: catalogSchemaVersion,
    releaseVersion: packageJson.version,
    frameworks: [target],
    generatedFrom: ["registry.json", "specs/components/*.json"],
    items,
  };
  await writeJson(path.join(rootDir, ".balsa", "catalog.json"), catalog);
  await writeJson(
    path.join(rootDir, ".balsa", "catalog-index.json"),
    createCatalogIndex(catalog),
  );
  return catalog;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const catalog = await buildCatalog();
  console.log(`Built catalog with ${catalog.items.length} public items.`);
}
