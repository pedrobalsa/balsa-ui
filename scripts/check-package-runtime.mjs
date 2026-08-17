/**
 * Verify the installed CLI can reach every local runtime module from the npm
 * tarball. Source-tree tests cannot catch a missing `files` entry: Node resolves
 * it locally and the failure appears only after publication.
 */
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registryTargetConfigurations } from "../bin/registry-targets.mjs";
import { itemPath, readJson, repoPath, rootDir } from "./registry-lib.mjs";

const importPattern = /(?:from\s+|import\s*\()\s*["'](\.\.?\/[^"']+)["']/g;

export const requiredCliData = [
  ".balsa/catalog-index.json",
  ".balsa/catalog.json",
  "registry.json",
  "packages/shared/registry.json",
  "packages/react/registry.json",
  "skills/balsa-ui/SKILL.md",
  "skills/balsa-template-design/SKILL.md",
  "skills/balsa-template-design/LICENSE.txt",
  "src/config/components-template.json",
  "src/config/components-template-react.json",
  "src/design-system/built-ins.json",
];

/**
 * Resolve a repository-relative source the same way the installer does, then
 * project it back to the posix path npm records in the tarball. Target-scoped
 * UI source packs from `packages/vue/...`; styles and the theme core pack from
 * `packages/shared/...`; fonts follow the target's prefix-to-root map.
 */
export function packedPathFromSource(relativePath, options) {
  return path.relative(rootDir, itemPath(relativePath, options)).replaceAll("\\", "/");
}

/**
 * Canonical files the published CLI reads when installing from the tarball:
 * every `files[].path` on every configured target's item source, plus
 * `specs/components/<name>.json` for items that declare `meta.spec`.
 */
export async function collectRegistryRuntimePaths() {
  const files = new Set();
  const specs = new Set();

  for (const [target, configuration] of Object.entries(registryTargetConfigurations())) {
    if (!configuration.itemSource) continue;
    const registry = await readJson(repoPath(configuration.itemSource));
    for (const item of registry.items ?? []) {
      for (const file of item.files ?? []) {
        if (typeof file?.path === "string" && file.path) {
          files.add(packedPathFromSource(file.path, { target }));
        }
      }
      if (typeof item.meta?.spec === "string" && item.meta.spec) {
        specs.add(path.relative(rootDir, repoPath(`specs/components/${item.name}.json`)).replaceAll("\\", "/"));
      }
    }
  }

  return { files, specs };
}

export async function findMissingPackedRuntimeFiles(packed) {
  const queue = ["bin/balsa.mjs"];
  const visited = new Set();
  const missing = [];

  while (queue.length) {
    const relative = queue.shift();
    if (visited.has(relative)) continue;
    visited.add(relative);
    if (!packed.has(relative)) {
      missing.push(relative);
      continue;
    }

    const source = await readFile(path.join(rootDir, relative), "utf8");
    for (const match of source.matchAll(importPattern)) {
      const imported = path.posix.normalize(path.posix.join(path.posix.dirname(relative), match[1]));
      if (imported.endsWith(".mjs")) queue.push(imported);
    }
  }

  for (const required of requiredCliData) {
    if (!packed.has(required)) missing.push(required);
  }
  if (![...packed].some((entry) => entry.startsWith("adapters/"))) {
    missing.push("adapters/**");
  }

  const { files, specs } = await collectRegistryRuntimePaths();
  for (const required of files) {
    if (!packed.has(required)) missing.push(required);
  }
  for (const required of specs) {
    if (!packed.has(required)) missing.push(required);
  }

  return {
    missing: [...new Set(missing)],
    visited,
    files,
    specs,
  };
}

async function main() {
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
  const { missing, visited, files, specs } = await findMissingPackedRuntimeFiles(packed);

  if (missing.length) {
    throw new Error(
      `npm tarball is missing CLI runtime files:\n${missing.map((entry) => `- ${entry}`).join("\n")}`,
    );
  }

  console.log(
    `Verified ${visited.size} CLI modules, ${files.size} registry sources, and ${specs.size} component specs across ${packed.size} packed files.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
