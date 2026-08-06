#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { installRegistryItems } from "../scripts/install-registry.mjs";
import { createBackgroundConfiguration } from "../scripts/background-cli.mjs";
import { applyThemeConfiguration, createThemeConfiguration, themePresets } from "../scripts/theme-cli.mjs";
import { createDesignSystemConfiguration } from "../scripts/design-system-cli.mjs";
import { createPaletteConfiguration } from "../scripts/palette-cli.mjs";
import {
  compactCatalogItem,
  ensureAgentInstructions,
  ensureStyleImports,
  formatCatalogList,
  formatComponentMarkdown,
  loadCatalog,
  loadComponentSpec,
  missingNpmDependencies,
  searchCatalog,
  unknownItemError,
} from "../scripts/agent-context.mjs";
import { readJson, rootDir } from "../scripts/registry-lib.mjs";
import { createResolver, loadProjectConfiguration } from "../scripts/registry-resolve.mjs";
import {
  formatInstallationPhases,
  formatProblems,
  inspectProject,
} from "../scripts/project-diagnostics.mjs";

const { version: cliVersion } = await readJson(path.join(rootDir, "package.json"));

const help = `Balsa UI CLI

Usage:
  balsa init [--palette] [--cwd <project>] [--force] [--json]
  balsa add <item|@registry/item> [more-items] [--implementation <registry>] [--cwd <project>] [--force]
  balsa list [--json]
  balsa search <terms> [--json]
  balsa info <item> [--json | --markdown]
  balsa docs <item> [--json | --markdown]
  balsa view <item|@registry/item> [--cwd <project>] [--json]
  balsa doctor [--cwd <project>] [--json]
  balsa theme apply <preset> [--name <id>] [--cwd <project>] [--force] [--json]
  balsa theme apply --list
  balsa background create <name> [--preset <preset> | --from <file> | --config <payload>] [--cwd <project>] [--force]
  balsa theme create <name> [--preset <theme> | --from <file> | --config <payload>] [--cwd <project>] [--force]
  balsa palette create <name> [--from <file> | --config <payload>] [--cwd <project>] [--force]
  balsa design-system create <name> [--from <file> | --config <payload>] [--cwd <project>] [--force]
  balsa version
  balsa help

Examples:
  npx balsa-ui@latest init
  npx balsa-ui@latest search "settings form"
  npx balsa-ui@latest info select --markdown
  npx balsa-ui@latest add button
  npx balsa-ui@latest add input modal --cwd ./apps/web
  npx balsa-ui@latest view @shadcn/stepper
  npx balsa-ui@latest add @shadcn/stepper
  npx balsa-ui@latest add button --implementation shadcn
  npx balsa-ui@latest theme apply modern-flat
  npx balsa-ui@latest background create hero --preset obsidian-fold
  npx balsa-ui@latest background create hero --from ./balsa-background.json
  npx balsa-ui@latest background create hero --config <studio-payload>
  npx balsa-ui@latest theme create my-modern-flat-theme --preset modern-flat
  npx balsa-ui@latest palette create my-palette --config <studio-payload>
  npx balsa-ui@latest design-system create my-design-system --config <studio-payload>

A bare item name resolves to @balsa. Declare other registries under "registries"
in components.json; @shadcn is configured by default.
`;

