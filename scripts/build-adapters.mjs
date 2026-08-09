/**
 * Derive theme adapters for upstream registry items.
 *
 * Hand-writing an adapter per component does not scale to the supported
 * shadcn-vue surface, and hand-written patches drift silently. Upstream styles
 * itself with a small, repeated vocabulary -- `shadow`, `shadow-sm`, a bare
 * `border` -- so the patches that carry Balsa's elevation and border width are
 * derivable from rules rather than authored.
 *
 * Every generated patch is proved before it is published: the generator applies
 * it to the source it was derived from and refuses to emit an adapter whose
 * patches do not apply cleanly. A rule that cannot be proved produces no patch
 * and the component keeps the lower integration status it honestly has.
 *
 *   (default)   write adapters/<registry>/<name>.json
 *   --check     fail if a published adapter no longer matches upstream
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { applyAdapter, loadAdapter, upstreamHashes } from "./apply-adapters.mjs";
import { createResolver, loadProjectConfiguration } from "./registry-resolve.mjs";
import { rootDir } from "./registry-lib.mjs";
import { stringLiterals as scanLiterals } from "./source-literals.mjs";
import { importedPackages, moduleSpecifiers } from "./source-imports.mjs";

const checkOnly = process.argv.includes("--check");

/**
 * The integration waves. Ordering is by how much of an application's surface
 * each group covers, so the components whose border and elevation treatment is
 * most visible when it does not match are certified first. An upstream item
 * outside these lists still gets an adapter, recorded without a wave.
 */
export const waves = {
  1: [
    "button", "input", "textarea", "checkbox", "radio-group", "switch",
    "toggle", "toggle-group", "slider", "select", "label", "field", "form",
    "input-otp", "number-field", "tags-input", "combobox", "button-group",
    "input-group", "native-select", "pin-input",
  ],
  2: [
    "card", "badge", "alert", "progress", "skeleton", "spinner", "separator",
    "table", "empty", "item", "sonner", "avatar", "kbd", "aspect-ratio",
  ],
  3: [
    "dialog", "alert-dialog", "drawer", "sheet", "popover", "tooltip",
    "hover-card", "dropdown-menu", "context-menu", "menubar", "command",
  ],
  4: [
    "tabs", "accordion", "collapsible", "breadcrumb", "pagination",
    "navigation-menu", "sidebar",
  ],
  5: [
    "calendar", "range-calendar", "chart", "carousel", "resizable",
    "scroll-area", "attachment", "stepper", "message", "message-scroller",
    "bubble", "marker",
  ],
};

const waveByItem = new Map(
  Object.entries(waves).flatMap(([wave, names]) =>
    names.map((name) => [name, Number(wave)])),
);

/**
 * Every upstream item, so coverage is measured against what upstream actually
 * publishes rather than against a list that can quietly fall behind it.
 */
