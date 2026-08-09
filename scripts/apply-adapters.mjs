/**
 * Apply Balsa theme adapters to upstream registry source.
 *
 * Some Balsa dimensions cannot be carried by redefining a variable: Tailwind
 * compiles `border` to a literal 1px and shadow utilities to literal offsets.
 * Reaching those needs a styling-only source patch, and a patch written against
 * source that has since changed is the dangerous case -- it either fails to
 * apply or, worse, applies to the wrong place. Every adapter therefore records
 * the hash of the source it was written against, and a mismatch downgrades the
 * component to its unpatched integration rather than guessing.
 *
 * A patch may only change styling. It must not touch public APIs, accessibility
 * behavior, keyboard interaction, state management, or upstream composition.
 */
import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { readJson, rootDir } from "./registry-lib.mjs";

export const adaptersDir = path.join(rootDir, "adapters");

function hashContent(content) {
  return `sha256-${createHash("sha256").update(content).digest("hex")}`;
}

/** `@shadcn/button` lives at `adapters/shadcn/button.json`. */
function adapterPath(reference) {
  const match = /^@([a-z0-9-]+)\/(.+)$/.exec(reference);
  if (!match) return undefined;
  return path.join(adaptersDir, match[1], `${match[2]}.json`);
}

export async function loadAdapter(reference) {
  const target = adapterPath(reference);
  if (!target) return undefined;
  try {
    return await readJson(target);
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function listAdapters() {
  const adapters = [];
  let registries;
  try {
    registries = await readdir(adaptersDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return adapters;
    throw error;
  }
  for (const registry of registries) {
    if (!registry.isDirectory()) continue;
    for (const entry of await readdir(path.join(adaptersDir, registry.name))) {
      if (!entry.endsWith(".json")) continue;
      adapters.push(await readJson(path.join(adaptersDir, registry.name, entry)));
    }
  }
  return adapters;
}

/**
 * Patch a resolved item in place, returning the item and what happened. The
 * item is never partially patched: either every patch applies or none do, so a
 * component cannot end up half-adapted.
 */
export function applyAdapter(item, adapter) {
  if (!adapter) return { item, status: "compatible", applied: false };

  const drifted = [];
  for (const file of item.files) {
    const expected = adapter.upstream.files[file.path];
    if (!expected) continue;
    if (hashContent(file.content) !== expected) drifted.push(file.path);
  }
  if (drifted.length) {
    return {
      item,
      status: "compatible",
      applied: false,
      conflict: {
        reason: "upstream-changed",
        files: drifted,
        message:
          `The Balsa adapter for ${adapter.item} was written against different upstream source`
          + ` (${drifted.join(", ")}). Installing the unpatched component: it follows Balsa colors`
          + ` and radius, but not border width or elevation. Regenerate the adapter to restore them.`,
      },
    };
  }

  const patched = new Map();
  for (const patch of adapter.patches ?? []) {
    const file = item.files.find((candidate) => candidate.path === patch.file);
    if (!file) {
      return {
        item,
        status: "compatible",
        applied: false,
        conflict: {
          reason: "missing-file",
          files: [patch.file],
          message: `The Balsa adapter for ${adapter.item} patches ${patch.file}, which upstream no longer ships.`,
        },
      };
    }
    const current = patched.get(patch.file) ?? file.content;
    const occurrences = current.split(patch.find).length - 1;
    if (occurrences !== 1) {
      return {
        item,
        status: "compatible",
        applied: false,
        conflict: {
          reason: occurrences ? "ambiguous-match" : "no-match",
          files: [patch.file],
          message:
            `A Balsa patch for ${adapter.item} matched ${occurrences} times in ${patch.file}`
            + ` and must match exactly once. Installing the unpatched component.`,
        },
      };
    }
    patched.set(patch.file, current.split(patch.find).join(patch.replace));
  }

  const files = item.files.map((file) =>
    (patched.has(file.path) ? { ...file, content: patched.get(file.path) } : file));

  return {
    item: { ...item, files },
    status: adapter.status,
    applied: patched.size > 0,
    adapter,
  };
}

/** Recompute an adapter's recorded hashes from live upstream source. */
export function upstreamHashes(item) {
  return Object.fromEntries(item.files.map((file) => [file.path, hashContent(file.content)]));
}

export { hashContent };
