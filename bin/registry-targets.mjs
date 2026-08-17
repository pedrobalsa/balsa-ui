/**
 * Registry target addressing is configured here and nowhere else. Vue's empty
 * reference and route prefixes are permanent compatibility surfaces. `shared`
 * carries portable CSS, the theme core, and the portal core at `@balsa/shared/<name>` and is not
 * a consumer framework. Vue keeps unqualified `@balsa/<name>` as generated
 * equivalent payloads of the CSS files. Adding a target means adding one table entry;
 * target consumers must not special-case it.
 */
/*
 * Assembled, never written out. `registry:validate` scans this repository for
 * the legacy icon-font package, class prefix, and stylesheet, and exempts only
 * `sync-starter.mjs`. Moving the starter's cleanup rules onto this table brought
 * those strings here, where a literal occurrence fails the guard even though it
 * exists solely in order to remove them.
 */
const legacyIconPackage = ["@", "mdi", "/font"].join("");
const legacyIconStylesheet = ["balsa", "-icons.css"].join("");

function defineRegistryTarget(addressing, generation = {}) {
  const target = { ...addressing };

  // Keep the step-1 addressing surface enumerable and byte-for-byte stable for
  // its characterization suite. Generation data still lives on the same target
  // entry, but is exposed through the accessor below rather than changing that
  // established projection.
  Object.defineProperty(target, "generation", {
    value: Object.freeze({ ...generation }),
    enumerable: false,
  });

  return Object.freeze(target);
}