async function upstreamItemNames(configuration) {
  // The item list sits at the registry root. The style-scoped sibling
  // (/r/styles/<style>/index.json) is a single registry:style item, not a list.
  const template = new URL(configuration.registries["@shadcn"].replace("{name}", "x"));
  const url = new URL("/r/index.json", template.origin).href;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} responded ${response.status}.`);
  const index = await response.json();
  if (!Array.isArray(index)) {
    throw new Error(`${url} did not return a registry item list.`);
  }
  return index
    .filter((entry) => entry.type === "registry:ui")
    .map((entry) => entry.name)
    .sort();
}

/**
 * Teleported content leaves the element the adapter scope is on, so an overlay
 * needs the attribute on its teleport target. Recording this per component is
 * what lets a consumer know which ones to check.
 */
function portalBehavior(item) {
  const source = item.files.map((file) => file.content).join("\n");
  if (/<\s*Teleport|Portal\b|to="body"|teleportTo/.test(source)) {
    return "Teleports content. The adapter scope does not follow a teleport, so put"
      + " data-balsa-adapt on the teleport target as well as the application root.";
  }
  return "Does not teleport content.";
}

/**
 * Static conformance. These properties are decidable from the patched source,
 * so they are measured rather than assumed -- unlike visual conformance, which
 * needs a browser and is not claimed here.
 *
 * `rounded-l` must not match `rounded-lg`, so every directional pattern ends at
 * a hyphen or a word boundary.
 */
const physicalDirection = [
  /\b[mp][lr]-/,            // ml-  mr-  pl-  pr-
  /\b(?:left|right)-/,
  /\btext-(?:left|right)\b/,
  /\bborder-[lr](?:-|\b)/,
  /\brounded-[tb]?[lr](?:-|\b)/,
];

const logicalDirection = /\b(?:[mp][se]-|(?:start|end)-|text-(?:start|end)\b|border-[se](?:-|\b)|rounded-[se](?:-|\b))/;

/**
 * A component that animates without a reduced-motion guard ignores the user's
 * stated preference however the Balsa motion tokens are configured.
 */
function analyzeConformance(item) {
  const source = item.files.map((file) => file.content).join("\n");
  const findings = [];

  const physical = [
    ...new Set(
      physicalDirection.flatMap((pattern) => {
        const global = new RegExp(pattern.source, "g");
        return [...source.matchAll(global)].map((match) => match[0]);
      }),
    ),
  ].sort();
  const usesLogical = logicalDirection.test(source);

  if (physical.length) {
    findings.push(
      `Uses physical-direction utilities (${physical.join(", ")}), which do not mirror in RTL.`,
    );
  }

  const animations = (source.match(/\b(?:animate-[a-z0-9-]+|transition(?:-[a-z]+)?)\b/g) ?? []).length;
  const guards = (source.match(/motion-reduce:/g) ?? []).length;
  if (animations && !guards) {
    findings.push(
      `Animates in ${animations} place(s) with no motion-reduce guard, so a reduced-motion preference is ignored.`,
    );
  }

  // A literal color ignores the palette however the token bridge is configured.
  const literalColors = [
    ...new Set([...source.matchAll(/#[0-9a-f]{3,8}\b|\brgba?\([^)]*\)/gi)].map((match) => match[0])),
  ];
  if (literalColors.length) {
    findings.push(`Contains literal colors (${literalColors.slice(0, 4).join(", ")}) that ignore the palette.`);
  }

  // A component with no physical-direction utilities mirrors correctly whether
  // it uses logical ones or is directionally neutral.
  void usesLogical;

  return {
    rtl: physical.length ? "unsupported" : "supported",
    reducedMotion: animations === 0 || guards ? "supported" : "unsupported",
    ...(findings.length ? { findings } : {}),
  };
}

/**
 * Styling-only substitutions, most specific first. Each replaces a hardcoded
 * Tailwind utility whose compiled output is a literal, and therefore cannot
 * read a Balsa token however the theme is configured.
 */
const rules = [
  {
    token: "shadow-lg",
    replacement: "shadow-[var(--balsa-shadow-lg)]",
    reason: "Tailwind shadow utilities compile to literal offsets, so elevation cannot reach through a variable.",
  },
  {
    token: "shadow-md",
    replacement: "shadow-[var(--balsa-shadow-md)]",
    reason: "Tailwind shadow utilities compile to literal offsets, so elevation cannot reach through a variable.",
  },
  {
    token: "shadow-sm",
    replacement: "shadow-[var(--balsa-shadow-control)]",
    reason: "Tailwind shadow utilities compile to literal offsets, so elevation cannot reach through a variable.",
  },
  {
    token: "shadow-xs",
    replacement: "shadow-[var(--balsa-shadow-control)]",
    reason: "Tailwind shadow utilities compile to literal offsets, so elevation cannot reach through a variable.",
  },
  {
    token: "shadow",
    replacement: "shadow-[var(--balsa-shadow-control)]",
    reason: "Tailwind shadow utilities compile to literal offsets, so elevation cannot reach through a variable.",
  },
  {
    token: "border",
    // `border` must not survive alongside the width utility: it declares a
    // literal 1px on the same property, so whichever Tailwind emits last wins
    // and the patch silently does nothing. `border-solid` keeps the style the
    // bare utility provided without competing for the width.
    replacement: "border-solid border-(length:--balsa-outline-border-width)",
    reason: "Tailwind's border utility compiles to a literal 1px width; the outline recipe carries the Balsa border width.",
  },
  ...spacingRules(),
];

/**
 * Upstream's fixed spacing, mapped onto the Balsa scale.
 *
 * Every step maps to the value it already had -- Tailwind's `4` and Balsa's
 * `lg` are both 16px at the default unit -- so nothing moves on install. What
 * changes is that the value now derives from `--balsa-space-unit` and follows
 * the Spacing control, where before it was a literal no design system could
 * reach. This is the same substitution Balsa's own components went through, and
 * it is what takes spacing from `unsupported` to `patch` on the manifests.
 *
 * The physical prefixes emit their logical equivalents in the same step, so a
 * patched `pl-4` becomes `ps-balsa-lg` rather than losing the RTL mirroring the
 * direction rules would otherwise have given it. Negative values are left
 * alone: they pull an element back over its neighbour, which is an overlap
 * offset rather than a distance between two things.
 */
function spacingRules() {
  const steps = new Map([
    ["0.5", "4xs"], ["1", "3xs"], ["1.5", "2xs"], ["2", "xs"], ["2.5", "sm"],
    ["3", "md"], ["4", "lg"], ["5", "xl"], ["6", "2xl"], ["8", "3xl"],
  ]);
  // Physical prefixes carry their logical replacement with them.
  const prefixes = new Map([
    ["p", "p"], ["px", "px"], ["py", "py"], ["pt", "pt"], ["pb", "pb"],
    ["pl", "ps"], ["pr", "pe"], ["ps", "ps"], ["pe", "pe"],
    ["m", "m"], ["mx", "mx"], ["my", "my"], ["mt", "mt"], ["mb", "mb"],
    ["ml", "ms"], ["mr", "me"], ["ms", "ms"], ["me", "me"],
    ["gap", "gap"], ["gap-x", "gap-x"], ["gap-y", "gap-y"],
    ["space-x", "space-x"], ["space-y", "space-y"],
  ]);

  const rules = [];
  for (const [prefix, logical] of prefixes) {
    for (const [value, step] of steps) {
      rules.push({
        token: `${prefix}-${value}`,
        replacement: `${logical}-balsa-${step}`,
        reason: "A fixed Tailwind spacing step cannot follow the design system's"
          + " spacing scale; the Balsa step carries the same value and derives from"
          + " the base unit.",
      });
    }
  }
  return rules;
}

/**
 * Physical-direction utilities do not mirror in RTL. Their logical equivalents
 * resolve identically in LTR, so this changes nothing for a left-to-right
 * reader and fixes the mirrored layout for a right-to-left one -- styling only,
 * with no effect on API, keyboard behavior or state.
 *
 * Longest prefix first: `rounded-tl-` must win over `rounded-l`.
 */
const directionRules = [
  ["rounded-tl-", "rounded-ss-"], ["rounded-tr-", "rounded-se-"],
  ["rounded-bl-", "rounded-es-"], ["rounded-br-", "rounded-ee-"],
  ["rounded-l-", "rounded-s-"], ["rounded-r-", "rounded-e-"],
  ["border-l-", "border-s-"], ["border-r-", "border-e-"],
  ["ml-", "ms-"], ["mr-", "me-"], ["pl-", "ps-"], ["pr-", "pe-"],
  ["left-", "start-"], ["right-", "end-"],
];

const exactDirectionRules = new Map([
  ["text-left", "text-start"], ["text-right", "text-end"],
  ["border-l", "border-s"], ["border-r", "border-e"],
  ["rounded-l", "rounded-s"], ["rounded-r", "rounded-e"],
  ["rounded-tl", "rounded-ss"], ["rounded-tr", "rounded-se"],
  ["rounded-bl", "rounded-es"], ["rounded-br", "rounded-ee"],
]);

/**
 * Rewrite one class token, preserving its variants and negative sign. Only the
 * utility after the last variant separator is directional: `md:hover:-ml-2`
 * carries `md:hover:` and `-` through unchanged.
 */
function toLogicalDirection(token) {
  const separator = token.lastIndexOf(":");
  const variants = separator < 0 ? "" : token.slice(0, separator + 1);
  let utility = separator < 0 ? token : token.slice(separator + 1);

  const negative = utility.startsWith("-");
  if (negative) utility = utility.slice(1);

  const exact = exactDirectionRules.get(utility);
  if (exact) return `${variants}${negative ? "-" : ""}${exact}`;

  for (const [from, to] of directionRules) {
    if (!utility.startsWith(from)) continue;
    return `${variants}${negative ? "-" : ""}${to}${utility.slice(from.length)}`;
  }
  return token;
}

const motionGuards = ["motion-reduce:transition-none", "motion-reduce:animate-none"];

/**
 * Patches are derived per string literal rather than per token, so a `find`
 * always has enough surrounding context to match exactly once. Upstream uses
 * both quote styles -- `cn('flex border ...')` and `"bg-primary shadow"` -- and
 * missing one silently under-reports a component as needing no patch.
 */
function classLiterals(content) {
  return scanLiterals(content, { minLength: 3, maxLength: 600 }).map((literal) => literal.raw);
}

/**
 * A class token may contain almost anything, including `data-[state=open]:`.
 * Prose must not be rewritten though -- a sentence containing the word "border"
 * would otherwise be corrupted -- so a literal only counts as a class list when
 * most of its tokens carry a utility marker.
 */
/** A Tailwind scale value, so `right-4` is a utility and `right-handed` is prose. */
const scaleValue = /^(?:\d+(?:\.\d+)?|\d+\/\d+|px|auto|full|screen|min|max|fit|dvh|dvw|\[[^\]]*\])$/;

function isDirectionalUtility(token) {
  const utility = token.slice(token.lastIndexOf(":") + 1).replace(/^-/, "");
  if (exactDirectionRules.has(utility)) return true;
  const rule = directionRules.find(([from]) => utility.startsWith(from));
  if (!rule) return false;
  const remainder = utility.slice(rule[0].length);
  // `rounded-l-lg` keeps a size keyword after the prefix; `left-4` a scale value.
  return scaleValue.test(remainder) || /^[a-z0-9]+$/.test(remainder);
}

function isClassList(classes) {
  if (!classes.every((value) => /^[!@a-z0-9[\]()/:_.,#&>*+~=%$-]+$/i.test(value))) return false;
  // Short literals are common inside ternaries (`orientation === 'x' ? '-ml-4'
  // : '-mt-4'`). Rewriting one is safe only when it is unmistakably a utility,
  // so prose that happens to contain a direction word is never touched.
  if (classes.length < 3) return classes.every(isDirectionalUtility);
  const utilityLike = classes.filter((value) => /[-:[/]/.test(value)).length;
  return utilityLike / classes.length >= 0.5;
}

