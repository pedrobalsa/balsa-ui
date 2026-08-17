import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registryTargetConfigurations } from "../bin/registry-targets.mjs";
import { buildCatalog } from "./build-catalog.mjs";
import {
  itemPath,
  readJson,
  rootDir,
  writeJson,
} from "./registry-lib.mjs";

function resolveWithin(directory, relativePath, description) {
  const root = path.resolve(directory);
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${description} escapes ${root}: ${relativePath}`);
  }
  return resolved;
}

function resolveCanonicalFile(projectRoot, configuration, relativePath, description) {
  if (!configuration.itemSourceRoots) {
    throw new Error(`${description}: missing itemSourceRoots`);
  }
  return itemPath(relativePath, {
    projectRoot,
    sourceRoots: configuration.itemSourceRoots,
  });
}

function assertSimpleItemName(name, targetName) {
  if (
    typeof name !== "string"
    || !name
    || name === "."
    || name === ".."
    || name.includes("/")
    || name.includes("\\")
  ) {
    throw new Error(`${targetName}: registry item names must be non-empty path segments (${name})`);
  }
}

function normalizedRoutePrefix(prefix, targetName) {
  if (typeof prefix !== "string" || prefix.includes("\\") || prefix.startsWith("/")) {
    throw new Error(`${targetName}: routePrefix must be a relative URL path`);
  }
  if (prefix && !prefix.endsWith("/")) {
    throw new Error(`${targetName}: routePrefix must end with /`);
  }
  const segments = prefix.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error(`${targetName}: routePrefix cannot contain . or .. segments`);
  }
  return segments;
}

function publicArtifactPath(projectRoot, targetName, configuration, name) {
  assertSimpleItemName(name, targetName);
  return path.join(
    projectRoot,
    "public",
    "r",
    ...normalizedRoutePrefix(configuration.routePrefix, targetName),
    `${name}.json`,
  );
}

function generatedRootPath(projectRoot, targetName, configuration) {
  if (
    typeof configuration.generatedDirectory !== "string"
    || !configuration.generatedDirectory
  ) {
    throw new Error(`${targetName}: generatedDirectory is required`);
  }
  return resolveWithin(
    path.join(projectRoot, "registry"),
    configuration.generatedDirectory,
    `${targetName}: generatedDirectory`,
  );
}

function generatedItemDirectory(item, generatedRoot) {
  if (item.type === "registry:theme") return path.join(generatedRoot, "themes");
  if (item.type === "registry:block") return path.join(generatedRoot, "blocks", item.name);
  if (item.type === "registry:component") {
    return path.join(generatedRoot, "compositions", item.name);
  }
  return path.join(generatedRoot, "components", item.name);
}

function assertNonOverlappingGeneratedRoots(projectRoot, targets) {
  const roots = Object.entries(targets).map(([name, configuration]) => ({
    name,
    path: generatedRootPath(projectRoot, name, configuration),
  }));

  for (let index = 0; index < roots.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < roots.length; otherIndex += 1) {
      const left = roots[index];
      const right = roots[otherIndex];
      const leftPath = process.platform === "win32" ? left.path.toLowerCase() : left.path;
      const rightPath = process.platform === "win32" ? right.path.toLowerCase() : right.path;
      if (
        leftPath === rightPath
        || leftPath.startsWith(`${rightPath}${path.sep}`)
        || rightPath.startsWith(`${leftPath}${path.sep}`)
      ) {
        throw new Error(
          `Registry targets ${left.name} and ${right.name} have overlapping generated directories`,
        );
      }
    }
  }
}

async function cleanHostedArtifacts(projectRoot, targetName, configuration) {
  const hostedDirectory = path.dirname(
    publicArtifactPath(projectRoot, targetName, configuration, "registry"),
  );
  let entries;
  try {
    entries = await readdir(hostedDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  // A target owns every direct JSON file in its hosted directory. Subdirectories
  // are never traversed, so an empty-prefix target cannot erase /r/react.
  await Promise.all(entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => rm(path.join(hostedDirectory, entry.name), { force: true })));
}

function assertUniqueHostedArtifacts(projectRoot, builds) {
  const owners = new Map();
  for (const { targetName, configuration, registry } of builds) {
    const names = ["registry", ...registry.items.map((item) => item.name)];
    for (const name of names) {
      const artifactPath = publicArtifactPath(projectRoot, targetName, configuration, name);
      const key = process.platform === "win32" ? artifactPath.toLowerCase() : artifactPath;
      const previousOwner = owners.get(key);
      if (previousOwner) {
        throw new Error(
          `Registry targets ${previousOwner} and ${targetName} both own ${artifactPath}`,
        );
      }
      owners.set(key, targetName);
    }
  }
}

async function buildTarget({ projectRoot, packageVersion, targetName, configuration, registry }) {
  const generatedRoot = generatedRootPath(projectRoot, targetName, configuration);
  await cleanHostedArtifacts(projectRoot, targetName, configuration);
  await rm(generatedRoot, { recursive: true, force: true });

  if (registry.items.length === 0) return;

  for (const item of registry.items) {
    assertSimpleItemName(item.name, targetName);
    const outputFiles = [];
    const mirrorDir = generatedItemDirectory(item, generatedRoot);
    await mkdir(mirrorDir, { recursive: true });

    for (const file of item.files) {
      const canonicalPath = resolveCanonicalFile(
        projectRoot,
        configuration,
        file.path,
        `${targetName}: source path`,
      );
      const mirrorPath = path.join(mirrorDir, path.basename(file.target));
      await copyFile(canonicalPath, mirrorPath);
      outputFiles.push({
        path: file.path,
        type: file.type,
        target: file.target,
        // Published payloads must not depend on the checkout that built them. A
        // Windows working tree carries CRLF, which would otherwise ship to every
        // consumer and make the generated registry differ by build machine.
        content: (await readFile(canonicalPath, "utf8")).split("\r\n").join("\n"),
      });
    }

    await writeJson(publicArtifactPath(projectRoot, targetName, configuration, item.name), {
      $schema: configuration.itemSchemaUrl,
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

  // The published index. Registry tooling and directory listings discover the
  // namespace through this document rather than by guessing item names, and it
  // is what lets an existing shadcn user browse Balsa without adopting the CLI.
  await writeJson(publicArtifactPath(projectRoot, targetName, configuration, "registry"), {
    $schema: configuration.indexSchemaUrl,
    name: registry.name,
    homepage: registry.homepage,
    version: packageVersion,
    items: registry.items.map((item) => ({
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description,
      dependencies: item.dependencies,
      registryDependencies: item.registryDependencies,
      files: item.files.map((file) => ({ path: file.path, type: file.type, target: file.target })),
      meta: item.meta,
    })),
  });

  await mkdir(generatedRoot, { recursive: true });
  await writeFile(
    path.join(generatedRoot, "README.md"),
    `# Generated ${configuration.displayName} registry source\n\nDo not edit files in this directory. Run \`npm run registry:build\`; canonical source lives under \`src/\`.\n`,
    "utf8",
  );
}

