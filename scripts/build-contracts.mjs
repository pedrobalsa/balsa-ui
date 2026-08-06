/**
 * Derive the exact public API of every catalog item from its canonical source.
 *
 * Hand-written contracts drift, and a prop list of bare names cannot tell an
 * agent whether `neutral` is a valid color for this component or only for that
 * one. The TypeScript compiler already knows; this reads the answer out of it
 * and writes it into the specification, so `balsa info` reports types, defaults
 * and enumerated unions that are true by construction.
 *
 * Run with --check to fail instead of writing, which is how the release gate
 * proves the published contracts still match the source.
 */
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createChecker } from "vue-component-meta";
import { loadRegistry, readJson, rootDir, sourcePath } from "./registry-lib.mjs";

/**
 * The website splits its TypeScript project; the exported public repository
 * uses one root config. Resolve whichever this checkout has.
 */
export async function resolveTsconfig() {
  for (const candidate of ["tsconfig.app.json", "tsconfig.json"]) {
    const target = path.join(rootDir, candidate);
    try {
      await access(target);
      return target;
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error("No tsconfig.app.json or tsconfig.json found.");
}

const checkOnly = process.argv.includes("--check");

/** Vue's built-in attributes are not part of an item's contract. */
function isAuthored(prop) {
  return !prop.global;
}

function cleanType(type) {
  return type.replace(/\s+/g, " ").trim();
}

/**
 * Structural types the compiler can expand but nobody needs expanded; `Date`
 * alone would contribute forty methods and bury the contract.
 */
const opaqueTypes = new Set([
  "Date", "RegExp", "Error", "Element", "HTMLElement", "Event", "File", "Blob",
  "Function", "Promise", "Node", "URL", "FormData",
]);

/**
 * A named alias tells an agent nothing about which values are legal. When the
 * compiler can enumerate the union, publish the members -- but only when every
 * member is a literal. A partial list is worse than none, because it reads as
 * complete.
 */
function enumeratedValues(schema) {
  if (!schema || typeof schema !== "object") return undefined;
  if (schema.kind !== "enum" || !Array.isArray(schema.schema)) return undefined;
  const members = schema.schema.filter((value) => value !== "undefined");
  if (!members.length || members.length > 40) return undefined;
  if (!members.every((value) => typeof value === "string")) return undefined;
  if (members.some((value) => /[{}()[\]]/.test(value))) return undefined;
  return members.map((value) => value.replace(/^"|"$/g, ""));
}

/**
 * Expand an object-shaped prop to its fields. This is the difference between
 * "logo: BrandLogo" and knowing that a logo needs a title and an alt.
 */
function describeShape(schema, depth = 0) {
  if (!schema || typeof schema !== "object" || depth > 1) return undefined;
  if (opaqueTypes.has(schema.type)) return undefined;

  if (schema.kind === "object") {
    const fields = Object.values(schema.schema ?? {})
      .slice(0, 25)
      .map((field) => ({
        name: field.name,
        type: cleanType(field.type),
        required: Boolean(field.required),
      }));
    return fields.length ? { type: cleanType(schema.type), fields } : undefined;
  }

  if (schema.kind === "enum" && Array.isArray(schema.schema)) {
    const variants = schema.schema
      .filter((member) => typeof member === "object")
      .slice(0, 6)
      .map((member) => describeShape(member, depth + 1))
      .filter(Boolean);
    if (!variants.length) return undefined;
    return variants.length === 1
      ? variants[0]
      : { type: cleanType(schema.type), variants };
  }

  return undefined;
}

function describeProp(prop) {
  const values = enumeratedValues(prop.schema);
  const shape = values ? undefined : describeShape(prop.schema);
  return {
    name: prop.name,
    type: cleanType(prop.type),
    ...(values ? { values } : {}),
    ...(shape ? { shape } : {}),
    required: Boolean(prop.required),
    ...(prop.default !== undefined && prop.default !== "undefined"
      ? { default: cleanType(String(prop.default)) }
      : {}),
    ...(prop.description ? { description: prop.description.trim() } : {}),
  };
}

/**
 * `v-model` is a prop and an event by convention rather than by declaration,
 * so it has to be recovered from the pair. Naming it explicitly is what stops
 * an agent guessing the model type.
 */
function describeModels(props, events) {
  const models = [];
  for (const prop of props) {
    const updateEvent = prop.name === "modelValue"
      ? "update:modelValue"
      : `update:${prop.name}`;
    if (!events.some((event) => event.name === updateEvent)) continue;
    models.push({
      name: prop.name,
      type: prop.type,
      ...(prop.values ? { values: prop.values } : {}),
      ...(prop.shape ? { shape: prop.shape } : {}),
      event: updateEvent,
    });
  }
  return models;
}

/**
 * The public entry point is normally the file named after the item, but an item
 * may expose a different component than the one carrying its name -- Toast's
 * public surface is ToastViewport, and Toast.vue renders one item inside it.
 * `meta.component` states that explicitly rather than leaving it to a guess.
 */
function primaryComponentFile(item) {
  if (item.meta?.component) return item.meta.component;
  const vueFiles = (item.files ?? []).filter((file) => file.path.endsWith(".vue"));
  if (!vueFiles.length) return undefined;
  const expected = `${item.name.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("")}.vue`;
  return (
    vueFiles.find((file) => path.basename(file.path) === expected)
    ?? vueFiles[0]
  ).path;
}

const registry = await loadRegistry();
const catalog = await readJson(path.join(rootDir, ".balsa", "catalog.json"));
const checker = createChecker(await resolveTsconfig(), {
  forceUseTs: true,
  schema: { ignore: [] },
});

const stale = [];
let written = 0;
let skipped = 0;

for (const catalogItem of catalog.items) {
  const item = registry.items.find((candidate) => candidate.name === catalogItem.name);
  const componentPath = item && primaryComponentFile(item);
  if (!componentPath) {
    skipped += 1;
    continue;
  }

  const meta = checker.getComponentMeta(sourcePath(componentPath));
  const props = meta.props.filter(isAuthored).map(describeProp);
  const events = meta.events.map((event) => ({
    name: event.name,
    ...(event.type ? { type: cleanType(event.type) } : {}),
  }));
  const slots = meta.slots.map((slot) => ({
    name: slot.name,
    ...(slot.type ? { type: cleanType(slot.type) } : {}),
  }));
  const exposed = meta.exposed
    .filter((entry) => !entry.name.startsWith("$"))
    .map((entry) => ({ name: entry.name, type: cleanType(entry.type) }));
  const models = describeModels(props, events);

  const publicApi = {
    source: componentPath,
    ...(models.length ? { models } : {}),
    props,
    events,
    slots,
    ...(exposed.length ? { exposed } : {}),
  };

  const specPath = sourcePath(`specs/components/${catalogItem.name}.json`);
  const spec = JSON.parse(await readFile(specPath, "utf8"));
  const next = { ...spec, publicApi };
  const serialized = `${JSON.stringify(next, null, 2)}\n`;

  if (JSON.stringify(spec.publicApi) !== JSON.stringify(publicApi)) {
    stale.push(catalogItem.name);
    if (!checkOnly) {
      await writeFile(specPath, serialized, "utf8");
      written += 1;
    }
  }
}

if (checkOnly && stale.length) {
  console.error(
    `${stale.length} component contracts no longer match their source:\n`
    + stale.map((name) => `- ${name}`).join("\n")
    + "\n\nRun npm run contracts:build and commit the regenerated specifications.",
  );
  process.exitCode = 1;
} else if (checkOnly) {
  console.log(`All ${catalog.items.length - skipped} derived component contracts match their source.`);
} else {
  console.log(
    `Derived contracts for ${catalog.items.length - skipped} components`
    + ` (${written} updated, ${skipped} items have no Vue entry point).`,
  );
}
