/**
 * Namespace-aware registry resolution.
 *
 * Balsa is the primary CLI for the shadcn-vue ecosystem, so `add` has to resolve
 * items that live in different registries with different URL shapes and
 * different ideas about where a file belongs. This module turns
 * `@shadcn/button`, `@balsa/button` or a bare `button` into a concrete list of
 * files with resolved targets, without the caller needing to know which
 * registry answered.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadRegistry, readJson, rootDir, sourcePath } from "./registry-lib.mjs";

export const defaultNamespace = "@balsa";

/**
 * shadcn-vue publishes a style-scoped registry rather than the flat
 * `{name}.json` layout Balsa uses, so every namespace carries its own template.
 */
export const builtinRegistries = {
  "@balsa": "https://balsa-ui.com/r/{name}.json",
  "@shadcn": "https://shadcn-vue.com/r/styles/{style}/{name}.json",
};

const defaultAliases = {
  ui: "@/components/ui",
  components: "@/components",
  lib: "@/lib",
  hooks: "@/composables",
  utils: "@/lib/utils",
};

const aliasForType = {
  "registry:ui": "ui",
  "registry:component": "components",
  "registry:block": "components",
  "registry:composition": "components",
  "registry:lib": "lib",
  "registry:hook": "hooks",
  "registry:theme": "lib",
};

export function parseItemReference(reference) {
  const match = /^(@[a-z0-9-]+)\/(.+)$/.exec(reference);
  if (match) return { namespace: match[1], name: match[2], explicit: true };
  if (reference.startsWith("@")) {
    throw new Error(
      `Invalid registry reference: ${reference}. Use @namespace/name, for example @shadcn/button.`,
    );
  }
  return { namespace: defaultNamespace, name: reference, explicit: false };
}

/**
 * A project's components.json is the shadcn-standard place to declare extra
 * registries, so a third-party registry needs no Balsa-specific configuration.
 */
