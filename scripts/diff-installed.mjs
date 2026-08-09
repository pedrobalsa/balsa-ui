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

/** The hash `add` recorded: every file's content, concatenated in order. */
async function hashOnDisk(projectRoot, files) {
  const contents = [];
  for (const file of files) {
    try {
      contents.push(await readFile(path.join(projectRoot, file), "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return undefined;
      throw error;
    }
  }
  return hashContent(contents);
}

/**
 * What `add` would write for this item today, hashed the same way.
 *
 * Balsa's own items are read from this package rather than the network, so the
 * comparison works offline for them and needs the registry only for upstream.
 */
async function hashFreshInstall(item) {
  const contents = [];
  for (const file of item.files) {
    contents.push(file.content ?? "");
  }
  return hashContent(contents);
}

export async function diffInstalled(projectRoot, { names, configuration } = {}) {
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
    const onDisk = await hashOnDisk(projectRoot, files);
    if (onDisk === undefined) {
      results.push({ reference, state: "missing", files: files.length });
      continue;
    }

    const locallyChanged = Boolean(entry.installedSourceHash)
      && onDisk !== entry.installedSourceHash;

    let upstreamChanged = false;
    let unresolved;
    try {
      const resolved = await resolver.resolve([reference]);
      const item = resolved.find((candidate) => candidate.reference === reference);
      if (item) {
        const adapted = item.namespace === defaultNamespace
          ? item
          : applyAdapter(item, await loadAdapter(item.reference)).item;
        const fresh = await hashFreshInstall(rewriteItemImports(adapted, resolvedConfiguration));
        upstreamChanged = Boolean(entry.originalSourceHash) && fresh !== entry.originalSourceHash;
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

    const state = unresolved
      ? (locallyChanged ? "local" : "unknown")
      : locallyChanged && upstreamChanged
        ? "diverged"
        : locallyChanged
          ? "local"
          : upstreamChanged
            ? "upstream"
            : "unchanged";

    results.push({ reference, state, files: files.length, ...(unresolved ? { unresolved } : {}) });
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
