import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildCatalog } from "./build-catalog.mjs";
import {
  generatedDirectory,
  loadRegistry,
  rootDir,
  sourcePath,
  writeJson,
} from "./registry-lib.mjs";

const registry = await loadRegistry();

await rm(path.join(rootDir, "registry", "vue"), {
  recursive: true,
  force: true,
});
await rm(path.join(rootDir, "public", "r"), { recursive: true, force: true });
await mkdir(path.join(rootDir, "public", "r"), { recursive: true });

for (const item of registry.items) {
  const outputFiles = [];
  const mirrorDir = path.join(rootDir, generatedDirectory(item));
  await mkdir(mirrorDir, { recursive: true });

  for (const file of item.files) {
    const canonicalPath = sourcePath(file.path);
    const mirrorPath = path.join(mirrorDir, path.basename(file.target));
    await copyFile(canonicalPath, mirrorPath);
    outputFiles.push({
      path: file.path,
      type: file.type,
      target: file.target,
      content: await readFile(canonicalPath, "utf8"),
    });
  }

  await writeJson(path.join(rootDir, "public", "r", `${item.name}.json`), {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies,
    files: outputFiles,
    meta: item.meta,
  });
}

await mkdir(path.join(rootDir, "registry", "vue"), { recursive: true });
await writeFile(
  path.join(rootDir, "registry", "vue", "README.md"),
  "# Generated Vue registry source\n\nDo not edit files in this directory. Run `npm run registry:build`; canonical source lives under `src/`.\n",
  "utf8",
);
await buildCatalog();
console.log(`Built ${registry.items.length} registry items and the agent catalog.`);