function rewriteLiteral(literal) {
  // Preserve the original quote character. Rewriting `'...'` as `"..."` is a
  // gratuitous edit, and breaks outright if the class list contains a quote.
  const quote = literal[0];
  const classes = literal.slice(1, -1).trim().split(/\s+/);
  if (!isClassList(classes)) return undefined;

  let changed = false;
  const next = classes.flatMap((value) => {
    for (const rule of rules) {
      if (value !== rule.token) continue;
      changed = true;
      return rule.replacement.split(" ");
    }
    const logical = toLogicalDirection(value);
    if (logical !== value) {
      changed = true;
      return [logical];
    }
    return [value];
  });

  // A component that animates without a reduced-motion guard ignores the user's
  // stated preference however the motion tokens are configured.
  const animates = next.some((value) => /(?:^|:)(?:animate-|transition)/.test(value));
  if (animates && !next.some((value) => value.startsWith("motion-reduce:"))) {
    next.push(...motionGuards);
    changed = true;
  }

  return changed ? `${quote}${next.join(" ")}${quote}` : undefined;
}

function derivePatches(item) {
  const patches = [];
  for (const file of item.files) {
    if (!/\.(?:ts|vue)$/.test(file.path)) continue;
    const seen = new Set();
    for (const literal of classLiterals(file.content)) {
      if (seen.has(literal)) continue;
      seen.add(literal);
      // Only a literal appearing exactly once can be patched unambiguously.
      if (file.content.split(literal).length - 1 !== 1) continue;
      const replaced = rewriteLiteral(literal);
      if (!replaced) continue;
      const tokens = literal.slice(1, -1).trim().split(/\s+/);
      const matched = rules.find((rule) => tokens.includes(rule.token));
      const reasons = [];
      if (matched) reasons.push(matched.reason);
      if (tokens.some((value) => toLogicalDirection(value) !== value)) {
        reasons.push(
          "Physical-direction utilities do not mirror in RTL;"
          + " their logical equivalents resolve identically in LTR.",
        );
      }
      if (replaced.includes("motion-reduce:") && !literal.includes("motion-reduce:")) {
        reasons.push(
          "Animating without a reduced-motion guard ignores the user's stated preference.",
        );
      }
      patches.push({
        file: file.path,
        find: literal,
        replace: replaced,
        reason: reasons.join(" ") || rules[0].reason,
      });
    }
  }
  return patches;
}