export async function loadProjectConfiguration(cwd) {
  let componentsJson = {};
  try {
    componentsJson = await readJson(path.join(cwd, "components.json"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return {
    style: componentsJson.style ?? "new-york",
    aliases: { ...defaultAliases, ...(componentsJson.aliases ?? {}) },
    registries: { ...builtinRegistries, ...(componentsJson.registries ?? {}) },
  };
}

export function registryUrl(configuration, namespace, name) {
  const template = configuration.registries[namespace];
  if (!template) {
    const known = Object.keys(configuration.registries).join(", ");
    throw new Error(
      `Unknown registry namespace ${namespace}. Known namespaces: ${known}.`
      + ` Declare it under "registries" in components.json.`,
    );
  }
  return template
    .replaceAll("{name}", name)
    .replaceAll("{style}", configuration.style);
}

/**
 * An alias is a module specifier (`@/components/ui`); a target is a path on
 * disk. Resolving one to the other is what lets an item published against a
 * different project layout land in the right place here.
 */
export function aliasToDirectory(alias) {
  if (alias.startsWith("@/")) return `src/${alias.slice(2)}`;
  if (alias.startsWith("~/")) return alias.slice(2);
  if (alias.startsWith("./")) return alias.slice(2);
  return alias;
}

/**
 * shadcn items publish `target: ""` and a `path` that is relative to the item
 * type's alias root, with the type directory repeated as the first segment.
 * Balsa items publish an explicit target and are used verbatim.
 */
export function resolveFileTarget(configuration, item, file) {
  if (file.target) return file.target.split("\\").join("/");

  const aliasKey = aliasForType[file.type ?? item.type] ?? "components";
  const alias = configuration.aliases[aliasKey] ?? defaultAliases[aliasKey];
  const directory = aliasToDirectory(alias);

  // "ui/button/Button.vue" under the ui alias is "<ui>/button/Button.vue".
  const segments = file.path.split("\\").join("/").split("/");
  const leading = { ui: "ui", components: "components", lib: "lib", hooks: "hooks" }[aliasKey];
  if (segments.length > 1 && segments[0] === leading) segments.shift();

  return [...directory.split(/[\\/]/), ...segments].join("/");
}

async function fetchRegistryItem(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`Could not reach ${url}: ${error.message}.`);
  }
  if (!response.ok) {
    throw new Error(
      `${url} responded ${response.status}. Confirm the item name and the registry namespace.`,
    );
  }
  const item = await response.json();
  if (!item || typeof item !== "object" || !item.name) {
    throw new Error(`${url} did not return a registry item.`);
  }
  return item;
}

/**
 * Read a Balsa item from this repository instead of over the network. The
 * canonical source is right here, so a contributor's install must not depend on
 * the published site being current.
 */
async function loadLocalBalsaItem(name) {
  const registry = await loadRegistry();
  const item = registry.items.find((candidate) => candidate.name === name);
  if (!item) return undefined;
  return {
    ...item,
    files: await Promise.all(
      item.files.map(async (file) => ({
        ...file,
        content: await readFile(sourcePath(file.path), "utf8"),
      })),
    ),
  };
}

export function createResolver({ configuration, local = true, fetchItem = fetchRegistryItem }) {
  const cache = new Map();

  async function load(namespace, name) {
    const key = `${namespace}/${name}`;
    if (cache.has(key)) return cache.get(key);

    let item;
    if (local && namespace === defaultNamespace) {
      item = await loadLocalBalsaItem(name);
    }
    if (!item) {
      item = await fetchItem(registryUrl(configuration, namespace, name));
    }
    const resolved = {
      ...item,
      namespace,
      reference: `${namespace}/${item.name}`,
      files: (item.files ?? []).map((file) => ({
        ...file,
        target: resolveFileTarget(configuration, item, file),
      })),
    };
    cache.set(key, resolved);
    return resolved;
  }

  /**
   * Resolve requested references and every registry dependency they reach,
   * across namespaces, dependencies-first so an item is never written before
   * something it needs. A dependency without a namespace belongs to the
   * registry that declared it, which is what keeps a third-party registry's
   * internal references from silently resolving against Balsa.
   */
  async function resolve(references) {
    const ordered = [];
    const visited = new Set();
    const stack = [];

    async function visit(reference, inheritedNamespace) {
      const parsed = parseItemReference(reference);
      const namespace = parsed.explicit ? parsed.namespace : (inheritedNamespace ?? parsed.namespace);
      const key = `${namespace}/${parsed.name}`;
      if (visited.has(key)) return;
      if (stack.includes(key)) {
        throw new Error(`Circular registry dependency: ${[...stack, key].join(" -> ")}.`);
      }
      stack.push(key);

      const item = await load(namespace, parsed.name);
      for (const dependency of item.registryDependencies ?? []) {
        // A URL dependency is a fully qualified item from anywhere.
        if (/^https?:\/\//.test(dependency)) {
          const remote = await fetchItem(dependency);
          if (!visited.has(`url:${dependency}`)) {
            visited.add(`url:${dependency}`);
            ordered.push({
              ...remote,
              namespace: "url",
              reference: dependency,
              files: (remote.files ?? []).map((file) => ({
                ...file,
                target: resolveFileTarget(configuration, remote, file),
              })),
            });
          }
          continue;
        }
        await visit(dependency, namespace);
      }

      stack.pop();
      visited.add(key);
      ordered.push(item);
    }

    for (const reference of references) await visit(reference, undefined);
    return ordered;
  }

  return { resolve, load };
}

/**
 * Two registries may publish the same component name. Installing both is legal
 * -- they land in different directories -- but writing two different sources to
 * one path is not, and silently doing so is how a design system drifts.
 *
 * Sharing a file is not a collision. Balsa items deliberately ship common
 * modules such as `classes.ts` from every item that needs them, so only
 * genuinely differing content counts as a disagreement.
 */
export function findTargetCollisions(items) {
  const owners = new Map();
  const collisions = [];
  for (const item of items) {
    for (const file of item.files ?? []) {
      const existing = owners.get(file.target);
      if (!existing) {
        owners.set(file.target, { reference: item.reference, content: file.content });
        continue;
      }
      if (existing.reference === item.reference) continue;
      if (existing.content !== undefined && existing.content === file.content) continue;
      collisions.push({ target: file.target, between: [existing.reference, item.reference] });
    }
  }
  return collisions;
}

export { rootDir };
