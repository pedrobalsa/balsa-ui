/**
 * Consumer-project preflight. Installation problems are usually environmental --
 * a missing dependency, no stylesheet entry point, an unconfigured alias -- and
 * they surface later as confusing build errors rather than as install failures.
 * Reporting them by code keeps the diagnosis machine-readable for agents.
 */
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { readJson } from "./registry-lib.mjs";
import {
  detectProjectFramework,
} from "./project-framework.mjs";

const stylesheetCandidates = [
  "src/index.css",
  "src/style.css",
  "src/styles.css",
  "src/assets/main.css",
];

const tsconfigCandidates = ["tsconfig.json", "tsconfig.app.json"];
const viteConfigCandidates = ["vite.config.ts", "vite.config.js", "vite.config.mjs"];

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function readIfPresent(target) {
  try {
    return await readFile(target, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function findStylesheet(projectRoot) {
  for (const candidate of stylesheetCandidates) {
    if (await exists(path.join(projectRoot, candidate))) return candidate;
  }
  return undefined;
}

async function hasAtAlias(projectRoot) {
  for (const candidate of tsconfigCandidates) {
    const source = await readIfPresent(path.join(projectRoot, candidate));
    if (source && /"@\/\*"\s*:/.test(source)) return true;
  }
  for (const candidate of viteConfigCandidates) {
    const source = await readIfPresent(path.join(projectRoot, candidate));
    if (source && /["'`]@["'`]\s*:/.test(source)) return true;
  }
  return false;
}

/**
 * Report what a Balsa installation needs from the destination project. `level`
 * separates conditions that make an install wrong (`error`) from conditions
 * that only make it incomplete (`warning`), so callers can decide whether to
 * stop or to install and explain.
 */
export async function inspectProject(cwd, { framework } = {}) {
  const projectRoot = path.resolve(cwd);
  const problems = [];
  const add = (code, level, message, fix) => problems.push({ code, level, message, fix });

  let packageJson;
  try {
    packageJson = await readJson(path.join(projectRoot, "package.json"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  if (!packageJson) {
    add(
      "missing-package-json",
      "error",
      `No package.json in ${projectRoot}.`,
      "Run this command from your application root, or pass --cwd <project>.",
    );
  }

  const detection = await detectProjectFramework(projectRoot, { framework });
  if (detection.code) {
    add(detection.code, "error", detection.message, detection.fix);
  }

  const dependencies = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
    ...(packageJson?.peerDependencies ?? {}),
  };

  if (packageJson && detection.framework === "vue" && !dependencies.vue) {
    add(
      "missing-vue",
      "error",
      "This project does not depend on vue. Balsa installs Vue 3 single-file components.",
      "npm install vue@^3.5.0",
    );
  }
  if (packageJson && !dependencies.tailwindcss) {
    add(
      "missing-tailwindcss",
      "warning",
      "This project does not depend on tailwindcss. Balsa styles are Tailwind CSS 4 utilities plus semantic tokens.",
      "npm install -D tailwindcss@^4.0.0",
    );
  }

  const sourceDir = await exists(path.join(projectRoot, "src"));
  if (!sourceDir) {
    add(
      "missing-source-directory",
      "error",
      "No src/ directory. Balsa installs component source under src/.",
      "Create src/, or pass --cwd pointing at the application that owns it.",
    );
  }

  const stylesheet = await findStylesheet(projectRoot);
  if (!stylesheet) {
    add(
      "missing-stylesheet",
      "warning",
      `No stylesheet entry point found. Balsa looked for ${stylesheetCandidates.join(", ")}.`,
      "Create src/index.css importing tailwindcss, then rerun so Balsa can add its imports.",
    );
  } else {
    const source = (await readIfPresent(path.join(projectRoot, stylesheet))) ?? "";
    if (!/@import\s+["']tailwindcss["']/.test(source)) {
      add(
        "missing-tailwind-import",
        "warning",
        `${stylesheet} does not import tailwindcss, so Balsa imports have no anchor point and utilities will not resolve.`,
        `Add @import "tailwindcss"; at the top of ${stylesheet}.`,
      );
    }
  }

  if (sourceDir && !(await hasAtAlias(projectRoot))) {
    add(
      "missing-alias",
      "warning",
      "No @/* alias is configured. Balsa documentation and generated snippets import through @/.",
      'Add "paths": { "@/*": ["src/*"] } to tsconfig and a matching Vite resolve.alias entry.',
    );
  }

  return {
    projectRoot,
    packageJson,
    framework: detection.framework,
    frameworkSource: detection.source,
    stylesheet,
    problems,
    errors: problems.filter((problem) => problem.level === "error"),
    warnings: problems.filter((problem) => problem.level === "warning"),
  };
}

/**
 * Installation is three independent phases and a failure in one says nothing
 * about the others. Reporting them separately is what lets an agent tell
 * "Balsa did not install" from "npm has not run yet".
 */
export function formatInstallationPhases({
  installed,
  stylesheet,
  projectRoot,
  npmDependencies,
  dependencyInstallation,
}) {
  const lines = [];
  lines.push(
    installed.length
      ? `Component source installed: ${installed.map((item) => item.reference ?? `@balsa/${item.name}`).join(", ")}`
      : "Component source installed: none",
  );
  lines.push(
    stylesheet
      ? `Stylesheet configured: ${path.relative(projectRoot, stylesheet).split(path.sep).join("/")}`
      : "Stylesheet configured: no -- add the Balsa style imports after Tailwind manually",
  );
  const unresolved = dependencyInstallation?.unresolved ?? npmDependencies ?? [];
  const installedDependencies = dependencyInstallation?.installed ?? [];
  if (unresolved.length) {
    lines.push(
      `npm dependencies unresolved: ${unresolved.join(" ")}`
      + (dependencyInstallation?.reason ? ` — ${dependencyInstallation.reason}` : ""),
    );
  } else if (installedDependencies.length) {
    lines.push(
      `npm dependencies installed with ${dependencyInstallation.manager}: ${installedDependencies.join(" ")}`,
    );
  } else {
    lines.push("npm dependencies: already satisfied");
  }
  return lines;
}

/**
 * What is actually installed here, and what state it is in.
 *
 * All of this was already recorded — the manifest carries origin, versions,
 * source hashes and adapter status for every install, and
 * `detectLocalModifications` compares them against disk — and none of it was
 * surfaced anywhere. An agent asking "what am I working with" had to read
 * `.balsa/installed.json` itself and re-derive the comparison.
 *
 * `loadAdapter` is injected rather than imported so this module stays free of
 * the adapter machinery, which a consumer project has no reason to load just to
 * run a diagnosis.
 */
export async function inspectInstallation(projectRoot, { loadAdapter, detectLocalModifications } = {}) {
  let manifest;
  try {
    manifest = await readJson(path.join(projectRoot, ".balsa", "installed.json"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return { installed: [], modified: [], outdatedAdapters: [], designSystemVersion: undefined };
  }

  const components = Object.values(manifest.components ?? {});
  const installed = components.map((entry) => ({
    registry: entry.registry,
    namespace: entry.namespace,
    version: entry.installedVersion,
    adapterStatus: entry.adapterStatus,
    files: (entry.files ?? []).length,
  }));

  const modified = detectLocalModifications
    ? await detectLocalModifications(projectRoot)
    : [];

  /*
   * An adapter whose status has moved since the component was installed. The
   * source on disk is still whatever the old adapter produced, so the component
   * is running an adaptation Balsa no longer publishes — worth reporting, and
   * not the same thing as a locally modified file.
   */
  const outdatedAdapters = [];
  if (loadAdapter) {
    for (const entry of components) {
      if (!entry.adapterStatus || entry.namespace === "@balsa") continue;
      const adapter = await loadAdapter(entry.registry);
      if (!adapter) continue;
      if (adapter.status !== entry.adapterStatus) {
        outdatedAdapters.push({
          registry: entry.registry,
          installedWith: entry.adapterStatus,
          available: adapter.status,
        });
      }
    }
  }

  return {
    installed,
    modified,
    outdatedAdapters,
    designSystemVersion: components.find((entry) => entry.designSystemVersion)?.designSystemVersion,
  };
}

export function formatProblems(problems) {
  return problems.map(
    (problem) => `${problem.level === "error" ? "Error" : "Warning"} [${problem.code}]: ${problem.message}\n  Fix: ${problem.fix}`,
  );
}

export { stylesheetCandidates };
