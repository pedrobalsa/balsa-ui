import { address } from "../bin/registry-targets.mjs";

export const catalogSchemaVersion = 2;
const legacyCatalogSchemaVersions = new Set([1]);
const reservedFramework = "shared";

export function itemSpecificationPath(item) {
  if (typeof item?.specification !== "string" || !item.specification.trim()) {
    throw new Error(
      `${item?.name ?? item?.registry ?? "unknown item"}: catalog item is missing specification`,
    );
  }
  return item.specification;
}

/**
 * Derived design-system integration levels live in one generated file rather
 * than being declared on each specification. Authors cannot self-badge; the
 * builder rereads canonical source the same way contracts reread TypeScript.
 */
export function integrationReportPath() {
  return ".balsa/integration.json";
}

/**
 * Accept a catalog written by this CLI or by an older installed copy.
 * Schema 1 used a singular top-level `framework` and omitted `specification`.
 * Reads normalize to the current shape; writers always emit schema 2.
 */
export function normalizeCatalog(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Catalog must be an object.");
  }
  if (
    value.schemaVersion !== catalogSchemaVersion
    && !legacyCatalogSchemaVersions.has(value.schemaVersion)
  ) {
    throw new Error(`Unsupported Balsa catalog schema version: ${String(value.schemaVersion)}.`);
  }
  if (value.schemaVersion === catalogSchemaVersion) return value;

  const { framework, items = [], ...rest } = value;
  return {
    ...rest,
    schemaVersion: catalogSchemaVersion,
    frameworks: Array.isArray(value.frameworks) && value.frameworks.length
      ? value.frameworks
      : (framework ? [framework] : []),
    items: items.map((item) => ({
      ...item,
      specification: item.specification ?? `specs/components/${item.name}.json`,
    })),
  };
}

/**
 * Constraints JSON Schema cannot express: `shared` is reserved and must not
 * appear in the consumer target list, a non-shared item's framework must be
 * one of those targets, registry references must be unique, and every
 * registry value must equal address(framework, name).
 */
export function catalogInvariantErrors(catalog) {
  const errors = [];
  const frameworks = new Set(catalog.frameworks ?? []);
  const seenRegistry = new Map();

  if (frameworks.has(reservedFramework)) {
    errors.push(`catalog.frameworks must not include reserved target "${reservedFramework}"`);
  }

  for (const item of catalog.items ?? []) {
    const label = item.name ?? item.registry ?? "unknown item";
    if (item.framework !== reservedFramework && !frameworks.has(item.framework)) {
      errors.push(
        `${label}: framework "${String(item.framework)}" is not in catalog.frameworks`,
      );
    }
    if (typeof item.registry === "string") {
      const previous = seenRegistry.get(item.registry);
      if (previous) {
        errors.push(`${label}: duplicate registry reference ${item.registry}`);
      } else {
        seenRegistry.set(item.registry, item);
      }
    }
    try {
      const expected = address(item.framework, item.name);
      if (item.registry !== expected) {
        errors.push(
          `${label}: registry ${item.registry} does not match ${expected}`,
        );
      }
    } catch (error) {
      errors.push(`${label}: ${error.message}`);
    }
  }

  return errors;
}
