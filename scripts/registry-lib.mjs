import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  address,
  defaultRegistryTarget,
  generatedDirectory,
  itemSourceForTarget,
  itemSourceRootsForTarget,
  sourceRootForTarget,
} from "../bin/registry-targets.mjs";

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const registryPath = path.join(rootDir, "registry.json");

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function loadTargetRegistry(target = defaultRegistryTarget) {
  const itemSource = itemSourceForTarget(target);
  if (!itemSource) return undefined;
  try {
    return await readJson(repoPath(itemSource));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function loadRegistry() {
  return loadTargetRegistry(defaultRegistryTarget);
}

export function localDependencyName(value, target = defaultRegistryTarget) {
  const prefix = address(target, "");
  return value.startsWith(prefix) ? value.slice(prefix.length) : undefined;
}

/**
 * Match a registry item path against a prefix-to-root map. Exactly one prefix
 * must match; an unclassified or ambiguous path fails rather than falling
 * through to the repository root.
 */
export function matchItemSourceRoot(relativePath, sourceRoots) {
  if (!sourceRoots || typeof sourceRoots !== "object" || Array.isArray(sourceRoots)) {
    throw new Error("Missing itemSourceRoots");
  }
  const posix = relativePath.split("\\").join("/");
  const matches = Object.entries(sourceRoots).filter(([prefix]) => {
    if (typeof prefix !== "string" || prefix.length === 0) {
      throw new Error("itemSourceRoots prefixes must be non-empty strings");
    }
    return posix === prefix || posix.startsWith(`${prefix}/`);
  });
  if (matches.length === 0) {
    throw new Error(`Unclassified item path: ${posix}`);
  }
  if (matches.length !== 1) {
    throw new Error(
      `Ambiguous item path: ${posix} matches ${matches.map(([prefix]) => prefix).join(", ")}`,
    );
  }
  const [prefix, sourceRoot] = matches[0];
  if (typeof sourceRoot !== "string" || sourceRoot.length === 0) {
    throw new Error(`Missing sourceRoot for prefix ${prefix}`);
  }
  return { prefix, sourceRoot, posix };
}

function resolveUnder(projectRoot, root, relativePath, sourceRootLabel) {
  if (typeof root !== "string" || root.length === 0) {
    throw new Error("Missing sourceRoot");
  }
  const resolvedProject = path.resolve(projectRoot);
  const resolvedRoot = path.resolve(resolvedProject, root);
  if (resolvedRoot !== resolvedProject && !resolvedRoot.startsWith(`${resolvedProject}${path.sep}`)) {
    throw new Error(`Source root escapes the repository: ${sourceRootLabel ?? root}`);
  }
  const resolved = path.resolve(resolvedRoot, relativePath);
  if (!resolved.startsWith(`${resolvedProject}${path.sep}`)) {
    throw new Error(`Source path escapes the repository: ${relativePath}`);
  }
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Source path escapes the source root: ${relativePath}`);
  }
  return resolved;
}

/**
 * Resolve a repository-root path: specs, skills, docs, and `itemSource`.
 * These are not target-scoped; routing them through Vue's `sourceRoot` would
 * look inside `packages/vue` after the relocation.
 */
export function repoPath(relativePath) {
  return resolveUnder(rootDir, ".", relativePath, ".");
}

/**
 * Resolve a source lookup through the target's configured `sourceRoot`.
 *
 * `files[].path` values stay relative to that root, so `registry.json` keeps
 * `src/components/ui/Foo.vue` and Vue's `sourceRoot` of `packages/vue` is what
 * redirects the lookup. A missing, empty, or escaping `sourceRoot` fails
 * rather than falling back to the repository root, and a relative path that
 * climbs out of the configured root is rejected even when it would still land
 * inside the repository — otherwise a wrong root would silently read the old
 * tree.
 *
 * Pass `{ sourceRoot }` to resolve against a specific root (tests, or a caller
 * that is not target-scoped). Pass `{ target }` to use that target's table
 * value. Repo-root lookups must use `repoPath()` instead.
 */
export function sourcePath(relativePath, options = {}) {
  const sourceRoot = options.sourceRoot ?? sourceRootForTarget(options.target);
  if (typeof sourceRoot !== "string" || sourceRoot.length === 0) {
    throw new Error("Missing sourceRoot");
  }
  return resolveUnder(options.projectRoot ?? rootDir, sourceRoot, relativePath, sourceRoot);
}

/**
 * Resolve a registry item `files[].path` through the target's prefix-to-root
 * map. `itemPath` and registry generation share this resolver so a path that
 * is not classified cannot silently read the repository root.
 */
export function itemPath(relativePath, options = {}) {
  const sourceRoots = options.sourceRoots ?? itemSourceRootsForTarget(options.target);
  const { sourceRoot } = matchItemSourceRoot(relativePath, sourceRoots);
  return resolveUnder(
    options.projectRoot ?? rootDir,
    sourceRoot,
    relativePath,
    sourceRoot,
  );
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

export function generatedItemDirectory(item, target = defaultRegistryTarget) {
  const targetRoot = path.join("registry", generatedDirectory(target));
  if (item.type === "registry:theme") return path.join(targetRoot, "themes");
  if (item.type === "registry:block") return path.join(targetRoot, "blocks", item.name);
  if (item.type === "registry:component") {
    return path.join(targetRoot, "compositions", item.name);
  }
  return path.join(targetRoot, "components", item.name);
}