function parseAddArguments(argv) {
  const names = [];
  let cwd = process.cwd();
  let force = false;
  let json = false;
  let implementation;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--cwd") {
      const destination = argv[index + 1];
      if (!destination) throw new Error("--cwd requires a project path.");
      cwd = path.resolve(destination);
      index += 1;
      continue;
    }
    if (value === "--implementation") {
      const selected = argv[index + 1];
      if (!selected) throw new Error("--implementation requires a registry name, for example balsa or shadcn.");
      implementation = selected.startsWith("@") ? selected : `@${selected}`;
      index += 1;
      continue;
    }
    if (value === "--force") {
      force = true;
      continue;
    }
    if (value === "--json") {
      json = true;
      continue;
    }
    if (value.startsWith("-")) {
      throw new Error(`Unknown option: ${value}`);
    }
    names.push(value);
  }

  if (!names.length) {
    throw new Error("Add at least one registry item, for example: balsa add button");
  }

  // `--implementation shadcn` selects the registry for every bare name, while an
  // explicit `@ns/name` in the same command keeps the namespace it states.
  if (implementation) {
    return {
      names: names.map((name) => (name.startsWith("@") ? name : `${implementation}/${name}`)),
      cwd,
      force,
      json,
    };
  }

  return { names, cwd, force, json };
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function parseOutputFormat(argv) {
  const json = argv.includes("--json");
  const markdown = argv.includes("--markdown");
  if (json && markdown) throw new Error("Choose either --json or --markdown.");
  return {
    json,
    markdown,
    values: argv.filter((value) => value !== "--json" && value !== "--markdown"),
  };
}

async function listItems(argv) {
  const { json, values } = parseOutputFormat(argv);
  if (values.length) throw new Error(`Unknown option: ${values[0]}`);
  const catalog = await loadCatalog();
  if (json) {
    printJson(catalog.items.map(compactCatalogItem));
    return;
  }
  console.log(formatCatalogList(catalog.items));
}

async function searchItems(argv) {
  const { json, values } = parseOutputFormat(argv);
  if (!values.length) throw new Error("Search for a component purpose or name.");
  const matches = searchCatalog(await loadCatalog(), values.join(" "));
  if (json) {
    printJson(matches.map(compactCatalogItem));
    return;
  }
  if (!matches.length) {
    console.log("No Balsa items matched.");
    return;
  }
  console.log(formatCatalogList(matches));
}

async function describeItem(argv) {
  const { json, values } = parseOutputFormat(argv);
  if (values.length !== 1) {
    throw new Error("Choose one item, for example: balsa info select --markdown");
  }
  const catalog = await loadCatalog();
  const item = catalog.items.find((candidate) => candidate.name === values[0]);
  if (!item) throw unknownItemError(catalog, values[0]);
  const spec = await loadComponentSpec(item);
  if (json) {
    printJson({ ...compactCatalogItem(item), contract: spec });
    return;
  }
  console.log(formatComponentMarkdown(item, spec));
}

/**
 * Report what the destination project is missing without refusing to install.
 * The written files are correct either way, and a directory that is not an npm
 * project yet is a legitimate target -- Balsa creates what it needs. Blocking
 * here would trade a confusing install for an unusable one. `balsa doctor` is
 * the command that treats these as pass/fail.
 */
async function preflight(cwd, { json = false } = {}) {
  const diagnosis = await inspectProject(cwd);
  if (diagnosis.problems.length && !json) {
    console.warn(`${formatProblems(diagnosis.problems).join("\n")}\n`);
  }
  return diagnosis;
}

async function runDoctor(argv) {
  const { json, values } = parseOutputFormat(argv);
  let cwd = process.cwd();
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] !== "--cwd") throw new Error(`Unknown option: ${values[index]}`);
    const destination = values[index + 1];
    if (!destination) throw new Error("--cwd requires a project path.");
    cwd = path.resolve(destination);
    index += 1;
  }

  const diagnosis = await inspectProject(cwd);
  if (json) {
    printJson({
      project: diagnosis.projectRoot,
      cliVersion,
      stylesheet: diagnosis.stylesheet,
      ready: diagnosis.errors.length === 0,
      problems: diagnosis.problems,
    });
    if (diagnosis.errors.length) process.exitCode = 1;
    return;
  }

  console.log(`Balsa UI ${cliVersion} checking ${diagnosis.projectRoot}`);
  if (!diagnosis.problems.length) {
    console.log("No problems detected. This project can host a Balsa installation.");
    return;
  }
  console.log(formatProblems(diagnosis.problems).join("\n"));
  if (diagnosis.errors.length) process.exitCode = 1;
}

