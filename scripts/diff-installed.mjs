/**
 * Three-way comparison for installed component source.
 *
 * An update is only safe if it can tell three things apart, and a two-way diff
 * cannot. What the install originally wrote, what is on disk now, and what a
 * fresh install would write today are three different states, and the answer to
 * "can I update this" depends on which pair differs:
 *
 *   unchanged   neither side moved. Nothing to do.
 *   local       the file was edited here and upstream stands still. An update
 *               would overwrite the user's own work for no gain.
 *   upstream    upstream or the adapter moved and the file is untouched. Safe
 *               to update; this is the case the whole mechanism exists for.
 *   diverged    both moved. No safe automatic answer — the user's change and
 *               the upstream change have to be reconciled by someone who knows
 *               why the local edit was made.
 *   missing     recorded, and no longer on disk.
 *
 * "What a fresh install would write" means after adapter patches and the import
 * rewrites, because that is what `add` produces. Comparing raw upstream instead
 * would report every patched component as diverged the moment it was installed.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { applyAdapter, loadAdapter } from "./apply-adapters.mjs";
import { hashContent, upgradeManifest } from "./install-registry.mjs";
import { createResolver, defaultNamespace, loadProjectConfiguration } from "./registry-resolve.mjs";
import { readJson } from "./registry-lib.mjs";
import { rewriteItemImports } from "./source-imports.mjs";

const diffContextLines = 3;
const maxDiffMatrixCells = 4_000_000;

function portablePath(value) {
  return value.replaceAll("\\", "/");
}

/** The files and hash `add` recorded, preserving its file order. */
async function readOnDisk(projectRoot, files) {
  const contents = [];
  const byPath = new Map();
  const missing = [];
  for (const file of files) {
    try {
      const content = await readFile(path.join(projectRoot, file), "utf8");
      contents.push(content);
      byPath.set(portablePath(file), content);
    } catch (error) {
      if (error.code === "ENOENT") {
        missing.push(portablePath(file));
        continue;
      }
      throw error;
    }
  }
  return {
    byPath,
    missing,
    hash: missing.length ? undefined : hashContent(contents),
  };
}

/**
 * What `add` would write for this item today, with the hash calculated the same way.
 *
 * Balsa's own items are read from this package rather than the network, so the
 * comparison works offline for them and needs the registry only for upstream.
 */
function freshInstall(item) {
  const contents = [];
  const byPath = new Map();
  for (const file of item.files) {
    const content = file.content ?? "";
    contents.push(content);
    byPath.set(portablePath(file.target), content);
  }
  return { byPath, hash: hashContent(contents) };
}

function sourceLines(source) {
  if (!source) return [];
  const normalized = source.replaceAll("\r\n", "\n");
  const lines = normalized.split("\n");
  const endsWithNewline = normalized.endsWith("\n");
  if (endsWithNewline) lines.pop();
  return lines.map((text, index) => ({
    text,
    newline: index < lines.length - 1 || endsWithNewline,
  }));
}

function sameLine(left, right) {
  return left.text === right.text && left.newline === right.newline;
}

/**
 * Line operations from the project's current source to current registry source.
 *
 * Component files are small enough for an LCS table, and keeping the algorithm
 * here means the published CLI does not depend on Git or an optional diff binary.
 */
function lineOperations(localSource, registrySource) {
  const local = sourceLines(localSource);
  const registry = sourceLines(registrySource);
  if (local.length * registry.length > maxDiffMatrixCells) {
    return [
      ...local.map((line) => ({ type: "-", line })),
      ...registry.map((line) => ({ type: "+", line })),
    ];
  }
  const lengths = Array.from(
    { length: local.length + 1 },
    () => new Uint32Array(registry.length + 1),
  );

  for (let localIndex = local.length - 1; localIndex >= 0; localIndex -= 1) {
    for (let registryIndex = registry.length - 1; registryIndex >= 0; registryIndex -= 1) {
      lengths[localIndex][registryIndex] = sameLine(local[localIndex], registry[registryIndex])
        ? lengths[localIndex + 1][registryIndex + 1] + 1
        : Math.max(
          lengths[localIndex + 1][registryIndex],
          lengths[localIndex][registryIndex + 1],
        );
    }
  }

  const operations = [];
  let localIndex = 0;
  let registryIndex = 0;
  while (localIndex < local.length || registryIndex < registry.length) {
    if (
      localIndex < local.length
      && registryIndex < registry.length
      && sameLine(local[localIndex], registry[registryIndex])
    ) {
      operations.push({ type: " ", line: local[localIndex] });
      localIndex += 1;
      registryIndex += 1;
    } else if (
      localIndex < local.length
      && (
        registryIndex >= registry.length
        || lengths[localIndex + 1][registryIndex] >= lengths[localIndex][registryIndex + 1]
      )
    ) {
      operations.push({ type: "-", line: local[localIndex] });
      localIndex += 1;
    } else {
      operations.push({ type: "+", line: registry[registryIndex] });
      registryIndex += 1;
    }
  }
  return operations;
}

