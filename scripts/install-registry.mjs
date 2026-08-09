import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncAgentContext } from "./agent-context.mjs";
import { applyAdapter, loadAdapter } from "./apply-adapters.mjs";
import {
  createResolver,
  defaultNamespace,
  findTargetCollisions,
  loadProjectConfiguration,
  registryUrl,
} from "./registry-resolve.mjs";
import {
  readJson,
  rootDir,
  sourcePath,
  targetPath,
  writeJson,
} from "./registry-lib.mjs";
import { rewriteItemImports } from "./source-imports.mjs";

const manifestSchemaVersion = 2;

function parseArguments(argv) {
  const names = [];
  let cwd = process.cwd();
  let force = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--cwd") {
      cwd = argv[index + 1];
      index += 1;
    } else if (value === "--force") {
      force = true;
    } else {
      names.push(value);
    }
  }
  if (names.length === 0) {
    throw new Error("Usage: npm run registry:install -- <item> [more-items] --cwd <project>");
  }
  return { names, cwd: path.resolve(cwd), force };
}

function hashContent(values) {
  const hash = createHash("sha256");
  for (const value of values) hash.update(value);
  return `sha256-${hash.digest("hex")}`;
}

/**
 * A manifest written by an older CLI records only Balsa items and only the
 * fields that existed then. Upgrading in place keeps an existing project
 * readable rather than forcing a reinstall.
 */
function upgradeManifest(manifest) {
  if (manifest.schemaVersion === manifestSchemaVersion) return manifest;
  // v1 keyed by bare name because every item was Balsa's. Two registries can
  // publish the same name, so v2 keys by the fully qualified reference.
  const components = {};
  for (const [name, entry] of Object.entries(manifest.components ?? {})) {
    components[entry.registry ?? `${defaultNamespace}/${name}`] = {
      registry: entry.registry ?? `${defaultNamespace}/${name}`,
      namespace: defaultNamespace,
      installedVersion: entry.installedVersion ?? "0.0.0",
      installedSourceHash: entry.sourceHash ?? entry.installedSourceHash,
      originalSourceHash: entry.sourceHash ?? entry.originalSourceHash,
      targetPath: entry.targetPath,
      files: entry.files ?? [],
    };
  }
  return { schemaVersion: manifestSchemaVersion, components };
}

async function balsaContractVersion(name) {
  try {
    const spec = await readJson(sourcePath(`specs/components/${name}.json`));
    return spec.version;
  } catch {
    return undefined;
  }
}