/**
 * Show what `add` would install, from any configured registry. `info` reads the
 * Balsa catalog and is the right tool for a Balsa contract; `view` resolves the
 * item itself, so it answers for `@shadcn/stepper` too.
 */
async function viewItem(argv) {
  const { json, values } = parseOutputFormat(argv);
  let cwd = process.cwd();
  const references = [];
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === "--cwd") {
      const destination = values[index + 1];
      if (!destination) throw new Error("--cwd requires a project path.");
      cwd = path.resolve(destination);
      index += 1;
      continue;
    }
    if (values[index].startsWith("-")) throw new Error(`Unknown option: ${values[index]}`);
    references.push(values[index]);
  }
  if (references.length !== 1) {
    throw new Error("Choose one item, for example: balsa view @shadcn/stepper");
  }

  const configuration = await loadProjectConfiguration(cwd);
  const resolver = createResolver({ configuration });
  const resolved = await resolver.resolve(references);
  const item = resolved.at(-1);
  const dependencies = resolved.filter((candidate) => candidate !== item);

  const catalog = await loadCatalog();
  const catalogItem = catalog.items.find(
    (candidate) => candidate.name === item.name && item.namespace === "@balsa",
  );

  const result = {
    reference: item.reference,
    namespace: item.namespace,
    type: item.type,
    description: item.description,
    ...(catalogItem
      ? {
        classification: catalogItem.classification,
        ...(catalogItem.upstream
          ? { upstream: `${catalogItem.upstream.registry}/${catalogItem.upstream.name}` }
          : {}),
      }
      : {}),
    install: `npx balsa-ui@latest add ${references[0]}`,
    files: item.files.map((file) => file.target),
    npmDependencies: item.dependencies ?? [],
    registryDependencies: dependencies.map((candidate) => candidate.reference),
  };

  if (json) {
    printJson(result);
    return;
  }

  console.log(`${result.reference}${result.type ? ` (${result.type})` : ""}`);
  if (result.description) console.log(result.description);
  if (result.classification) {
    console.log(`Classification: ${result.classification}`);
    if (result.upstream) console.log(`Upstream equivalent: ${result.upstream}`);
  }
  console.log(`Install: ${result.install}`);
  console.log(`\nFiles (${result.files.length}):`);
  for (const file of result.files) console.log(`  ${file}`);
  console.log(
    `\nRegistry dependencies: ${result.registryDependencies.join(", ") || "none"}`,
  );
  console.log(`npm dependencies: ${result.npmDependencies.join(", ") || "none"}`);
}

async function applyTheme(argv) {
  const { json, values } = parseOutputFormat(argv);
  let cwd = process.cwd();
  let force = false;
  let name;
  const positional = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--cwd" || value === "--name") {
      const next = values[index + 1];
      if (!next) throw new Error(`${value} requires a value.`);
      if (value === "--cwd") cwd = path.resolve(next);
      else name = next;
      index += 1;
      continue;
    }
    if (value === "--force") {
      force = true;
      continue;
    }
    if (value === "--list") {
      console.log(themePresets.join("\n"));
      return;
    }
    if (value.startsWith("-")) throw new Error(`Unknown option: ${value}`);
    positional.push(value);
  }

  if (positional.length !== 1) {
    throw new Error(
      `Choose one theme preset: ${themePresets.join(", ")}.`
      + ` For example: balsa theme apply modern-flat`,
    );
  }

  await preflight(cwd, { json });
  const result = await applyThemeConfiguration({ preset: positional[0], cwd, name, force });
  const moduleName = path.basename(result.relativeTarget, ".ts");
  const payload = {
    preset: result.preset,
    theme: result.themeId,
    module: result.relativeTarget,
    identifier: result.identifier,
    stylesheet: result.stylesheet,
    activate: `<html data-theme="${result.themeId}">`,
  };
  if (json) {
    printJson(payload);
    return;
  }
  console.log(`Applied the ${result.preset} theme as "${result.themeId}".`);
  console.log(`Created ${result.relativeTarget}`);
  console.log(`Import: import { ${result.identifier} } from "@/themes/${moduleName}";`);
  console.log(`Register: createDesignThemeStore({ themes: [${result.identifier}] });`);
  console.log(
    result.stylesheet
      ? `Configured styles: ${path.relative(result.projectRoot, result.stylesheet).split(path.sep).join("/")}`
      : "No stylesheet entry point was found. Import the Balsa foundation and theme after Tailwind.",
  );
  console.log(`Activate: ${payload.activate}`);
}