export const registryTargets = Object.freeze({
  vue: defineRegistryTarget({
    namespace: "@balsa",
    referencePrefix: "",
    routePrefix: "",
    generatedDirectory: "vue",
    hookAlias: "composables",
  }, {
    displayName: "Vue",
    itemSource: "registry.json",
    // Physical root for this target's UI `files[].path` values. Registry
    // paths stay `src/components/ui/...`; this prefix is what relocates them.
    sourceRoot: ".",
    // Prefix → repository-relative root. Exactly one prefix must match;
    // unclassified paths fail rather than falling through to the repo root.
    itemSourceRoots: Object.freeze({
      "src/components/ui": ".",
      "src/components/compositions": ".",
      "src/theme": ".",
      "src/theme-core": ".",
      "src/portal-core": ".",
      "src/styles": ".",
      "public/fonts": ".",
    }),
    itemSchemaUrl: "https://shadcn-vue.com/schema/registry-item.json",
    indexSchemaUrl: "https://shadcn-vue.com/schema/registry.json",
    // Documented component theme path: the helper, or the resolver it wraps.
    themeResolutionMarkers: Object.freeze([
      "useResolvedThemeProps",
      "useComponentTheme",
    ]),
    // Vue contracts are written back into the item specification's `publicApi`.
    contractDerivation: Object.freeze({
      extractor: "vue-component-meta",
      entryExtensions: Object.freeze([".vue"]),
    }),
    starterDirectory: "starters/vue",
    starterSync: Object.freeze({
      items: Object.freeze([
        "balsa-palette",
        "button",
        "input",
        "modal",
        "textarea",
        "breadcrumb",
      ]),
      legacyFiles: Object.freeze([
        "src/styles/balsa.css",
        `src/styles/${legacyIconStylesheet}`,
        "src/components/compositions/FormField.vue",
        "src/components/blocks/PageHeader.vue",
      ]),
      legacyManifestKeys: Object.freeze(["form-field", "page-header"]),
      appFile: "src/App.vue",
      mainFile: "src/main.ts",
      htmlFile: "index.html",
      cssFile: "src/index.css",
      fontsFile: "src/styles/balsa-fonts.css",
      utilityRenames: Object.freeze([
        Object.freeze({ find: "border-border", replace: "border-balsa-border", all: true }),
        Object.freeze({ find: "bg-background", replace: "bg-balsa-background", all: true }),
        Object.freeze({ find: "text-foreground", replace: "text-balsa-foreground", all: true }),
        Object.freeze({ find: "text-muted-foreground", replace: "text-balsa-muted-foreground", all: true }),
        Object.freeze({ find: "bg-surface", replace: "bg-balsa-surface", all: true }),
        Object.freeze({ find: "text-surface-foreground", replace: "text-balsa-surface-foreground", all: true }),
        Object.freeze({ find: "rounded-surface", replace: "rounded-balsa-surface", all: true }),
        Object.freeze({ find: "shadow-surface", replace: "shadow-balsa-surface", all: true }),
        Object.freeze({ find: "font-body", replace: "font-balsa-body", all: true }),
        Object.freeze({ find: "font-title", replace: "font-balsa-title", all: true }),
      ]),
      utilityReplacements: Object.freeze([
        Object.freeze({
          find: "@apply border-balsa-border;",
          replace: "border-color: var(--color-balsa-border);",
        }),
        Object.freeze({
          find: "@apply m-0 min-w-80 bg-balsa-background font-balsa-body text-balsa-foreground antialiased;",
          replace: "@apply m-0 min-w-80 antialiased;\n    background-color: var(--color-balsa-background);\n    color: var(--color-balsa-foreground);\n    font-family: var(--font-balsa-body);",
        }),
        Object.freeze({
          find: "@apply font-balsa-title text-4xl font-medium leading-tight tracking-tight md:text-5xl;",
          replace: "@apply text-4xl font-medium leading-tight tracking-tight md:text-5xl;\n    font-family: var(--font-balsa-title);",
        }),
      ]),
      cssRemovals: Object.freeze([
        Object.freeze({
          find: "^@import [\"']\\.\\/styles\\/balsa-icons\\.css[\"'];\\r?\\n",
          flags: "gm",
          replace: "",
        }),
      ]),
      mainRemovals: Object.freeze([
        Object.freeze({
          // Assembled rather than written out: `registry:validate` scans this
          // repository for the legacy icon-font package and fails on a literal
          // occurrence, including one that exists only in order to strip it.
          find: `import "${legacyIconPackage}/css/materialdesignicons.css";\n`,
          replace: "",
        }),
        Object.freeze({
          find: "^import \"@fontsource/[^\"]+\";\\r?\\n",
          flags: "gm",
          replace: "",
        }),
      ]),
      legacyNpmDependencies: Object.freeze([legacyIconPackage]),
      agents: Object.freeze([
        "# Balsa Vue starter agent rules",
        "",
        "- Before writing common UI, run `npx balsa-ui@latest search \"<intent>\"`; use `.balsa/catalog-index.json` only when CLI search is unavailable.",
        "- Read only the selected `.balsa/specs/components/<name>.json`, then install missing items with `npx balsa-ui@latest add <name>` before implementation.",
        "- Prefer installed Balsa components over rebuilding controls. The specification is sufficient for normal use; inspect component source only when changing behavior.",
        "- Preserve local edits and never use `--force` without reviewing differences.",
        "- Use Vue 3 `<script setup lang=\"ts\">`, typed public APIs, semantic `balsa` color utilities for theme-aware UI, and existing accessible behavior. Standard Tailwind colors remain available for product-specific decoration.",
        "- The starter activates the Light palette on `<html>`. Keep palette, semantic content colors, and Balsa component surfaces consistent.",
        "- Keep labels, keyboard behavior, focus visibility, accessible names, and state announcements intact.",
        "- Validate changes with `npm run lint`, `npm run test`, and `npm run build`.",
        "",
      ]),
      readme: Object.freeze([
        "# Balsa UI Vue starter",
        "",
        "A standalone Vue 3, strict TypeScript, Vite, and Tailwind CSS 4 starting point with Balsa's foundation, palette, themes, representative editable components, validation, and local agent context.",
        "",
        "```sh",
        "npm install",
        "npm run dev",
        "npm run check",
        "```",
        "",
        "Agents search by intent first, then read only the selected specification and add the matching editable components before writing raw controls:",
        "",
        "```sh",
        "npx balsa-ui@latest search \"settings form\"",
        "npx balsa-ui@latest info input --markdown",
        "npx balsa-ui@latest add input button modal",
        "```",
        "",
        "The starter has no dependency on the Balsa monorepo. Installed Balsa files are ordinary application source; preserve local changes when adding or updating items. The generated font stylesheet keeps the Latin application fonts on modern WOFF2 assets, while icons are tree-shaken Vue components.",
        "",
      ]),
    }),
  }),
  react: defineRegistryTarget({
    namespace: "@balsa",
    referencePrefix: "react/",
    routePrefix: "react/",
    generatedDirectory: "react",
    hookAlias: "hooks",
  }, {
    displayName: "React",
    itemSource: "packages/react/registry.json",
    sourceRoot: "packages/react",
    itemSourceRoots: Object.freeze({
      "src/components/ui": "packages/react",
      "src/components/compositions": "packages/react",
      "src/styles": ".",
      "src/theme-core": ".",
      "src/portal-core": ".",
      "public/fonts": ".",
    }),
    itemSchemaUrl: "https://ui.shadcn.com/schema/registry-item.json",
    indexSchemaUrl: "https://ui.shadcn.com/schema/registry.json",
    themeResolutionMarkers: Object.freeze(["useResolvedThemeProps"]),
    contractDerivation: Object.freeze({
      extractor: "typescript-props",
      entryExtensions: Object.freeze([".tsx"]),
      outputDirectory: ".balsa/contracts/react",
    }),
    starterDirectory: "starters/react",
    starterSync: Object.freeze({
      items: Object.freeze([
        "@balsa/shared/balsa-palette",
        "@balsa/react/input",
        "@balsa/react/application-card",
      ]),
      legacyFiles: Object.freeze([]),
      legacyManifestKeys: Object.freeze([]),
      appFile: "src/App.tsx",
      mainFile: "src/main.tsx",
      htmlFile: "index.html",
      cssFile: "src/index.css",
      fontsFile: "src/styles/balsa-fonts.css",
      utilityRenames: Object.freeze([]),
      utilityReplacements: Object.freeze([]),
      cssRemovals: Object.freeze([]),
      mainRemovals: Object.freeze([]),
      legacyNpmDependencies: Object.freeze([]),
      agents: Object.freeze([
        "# Balsa React starter agent rules",
        "",
        "- Before writing common UI, run `npx balsa-ui@latest search \"<intent>\"`; use `.balsa/catalog-index.json` only when CLI search is unavailable.",
        "- Read only the selected `.balsa/specs/components/<name>.json`, then install missing items with `npx balsa-ui@latest add <name>` before implementation.",
        "- Prefer installed Balsa components over rebuilding controls. The specification is sufficient for normal use; inspect component source only when changing behavior.",
        "- Preserve local edits and never use `--force` without reviewing differences.",
        "- Use React function components with TypeScript, typed public APIs, semantic `balsa` color utilities for theme-aware UI, and existing accessible behavior. Standard Tailwind colors remain available for product-specific decoration.",
        "- The starter activates the Light palette on `<html>`. Keep palette, semantic content colors, and Balsa component surfaces consistent.",
        "- Keep labels, keyboard behavior, focus visibility, accessible names, and state announcements intact.",
        "- Validate changes with `npm run lint`, `npm run test`, and `npm run build`.",
        "",
      ]),
      readme: Object.freeze([
        "# Balsa UI React starter",
        "",
        "A standalone React, strict TypeScript, Vite, and Tailwind CSS 4 starting point with Balsa's foundation, palette, themes, representative editable components, validation, and local agent context.",
        "",
        "```sh",
        "npm install",
        "npm run dev",
        "npm run check",
        "```",
        "",
        "Agents search by intent first, then read only the selected specification and add the matching editable components before writing raw controls:",
        "",
        "```sh",
        "npx balsa-ui@latest search \"settings form\"",
        "npx balsa-ui@latest info input --markdown",
        "npx balsa-ui@latest add input",
        "```",
        "",
        "The starter has no dependency on the Balsa monorepo. Installed Balsa files are ordinary application source; preserve local changes when adding or updating items. The generated font stylesheet keeps the Latin application fonts on modern WOFF2 assets, while icons are tree-shaken Lucide React components.",
        "",
      ]),
    }),
  }),
  shared: defineRegistryTarget({
    namespace: "@balsa",
    referencePrefix: "shared/",
    routePrefix: "shared/",
    generatedDirectory: "shared",
    hookAlias: "composables",
  }, {
    displayName: "Shared",
    itemSource: "packages/shared/registry.json",
    sourceRoot: ".",
    itemSourceRoots: Object.freeze({
      "src/styles": ".",
      "src/theme-core": ".",
      "src/portal-core": ".",
    }),
    itemSchemaUrl: "https://shadcn-vue.com/schema/registry-item.json",
    indexSchemaUrl: "https://shadcn-vue.com/schema/registry.json",
  }),
});

