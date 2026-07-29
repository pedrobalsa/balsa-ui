import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const registryPath = path.join(rootDir, "registry.json");

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function loadRegistry() {
  return readJson(registryPath);
}

export function localDependencyName(value) {
  return value.startsWith("@balsa/") ? value.slice("@balsa/".length) : undefined;
}

export function sourcePath(relativePath) {
  const resolved = path.resolve(rootDir, relativePath);
  if (!resolved.startsWith(`${rootDir}${path.sep}`)) {
    throw new Error(`Source path escapes the repository: ${relativePath}`);
  }
  return resolved;
}

export function targetPath(cwd, relativePath) {
  const resolvedCwd = path.resolve(cwd);
  const resolved = path.resolve(resolvedCwd, relativePath);
  if (!resolved.startsWith(`${resolvedCwd}${path.sep}`)) {
    throw new Error(`Target path escapes the destination: ${relativePath}`);
  }
  return resolved;
}

export async function fileHash(filePaths) {
  const hash = createHash("sha256");
  for (const filePath of filePaths) {
    hash.update(await readFile(filePath));
  }
  return `sha256-${hash.digest("hex")}`;
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function registryItemByName(registry, name) {
  const normalized = localDependencyName(name) ?? name;
  const item = registry.items.find((candidate) => candidate.name === normalized);
  if (!item) throw new Error(`Unknown Balsa registry item: ${name}`);
  return item;
}

export function resolveItems(registry, requestedNames) {
  const resolved = [];
  const visited = new Set();

  function visit(name) {
    const item = registryItemByName(registry, name);
    if (visited.has(item.name)) return;
    visited.add(item.name);
    for (const dependency of item.registryDependencies) {
      const localName = localDependencyName(dependency);
      if (localName) visit(localName);
    }
    resolved.push(item);
  }

  for (const name of requestedNames) visit(name);
  return resolved;
}

export function generatedDirectory(item) {
  if (item.type === "registry:theme") return path.join("registry", "vue", "themes");
  if (item.type === "registry:block") return path.join("registry", "vue", "blocks", item.name);
  if (item.type === "registry:component") {
    return path.join("registry", "vue", "compositions", item.name);
  }
  return path.join("registry", "vue", "components", item.name);
}
