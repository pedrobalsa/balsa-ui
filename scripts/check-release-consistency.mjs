/**
 * Website, npm package, registry, starter and documentation must ship as one
 * compatible release. The failure this prevents is the release race: the
 * website advertising a command that the published CLI does not yet have, which
 * reads to an autonomous agent as though the user or the documentation is wrong.
 */
import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { commands } from "../bin/balsa.mjs";
import { readJson, rootDir, loadRegistry } from "./registry-lib.mjs";

const errors = [];
const packageJson = await readJson(path.join(rootDir, "package.json"));
const registry = await loadRegistry();

async function documentationSources() {
  const sources = [
    "public/llms.txt",
    "public/llms-full.txt",
    "public/agent/quick-start.md",
    "README.md",
    "skills/balsa-ui/SKILL.md",
  ];
  // Directories are discovered rather than listed file by file, so website
  // content is covered wherever it lives. The public export carries a subset of
  // the private tree, and a consumer checkout carries less again; a missing
  // directory is not a release problem, but a command documented in one that
  // does not exist is.
  for (const [directory, extension] of [
    ["docs", ".md"],
    ["docs/agent-rules", ".md"],
    ["public/docs/components", ".md"],
    [path.join("src", "content"), ".ts"],
  ]) {
    let entries;
    try {
      entries = await readdir(path.join(rootDir, directory), { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(extension)) {
        sources.push(path.join(directory, entry.name));
      }
    }
  }
  return sources;
}

// `balsa add`, `npx balsa-ui@latest search`, `npx balsa-ui background create`.
// The subcommand must sit on the same line, and a `$`-prefixed token is a prompt
// placeholder rather than an invocation.
const commandPattern =
  /(?<![\w$@/-])(?:npx[ \t]+)?balsa(?:-ui)?(?:@[a-z0-9.]+)?[ \t]+([a-z][a-z-]*)/g;
const prose = new Set(["ui", "and", "the", "is", "cli", "component", "components", "registry"]);

for (const source of await documentationSources()) {
  let text;
  try {
    text = await readFile(path.join(rootDir, source), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  for (const match of text.matchAll(commandPattern)) {
    const command = match[1];
    if (prose.has(command)) continue;
    if (!Object.hasOwn(commands, command)) {
      errors.push(
        `${source}: documents \`balsa ${command}\`, which this CLI does not support.`
        + ` Publish the CLI before the documentation that advertises it.`,
      );
    }
  }
}

// registry.json follows the shadcn registry schema, which has no release
// version, so the Balsa-owned catalog is where the npm version is stamped.
for (const relativePath of [
  ".balsa/catalog.json",
  "public/catalog.json",
  "starters/vue/.balsa/catalog.json",
]) {
  try {
    const catalog = await readJson(path.join(rootDir, relativePath));
    if (catalog.releaseVersion !== packageJson.version) {
      errors.push(
        `${relativePath} releaseVersion ${JSON.stringify(catalog.releaseVersion)} does not match package.json ${packageJson.version}.`
        + ` Rebuild the registry and resynchronize the starter before releasing.`,
      );
    }
    if (catalog.items.length !== registry.items.filter((item) => item.meta?.spec).length) {
      errors.push(`${relativePath} item count is stale against registry.json.`);
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      errors.push(`${relativePath} is missing. Run npm run registry:build && npm run starter:sync.`);
    } else {
      throw error;
    }
  }
}

// The published index is how registry tooling and directory listings discover
// the namespace without knowing item names in advance.
try {
  const index = await readJson(path.join(rootDir, "public", "r", "registry.json"));
  if (index.version !== packageJson.version) {
    errors.push(
      `public/r/registry.json version ${JSON.stringify(index.version)} does not match package.json ${packageJson.version}.`,
    );
  }
  if (index.items?.length !== registry.items.length) {
    errors.push(
      `public/r/registry.json lists ${index.items?.length} items but registry.json has ${registry.items.length}.`,
    );
  }
  if (index.homepage !== packageJson.homepage) {
    errors.push("public/r/registry.json homepage does not match package.json.");
  }
} catch (error) {
  if (error.code === "ENOENT") {
    errors.push("public/r/registry.json is missing. Run npm run registry:build.");
  } else {
    throw error;
  }
}

if (registry.homepage !== packageJson.homepage) {
  errors.push(
    `registry.json homepage ${JSON.stringify(registry.homepage)} does not match package.json ${JSON.stringify(packageJson.homepage)}.`,
  );
}

// Every command the public documentation tells a user to run must actually run.
const readOnlyInvocations = [
  ["version"],
  ["help"],
  ["list"],
  ["list", "--json"],
  ["search", "settings form"],
  ["search", "settings form", "--json"],
  ["info", "button", "--markdown"],
  ["info", "button", "--json"],
  ["docs", "button", "--markdown"],
  ["view", "button", "--json"],
  ["doctor", "--json", "--cwd", rootDir],
  ["theme", "apply", "--list"],
];

for (const invocation of readOnlyInvocations) {
  const result = spawnSync(process.execPath, [path.join(rootDir, "bin", "balsa.mjs"), ...invocation], {
    cwd: rootDir,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    errors.push(
      `Documented command \`balsa ${invocation.join(" ")}\` exited ${result.status}: ${(result.stderr ?? "").trim().split("\n")[0]}`,
    );
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Release surfaces are consistent: ${Object.keys(commands).length} CLI commands, registry and npm at ${packageJson.version}, ${readOnlyInvocations.length} documented commands executed.`,
  );
}
