/**
 * Type-check the source Balsa actually installs against the compiler profile a
 * current create-vue project generates, including `noUncheckedIndexedAccess`.
 *
 * The website's own tsconfig is deliberately looser, so this gate is the only
 * place a strict-consumer regression in registry source is caught. The include
 * list is derived from registry.json so new items are covered automatically.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { loadRegistry, rootDir } from "./registry-lib.mjs";

const checkedExtensions = new Set([".ts", ".tsx", ".vue"]);
const registry = await loadRegistry();
const include = [
  ...new Set(
    registry.items
      .flatMap((item) => (item.files ?? []).map((file) => file.path.split("\\").join("/")))
      .filter((file) => checkedExtensions.has(path.extname(file))),
  ),
].sort();

if (!include.length) {
  console.error("No registry TypeScript or Vue source was found to check.");
  process.exit(1);
}

const generatedDir = path.join(rootDir, "node_modules", ".tmp");
const configPath = path.join(generatedDir, "tsconfig.strict-consumer.json");
await mkdir(generatedDir, { recursive: true });
await writeFile(
  configPath,
  `${JSON.stringify(
    {
      extends: path.join(rootDir, "node_modules", "@vue", "tsconfig", "tsconfig.dom.json"),
      compilerOptions: {
        noEmit: true,
        tsBuildInfoFile: path.join(generatedDir, "tsconfig.strict-consumer.tsbuildinfo"),
        types: ["vite/client"],
        paths: { "@/*": [`${path.join(rootDir, "src").split("\\").join("/")}/*`] },
        strict: true,
        noUncheckedIndexedAccess: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
      },
      include: include.map((file) => path.join(rootDir, file)),
    },
    null,
    2,
  )}\n`,
  "utf8",
);

const result = spawnSync(
  process.execPath,
  [path.join(rootDir, "node_modules", "vue-tsc", "bin", "vue-tsc.js"), "--noEmit", "-p", configPath],
  { cwd: rootDir, encoding: "utf8" },
);

const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
if (result.status !== 0) {
  console.error(output || "vue-tsc failed without output.");
  console.error(
    "\nRegistry source must type-check under the strict create-vue profile. "
    + "Consumers cannot be asked to disable noUncheckedIndexedAccess.",
  );
  process.exit(1);
}

console.log(`Type-checked ${include.length} installable registry source files under the strict consumer profile.`);
