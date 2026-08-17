/**
 * Derive the exact public API of every catalog item from its canonical source.
 *
 * Hand-written contracts drift, and a prop list of bare names cannot tell an
 * agent whether `neutral` is a valid color for this component or only for that
 * one. The TypeScript compiler already knows; this reads the answer out of it
 * and writes it into the specification, so `balsa info` reports types, defaults
 * and enumerated unions that are true by construction.
 *
 * Each consumer framework declares how its contracts are derived on the
 * registry target table. Vue still writes `publicApi` into the item
 * specification; a target that sets `outputDirectory` stores the same shape
 * beside the spec so the Vue bytes do not churn.
 *
 * Run with --check to fail instead of writing, which is how the release gate
 * proves the published contracts still match the source.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  consumerFrameworks,
  contractDerivationForTarget,
} from "../bin/registry-targets.mjs";
import { itemSpecificationPath } from "./catalog.mjs";
import { createTypescriptPropsExtractor } from "./extract-react-contract.mjs";
import { createVueContractExtractor } from "./extract-vue-contract.mjs";
import { itemPath, loadTargetRegistry, readJson, repoPath, rootDir } from "./registry-lib.mjs";

const extractorFactories = {
  "vue-component-meta": async () => createVueContractExtractor(),
  "typescript-props": async (target) => createTypescriptPropsExtractor(target),
};

/**
 * The public entry point is normally the file named after the item, but an item
 * may expose a different component than the one carrying its name -- Toast's
 * public surface is ToastViewport, and Toast.vue renders one item inside it.
 * `meta.component` states that explicitly rather than leaving it to a guess.
 */
export function primaryComponentFile(item, entryExtensions) {
  if (item.meta?.component) return item.meta.component;
  const files = (item.files ?? []).filter((file) =>
    entryExtensions.some((extension) => file.path.endsWith(extension)),
  );
  if (!files.length) return undefined;
  const expected = item.name.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("");
  return (
    files.find((file) =>
      entryExtensions.some((extension) => path.basename(file.path) === `${expected}${extension}`),
    )
    ?? files[0]
  ).path;
}

function contractDocumentPath(catalogItem, derivation) {
  if (typeof derivation.outputDirectory === "string" && derivation.outputDirectory.length) {
    return path.posix.join(derivation.outputDirectory, `${catalogItem.name}.json`);
  }
  return itemSpecificationPath(catalogItem);
}

async function readContractDocument(relativePath) {
  try {
    return JSON.parse(await readFile(repoPath(relativePath), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function createExtractor(target, derivation) {
  const factory = extractorFactories[derivation.extractor];
  if (!factory) {
    throw new Error(
      `Unknown contract extractor "${derivation.extractor}" for registry target: ${target}`,
    );
  }
  return factory(target);
}

export async function deriveContracts({
  checkOnly = false,
  catalog,
} = {}) {
  const resolvedCatalog = catalog
    ?? await readJson(path.join(rootDir, ".balsa", "catalog.json"));
  const summaries = [];

  for (const target of consumerFrameworks()) {
    const derivation = contractDerivationForTarget(target);
    if (!derivation) continue;

    const registry = await loadTargetRegistry(target);
    const extractor = await createExtractor(target, derivation);
    const stale = [];
    let written = 0;
    let skipped = 0;
    let derived = 0;

    for (const catalogItem of resolvedCatalog.items) {
      const item = registry?.items.find((candidate) => candidate.name === catalogItem.name);
      const componentPath = item && primaryComponentFile(item, derivation.entryExtensions);
      if (!componentPath) {
        skipped += 1;
        continue;
      }

      const publicApi = extractor.extract(
        itemPath(componentPath, { target }),
        componentPath,
        item,
      );
      if (!publicApi || !publicApi.props?.length) {
        skipped += 1;
        continue;
      }

      derived += 1;
      const relativePath = contractDocumentPath(catalogItem, derivation);
      const existing = await readContractDocument(relativePath);
      const next = derivation.outputDirectory
        ? { publicApi }
        : { ...existing, publicApi };
      const serialized = `${JSON.stringify(next, null, 2)}\n`;

      if (JSON.stringify(existing?.publicApi) !== JSON.stringify(publicApi)) {
        stale.push(catalogItem.name);
        if (!checkOnly) {
          const absPath = repoPath(relativePath);
          await mkdir(path.dirname(absPath), { recursive: true });
          await writeFile(absPath, serialized, "utf8");
          written += 1;
        }
      }
    }

    summaries.push({
      target,
      derived,
      skipped,
      written,
      stale,
      catalogCount: resolvedCatalog.items.length,
      storesInSpecification: !derivation.outputDirectory,
    });
  }

  return summaries;
}

function printCheckFailure(summary) {
  console.error(
    `${summary.stale.length} ${summary.target} component contracts no longer match their source:\n`
    + summary.stale.map((name) => `- ${name}`).join("\n")
    + "\n\nRun npm run contracts:build and commit the regenerated specifications.",
  );
}

function printCheckSuccess(summary) {
  if (summary.storesInSpecification) {
    console.log(`All ${summary.derived} derived component contracts match their source.`);
    return;
  }
  console.log(
    `All ${summary.derived} derived ${summary.target} component contracts match their source.`,
  );
}

function printBuildSuccess(summary) {
  if (summary.storesInSpecification) {
    console.log(
      `Derived contracts for ${summary.derived} components`
      + ` (${summary.written} updated, ${summary.skipped} items have no Vue entry point).`,
    );
    return;
  }
  console.log(
    `Derived contracts for ${summary.derived} ${summary.target} components`
    + ` (${summary.written} updated, ${summary.skipped} items have no ${summary.target} entry point).`,
  );
}

export async function main(args = process.argv.slice(2)) {
  const checkOnly = args.includes("--check");
  const summaries = await deriveContracts({ checkOnly });
  const failed = summaries.filter((summary) => checkOnly && summary.stale.length);

  if (failed.length) {
    for (const summary of failed) printCheckFailure(summary);
    process.exitCode = 1;
    return summaries;
  }

  for (const summary of summaries) {
    if (checkOnly) printCheckSuccess(summary);
    else printBuildSuccess(summary);
  }
  return summaries;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
