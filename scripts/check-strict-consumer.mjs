/**
 * Type-check the source Balsa actually installs against the compiler profile a
 * current create-vue project generates, including `noUncheckedIndexedAccess`.
 *
 * The website's own tsconfig is deliberately looser, so this gate is the only
 * place a strict-consumer regression in registry source is caught. The include
 * list is derived from every generated target's item source so new items are
 * covered automatically, and resolved through each file's real source root so a
 * vacated tree cannot type-check as an empty success.
 *
 * React `.tsx` adapters cannot share Vue's JSX namespace, so those files are
 * checked with `tsc` under `jsx: react-jsx` while Vue/shared stay on `vue-tsc`.
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { registryTargetConfigurations } from "../bin/registry-targets.mjs";
import { itemPath, loadTargetRegistry, rootDir } from "./registry-lib.mjs";
import { createSiteTypeScriptPaths } from "./site-aliases.mjs";

const checkedExtensions = new Set([".ts", ".tsx", ".vue"]);
const include = [];
for (const [target, configuration] of Object.entries(registryTargetConfigurations())) {
  if (!configuration.itemSource) continue;
  const registry = await loadTargetRegistry(target);
  for (const item of registry?.items ?? []) {
    for (const file of item.files ?? []) {
      const posix = file.path.split("\\").join("/");
      if (!checkedExtensions.has(path.extname(posix))) continue;
      include.push({ posix, target });
    }
  }
}

const resolved = [
  ...new Map(
    include.map((file) => [
      itemPath(file.posix, { target: file.target }),
      file,
    ]),
  ).keys(),
].sort();

if (!resolved.length) {
  console.error("No registry TypeScript or Vue source was found to check.");
  process.exit(1);
}

const missing = resolved.filter((file) => !existsSync(file));
if (missing.length) {
  console.error(
    "Registry typecheck include list points at missing files:\n"
    + missing.map((file) => `- ${path.relative(rootDir, file).replaceAll("\\", "/")}`).join("\n"),
  );
  process.exit(1);
}

const generatedDir = path.join(rootDir, "node_modules", ".tmp");
await mkdir(generatedDir, { recursive: true });

const reactRoot = path.join(rootDir, "packages", "react") + path.sep;
const reactFiles = resolved.filter((file) => file.startsWith(reactRoot));
const vueFiles = resolved.filter((file) => !file.startsWith(reactRoot));
const includesTsx = reactFiles.some((file) => path.extname(file) === ".tsx");

const sharedStrictOptions = {
  noEmit: true,
  types: ["vite/client"],
  paths: createSiteTypeScriptPaths(rootDir),
  strict: true,
  noUncheckedIndexedAccess: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  noFallthroughCasesInSwitch: true,
};

async function writeConfig(name, config) {
  const configPath = path.join(generatedDir, name);
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return configPath;
}

function runChecker(label, command, args, configPath) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0) {
    console.error(output || `${label} failed without output.`);
    console.error(
      "\nRegistry source must type-check under the strict create-vue profile. "
      + "Consumers cannot be asked to disable noUncheckedIndexedAccess.",
    );
    process.exit(1);
  }
  return configPath;
}

if (vueFiles.length) {
  const vueConfigPath = await writeConfig("tsconfig.strict-consumer.json", {
    extends: path.join(rootDir, "node_modules", "@vue", "tsconfig", "tsconfig.dom.json"),
    compilerOptions: {
      ...sharedStrictOptions,
      tsBuildInfoFile: path.join(generatedDir, "tsconfig.strict-consumer.tsbuildinfo"),
    },
    include: vueFiles,
  });
  runChecker(
    "vue-tsc",
    process.execPath,
    [path.join(rootDir, "node_modules", "vue-tsc", "bin", "vue-tsc.js"), "--noEmit", "-p", vueConfigPath],
    vueConfigPath,
  );
}

if (reactFiles.length) {
  const reactConfigPath = await writeConfig("tsconfig.strict-consumer-react.json", {
    compilerOptions: {
      ...sharedStrictOptions,
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "Bundler",
      lib: ["ESNext", "DOM", "DOM.Iterable"],
      skipLibCheck: true,
      isolatedModules: true,
      resolveJsonModule: true,
      tsBuildInfoFile: path.join(generatedDir, "tsconfig.strict-consumer-react.tsbuildinfo"),
      ...(includesTsx ? { jsx: "react-jsx" } : {}),
    },
    include: reactFiles,
  });
  const tscJs = path.join(rootDir, "node_modules", "typescript", "lib", "tsc.js");
  runChecker(
    "tsc",
    process.execPath,
    [tscJs, "--noEmit", "-p", reactConfigPath],
    reactConfigPath,
  );
}

console.log(
  `Type-checked ${resolved.length} installable registry source files under the strict consumer profile`
  + (reactFiles.length ? ` (${reactFiles.length} React).` : "."),
);