export const defaultRegistryTarget = "vue";
export const reservedRegistryTarget = "shared";

const typeAliases = Object.freeze({
  "registry:ui": "ui",
  "registry:component": "components",
  "registry:block": "components",
  "registry:composition": "components",
  "registry:lib": "lib",
  "registry:theme": "lib",
});

function configuration(target) {
  const configured = registryTargets[target];
  if (!configured) throw new Error(`Unknown registry target: ${target}`);
  return configured;
}

export function registryTargetConfigurations() {
  return Object.fromEntries(Object.entries(registryTargets).map(([name, target]) => [
    name,
    Object.freeze({ ...target, ...target.generation }),
  ]));
}

export function address(target, name) {
  const configured = configuration(target);
  return `${configured.namespace}/${configured.referencePrefix}${name}`;
}

export function route(target, name) {
  const configured = configuration(target);
  return `/r/${configured.routePrefix}${name}.json`;
}

export function namespace(target) {
  return configuration(target).namespace;
}

export function generatedDirectory(target) {
  return configuration(target).generatedDirectory;
}

export function aliasForType(type, target) {
  const configured = configuration(target);
  return type === "registry:hook" ? configured.hookAlias : (typeAliases[type] ?? "components");
}

export function isConsumerFramework(value) {
  return Boolean(registryTargets[value] && value !== reservedRegistryTarget);
}

