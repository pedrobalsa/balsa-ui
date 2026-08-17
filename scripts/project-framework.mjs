/**
 * One framework detection implementation for init, add, doctor, MCP project
 * status, and catalog filtering. Precedence is fixed: an explicit flag, then
 * the recorded project, then the components.json schema, then runtime
 * dependency signals. Ambiguous or unknown results are named codes, never a
 * guess.
 */
import path from "node:path";
import {
  consumerFrameworks,
  isConsumerFramework,
} from "../bin/registry-targets.mjs";
import { readJson, writeJson } from "./registry-lib.mjs";

export const unknownFrameworkCode = "unknown-framework";
export const ambiguousFrameworkCode = "ambiguous-framework";
export const projectFrameworkSchemaVersion = 1;

const vuePackages = Object.freeze(["vue", "nuxt", "@vue/runtime-dom"]);
const reactPackages = Object.freeze(["react", "react-dom", "next"]);
const frameworkPackages = Object.freeze({
  vue: vuePackages,
  react: reactPackages,
});

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function packageNames(packageJson) {
  return new Set([
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
    ...Object.keys(packageJson?.peerDependencies ?? {}),
  ]);
}

export function projectHasPackage(packageJson, name) {
  return packageNames(packageJson).has(name);
}

function frameworksFromPackages(packageJson) {
  if (!packageJson) return [];
  const installed = packageNames(packageJson);
  return consumerFrameworks().filter((framework) =>
    frameworkPackages[framework].some((name) => installed.has(name)),
  );
}

function frameworkFromSchema(schema) {
  if (typeof schema !== "string") return undefined;
  if (schema.includes("ui.shadcn.com")) return "react";
  if (schema.includes("shadcn-vue.com")) return "vue";
  return undefined;
}

export function frameworkDetectionError(detection) {
  const error = new Error(`Error [${detection.code}]: ${detection.message}`);
  error.code = detection.code;
  return error;
}

function unknownFrameworkResult() {
  return {
    framework: undefined,
    source: undefined,
    code: unknownFrameworkCode,
    matches: [],
    message:
      "Could not detect a UI framework. Balsa needs an explicit --framework, a .balsa/project.json, a components.json schema, or a vue or react dependency.",
    fix: `Pass --framework ${consumerFrameworks().join(" or --framework ")}, or add a vue or react runtime dependency.`,
  };
}

function ambiguousFrameworkResult(matches, source) {
  return {
    framework: undefined,
    source,
    code: ambiguousFrameworkCode,
    matches,
    message:
      `This project matches more than one UI framework (${matches.join(", ")}). Balsa will not guess which one to install.`,
    fix: `Pass --framework ${consumerFrameworks().join(" or --framework ")}, or record one framework in .balsa/project.json.`,
  };
}

function resolvedFramework(framework, source) {
  return {
    framework,
    source,
    code: undefined,
    matches: [framework],
    message: undefined,
    fix: undefined,
  };
}

export function projectFrameworkPath(cwd) {
  return path.join(cwd, ".balsa", "project.json");
}

export async function readProjectFramework(cwd) {
  const target = projectFrameworkPath(cwd);
  let value;
  try {
    value = await readJson(target);
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
  if (
    !isRecord(value)
    || value.schemaVersion !== projectFrameworkSchemaVersion
    || !isConsumerFramework(value.framework)
  ) {
    throw new Error(
      `.balsa/project.json is invalid. Expected { schemaVersion: ${projectFrameworkSchemaVersion}, framework: "${consumerFrameworks().join('" | "')}" }.`,
    );
  }
  return value;
}

export async function writeProjectFramework(cwd, framework) {
  if (!isConsumerFramework(framework)) {
    throw new Error(
      `Unknown framework: ${framework}. Choose ${consumerFrameworks().join(" or ")}.`,
    );
  }
  await writeJson(projectFrameworkPath(cwd), {
    schemaVersion: projectFrameworkSchemaVersion,
    framework,
  });
}

async function readComponentsSchema(cwd) {
  try {
    const configuration = await readJson(path.join(cwd, "components.json"));
    return isRecord(configuration) ? configuration.$schema : undefined;
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function readPackageJson(cwd) {
  try {
    return await readJson(path.join(cwd, "package.json"));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

function parseExplicitFramework(framework) {
  if (framework === undefined) return undefined;
  if (!isConsumerFramework(framework)) {
    throw new Error(
      `Unknown framework: ${framework}. Choose ${consumerFrameworks().join(" or ")}.`,
    );
  }
  return framework;
}

/**
 * Resolve the consumer framework for a project. `options.framework` is the
 * explicit `--framework` value. A flag that contradicts `.balsa/project.json`
 * is an error rather than a silent rewrite.
 */
export async function detectProjectFramework(cwd, { framework } = {}) {
  const explicit = parseExplicitFramework(framework);
  const recorded = await readProjectFramework(cwd);

  if (explicit) {
    if (recorded && recorded.framework !== explicit) {
      throw new Error(
        `Framework "${explicit}" contradicts .balsa/project.json (${recorded.framework}).`,
      );
    }
    return resolvedFramework(explicit, "explicit");
  }

  if (recorded) return resolvedFramework(recorded.framework, "project");

  const schemaFramework = frameworkFromSchema(await readComponentsSchema(cwd));
  if (schemaFramework) return resolvedFramework(schemaFramework, "schema");

  const matches = frameworksFromPackages(await readPackageJson(cwd));
  if (matches.length === 1) return resolvedFramework(matches[0], "dependencies");
  if (matches.length > 1) return ambiguousFrameworkResult(matches, "dependencies");
  return unknownFrameworkResult();
}

export function catalogFrameworkOption(detection) {
  return detection?.framework ? { framework: detection.framework } : {};
}
