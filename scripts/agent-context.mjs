import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  readJson,
  rootDir,
  sourcePath,
  writeJson,
} from "./registry-lib.mjs";
import { importedPackages } from "./source-imports.mjs";

export const publicBaseUrl = "https://balsa-ui.com";
export const catalogPath = path.join(rootDir, ".balsa", "catalog.json");
export const catalogIndexPath = path.join(rootDir, ".balsa", "catalog-index.json");

const agentBlockStart = "<!-- balsa-ui-agent-context:start -->";
const agentBlockEnd = "<!-- balsa-ui-agent-context:end -->";
const stylesheetCandidates = [
  "src/index.css",
  "src/style.css",
  "src/styles.css",
  "src/assets/main.css",
];

export function createCatalogIndex(catalog) {
  return {
    schemaVersion: catalog.schemaVersion,
    framework: catalog.framework,
    itemCount: catalog.items.length,
    items: catalog.items.map((item) => ({
      name: item.name,
      title: item.title,
      category: item.category,
      description: item.description,
      status: item.status,
    })),
  };
}

export async function loadCatalog() {
  return readJson(catalogPath);
}

function searchableText(item) {
  return [
    item.name,
    item.title,
    item.category,
    item.description,
    ...(item.registryDependencies ?? []),
    ...(item.npmDependencies ?? []),
  ].join(" ").toLocaleLowerCase();
}

/**
 * What kind of thing a result is, and how strongly to prefer it.
 *
 * The order is a recommendation, not a quality ranking. A composition is a
 * whole interface and answers an intent outright, so it beats the parts it is
 * made of. A Balsa addition is something upstream has no equivalent for, so it
 * is the only way to get that thing. A Balsa alternative is a deliberate
 * replacement for an upstream component and worth preferring where it exists,
 * but the upstream original is a legitimate choice and ranks just behind it
 * rather than being hidden.
 */
const kindRank = {
  block: 0,
  composition: 1,
  addition: 2,
  alternative: 3,
  upstream: 4,
};

export const searchKinds = Object.keys(kindRank);

export const kindLabels = {
  block: "block",
  composition: "composition",
  addition: "Balsa addition",
  alternative: "Balsa alternative",
  upstream: "upstream component",
};

function kindOf(item) {
  if (item.source === "upstream") return "upstream";
  if (item.type === "registry:block") return "block";
  if (item.classification === "balsa-composition") return "composition";
  if (item.classification === "balsa-addition") return "addition";
  if (item.classification === "balsa-alternative") return "alternative";
  return item.category === "composition" ? "composition" : "addition";
}

/**
 * Why a result matched, in the caller's words where possible.
 *
 * An agent choosing between ten results needs the reason more than the rank:
 * "its name is this" and "one of its dependencies mentions this" are very
 * different kinds of hit, and a score alone cannot tell them apart.
 */
function matchReasons(item, terms) {
  const name = item.name.toLocaleLowerCase();
  const title = (item.title ?? "").toLocaleLowerCase();
  const description = (item.description ?? "").toLocaleLowerCase();
  const dependencies = [
    ...(item.registryDependencies ?? []),
    ...(item.npmDependencies ?? []),
  ].join(" ").toLocaleLowerCase();

  const reasons = [];
  for (const term of terms) {
    if (name === term) reasons.push(`name is "${term}"`);
    else if (name.includes(term)) reasons.push(`name contains "${term}"`);
    else if (title.includes(term)) reasons.push(`title mentions "${term}"`);
    else if (description.includes(term)) reasons.push(`description mentions "${term}"`);
    else if (dependencies.includes(term)) reasons.push(`depends on "${term}"`);
  }
  return [...new Set(reasons)];
}

/**
 * Search the catalog, ranked and explained.
 *
 * Returns results rather than bare items: the rank, the kind and the reasons
 * are the parts a caller acts on, and discarding them was why the CLI could
 * list ten things without saying which to take or why any of them appeared.
 *
 * `upstream` items come from the adapter manifests rather than the network, so
 * a search stays offline and instant while still answering "what does Balsa add
 * and what does it adapt".
 */