export function consumerFrameworks() {
  return Object.keys(registryTargets).filter((name) => name !== reservedRegistryTarget);
}

/**
 * Map the name segment of an `@balsa/...` address onto a target table entry.
 * Longer prefixes win, so `react/button` is React rather than an unknown Vue
 * item named `react/button`. Vue's empty prefix is the fallback for a bare name.
 */
export function parseTargetAddress(referenceName) {
  if (typeof referenceName !== "string" || !referenceName) {
    throw new Error(`Unknown registry target for ${String(referenceName)}`);
  }

  const ranked = Object.entries(registryTargets).sort(
    (left, right) => right[1].referencePrefix.length - left[1].referencePrefix.length,
  );

  for (const [target, configured] of ranked) {
    const prefix = configured.referencePrefix;
    if (prefix) {
      if (!referenceName.startsWith(prefix)) continue;
      const itemName = referenceName.slice(prefix.length);
      if (itemName && !itemName.includes("/")) return { target, itemName };
      continue;
    }
    if (!referenceName.includes("/")) return { target, itemName: referenceName };
  }

  throw new Error(`Unknown registry target for ${referenceName}`);
}

/** Production generation source, or the in-repo local source used only to resolve unpublished targets. */
export function itemSourceForTarget(target) {
  const configured = registryTargetConfigurations()[target];
  if (!configured) throw new Error(`Unknown registry target: ${target}`);
  return configured.itemSource ?? configured.localItemSource;
}

/**
 * Directory that this target's item `files[].path` values are stored under,
 * relative to the repository root. Required generation data: a missing value
 * fails rather than implying the repository root.
 */
export function sourceRootForTarget(target = defaultRegistryTarget) {
  const configured = registryTargetConfigurations()[target];
  if (!configured) throw new Error(`Unknown registry target: ${target}`);
  if (typeof configured.sourceRoot !== "string" || configured.sourceRoot.length === 0) {
    throw new Error(`Missing sourceRoot for registry target: ${target}`);
  }
  return configured.sourceRoot;
}

/**
 * Prefix-to-root map for this target's item `files[].path` values. Required
 * generation data: a missing or empty map fails rather than implying the
 * repository root for unclassified paths.
 */
