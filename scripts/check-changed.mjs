import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const base = args.find((value) => value.startsWith("--base="))?.slice(7) ?? "HEAD";
const explicit = args.filter((value) => !value.startsWith("--"));
const git = (values) => {
  try {
    return execFileSync("git", values, { cwd: root, encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
};
const changed = [...new Set(explicit.length ? explicit : [
  ...git(["diff", "--name-only", "--diff-filter=ACMRT", base]),
  ...git(["diff", "--cached", "--name-only", "--diff-filter=ACMRT"]),
  ...git(["ls-files", "--others", "--exclude-standard"]),
])].filter((file) => existsSync(path.join(root, file)));
if (!changed.length) {
  console.log("No changed files detected.");
  process.exit(0);
}
const run = (label, command, commandArgs) => {
  console.log(`\n> ${label}`);
  execFileSync(command, commandArgs, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
};
const source = changed.filter((file) => /\.(?:[cm]?js|ts|vue)$/.test(file) && !/^(registry\/vue|public\/r|starters\/vue|tests\/fixtures)\//.test(file));
const componentChanged = changed.some((file) => /^src\/(components\/ui|styles|theme)\//.test(file));
const gradientChanged = changed.some((file) => /gradient-background|background-cli/.test(file));
const registryChanged = changed.some((file) => /^(src\/|specs\/components\/|docs\/components\/|registry\.json|scripts\/(build|validate|registry-lib))/.test(file));
if (source.length) run("lint", "npx", ["eslint", ...source]);
const tests = new Set(changed.filter((file) => /^tests\/.+\.test\.ts$/.test(file)));
if (componentChanged) {
  tests.add("tests/components.test.ts");
  tests.add("tests/important-modifiers.test.ts");
}
if (gradientChanged) {
  tests.add("tests/background-cli.test.ts");
  tests.add("tests/gradient-background-component.test.ts");
  tests.add("tests/gradient-background-config.test.ts");
}
if (tests.size) run("focused tests", "npx", ["vitest", "run", ...tests]);
if (componentChanged) run("typecheck", "npm", ["run", "typecheck"]);
if (registryChanged) {
  run("registry build", "npm", ["run", "registry:build"]);
  run("registry validation", "npm", ["run", "registry:validate"]);
}
console.log("\nChanged-area validation passed.");
