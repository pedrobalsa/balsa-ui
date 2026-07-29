import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCatalogIndex } from "./agent-context.mjs";
import { loadRegistry, readJson, rootDir, sourcePath, writeJson } from "./registry-lib.mjs";

export async function buildCatalog() {
  const registry = await loadRegistry();
  const publicItems = registry.items.filter((item) => item.meta?.spec);
  const items = [];

  for (const item of publicItems) {
    const spec = await readJson(sourcePath(item.meta.spec));
    items.push({
      name: spec.name,
      title: spec.title,
      category: spec.category,
      description: item.description,
      status: spec.status,
      version: spec.version,
      registry: `@balsa/${item.name}`,
      registryDependencies: item.registryDependencies,
      npmDependencies: item.dependencies,
      tokens: spec.tokens,
      documentation: item.meta.documentation,
      example: item.meta.documentation,
      source: item.files.map((file) => file.path),
      framework: item.meta.framework,
    });
  }

  const catalog = {
    schemaVersion: 1,
    framework: "vue",
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
