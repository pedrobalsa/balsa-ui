import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

/** A deterministic npm executable for CLI tests; it records dependencies without network I/O. */
export function fakePackageManagerEnvironment(projectRoot: string): NodeJS.ProcessEnv {
  const executable = resolve(projectRoot, "fake-npm.mjs");
  writeFileSync(
    executable,
    `import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const dependencies = args.filter((value) => value !== "install" && !value.startsWith("-"));
const packagePath = resolve(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
packageJson.dependencies = { ...(packageJson.dependencies ?? {}) };
for (const dependency of dependencies) packageJson.dependencies[dependency] ??= "0.0.0-test";
writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\\n", "utf8");
writeFileSync(resolve(process.cwd(), ".fake-package-manager.json"), JSON.stringify({ args, dependencies }, null, 2) + "\\n", "utf8");
`,
    "utf8",
  );
  return {
    ...process.env,
    npm_execpath: executable,
    BALSA_PACKAGE_MANAGER_EXEC_PATH: executable,
  };
}