async function addItems(argv) {
  const options = parseAddArguments(argv);
  await preflight(options.cwd, { json: options.json });
  const installed = await installRegistryItems(options);
  const includesTheme = installed.some((item) => item.name === "balsa-theme");
  const includesPalette = installed.some((item) => item.name === "balsa-palette");
  const stylesheet = includesTheme || includesPalette
    ? await ensureStyleImports(options.cwd, includesPalette)
    : undefined;
  const npmDependencies = await missingNpmDependencies(options.cwd, installed);
  const result = {
    installed: installed.map((item) => item.reference ?? `@balsa/${item.name}`),
    project: options.cwd,
    stylesheet,
    agentContext: path.join(options.cwd, ".balsa"),
    missingNpmDependencies: npmDependencies,
  };
  if (options.json) {
    printJson(result);
    return;
  }
  console.log(`Installed into ${options.cwd}`);
  console.log("Agent context synchronized under .balsa/.");
  console.log(
    formatInstallationPhases({
      installed,
      stylesheet: includesTheme || includesPalette ? stylesheet : undefined,
      projectRoot: options.cwd,
      npmDependencies,
    }).join("\n"),
  );
}

function parseInitArguments(argv) {
  let cwd = process.cwd();
  let force = false;
  let palette = false;
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--cwd") {
      const destination = argv[index + 1];
      if (!destination) throw new Error("--cwd requires a project path.");
      cwd = path.resolve(destination);
      index += 1;
      continue;
    }
    if (value === "--force") force = true;
    else if (value === "--palette") palette = true;
    else if (value === "--json") json = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return { cwd, force, palette, json };
}

async function initializeProject(argv) {
  const options = parseInitArguments(argv);
  const diagnosis = await preflight(options.cwd, { json: options.json });
  const names = ["balsa-theme", ...(options.palette ? ["balsa-palette"] : [])];
  const installed = await installRegistryItems({
    names,
    cwd: options.cwd,
    force: options.force,
  });
  const stylesheet = await ensureStyleImports(options.cwd, options.palette);
  const agentInstructions = await ensureAgentInstructions(options.cwd);
  const npmDependencies = await missingNpmDependencies(options.cwd, installed);
  const result = {
    project: options.cwd,
    installed: installed.map((item) => item.reference ?? `@balsa/${item.name}`),
    stylesheet,
    agentInstructions,
    agentContext: path.join(options.cwd, ".balsa"),
    missingNpmDependencies: npmDependencies,
    problems: diagnosis.problems,
  };
  if (options.json) {
    printJson(result);
    return;
  }
  console.log(`Initialized Balsa UI in ${options.cwd}`);
  console.log(`Agent instructions: ${path.relative(options.cwd, agentInstructions)}`);
  console.log("Agent catalog and specifications: .balsa/");
  console.log(
    formatInstallationPhases({
      installed,
      stylesheet,
      projectRoot: options.cwd,
      npmDependencies,
    }).join("\n"),
  );
}

