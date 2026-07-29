import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncAgentContext } from "./agent-context.mjs";
import {
  fileHash,
  loadRegistry,
  readJson,
  resolveItems,
  rootDir,
  sourcePath,
  targetPath,
  writeJson,
} from "./registry-lib.mjs";

function parseArguments(argv) {
  const names = [];
  let cwd = process.cwd();
  let force = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--cwd") {
      cwd = argv[index + 1];
      index += 1;
    } else if (value === "--force") {
      force = true;
    } else {
      names.push(value);
    }
  }
  if (names.length === 0) {
    throw new Error("Usage: npm run registry:install -- <item> [more-items] --cwd <project>");
  }
  return { names, cwd: path.resolve(cwd), force };
}

export async function installRegistryItems({
  names,
  cwd,
  force = false,
  agentContext = true,
  forceAgentSkill = false,
}) {
  const registry = await loadRegistry();
  const items = resolveItems(registry, names);
  const manifestPath = path.join(cwd, ".balsa", "installed.json");
  let manifest = { schemaVersion: 1, components: {} };
  try {
    manifest = await readJson(manifestPath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  for (const item of items) {
    const canonicalPaths = item.files.map((file) => sourcePath(file.path));
    for (let index = 0; index < item.files.length; index += 1) {
      const file = item.files[index];
      const source = canonicalPaths[index];
      const destination = targetPath(cwd, file.target);
      const content = await readFile(source);
      try {
        const existing = await readFile(destination);
        if (!existing.equals(content) && !force) {
          throw new Error(`Refusing to overwrite customized file: ${path.relative(cwd, destination)}`);
        }
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, content);
    }

    manifest.components[item.name] = {
      registry: `@balsa/${item.name}`,
      installedVersion: item.meta?.spec
        ? (await readJson(path.join(rootDir, item.meta.spec))).version
        : "0.1.0",
      sourceHash: await fileHash(canonicalPaths),
      targetPath: item.files[0].target,
      files: item.files.map((file) => file.target),
    };
  }

  await writeJson(manifestPath, manifest);
  if (agentContext) await syncAgentContext(cwd, { forceSkill: forceAgentSkill });
  return items;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArguments(process.argv.slice(2));
  const installed = await installRegistryItems(options);
  console.log(`Installed ${installed.map((item) => `@balsa/${item.name}`).join(", ")} into ${options.cwd}`);
  if (installed.some((item) => item.name === "balsa-foundation")) {
    console.log('Ensure your main CSS imports "./styles/balsa-foundation.css" after Tailwind CSS.');
  }
  if (installed.some((item) => item.name === "balsa-theme")) {
    console.log('Import "./styles/balsa-theme.css" after the Balsa foundation.');
  }
  if (installed.some((item) => item.name === "balsa-palette")) {
    console.log('Import "./styles/balsa-palette.css" optionally and activate it with data-palette.');
  }
}