/**
 * What the component needs to build, measured from its source rather than read
 * off the registry item.
 *
 * A registry may under-declare: 14 upstream items import
 * `class-variance-authority` while declaring no dependencies at all, and 22
 * import `lucide-vue-next`. Recording the measured list here is what turns
 * `adapters:check` into the gate for it -- an upstream release that adds an
 * import now shows up as a stale adapter instead of as a consumer's failed
 * build.
 *
 * `siblingImports` records the specifiers the installer must rewrite. They are
 * not dependencies, but a component that reaches a sibling is the case that
 * breaks when the rewrite is wrong, so the manifest names them.
 */
function sourceRequirements(item) {
  const siblings = new Set();
  for (const file of item.files ?? []) {
    for (const specifier of moduleSpecifiers(file.content)) {
      if (specifier.startsWith("@/registry/")) siblings.add(specifier);
    }
  }
  const declared = new Set(item.dependencies ?? []);
  const imported = importedPackages(item.files);
  return {
    npmDependencies: [...new Set([...declared, ...imported])].sort(),
    ...(imported.some((name) => !declared.has(name))
      ? { undeclaredUpstreamDependencies: imported.filter((name) => !declared.has(name)) }
      : {}),
    ...(siblings.size ? { siblingImports: [...siblings].sort() } : {}),
  };
}