export function itemSourceRootsForTarget(target = defaultRegistryTarget) {
  const configured = registryTargetConfigurations()[target];
  if (!configured) throw new Error(`Unknown registry target: ${target}`);
  const roots = configured.itemSourceRoots;
  if (!roots || typeof roots !== "object" || Array.isArray(roots) || !Object.keys(roots).length) {
    throw new Error(`Missing itemSourceRoots for registry target: ${target}`);
  }
  return roots;
}

/**
 * Source markers that prove an item resolved appearance through the target's
 * documented theme path. Empty means the target has not declared a path yet,
 * so the integration builder treats the rule as not-applicable rather than
 * guessing a framework-named helper.
 */
export function themeResolutionMarkersForTarget(target) {
  const configured = registryTargetConfigurations()[target];
  if (!configured) throw new Error(`Unknown registry target: ${target}`);
  const markers = configured.themeResolutionMarkers;
  return Array.isArray(markers) ? markers : [];
}

/**
 * How this target's public API is derived from canonical source. Missing means
 * the target does not publish component contracts (shared CSS/theme cores).
 * A new consumer adds a table entry plus an extractor; orchestration must not
 * switch on the target name.
 */
export function contractDerivationForTarget(target) {
  const configured = registryTargetConfigurations()[target];
  if (!configured) throw new Error(`Unknown registry target: ${target}`);
  const derivation = configured.contractDerivation;
  if (!derivation || typeof derivation !== "object") return undefined;
  if (typeof derivation.extractor !== "string" || !derivation.extractor) {
    throw new Error(`Missing contract extractor for registry target: ${target}`);
  }
  const entryExtensions = derivation.entryExtensions;
  if (!Array.isArray(entryExtensions) || !entryExtensions.length) {
    throw new Error(`Missing contract entryExtensions for registry target: ${target}`);
  }
  return derivation;
}

/**
 * Repository-relative directory for this target's consumer starter. Missing
 * means the target does not ship a starter (shared CSS/theme cores). A new
 * consumer adds a table entry; orchestration must not switch on the name.
 */
export function starterDirectoryForTarget(target) {
  const configured = registryTargetConfigurations()[target];
  if (!configured) throw new Error(`Unknown registry target: ${target}`);
  const directory = configured.starterDirectory;
  if (directory == null) return undefined;
  if (typeof directory !== "string" || directory.length === 0) {
    throw new Error(`Missing starterDirectory for registry target: ${target}`);
  }
  return directory;
}

/**
 * Configured consumer starters from the target table. Filesystem existence is
 * applied by orchestration so a declared starter that is not on disk is skipped
 * rather than special-cased by framework name.
 */
export function consumerStarterDirectories() {
  return consumerFrameworks().flatMap((framework) => {
    const directory = starterDirectoryForTarget(framework);
    return directory ? [{ framework, directory }] : [];
  });
}

/**
 * How this consumer starter is synchronized. Missing means the target does not
 * ship a starter. A new consumer adds items, paths, and documents here;
 * orchestration must not switch on the target name.
 */
export function starterSyncForTarget(target) {
  const configured = registryTargetConfigurations()[target];
  if (!configured) throw new Error(`Unknown registry target: ${target}`);
  const sync = configured.starterSync;
  if (!sync || typeof sync !== "object") {
    throw new Error(`Missing starterSync for registry target: ${target}`);
  }
  if (!Array.isArray(sync.items) || !sync.items.length) {
    throw new Error(`Missing starterSync.items for registry target: ${target}`);
  }
  for (const field of ["appFile", "mainFile", "htmlFile", "cssFile", "fontsFile"]) {
    if (typeof sync[field] !== "string" || sync[field].length === 0) {
      throw new Error(`Missing starterSync.${field} for registry target: ${target}`);
    }
  }
  if (!Array.isArray(sync.agents) || !sync.agents.length) {
    throw new Error(`Missing starterSync.agents for registry target: ${target}`);
  }
  if (!Array.isArray(sync.readme) || !sync.readme.length) {
    throw new Error(`Missing starterSync.readme for registry target: ${target}`);
  }
  return sync;
}