function hunkRanges(operations) {
  const changed = operations
    .map((operation, index) => (operation.type === " " ? undefined : index))
    .filter((index) => index !== undefined);
  if (!changed.length) return [];

  const ranges = [];
  let first = changed[0];
  let last = changed[0];
  for (const index of changed.slice(1)) {
    if (index - last > (diffContextLines * 2) + 1) {
      ranges.push([
        Math.max(0, first - diffContextLines),
        Math.min(operations.length, last + diffContextLines + 1),
      ]);
      first = index;
    }
    last = index;
  }
  ranges.push([
    Math.max(0, first - diffContextLines),
    Math.min(operations.length, last + diffContextLines + 1),
  ]);
  return ranges;
}

export function createUnifiedPatch(target, localSource, registrySource) {
  if (localSource === registrySource) return "";

  const operations = lineOperations(localSource ?? "", registrySource ?? "");
  const localBefore = new Uint32Array(operations.length + 1);
  const registryBefore = new Uint32Array(operations.length + 1);
  for (let index = 0; index < operations.length; index += 1) {
    localBefore[index + 1] = localBefore[index] + (operations[index].type === "+" ? 0 : 1);
    registryBefore[index + 1] = registryBefore[index] + (operations[index].type === "-" ? 0 : 1);
  }

  const lines = [
    `--- ${localSource === undefined ? "/dev/null" : `local/${target}`}`,
    `+++ ${registrySource === undefined ? "/dev/null" : `registry/${target}`}`,
  ];
  const ranges = hunkRanges(operations);
  for (const [start, end] of ranges) {
    const localCount = localBefore[end] - localBefore[start];
    const registryCount = registryBefore[end] - registryBefore[start];
    const localStart = localBefore[start] + (localCount ? 1 : 0);
    const registryStart = registryBefore[start] + (registryCount ? 1 : 0);
    lines.push(`@@ -${localStart},${localCount} +${registryStart},${registryCount} @@`);
    for (const operation of operations.slice(start, end)) {
      lines.push(`${operation.type}${operation.line.text}`);
      if (!operation.line.newline) lines.push("\\ No newline at end of file");
    }
  }

  // A line-ending-only change has no line operation after normalization, but it
  // still changes the source hash and must not produce an empty explanation.
  if (!ranges.length) {
    lines.push("@@ line endings @@", "-local line endings", "+registry line endings");
  }
  return `${lines.join("\n")}\n`;
}

function compareFiles(localFiles, registryFiles) {
  const targets = new Set([...localFiles.keys(), ...registryFiles.keys()]);
  return [...targets]
    .sort((left, right) => left.localeCompare(right))
    .flatMap((target) => {
      const local = localFiles.get(target);
      const registry = registryFiles.get(target);
      if (local === registry) return [];
      return [{
        path: target,
        status: local === undefined ? "added" : registry === undefined ? "removed" : "modified",
        patch: createUnifiedPatch(target, local, registry),
      }];
    });
}