function reachedDimensions(patches) {
  const text = patches.map((patch) => patch.replace).join(" ");
  return {
    color: "bridge",
    radius: "adapter-scope",
    typography: "adapter-scope",
    motion: "adapter-scope",
    border: text.includes("--balsa-outline-border-width") ? "patch" : "unsupported",
    elevation: /--balsa-shadow-/.test(text) ? "patch" : "unsupported",
    spacing: /(?:^|\s)[a-z-]+-balsa-(?:\dxs|xs|sm|md|lg|xl|\dxl)(?:\s|$)/.test(text)
      ? "patch"
      : "unsupported",
    // Control size, not spacing. Upstream sizes its controls on its own scale,
    // and Balsa's is not a Tailwind grid unit, so no patch can carry it.
    density: "unsupported",
    // Material is a surface and overlay dimension expressed through Balsa's
    // typed variants. An upstream component has no such variant to resolve, so
    // the Glass recipe reaches its colours through the token bridge and its
    // translucency not at all.
    material: "unsupported",
  };
}

const configuration = await loadProjectConfiguration(path.join(rootDir, "starters", "vue"));
const resolver = createResolver({ configuration });

const written = [];
const stale = [];
const unavailable = [];
const summary = [];

const itemNames = await upstreamItemNames(configuration);

