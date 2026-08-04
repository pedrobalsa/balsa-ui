#!/usr/bin/env node

import path from "node:path";
import { installRegistryItems } from "../scripts/install-registry.mjs";
import { createBackgroundConfiguration } from "../scripts/background-cli.mjs";
import { createThemeConfiguration } from "../scripts/theme-cli.mjs";
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
} from "../scripts/agent-context.mjs";

const help = `Balsa UI CLI

Usage:
  balsa init [--palette] [--cwd <project>] [--force] [--json]
  balsa add <item> [more-items] [--cwd <project>] [--force]
  balsa list [--json]
  balsa search <terms> [--json]
  balsa info <item> [--json | --markdown]
  balsa docs <item> [--json | --markdown]
  balsa background create <name> [--preset <preset> | --from <file> | --config <payload>] [--cwd <project>] [--force]
  balsa theme create <name> [--preset <theme> | --from <file> | --config <payload>] [--cwd <project>] [--force]
  balsa palette create <name> [--from <file> | --config <payload>] [--cwd <project>] [--force]
  balsa design-system create <name> [--from <file> | --config <payload>] [--cwd <project>] [--force]
  balsa help

Examples:
  npx balsa-ui@latest init
  npx balsa-ui@latest search "settings form"
  npx balsa-ui@latest info select --markdown
  npx balsa-ui@latest add button
  npx balsa-ui@latest add input modal --cwd ./apps/web
  npx balsa-ui@latest background create hero --preset obsidian-fold
  npx balsa-ui@latest background create hero --from ./balsa-background.json
  npx balsa-ui@latest background create hero --config <studio-payload>
  npx balsa-ui@latest theme create my-modern-flat-theme --preset modern-flat
  npx balsa-ui@latest palette create my-palette --config <studio-payload>
  npx balsa-ui@latest design-system create my-design-system --config <studio-payload>
`;

function parseAddArguments(argv) {
  const names = [];
  let cwd = process.cwd();
  let force = false;
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
  if (!item) throw new Error(`Unknown Balsa registry item: ${values[0]}`);
  const spec = await loadComponentSpec(item);
  if (json) {
    printJson({ ...compactCatalogItem(item), contract: spec });
    return;
  }
  console.log(formatComponentMarkdown(item, spec));
}

async function addItems(argv) {
  const options = parseAddArguments(argv);
  const installed = await installRegistryItems(options);
  const includesTheme = installed.some((item) => item.name === "balsa-theme");
  const includesPalette = installed.some((item) => item.name === "balsa-palette");
  const stylesheet = includesTheme || includesPalette
    ? await ensureStyleImports(options.cwd, includesPalette)
    : undefined;
  const npmDependencies = await missingNpmDependencies(options.cwd, installed);
  const result = {
    installed: installed.map((item) => `@balsa/${item.name}`),
    project: options.cwd,
    stylesheet,
    agentContext: path.join(options.cwd, ".balsa"),
    missingNpmDependencies: npmDependencies,
  };
  if (options.json) {
    printJson(result);
    return;
  }
  console.log(`Installed ${result.installed.join(", ")} into ${options.cwd}`);
  console.log("Agent context synchronized under .balsa/.");
  if (stylesheet) {
    console.log(`Configured styles: ${path.relative(options.cwd, stylesheet)}`);
  } else if (includesTheme || includesPalette) {
    console.log("Add the installed Balsa style imports after Tailwind in your main stylesheet.");
  }
  if (npmDependencies.length) {
    console.log(`Install missing npm dependencies: npm install ${npmDependencies.join(" ")}`);
  }
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
    installed: installed.map((item) => `@balsa/${item.name}`),
    stylesheet,
    agentInstructions,
    agentContext: path.join(options.cwd, ".balsa"),
    missingNpmDependencies: npmDependencies,
  };
  if (options.json) {
    printJson(result);
    return;
  }
  console.log(`Initialized Balsa UI in ${options.cwd}`);
  console.log(`Agent instructions: ${path.relative(options.cwd, agentInstructions)}`);
  console.log("Agent catalog and specifications: .balsa/");
  if (stylesheet) {
    console.log(`Configured styles: ${path.relative(options.cwd, stylesheet)}`);
  } else {
    console.log("Add the Balsa foundation and theme imports after Tailwind in your main stylesheet.");
  }
  if (npmDependencies.length) {
    console.log(`Install missing npm dependencies: npm install ${npmDependencies.join(" ")}`);
  }
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
  const result = await createPaletteConfiguration(parsePaletteArguments(argv));
  console.log(`Created ${result.paletteTarget}`);
  console.log(`Import "./styles/${path.basename(result.paletteTarget)}" after the Balsa foundation.`);
  console.log(`Activate: <html data-palette="${result.paletteId}">`);
}

async function createDesignSystem(argv) {
  const result = await createDesignSystemConfiguration(parseDesignSystemArguments(argv));
  const moduleName = path.basename(result.themeTarget, ".ts");
  console.log(`Created ${result.themeTarget}`);
  console.log(`Created ${result.paletteTarget}`);
  console.log(`Import: import { ${result.identifier} } from "@/themes/${moduleName}";`);
  console.log(`Register: createDesignThemeStore({ themes: [${result.identifier}] });`);
  console.log(`Import "./styles/${path.basename(result.paletteTarget)}" after the Balsa foundation.`);
  console.log(`Activate: <html data-palette="${result.paletteId}" data-theme="${result.paletteId}">`);
}

async function createTheme(argv) {
  const result = await createThemeConfiguration(parseThemeArguments(argv));
  const moduleName = path.basename(result.relativeTarget, ".ts");
  console.log(`Created ${result.relativeTarget}`);
  console.log(`Import: import { ${result.identifier} } from "@/themes/${moduleName}";`);
  console.log(`Register: createDesignThemeStore({ themes: [${result.identifier}] });`);
}

async function main() {
  const [command = "help", ...argv] = process.argv.slice(2);
  if (command === "help" || command === "--help" || command === "-h") {
    console.log(help);
    return;
  }
  if (command === "list") {
    await listItems(argv);
    return;
  }
  if (command === "search") {
    await searchItems(argv);
    return;
  }
  if (command === "info" || command === "docs") {
    await describeItem(argv);
    return;
  }
  if (command === "init") {
    await initializeProject(argv);
    return;
  }
  if (command === "add") {
    await addItems(argv);
    return;
  }
  if (command === "background") {
    await createBackground(argv);
    return;
  }
  if (command === "theme") {
    await createTheme(argv);
    return;
  }
  if (command === "palette") {
    await createPalette(argv);
    return;
  }
  if (command === "design-system") {
    await createDesignSystem(argv);
    return;
  }
  throw new Error(`Unknown command: ${command}\n\n${help}`);
}

main().catch((error) => {
  console.error(`Balsa UI: ${error.message}`);
  process.exitCode = 1;
});