export async function buildRegistryTargets({
  projectRoot = rootDir,
  targets = registryTargetConfigurations(),
  packageVersion,
} = {}) {
  assertNonOverlappingGeneratedRoots(projectRoot, targets);
  const builds = [];

  for (const [targetName, configuration] of Object.entries(targets)) {
    if (!configuration.itemSource) continue;
    const itemSource = resolveWithin(
      projectRoot,
      configuration.itemSource,
      `${targetName}: item source`,
    );
    const registry = await readJson(itemSource);
    if (!Array.isArray(registry.items)) {
      throw new Error(`${targetName}: item source must contain an items array`);
    }
    if (registry.items.length) {
      if (!configuration.itemSchemaUrl || !configuration.indexSchemaUrl) {
        throw new Error(
          `${targetName}: populated registry targets require item and index schema URLs`,
        );
      }
      if (!configuration.displayName) {
        throw new Error(`${targetName}: populated registry targets require a display name`);
      }
      for (const item of registry.items) assertSimpleItemName(item.name, targetName);
    }
    builds.push({ targetName, configuration, registry });
  }

  assertUniqueHostedArtifacts(projectRoot, builds);
  const version = packageVersion ?? (await readJson(path.join(projectRoot, "package.json"))).version;

  for (const build of builds) await buildTarget({ projectRoot, packageVersion: version, ...build });

  return {
    itemCount: builds.reduce((total, build) => total + build.registry.items.length, 0),
    targetCount: builds.filter((build) => build.registry.items.length > 0).length,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildRegistryTargets();
  await buildCatalog();
  console.log(
    `Built ${result.itemCount} registry items across ${result.targetCount} target(s) and the agent catalog.`,
  );
}
