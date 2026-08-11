/**
 * Verify the installed CLI can reach every local runtime module from the npm
 * tarball. Source-tree tests cannot catch a missing `files` entry: Node resolves
 * it locally and the failure appears only after publication.
 */
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmExecPath = process.env.npm_execpath;
if (!npmExecPath) {
  throw new Error("Run the package runtime check through `npm run package:check`.");
}

const packOutput = execFileSync(
  process.execPath,
  [npmExecPath, "pack", "--dry-run", "--json"],
  { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
);
const [pack] = JSON.parse(packOutput);
const packed = new Set(pack.files.map((entry) => entry.path.replaceAll("\\", "/")));
const queue = ["bin/balsa.mjs"];
const visited = new Set();
const missing = [];
const importPattern = /(?:from\s+|import\s*\()\s*["'](\.\.?\/[^"']+)["']/g;

while (queue.length) {
  const relative = queue.shift();
  if (visited.has(relative)) continue;
  visited.add(relative);
  if (!packed.has(relative)) {
    missing.push(relative);
    continue;
  }

  const source = await readFile(path.join(root, relative), "utf8");
  for (const match of source.matchAll(importPattern)) {
    const imported = path.posix.normalize(path.posix.join(path.posix.dirname(relative), match[1]));
    if (imported.endsWith(".mjs")) queue.push(imported);
  }
}

const requiredData = [
  ".balsa/catalog-index.json",
  ".balsa/catalog.json",
  "registry.json",
  "src/config/components-template.json",
  "src/design-system/built-ins.json",
];
for (const required of requiredData) {
  if (!packed.has(required)) missing.push(required);
}
if (![...packed].some((entry) => entry.startsWith("adapters/"))) {
  missing.push("adapters/**");
}

if (missing.length) {
  throw new Error(
    `npm tarball is missing CLI runtime files:\n${[...new Set(missing)].map((entry) => `- ${entry}`).join("\n")}`,
  );
}

console.log(`Verified ${visited.size} CLI modules across ${packed.size} packed files.`);