for (const name of itemNames) {
  const reference = `@shadcn/${name}`;
  let item;
  try {
    const resolved = await resolver.resolve([reference]);
    item = resolved.find((candidate) => candidate.name === name);
  } catch {
    unavailable.push(name);
    continue;
  }
  if (!item) {
    unavailable.push(name);
    continue;
  }

  const patches = derivePatches(item);
  // Measured on the patched source, so findings reflect what actually ships.
  const patchedPreview = applyAdapter(item, {
    schemaVersion: 1, item: reference, status: "integrated",
    upstream: { files: upstreamHashes(item) }, dimensions: {}, patches,
  });
  const conformance = analyzeConformance(patchedPreview.item);
  const adapter = {
    schemaVersion: 1,
    item: reference,
    ...(waveByItem.has(name) ? { wave: waveByItem.get(name) } : {}),
    status: patches.length ? "integrated-with-patch" : "integrated",
    upstream: { version: item.version ?? null, files: upstreamHashes(item) },
    requires: sourceRequirements(item),
    dimensions: reachedDimensions(patches),
    ...(patches.length ? { patches } : {}),
    portal: portalBehavior(item),
    ...conformance,
    coverage: { visual: false, interaction: false, staticConformance: true },
    limitations: [
      "Control heights stay on the upstream scale; Balsa density is not a Tailwind grid unit.",
      "Type scale stays on the upstream scale; Balsa defines no numeric type scale.",
      "The Glass material is not applied; material direction is a composition decision.",
    ],
  };

  // Prove the adapter against the source it was derived from before publishing.
  const applied = applyAdapter(item, adapter);
  if (applied.conflict) {
    throw new Error(
      `Derived adapter for ${reference} does not apply cleanly: ${applied.conflict.message}`,
    );
  }

  const target = path.join(rootDir, "adapters", "shadcn", `${name}.json`);
  const serialized = `${JSON.stringify(adapter, null, 2)}\n`;
  const existing = await loadAdapter(reference);
  if (JSON.stringify(existing) !== JSON.stringify(adapter)) {
    stale.push(name);
    if (!checkOnly) {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, serialized, "utf8");
      written.push(name);
    }
  }
  summary.push({ name, wave: waveByItem.get(name), status: adapter.status, patches: patches.length });
}

if (checkOnly && stale.length) {
  console.error(
    `${stale.length} adapters no longer match upstream source:\n`
    + stale.map((name) => `- @shadcn/${name}`).join("\n")
    + "\n\nRun npm run adapters:build and commit the regenerated adapters.",
  );
  process.exit(1);
}

const byWave = new Map();
for (const entry of summary) {
  const key = entry.wave ?? "unassigned";
  byWave.set(key, [...(byWave.get(key) ?? []), entry]);
}
for (const key of [...byWave.keys()].sort()) {
  const entries = byWave.get(key);
  const patched = entries.filter((entry) => entry.patches > 0).length;
  console.log(
    `Wave ${key}: ${entries.length} items`
    + ` -- ${patched} integrated-with-patch, ${entries.length - patched} integrated`,
  );
}

if (unavailable.length) {
  console.log(
    `\nListed upstream but not resolvable at the configured style path (${unavailable.length}):`
    + `\n  ${unavailable.join(", ")}`,
  );
}
console.log(
  checkOnly
    ? `\nAll ${summary.length} adapters match upstream source.`
    : `\nDerived ${summary.length} adapters (${written.length} updated).`,
);