export async function diffInstalled(
  projectRoot,
  { names, configuration, includePatches = true } = {},
) {
  let manifest;
  try {
    manifest = upgradeManifest(await readJson(path.join(projectRoot, ".balsa", "installed.json")));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const resolvedConfiguration = configuration ?? await loadProjectConfiguration(projectRoot);
  const resolver = createResolver({ configuration: resolvedConfiguration });

  const wanted = names?.length
    ? new Set(names.map((name) => (name.startsWith("@") ? name : `${defaultNamespace}/${name}`)))
    : undefined;

  const results = [];
  for (const [reference, entry] of Object.entries(manifest.components)) {
    if (wanted && !wanted.has(reference)) continue;

    const files = entry.files ?? [];
    const onDisk = await readOnDisk(projectRoot, files);
    const locallyChanged = Boolean(entry.installedSourceHash)
      && onDisk.hash !== undefined
      && onDisk.hash !== entry.installedSourceHash;

    let upstreamChanged = false;
    let currentRegistry;
    let unresolved;
    try {
      const resolved = await resolver.resolve([reference]);
      const item = resolved.find((candidate) => candidate.reference === reference);
      if (item) {
        const adapted = item.namespace === defaultNamespace
          ? item
          : applyAdapter(item, await loadAdapter(item.reference)).item;
        currentRegistry = freshInstall(rewriteItemImports(adapted, resolvedConfiguration));
        upstreamChanged = Boolean(entry.originalSourceHash)
          && currentRegistry.hash !== entry.originalSourceHash;
      } else {
        unresolved = "resolved to nothing";
      }
    } catch (error) {
      // A registry that cannot be reached is not the same as a component that
      // changed, and reporting it as either would be a guess.
      unresolved = /responded (\d+)/.exec(error.message)?.[1]
        ? `registry responded ${/responded (\d+)/.exec(error.message)[1]}`
        : "registry unreachable";
    }

    const state = onDisk.missing.length
      ? "missing"
      : unresolved
      ? (locallyChanged ? "local" : "unknown")
      : locallyChanged && upstreamChanged
        ? "diverged"
        : locallyChanged
          ? "local"
          : upstreamChanged
            ? "upstream"
            : "unchanged";

    const changes = includePatches && currentRegistry
      ? compareFiles(onDisk.byPath, currentRegistry.byPath)
      : [];
    results.push({
      reference,
      state,
      files: files.length,
      changes,
      ...(unresolved ? { unresolved } : {}),
    });
  }

  return results.sort((left, right) => left.reference.localeCompare(right.reference));
}

/** The order someone acts in: conflicts first, then work, then noise. */
export const diffStateOrder = ["diverged", "local", "upstream", "missing", "unknown", "unchanged"];

export const diffStateSummary = {
  diverged: "changed here and upstream — reconcile by hand",
  local: "changed here only — an update would overwrite your work",
  upstream: "changed upstream only — safe to update",
  missing: "recorded but not on disk",
  unknown: "could not reach the registry to compare",
  unchanged: "identical to what was installed",
};

/**
 * What `update` does with each state above.
 *
 * The two worth thinking about are the two it refuses. `local` means the user
 * edited the file and upstream did not move, so an update has nothing to offer
 * and everything to destroy. `diverged` means both moved, and no merge this
 * command could perform knows why the local edit was made.
 *
 * `--force` takes them anyway, which is the honest way to offer it: a flag that
 * says "I know, do it" rather than a prompt that trains people to agree.
 *
 * It lives beside the comparison it interprets rather than inside the CLI,
 * because the CLI is no longer the only caller: the MCP surface answers "what
 * would an update do here" and must answer with what `update` would actually
 * do, not with a second copy of the rules that can drift from the first.
 */
export const updatePolicy = {
  upstream: { act: true, note: "updated" },
  missing: { act: true, note: "restored" },
  unchanged: { act: false, note: "already current" },
  local: { act: false, forceable: true, note: "changed here — kept, use --force to overwrite" },
  diverged: { act: false, forceable: true, note: "changed here and upstream — kept, use --force to overwrite" },
  unknown: { act: false, note: "could not reach the registry to compare" },
};

/**
 * Turn a comparison into the list of actions `update` would take. Shared so the
 * command and any other caller plan identically.
 */
export function planUpdate(compared, { force = false } = {}) {
  return compared.map((entry) => {
    const policy = updatePolicy[entry.state] ?? { act: false, note: entry.state };
    const act = policy.act || (force && policy.forceable === true);
    return {
      reference: entry.reference,
      state: entry.state,
      action: act ? "update" : "keep",
      note: act && policy.forceable ? "overwritten with --force" : policy.note,
    };
  });
}
