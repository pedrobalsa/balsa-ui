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
import {
  aliasForType,
  defaultRegistryTarget,
  isConsumerFramework,
  namespace,
  parseTargetAddress,
  route,
} from "../bin/registry-targets.mjs";
import { itemPath, loadTargetRegistry, readJson, rootDir, writeJson } from "./registry-lib.mjs";

export const defaultNamespace = namespace(defaultRegistryTarget);
const projectConfigurationTemplates = Object.freeze({
  vue: path.join(rootDir, "src", "config", "components-template.json"),
  react: path.join(rootDir, "src", "config", "components-template-react.json"),
});

/**
 * shadcn-vue publishes a style-scoped registry rather than the flat
 * `{name}.json` layout Balsa uses, so every namespace carries its own template.
 */
export const builtinRegistries = {
  [defaultNamespace]: `https://balsa-ui.com${route(defaultRegistryTarget, "{name}")}`,
  "@shadcn": "https://shadcn-vue.com/r/styles/{style}/{name}.json",
};

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * One authored configuration for `balsa init`, resolver fallbacks, and starter
 * generation. Its shape follows the current official shadcn-vue contract:
 * https://www.shadcn-vue.com/docs/components-json and
 * https://shadcn-vue.com/schema.json. Tailwind v4 intentionally uses an empty
 * config path, while the stylesheet is resolved from the consumer project.
 */
export async function createProjectConfiguration({
  stylesheet = "src/index.css",
  framework = defaultRegistryTarget,
  rsc,
} = {}) {
  const templatePath = projectConfigurationTemplates[
    isConsumerFramework(framework) ? framework : defaultRegistryTarget
  ];
  const template = await readJson(templatePath);
  const configuration = {
    ...template,
    tailwind: { ...template.tailwind, css: stylesheet.split(path.sep).join("/") },
    aliases: { ...template.aliases },
    registries: { ...template.registries },
  };
  if (framework === "react") configuration.rsc = Boolean(rsc);
  return configuration;
}

/** Create the standard config once; an existing project-owned file is untouched. */
export async function ensureProjectConfiguration(cwd, options = {}) {
  const target = path.join(cwd, "components.json");
  try {
    const existing = await readJson(target);
    if (!isRecord(existing)) throw new Error("components.json must contain a JSON object.");
    return { path: target, created: false, configuration: existing };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const configuration = await createProjectConfiguration(options);
  await writeJson(target, configuration);
  return { path: target, created: true, configuration };
}

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
export async function loadProjectConfiguration(cwd, { framework } = {}) {
  const defaults = await createProjectConfiguration({
    framework: framework ?? defaultRegistryTarget,
  });
  let componentsJson = {};
  try {
    componentsJson = await readJson(path.join(cwd, "components.json"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!isRecord(componentsJson)) throw new Error("components.json must contain a JSON object.");
  if (componentsJson.aliases !== undefined && !isRecord(componentsJson.aliases)) {
    throw new Error("components.json aliases must be an object.");
  }
  if (componentsJson.registries !== undefined && !isRecord(componentsJson.registries)) {
    throw new Error("components.json registries must be an object.");
  }
  const aliases = { ...defaults.aliases, ...(componentsJson.aliases ?? {}) };
  // Read the old Balsa key while projects migrate to shadcn-vue's official
  // `composables` name. Existing customized files remain valid and untouched.
  if (componentsJson.aliases?.hooks && !componentsJson.aliases.composables) {
    aliases.composables = componentsJson.aliases.hooks;
  }
  return {
    style: componentsJson.style ?? defaults.style,
    tailwind: { ...defaults.tailwind, ...(componentsJson.tailwind ?? {}) },
    aliases,
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
export function resolveFileTarget(configuration, item, file, target = defaultRegistryTarget) {
  if (file.target) return file.target.split("\\").join("/");

  const aliasKey = aliasForType(file.type ?? item.type, target);
  const alias = configuration.aliases[aliasKey];
  const directory = aliasToDirectory(alias);

  // "ui/button/Button.vue" under the ui alias is "<ui>/button/Button.vue".
  const segments = file.path.split("\\").join("/").split("/");
  const leading = {
    ui: ["ui"],
    components: ["components"],
    lib: ["lib"],
    composables: ["hooks", "composables"],
    hooks: ["hooks", "composables"],
  }[aliasKey];
  if (segments.length > 1 && leading?.includes(segments[0])) segments.shift();

  return [...directory.split(/[\\/]/), ...segments].join("/");
}

function balsaTargetForName(itemNamespace, name) {
  if (itemNamespace !== defaultNamespace) return undefined;
  try {
    return parseTargetAddress(name).target;
  } catch {
    return undefined;
  }
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
  let target;
  let itemName;
  try {
    ({ target, itemName } = parseTargetAddress(name));
  } catch {
    return undefined;
  }
  const registry = await loadTargetRegistry(target);
  const item = registry?.items.find((candidate) => candidate.name === itemName);
  if (!item) return undefined;
  return {
    ...item,
    files: await Promise.all(
      item.files.map(async (file) => ({
        ...file,
        content: await readFile(itemPath(file.path, { target }), "utf8"),
      })),
    ),
  };
}

export function createResolver({
  configuration,
  local = true,
  fetchItem = fetchRegistryItem,
  target = defaultRegistryTarget,
}) {
  const cache = new Map();

  async function load(itemNamespace, name) {
    const key = `${itemNamespace}/${name}`;
    if (cache.has(key)) return cache.get(key);

    let item;
    if (local && itemNamespace === defaultNamespace) {
      item = await loadLocalBalsaItem(name);
    }
    if (!item) {
      item = await fetchItem(registryUrl(configuration, itemNamespace, name));
    }
    const itemTarget = balsaTargetForName(itemNamespace, name) ?? target;
    const resolved = {
      ...item,
      namespace: itemNamespace,
      reference: `${itemNamespace}/${name}`,
      files: (item.files ?? []).map((file) => ({
        ...file,
        target: resolveFileTarget(configuration, item, file, itemTarget),
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
                target: resolveFileTarget(configuration, remote, file, target),
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
