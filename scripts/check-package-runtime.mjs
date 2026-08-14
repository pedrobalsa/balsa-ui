/**
 * Verify the installed CLI can reach every local runtime module from the npm
 * tarball. Source-tree tests cannot catch a missing `files` entry: Node resolves
 * it locally and the failure appears only after publication.
 */
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadRegistry, rootDir, sourcePath } from "./registry-lib.mjs";

const importPattern = /(?:from\s+|import\s*\()\s*["'](\.\.?\/[^"']+)["']/g;
export const requiredData = [
  ".balsa/catalog-index.json",
  ".balsa/catalog.json",
  "registry.json",
  "skills/balsa-ui/SKILL.md",
  "skills/balsa-template-design/SKILL.md",
  "skills/balsa-template-design/LICENSE.txt",
  "src/config/components-template.json",
  "src/design-system/built-ins.json",
];

function packagePath(relativePath) {
  return path.relative(rootDir, sourcePath(relativePath)).replaceAll("\\", "/");
}

export async function collectCliModules(entry = "bin/balsa.mjs") {
  const queue = [entry];
  const visited = new Set();

  while (queue.length) {
    const relative = queue.shift();
    if (visited.has(relative)) continue;
    visited.add(relative);

    const source = await readFile(sourcePath(relative), "utf8");
    for (const match of source.matchAll(importPattern)) {
      const imported = path.posix.normalize(path.posix.join(path.posix.dirname(relative), match[1]));
      if (imported.endsWith(".mjs")) queue.push(imported);
    }
  }

  return [...visited];
}

export async function collectPackageRuntimeRequirements(registry) {
  const registrySources = registry.items.flatMap((item) =>
    item.files.map((file) => packagePath(file.path))
  );
  const componentSpecs = registry.items
    .filter((item) => item.meta?.spec)
    .map((item) => packagePath(`specs/components/${item.name}.json`));

  return {
    cliModules: await collectCliModules(),
    cliData: requiredData,
    registrySources,
    componentSpecs,
  };
}

export async function verifyPackedRuntime(packed, registry) {
  const requirements = await collectPackageRuntimeRequirements(registry);
  const missing = [
    ...requirements.cliModules.filter((entry) => !packed.has(entry)),
    ...requirements.cliData.filter((entry) => !packed.has(entry)),
    ...requirements.registrySources.filter((entry) => !packed.has(entry)),
    ...requirements.componentSpecs.filter((entry) => !packed.has(entry)),
  ];
  const hasAdapters = [...packed].some((entry) => entry.startsWith("adapters/"));
  if (!hasAdapters) missing.push("adapters/**");

  if (missing.length) {
    throw new Error(
      `npm tarball is missing CLI runtime files:\n${[...new Set(missing)].map((entry) => `- ${entry}`).join("\n")}`,
    );
  }

  return {
    packedFiles: packed.size,
    cliModules: requirements.cliModules.length,
    cliData: requirements.cliData.length,
    registrySourceReferences: requirements.registrySources.length,
    registrySources: new Set(requirements.registrySources).size,
    componentSpecs: requirements.componentSpecs.length,
    adapters: hasAdapters,
  };
}

export async function runPackageRuntimeCheck() {
  const npmExecPath = process.env.npm_execpath;
  if (!npmExecPath) {
    throw new Error("Run the package runtime check through `npm run package:check`.");
  }

  const packOutput = execFileSync(
    process.execPath,
    [npmExecPath, "pack", "--dry-run", "--json"],
    { cwd: rootDir, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  const [pack] = JSON.parse(packOutput);
  const packed = new Set(pack.files.map((entry) => entry.path.replaceAll("\\", "/")));
  const report = await verifyPackedRuntime(packed, await loadRegistry());

  console.log(
    `Verified ${report.cliModules} CLI modules, ${report.cliData} CLI data files, `
      + `${report.registrySourceReferences} registry source references `
      + `(${report.registrySources} unique files), ${report.componentSpecs} component specs, `
      + `and adapters/ across ${report.packedFiles} packed files.`,
  );
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) await runPackageRuntimeCheck();