export function searchCatalog(catalog, query, options = {}) {
  const { kinds, limit, upstreamItems = [] } = options;

  const candidates = [
    ...catalog.items,
    ...upstreamItems.map((entry) => ({ ...entry, source: "upstream" })),
  ];

  const terms = query
    .toLocaleLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  const scored = candidates
    .map((item) => {
      const kind = kindOf(item);
      if (kinds?.length && !kinds.includes(kind)) return undefined;
      if (!terms.length) return { item, kind, score: 0, reasons: [] };

      const name = item.name.toLocaleLowerCase();
      const title = (item.title ?? "").toLocaleLowerCase();
      const text = searchableText(item);
      const matchedTerms = terms.filter((term) => text.includes(term));
      if (!matchedTerms.length) return undefined;

      const score = terms.reduce((total, term) => {
        if (name === term) return total + 12;
        if (name.startsWith(term)) return total + 8;
        if (title.includes(term)) return total + 4;
        if (text.includes(term)) return total + 1;
        return total;
      }, matchedTerms.length === terms.length ? 6 : 0);

      return { item, kind, score, reasons: matchReasons(item, terms) };
    })
    .filter(Boolean)
    .sort((left, right) =>
      // Relevance first, then the kind recommendation. Ordering by kind first
      // would bury an exactly-named component under every composition that
      // happens to mention the word.
      right.score - left.score
      || kindRank[left.kind] - kindRank[right.kind]
      || left.item.name.localeCompare(right.item.name));

  return typeof limit === "number" ? scored.slice(0, limit) : scored;
}

function editDistance(left, right) {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

export function suggestItemNames(catalog, name, limit = 3) {
  const query = name.toLocaleLowerCase();
  return catalog.items
    .map((item) => {
      const candidate = item.name.toLocaleLowerCase();
      const distance = editDistance(query, candidate);
      const related = candidate.includes(query) || query.includes(candidate);
      return { name: item.name, distance: related ? 0 : distance };
    })
    .filter((candidate) => candidate.distance <= 3)
    .sort((left, right) => left.distance - right.distance || left.name.localeCompare(right.name))
    .slice(0, limit)
    .map((candidate) => candidate.name);
}

export function unknownItemError(catalog, name) {
  const suggestions = suggestItemNames(catalog, name);
  const hint = suggestions.length
    ? `Did you mean: ${suggestions.join(", ")}?`
    : `Run \`balsa search "${name}"\` to find an item by intent.`;
  return new Error(`Unknown Balsa registry item: ${name}. ${hint}`);
}

export function compactCatalogItem(item) {
  return {
    name: item.name,
    title: item.title,
    category: item.category,
    classification: item.classification,
    ...(item.upstream ? { upstream: `${item.upstream.registry}/${item.upstream.name}` } : {}),
    description: item.description,
    status: item.status,
    version: item.version,
    install: `npx balsa-ui@latest add ${item.name}`,
    documentation: publicDocumentationUrl(item),
    markdown: `${publicBaseUrl}/docs/components/${item.name}.md`,
    specification: `${publicBaseUrl}/specs/components/${item.name}.json`,
    registryDependencies: item.registryDependencies,
    npmDependencies: item.npmDependencies,
  };
}

export function publicDocumentationUrl(item) {
  const segment = item.category === "component" ? "components" : `${item.category}s`;
  return `${publicBaseUrl}/docs/${segment}/${item.name}`;
}

function listLines(items) {
  return items.map(
    (item) =>
      `${item.name.padEnd(20)} ${item.category.padEnd(12)} ${item.description}`,
  );
}

export function formatCatalogList(items) {
  return listLines(items).join("\n");
}

function scalarText(value) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "None";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function contractText(value) {
  if (value === null || value === undefined) return "None";
  if (Array.isArray(value)) {
    return value.length ? value.map(scalarText).join(", ") : "None";
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).map(
      ([key, entry]) => `${key}: ${scalarText(entry)}`,
    );
    return entries.length ? entries.join(", ") : "None";
  }
  return scalarText(value);
}

function bulletSection(title, values, emptyText = "Not documented in this specification.") {
  const bullets = Array.isArray(values) && values.length
    ? values.map((value) => `- ${scalarText(value)}`)
    : [emptyText];
  return [`## ${title}`, "", ...bullets, ""];
}

function shapeLines(shape, indent = "  ") {
  if (!shape) return [];
  if (shape.variants?.length) {
    return shape.variants.flatMap((variant) => [
      `${indent}- variant \`${variant.type}\`:`,
      ...shapeLines(variant, `${indent}  `),
    ]);
  }
  return (shape.fields ?? []).map(
    (field) => `${indent}- \`${field.name}${field.required ? "" : "?"}: ${field.type}\``,
  );
}

