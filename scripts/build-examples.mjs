/**
 * Carry the website's live examples into the machine-readable specifications,
 * and prove every one of them compiles.
 *
 * A specification that lists example *names* tells an agent an example exists
 * but not what it looks like, so the agent writes its own and guesses the API.
 * The website already renders real single-file components for each item; this
 * publishes that same source and then type-checks it against the real
 * component, which is what makes an example executable rather than decorative.
 *
 * Modes:
 *   (default)   write examples into specs/components/<name>.json
 *   --check     fail if a specification no longer matches the generated source
 *   --typecheck materialize every example and run vue-tsc over them
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { createServer } from "vite";
import { readJson, rootDir, sourcePath } from "./registry-lib.mjs";

const checkOnly = process.argv.includes("--check");
const typecheck = process.argv.includes("--typecheck");

async function loadExampleModule() {
  const server = await createServer({
    configFile: false,
    root: rootDir,
    logLevel: "error",
    server: { middlewareMode: true },
    resolve: { alias: { "@": path.join(rootDir, "src") } },
  });
  try {
    return {
      module: await server.ssrLoadModule("/src/examples/component-examples.ts"),
      close: () => server.close(),
    };
  } catch (error) {
    await server.close();
    throw error;
  }
}

function describeExample(example) {
  return {
    id: example.id,
    title: example.title,
    ...(example.description ? { description: example.description } : {}),
    source: example.source.split("\r\n").join("\n").trim(),
  };
}

const { module, close } = await loadExampleModule();
const catalog = await readJson(path.join(rootDir, ".balsa", "catalog.json"));

const generated = new Map();
const missing = [];
for (const item of catalog.items) {
  const examples = module.getComponentExamples(item.name) ?? [];
  if (!examples.length) {
    missing.push(item.name);
    continue;
  }
  generated.set(item.name, examples.map(describeExample));
}
await close();

if (missing.length) {
  console.error(
    `No examples are defined for ${missing.length} catalog items:\n`
    + missing.map((name) => `- ${name}`).join("\n"),
  );
  process.exitCode = 1;
}

if (typecheck) {
  // Examples are written as real single-file components and compiled against
  // the real source, so an example using a value the component does not accept
  // fails here rather than in a consumer's editor.
  const outputDir = path.join(rootDir, "node_modules", ".tmp", "examples");
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  let count = 0;
  for (const [name, examples] of generated) {
    for (const example of examples) {
      const fileName = `${name}--${example.id}.vue`.replace(/[^a-zA-Z0-9.-]/g, "-");
      await writeFile(path.join(outputDir, fileName), `${example.source}\n`, "utf8");
      count += 1;
    }
  }

  const configPath = path.join(outputDir, "tsconfig.json");
  await writeFile(
    configPath,
    `${JSON.stringify({
      extends: path.join(rootDir, "node_modules", "@vue", "tsconfig", "tsconfig.dom.json"),
      compilerOptions: {
        noEmit: true,
        types: ["vite/client"],
        paths: { "@/*": [`${path.join(rootDir, "src").split("\\").join("/")}/*`] },
      },
      include: ["./*.vue"],
    }, null, 2)}\n`,
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
      "\nEvery documented example must compile against the component it demonstrates."
      + " Fix the example, or the component contract it relies on.",
    );
    process.exit(1);
  }
  console.log(`Type-checked ${count} documented examples against their components.`);
}

const stale = [];
for (const [name, examples] of generated) {
  const specPath = sourcePath(`specs/components/${name}.json`);
  const spec = JSON.parse(await readFile(specPath, "utf8"));
  if (JSON.stringify(spec.examples) === JSON.stringify(examples)) continue;
  stale.push(name);
  if (!checkOnly) {
    await writeFile(specPath, `${JSON.stringify({ ...spec, examples }, null, 2)}\n`, "utf8");
  }
}

if (checkOnly && stale.length) {
  console.error(
    `${stale.length} specifications no longer match their documented examples:\n`
    + stale.map((name) => `- ${name}`).join("\n")
    + "\n\nRun npm run examples:build and commit the regenerated specifications.",
  );
  process.exit(1);
}

if (checkOnly) {
  console.log(`All ${generated.size} specifications match their documented examples.`);
} else {
  console.log(`Published examples for ${generated.size} components (${stale.length} updated).`);
}