async function activeDesignSystemVersion(cwd) {
  for (const candidate of [
    path.join(cwd, ".balsa", "catalog.json"),
    path.join(rootDir, ".balsa", "catalog.json"),
  ]) {
    try {
      return (await readJson(candidate)).releaseVersion;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return undefined;
}

/**
 * Install registry items and everything they depend on, from any configured
 * registry namespace, recording enough provenance that a later `diff` or
 * `update` can tell upstream change from local change.
 */
export async function installRegistryItems({
  names,
  cwd,
  force = false,
  agentContext = true,
  forceAgentSkill = false,
}) {
  const configuration = await loadProjectConfiguration(cwd);
  const resolver = createResolver({ configuration });
  let items = await resolver.resolve(names);

  // An upstream component styles itself from the standard shadcn variables and
  // knows nothing about Balsa. Installing the token bridge alongside it is what
  // makes it follow the active palette instead of shadcn's defaults, so it is
  // pulled in automatically rather than left as a step to remember.
  // Adapters carry the dimensions the token bridge cannot: Tailwind compiles
  // border width and shadow geometry to literals, so those need a styling-only
  // source patch applied before the file is written.
  const adapterConflicts = [];
  const adapterStatus = new Map();
  items = await Promise.all(items.map(async (item) => {
    if (item.namespace === defaultNamespace) return item;
    const result = applyAdapter(item, await loadAdapter(item.reference));
    adapterStatus.set(item.reference, result.status);
    if (result.conflict) adapterConflicts.push(result.conflict);
    return result.item;
  }));

  // Only now that every adapter has matched its recorded hashes and applied its
  // patches is it safe to touch the source. An upstream component reaches its
  // siblings through shadcn's own repository layout, which does not exist in a
  // consumer project, so the specifiers have to be pointed at wherever this
  // project's aliases put those siblings. Doing it before the adapters would
  // drift every recorded hash and downgrade all of them to unpatched.
  items = items.map((item) => rewriteItemImports(item, configuration));

  const needsBridge = items.some((item) => item.namespace !== defaultNamespace);
  if (needsBridge && !items.some((item) => item.name === "balsa-shadcn-bridge")) {
    const bridge = await resolver.resolve([`${defaultNamespace}/balsa-shadcn-bridge`]);
    const known = new Set(items.map((item) => item.reference));
    items = [...bridge.filter((item) => !known.has(item.reference)), ...items];
  }

  const collisions = findTargetCollisions(items);
  if (collisions.length && !force) {
    throw new Error(
      `Registry items disagree about the same file:\n${collisions
        .map((collision) => `  ${collision.target} claimed by ${collision.between.join(" and ")}`)
        .join("\n")}\nInstall them separately or rerun with --force to accept the last writer.`,
    );
  }

  const manifestPath = path.join(cwd, ".balsa", "installed.json");
  let manifest = { schemaVersion: manifestSchemaVersion, components: {} };
  try {
    manifest = upgradeManifest(await readJson(manifestPath));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const designSystemVersion = await activeDesignSystemVersion(cwd);

  // Each item is recorded as soon as its files land. A later item refusing to
  // overwrite a customized file must not erase the record of what already
  // installed, or a rerun cannot tell an installed component from a missing one.
  const completed = [];
  try {
    for (const item of items) {
      const contents = [];
      for (const file of item.files) {
        const destination = targetPath(cwd, file.target);
        const content = file.content ?? await readFile(sourcePath(file.path), "utf8");
        contents.push(content);
        try {
          const existing = await readFile(destination, "utf8");
          if (existing !== content && !force) {
            throw new Error(
              `Refusing to overwrite customized file: ${file.target}.`
              + ` Review the difference, then rerun with --force to accept the registry version.`,
            );
          }
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, content, "utf8");
      }

      const sourceHash = hashContent(contents);
      const isBalsa = item.namespace === defaultNamespace;
      manifest.components[item.reference] = {
        registry: item.reference,
        namespace: item.namespace,
        origin: isBalsa && item.meta?.spec
          ? undefined
          : safeRegistryUrl(configuration, item),
        installedVersion: isBalsa
          ? (await balsaContractVersion(item.name)) ?? "0.1.0"
          : item.version ?? "unversioned",
        upstreamVersion: item.version,
        contractVersion: isBalsa ? await balsaContractVersion(item.name) : undefined,
        adapterStatus: adapterStatus.get(item.reference),
        designSystemVersion,
        originalSourceHash: sourceHash,
        installedSourceHash: sourceHash,
        dependencies: item.dependencies ?? [],
        registryDependencies: item.registryDependencies ?? [],
        targetPath: item.files[0]?.target,
        files: item.files.map((file) => file.target),
      };
      completed.push(item);
    }
  } catch (error) {
    if (completed.length) {
      await writeJson(manifestPath, manifest);
      if (agentContext) await syncAgentContext(cwd, { forceSkill: forceAgentSkill });
      error.installed = completed.map((item) => item.reference);
      error.message =
        `${error.message}\nInstalled before stopping: ${error.installed.join(", ")}.`
        + ` These are recorded in .balsa/installed.json; rerunning installs only what is still missing.`;
    }
    throw error;
  }

  await writeJson(manifestPath, manifest);
  if (agentContext) await syncAgentContext(cwd, { forceSkill: forceAgentSkill });
  items.conflicts = adapterConflicts;
  return items;
}

function safeRegistryUrl(configuration, item) {
  try {
    return registryUrl(configuration, item.namespace, item.name);
  } catch {
    return item.reference;
  }
}

/**
 * Compare what is on disk against what was installed. This is what makes an
 * update safe: a file the user changed is reported, never silently replaced.
 */
export async function detectLocalModifications(cwd) {
  let manifest;
  try {
    manifest = upgradeManifest(await readJson(path.join(cwd, ".balsa", "installed.json")));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const modified = [];
  for (const [reference, entry] of Object.entries(manifest.components)) {
    const contents = [];
    let missing = false;
    for (const file of entry.files ?? []) {
      try {
        contents.push(await readFile(path.join(cwd, file), "utf8"));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        missing = true;
      }
    }
    if (missing) {
      modified.push({ reference, registry: entry.registry, state: "missing" });
      continue;
    }
    if (entry.installedSourceHash && hashContent(contents) !== entry.installedSourceHash) {
      modified.push({ reference, registry: entry.registry, state: "modified" });
    }
  }
  return modified;
}

export { hashContent, manifestSchemaVersion, upgradeManifest };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArguments(process.argv.slice(2));
  const installed = await installRegistryItems(options);
  console.log(`Installed ${installed.map((item) => item.reference).join(", ")} into ${options.cwd}`);
  if (installed.some((item) => item.name === "balsa-foundation")) {
    console.log('Ensure your main CSS imports "./styles/balsa-foundation.css" after Tailwind CSS.');
  }
  if (installed.some((item) => item.name === "balsa-theme")) {
    console.log('Import "./styles/balsa-theme.css" after the Balsa foundation.');
  }
  if (installed.some((item) => item.name === "balsa-palette")) {
    console.log('Import "./styles/balsa-palette.css" optionally and activate it with data-palette.');
  }
}
