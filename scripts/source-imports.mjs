/**
 * What a source file imports, and where those imports must point once installed.
 *
 * Two things upstream source says about its dependencies cannot be taken at face
 * value, and both were found the same way: an install that reported success and
 * produced a project that would not compile.
 *
 * A component reaches a sibling through `@/registry/{style}/ui/{name}`. That
 * path is real in shadcn's own repository and nowhere else -- a consumer has no
 * `src/registry` directory, and the installed file resolves to nothing. The
 * target resolution already decides where each file lands, so the same alias map
 * answers where the sibling landed; rewriting the specifier is mechanical, and
 * not doing it is why an item that imports a sibling installs but fails to
 * build.
 *
 * A registry item's `dependencies` list is also not always what its files
 * import. `@shadcn/field` declares none and imports `class-variance-authority`.
 * Trusting the declaration made the CLI report "npm dependencies unresolved:
 * none" for a component that could not resolve its own imports, which is worse
 * than no diagnostic: it is a clean result on an unanswered question.
 */

/**
 * A module specifier in an import, re-export or dynamic import. Written to be
 * indifferent to the surrounding form -- `import x from`, `export * from`,
 * `import type {…} from`, bare `import "…"` and `import("…")` all reach a
 * specifier the same way, and matching only the common shape would silently
 * miss the others.
 */
const specifierPattern = /(?:\bfrom|\bimport|\brequire)\s*\(?\s*(["'])([^"'\n]+)\1/g;

export function moduleSpecifiers(content) {
  return [...(content ?? "").matchAll(specifierPattern)].map((match) => match[2]);
}

/**
 * The npm package a specifier names, or undefined when it names something else.
 * A relative path, an alias and a Node builtin are all resolvable without a
 * package being installed, so none of them is a dependency.
 */
export function packageForSpecifier(specifier) {
  if (!specifier) return undefined;
  if (specifier.startsWith(".") || specifier.startsWith("/")) return undefined;
  if (specifier.startsWith("@/") || specifier.startsWith("~/")) return undefined;
  if (specifier.startsWith("node:")) return undefined;
  const segments = specifier.split("/");
  return specifier.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0];
}

/** Every npm package a set of files imports, deduplicated and sorted. */
export function importedPackages(files) {
  const packages = new Set();
  for (const file of files ?? []) {
    for (const specifier of moduleSpecifiers(file.content)) {
      const name = packageForSpecifier(specifier);
      if (name) packages.add(name);
    }
  }
  return [...packages].sort();
}

/**
 * Packages upstream imports under a name that has since changed.
 *
 * Only a rename belongs here — the same library under its current name, with
 * the same API. Swapping one library for a different one would be a behavioural
 * change wearing a rewrite's clothes, and the failure would surface as a
 * missing export in a consumer's build with nothing to point at.
 *
 * `lucide-vue-next` was renamed `@lucide/vue` after Lucide v1 and deprecated
 * under the old name; the migration is documented as a find-and-replace with no
 * other changes. shadcn-vue's published source still imports the old name,
 * while Balsa is on the current one, so without this an install adds a
 * deprecated duplicate of an icon package the project already has.
 */
const renamedPackages = new Map([
  ["lucide-vue-next", "@lucide/vue"],
]);

/**
 * Rewrite a renamed package to its current name, preserving any subpath.
 * `lucide-vue-next/icons/x` becomes `@lucide/vue/icons/x`.
 */
export function rewriteRenamedPackages(content) {
  if (typeof content !== "string") return content;
  let next = content;
  for (const [from, to] of renamedPackages) {
    // Escaped for the regex, and anchored by the closing quote or a subpath so
    // `lucide-vue-next-extras` is not rewritten to a package that does not exist.
    const escaped = from.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    const pattern = new RegExp(`(["'])${escaped}((?:/[^"']*)?)\\1`, "g");
    next = next.replace(pattern, (_match, quote, subpath) => `${quote}${to}${subpath}${quote}`);
  }
  return next;
}

/**
 * Which alias a registry directory belongs to. Keyed by the directory upstream
 * publishes under rather than by registry type, because that is what appears in
 * the specifier being rewritten.
 */
const aliasForDirectory = {
  ui: "ui",
  lib: "lib",
  hooks: "hooks",
  composables: "hooks",
  components: "components",
};

/**
 * `@/registry/{style}/{directory}/{rest}` in quotes. The style segment is
 * matched rather than assumed, so a project on a different shadcn style is
 * rewritten too instead of being left with a path that resolves to nothing.
 */
const registryImportPattern = /(["'])@\/registry\/[^/"'\n]+\/([^/"'\n]+)\/([^"'\n]+)\1/g;

/**
 * Point a sibling import at wherever the alias map puts that item.
 *
 * A directory with no alias is left alone. Rewriting it to a guess would turn a
 * specifier that fails loudly at build time into one that resolves to the wrong
 * file, and a wrong component is far harder to notice than a missing one.
 */
export function rewriteRegistryImports(content, configuration) {
  if (typeof content !== "string") return content;
  return content.replace(registryImportPattern, (match, quote, directory, rest) => {
    const aliasKey = aliasForDirectory[directory];
    const alias = aliasKey ? configuration.aliases?.[aliasKey] : undefined;
    if (!alias) return match;
    return `${quote}${alias}/${rest}${quote}`;
  });
}

/**
 * Apply the rewrite across an item's files.
 *
 * This runs after adapter patches, never before. An adapter records the hash of
 * the upstream source it was written against and refuses to apply when the
 * source has changed; rewriting first would drift every hash at once and
 * silently downgrade every adapter to unpatched, which is exactly the failure
 * the hash check exists to prevent.
 */
export function rewriteItemImports(item, configuration) {
  return {
    ...item,
    files: (item.files ?? []).map((file) => (
      typeof file.content === "string"
        ? {
          ...file,
          content: rewriteRenamedPackages(
            rewriteRegistryImports(file.content, configuration),
          ),
        }
        : file
    )),
  };
}