function parseBackgroundArguments(argv) {
  const [subcommand, name, ...options] = argv;
  if (subcommand !== "create" || !name) {
    throw new Error("Usage: balsa background create <name> [--preset <preset> | --from <file> | --config <payload>] [--cwd <project>] [--force]");
  }
  let cwd = process.cwd();
  let preset;
  let from;
  let inlineConfig;
  let force = false;
  for (let index = 0; index < options.length; index += 1) {
    const value = options[index];
    if (["--cwd", "--preset", "--from", "--config"].includes(value)) {
      const next = options[index + 1];
      if (!next) throw new Error(`${value} requires a value.`);
      if (value === "--cwd") cwd = path.resolve(next);
      if (value === "--preset") preset = next;
      if (value === "--from") from = path.resolve(next);
      if (value === "--config") inlineConfig = next;
      index += 1;
      continue;
    }
    if (value === "--force") {
      force = true;
      continue;
    }
    throw new Error(`Unknown option: ${value}`);
  }
  return { name, cwd, preset, from, inlineConfig, force };
}

function parseThemeArguments(argv) {
  const [subcommand, name, ...options] = argv;
  if (subcommand !== "create" || !name) {
    throw new Error("Usage: balsa theme create <name> [--preset <theme> | --from <file> | --config <payload>] [--cwd <project>] [--force]");
  }
  let cwd = process.cwd();
  let preset;
  let from;
  let inlineConfig;
  let force = false;
  for (let index = 0; index < options.length; index += 1) {
    const value = options[index];
    if (["--cwd", "--preset", "--from", "--config"].includes(value)) {
      const next = options[index + 1];
      if (!next) throw new Error(`${value} requires a value.`);
      if (value === "--cwd") cwd = path.resolve(next);
      if (value === "--preset") preset = next;
      if (value === "--from") from = path.resolve(next);
      if (value === "--config") inlineConfig = next;
      index += 1;
      continue;
    }
    if (value === "--force") {
      force = true;
      continue;
    }
    throw new Error(`Unknown option: ${value}`);
  }
  return { name, cwd, preset, from, inlineConfig, force };
}

async function createBackground(argv) {
  const result = await createBackgroundConfiguration(parseBackgroundArguments(argv));
  console.log(`Created ${result.relativeTarget}`);
  console.log(`Import: import { ${result.identifier} } from "@/backgrounds/${path.basename(result.relativeTarget, ".ts")}";`);
  console.log(`Use: <GradientBackground :config="${result.identifier}" />`);
  const npmDependencies = [
    ...new Set(result.installed.flatMap((item) => item.dependencies ?? [])),
  ];
  if (npmDependencies.length) {
    console.log(`Required npm dependencies: ${npmDependencies.join(", ")}`);
  }
}

function parseDesignSystemArguments(argv) {
  const [subcommand, name, ...options] = argv;
  if (subcommand !== "create" || !name) {
    throw new Error("Usage: balsa design-system create <name> [--from <file> | --config <payload>] [--cwd <project>] [--force]");
  }
  let cwd = process.cwd();
  let from;
  let inlineConfig;
  let force = false;
  for (let index = 0; index < options.length; index += 1) {
    const value = options[index];
    if (["--cwd", "--from", "--config"].includes(value)) {
      const next = options[index + 1];
      if (!next) throw new Error(`${value} requires a value.`);
      if (value === "--cwd") cwd = path.resolve(next);
      if (value === "--from") from = path.resolve(next);
      if (value === "--config") inlineConfig = next;
      index += 1;
      continue;
    }
    if (value === "--force") {
      force = true;
      continue;
    }
    throw new Error(`Unknown option: ${value}`);
  }
  return { name, cwd, from, inlineConfig, force };
}

function parsePaletteArguments(argv) {
  const [subcommand, name, ...options] = argv;
  if (subcommand !== "create" || !name) {
    throw new Error("Usage: balsa palette create <name> [--from <file> | --config <payload>] [--cwd <project>] [--force]");
  }
  let cwd = process.cwd();
  let from;
  let inlineConfig;
  let force = false;
  for (let index = 0; index < options.length; index += 1) {
    const value = options[index];
    if (["--cwd", "--from", "--config"].includes(value)) {
      const next = options[index + 1];
      if (!next) throw new Error(`${value} requires a value.`);
      if (value === "--cwd") cwd = path.resolve(next);
      if (value === "--from") from = path.resolve(next);
      if (value === "--config") inlineConfig = next;
      index += 1;
      continue;
    }
    if (value === "--force") {
      force = true;
      continue;
    }
    throw new Error(`Unknown option: ${value}`);
  }
  return { name, cwd, from, inlineConfig, force };
}