function propLines(props) {
  if (!Array.isArray(props) || !props.length) return ["No props."];
  return props.flatMap((prop) => {
    const parts = [`\`${prop.type}\``];
    if (prop.required) parts.push("required");
    if (prop.default !== undefined) parts.push(`default \`${prop.default}\``);
    const head = `- \`${prop.name}\` ${parts.join(", ")}`;
    return [
      prop.description ? `${head} -- ${prop.description}` : head,
      ...(prop.values ? [`  - one of: ${prop.values.map((value) => `\`${value}\``).join(", ")}`] : []),
      ...shapeLines(prop.shape),
    ];
  });
}

function namedLines(entries, emptyText) {
  if (!Array.isArray(entries) || !entries.length) return [emptyText];
  return entries.map(
    (entry) => `- \`${entry.name}\`${entry.type ? `: \`${entry.type}\`` : ""}`,
  );
}

/**
 * Examples are published as source, not as titles. An agent that can read the
 * example does not have to invent one, which is where invented APIs come from.
 */
function exampleSection(examples) {
  if (!Array.isArray(examples) || !examples.length) {
    return ["## Examples", "", "Not documented in this specification.", ""];
  }
  // A specification written before examples carried source still renders.
  if (examples.every((example) => typeof example === "string")) {
    return bulletSection("Examples", examples);
  }
  return [
    "## Examples",
    "",
    ...examples.flatMap((example) => [
      `### ${example.title ?? example.id}`,
      "",
      ...(example.description ? [example.description, ""] : []),
      "```vue",
      ...String(example.source ?? "").split("\n"),
      "```",
      "",
    ]),
  ];
}