async function createPalette(argv) {
  const options = parsePaletteArguments(argv);
  await preflight(options.cwd);
  const result = await createPaletteConfiguration(options);
  console.log(`Created ${result.paletteTarget}`);
  console.log(
    result.stylesheet
      ? `Configured styles: ${path.relative(result.projectRoot, result.stylesheet)}`
      : `No stylesheet entry point was found. Import "./styles/${path.basename(result.paletteTarget)}" after the Balsa foundation.`,
  );
  console.log(`Activate: <html data-palette="${result.paletteId}">`);
}

async function createDesignSystem(argv) {
  const options = parseDesignSystemArguments(argv);
  await preflight(options.cwd);
  const result = await createDesignSystemConfiguration(options);
  const moduleName = path.basename(result.themeTarget, ".ts");
  console.log(`Created ${result.themeTarget}`);
  console.log(`Created ${result.paletteTarget}`);
  console.log(`Import: import { ${result.identifier} } from "@/themes/${moduleName}";`);
  console.log(`Register: createDesignThemeStore({ themes: [${result.identifier}] });`);
  console.log(
    result.stylesheet
      ? `Configured styles: ${path.relative(result.projectRoot, result.stylesheet)}`
      : `No stylesheet entry point was found. Import "./styles/${path.basename(result.paletteTarget)}" after the Balsa foundation.`,
  );
  console.log(`Activate: <html data-palette="${result.paletteId}" data-theme="${result.paletteId}">`);
}

async function runThemeCommand(argv) {
  const [subcommand] = argv;
  if (subcommand === "apply") return applyTheme(argv.slice(1));
  return createTheme(argv);
}

async function createTheme(argv) {
  const result = await createThemeConfiguration(parseThemeArguments(argv));
  const moduleName = path.basename(result.relativeTarget, ".ts");
  console.log(`Created ${result.relativeTarget}`);
  console.log(`Import: import { ${result.identifier} } from "@/themes/${moduleName}";`);
  console.log(`Register: createDesignThemeStore({ themes: [${result.identifier}] });`);
}

/**
 * The single source of truth for what this CLI supports. The release gate reads
 * it to prove that every command the website and documentation advertise is one
 * an installed CLI can actually run.
 */
export const commands = {
  help: () => console.log(help),
  version: () => console.log(cliVersion),
  list: listItems,
  search: searchItems,
  info: describeItem,
  docs: describeItem,
  init: initializeProject,
  doctor: runDoctor,
  view: viewItem,
  add: addItems,
  background: createBackground,
  theme: runThemeCommand,
  palette: createPalette,
  "design-system": createDesignSystem,
};

const commandAliases = {
  "--help": "help",
  "-h": "help",
  "--version": "version",
  "-v": "version",
};

async function main() {
  const [requested = "help", ...argv] = process.argv.slice(2);
  const command = commandAliases[requested] ?? requested;
  const handler = Object.hasOwn(commands, command) ? commands[command] : undefined;
  if (!handler) {
    throw new Error(
      `Unknown command: ${requested}. This is balsa-ui ${cliVersion}; a newer release may provide it. Run \`npx balsa-ui@latest ${requested}\` or \`balsa help\`.\n\n${help}`,
    );
  }
  await handler(argv);
}

// Guarded so the release gate can import the command table without running it.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    if (process.argv.includes("--json")) {
      console.error(JSON.stringify(
        {
          error: error.message,
          cliVersion,
          ...(error.installed ? { installed: error.installed } : {}),
        },
        null,
        2,
      ));
    } else {
      console.error(`Balsa UI: ${error.message}`);
    }
    process.exitCode = 1;
  });
}