function publicApiSection(publicApi) {
  const contract = publicApi && typeof publicApi === "object" ? publicApi : {};
  // A hand-written contract from an older specification is still readable.
  if (contract.props && !Array.isArray(contract.props)) {
    return ["## Public API", "", `- Props: ${contractText(contract.props)}`, ""];
  }
  if (Array.isArray(contract.props) && contract.props.some((prop) => typeof prop === "string")) {
    return [
      "## Public API",
      "",
      `- Props: ${contractText(contract.props)}`,
      `- Events: ${contractText(contract.events)}`,
      `- Slots: ${contractText(contract.slots)}`,
      "",
    ];
  }

  return [
    "## Public API",
    "",
    ...(contract.models?.length
      ? [
        "### Models",
        "",
        ...contract.models.flatMap((model) => [
          `- \`v-model${model.name === "modelValue" ? "" : `:${model.name}`}\`: \`${model.type}\` via \`${model.event}\``,
          ...(model.values ? [`  - one of: ${model.values.map((value) => `\`${value}\``).join(", ")}`] : []),
          ...shapeLines(model.shape),
        ]),
        "",
      ]
      : []),
    "### Props",
    "",
    ...propLines(contract.props),
    "",
    "### Events",
    "",
    ...namedLines(contract.events, "No events."),
    "",
    "### Slots",
    "",
    ...namedLines(contract.slots, "No slots."),
    "",
    ...(contract.exposed?.length
      ? ["### Exposed", "", ...namedLines(contract.exposed, "None."), ""]
      : []),
  ];
}

export function formatComponentMarkdown(item, spec) {
  const contract = spec && typeof spec === "object" ? spec : {};
  const lines = [
    `# ${contract.title ?? item.title ?? item.name}`,
    "",
    contract.purpose ?? item.description ?? "No purpose is documented for this item.",
    "",
    `Install: \`npx balsa-ui@latest add ${item.name}\``,
    `Documentation: ${publicDocumentationUrl(item)}`,
    ...(item.classification ? [`Classification: ${item.classification}`] : []),
    ...(item.upstream
      ? [
        `Upstream equivalent: \`${item.upstream.registry}/${item.upstream.name}\``
        + ` (install with \`npx balsa-ui@latest add ${item.upstream.registry}/${item.upstream.name}\`)`,
      ]
      : []),
    "",
    ...bulletSection("Use for", contract.useFor),
    ...bulletSection("Avoid for", contract.avoidFor),
    ...bulletSection("Accessibility", contract.accessibility),
    ...publicApiSection(contract.publicApi),
    ...bulletSection("Tokens", contract.tokens),
    ...exampleSection(contract.examples),
    ...bulletSection("Common mistakes", contract.commonMistakes),
  ];
  return lines.join("\n");
}

export async function loadComponentSpec(item) {
  try {
    return await readJson(sourcePath(`specs/components/${item.name}.json`));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        `No Balsa specification is published for ${item.name}. Expected specs/components/${item.name}.json.`,
      );
    }
    if (error instanceof SyntaxError) {
      throw new Error(
        `The Balsa specification for ${item.name} is not valid JSON (${error.message}).`,
      );
    }
    throw error;
  }
}

async function copyAgentSpecs(targetRoot, catalog) {
  for (const item of catalog.items) {
    const source = sourcePath(`specs/components/${item.name}.json`);
    const target = path.join(
      targetRoot,
      ".balsa",
      "specs",
      "components",
      `${item.name}.json`,
    );
    // Every install synchronizes the whole catalog. Rewriting specifications
    // that did not change is the bulk of that work and touches the consumer's
    // file timestamps for no reason.
    const content = `${JSON.stringify(await readJson(source), null, 2)}\n`;
    try {
      if (await readFile(target, "utf8") === content) continue;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }

  // A specification left behind after its component leaves the catalog is worse
  // than a missing one: an agent reads it, believes the component exists, and
  // writes an install command that cannot resolve. The directory has to mirror
  // the catalog, not accumulate it.
  const directory = path.join(targetRoot, ".balsa", "specs", "components");
  const published = new Set(catalog.items.map((item) => `${item.name}.json`));
  let present = [];
  try {
    present = await readdir(directory);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  for (const file of present) {
    if (file.endsWith(".json") && !published.has(file)) {
      await rm(path.join(directory, file));
    }
  }
}

async function copyAgentSkill(targetRoot, force = false) {
  const source = await readFile(sourcePath("skills/balsa-ui/SKILL.md"), "utf8");
  const canonicalTarget = path.join(
    targetRoot,
    ".balsa",
    "skills",
    "balsa-ui",
    "SKILL.md",
  );
  await mkdir(path.dirname(canonicalTarget), { recursive: true });
  await writeFile(canonicalTarget, source, "utf8");

  const discoveryTarget = path.join(
    targetRoot,
    ".agents",
    "skills",
    "balsa-ui",
    "SKILL.md",
  );
  if (!force) {
    try {
      const existing = await readFile(discoveryTarget, "utf8");
      if (existing !== source) return;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  await mkdir(path.dirname(discoveryTarget), { recursive: true });
  await writeFile(discoveryTarget, source, "utf8");
}

export async function syncAgentContext(targetRoot, { forceSkill = false } = {}) {
  const catalog = await loadCatalog();
  await writeJson(path.join(targetRoot, ".balsa", "catalog.json"), catalog);
  await writeJson(
    path.join(targetRoot, ".balsa", "catalog-index.json"),
    createCatalogIndex(catalog),
  );
  await copyAgentSpecs(targetRoot, catalog);
  await copyAgentSkill(targetRoot, forceSkill);
  await mkdir(path.join(targetRoot, ".balsa"), { recursive: true });
  await writeFile(
    path.join(targetRoot, ".balsa", "README.md"),
    [
      "# Balsa agent context",
      "",
      "Use the CLI to search by intent before loading catalog files into context. Then read only the selected specification under `specs/components/`.",
      "Use `catalog-index.json` only when CLI search is unavailable, and `catalog.json` only for dependency, token, documentation, or source metadata.",
      "",
      "```sh",
      'npx balsa-ui@latest search "settings form"',
      "npx balsa-ui@latest info input --markdown",
      "npx balsa-ui@latest add input button",
      "```",
      "",
      "Installed source belongs to this application. Preserve local changes and do not use `--force` without reviewing the diff.",
      "",
    ].join("\n"),
    "utf8",
  );
  return catalog;
}

function agentInstructions() {
  return [
    agentBlockStart,
    "## Balsa UI",
    "",
    "- Before writing common controls or surfaces, run `npx balsa-ui@latest search \"<intent>\"`, then read only the selected `.balsa/specs/components/<name>.json`.",
    "- Install matching items with `npx balsa-ui@latest add <name>` before implementing the interface. Do not rebuild a Balsa-covered control with raw HTML and CSS.",
    "- The specification is sufficient for normal composition. Inspect installed component source only when changing its behavior.",
    "- Use semantic Balsa tokens and preserve component accessibility behavior and typed APIs.",
    "- Treat installed files as application source. Never use `--force` without reviewing local differences.",
    "- Validate application changes with the repository's existing lint, test, typecheck, and build commands.",
    agentBlockEnd,
  ].join("\n");
}

export async function ensureAgentInstructions(targetRoot) {
  const target = path.join(targetRoot, "AGENTS.md");
  let source = "";
  try {
    source = await readFile(target, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const block = agentInstructions();
  const start = source.indexOf(agentBlockStart);
  const end = source.indexOf(agentBlockEnd);
  const next = start >= 0 && end > start
    ? `${source.slice(0, start)}${block}${source.slice(end + agentBlockEnd.length)}`
    : `${source.trimEnd()}${source.trim() ? "\n\n" : ""}${block}\n`;
  await writeFile(target, next, "utf8");
  return target;
}

async function existingStylesheet(targetRoot) {
  for (const candidate of stylesheetCandidates) {
    const target = path.join(targetRoot, candidate);
    try {
      await access(target);
      return target;
    } catch {
      // Continue through the finite supported entrypoint list.
    }
  }
  return undefined;
}

/**
 * Wire the Balsa stylesheets into the project's CSS entry point. Generated
 * palettes are appended after the theme so a design system's own colors win
 * over the defaults it extends.
 */
export async function ensureStyleImports(targetRoot, options = false) {
  const { includePalette = false, includeTheme = true, includeBridge = false, generated = [] } =
    typeof options === "boolean" ? { includePalette: options } : options;
  const target = await existingStylesheet(targetRoot);
  if (!target) return undefined;

  const styleImport = (fileName) => {
    const relative = path
      .relative(path.dirname(target), path.join(targetRoot, "src", "styles", fileName))
      .replaceAll(path.sep, "/");
    return `@import "${relative.startsWith(".") ? relative : `./${relative}`}";`;
  };
  const imports = [
    styleImport("balsa-foundation.css"),
    ...(includePalette ? [styleImport("balsa-palette.css")] : []),
    ...(includeTheme ? [styleImport("balsa-theme.css")] : []),
    // The bridge reads resolved Balsa tokens, so it has to come after them.
    ...(includeBridge ? [styleImport("balsa-shadcn-bridge.css")] : []),
    ...generated.map((fileName) => styleImport(fileName)),
  ];
  let source = await readFile(target, "utf8");
  const missing = imports.filter((value) => !source.includes(value));
  if (!missing.length) return target;

  // Order matters: the bridge reads tokens the foundation and theme define, and
  // a generated palette overrides the defaults it extends. Anchoring to the last
  // Balsa import already present keeps a later addition after its prerequisites
  // rather than dropping it directly under the Tailwind import.
  const anchors = imports
    .map((value) => {
      const index = source.indexOf(value);
      return index < 0 ? -1 : index + value.length;
    })
    .filter((index) => index >= 0);

  let insertion = anchors.length ? Math.max(...anchors) : undefined;
  if (insertion === undefined) {
    const matched = source.match(/@import\s+["']tailwindcss["'];?/);
    insertion = matched?.index === undefined ? undefined : matched.index + matched[0].length;
  }

  source = insertion === undefined
    ? `${missing.join("\n")}\n${source}`
    : `${source.slice(0, insertion)}\n${missing.join("\n")}${source.slice(insertion)}`;
  await writeFile(target, source, "utf8");
  return target;
}

/**
 * What an item needs from npm.
 *
 * The union of what it declares and what its files actually import, because
 * neither alone is trustworthy. A registry may under-declare -- `@shadcn/field`
 * declares nothing and imports `class-variance-authority` -- and reporting a
 * declaration back as if it were a fact produced a clean diagnostic for a
 * component that could not resolve its own imports. A declaration may also name
 * something the source no longer imports, and dropping it silently would be its
 * own guess, so both are kept.
 */
export function requiredNpmDependencies(items) {
  const required = new Set();
  for (const item of items) {
    for (const dependency of item.dependencies ?? []) required.add(dependency);
    for (const dependency of importedPackages(item.files)) required.add(dependency);
  }
  return [...required].sort();
}

export async function missingNpmDependencies(targetRoot, items) {
  const required = requiredNpmDependencies(items);
  let packageJson;
  try {
    packageJson = await readJson(path.join(targetRoot, "package.json"));
  } catch (error) {
    if (error.code === "ENOENT") return required;
    throw error;
  }
  const installed = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
  ]);
  return required.filter((dependency) => !installed.has(dependency));
}
