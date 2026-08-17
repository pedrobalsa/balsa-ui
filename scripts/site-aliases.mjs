import path from "node:path";
import aliasConfig from "../tsconfig.aliases.json" with { type: "json" };

export const siteTypeScriptPaths = Object.freeze(aliasConfig.compilerOptions.paths);

const siteAliasEntries = Object.freeze(
  Object.entries(siteTypeScriptPaths).map(([pattern, targets]) => {
    if (!pattern.endsWith("/*") || !Array.isArray(targets) || targets.length !== 1) {
      throw new Error(`Site alias ${pattern} must have exactly one wildcard target.`);
    }
    const [target] = targets;
    if (typeof target !== "string" || !target.startsWith("./") || !target.endsWith("/*")) {
      throw new Error(`Site alias ${pattern} must target one repository-relative wildcard path.`);
    }
    return Object.freeze({
      find: pattern.slice(0, -2),
      source: target.slice(2, -2),
    });
  }),
);

export function createSiteViteAliases(repositoryRoot) {
  return siteAliasEntries.map(({ find, source }) => ({
    find,
    replacement: path.resolve(repositoryRoot, source),
  }));
}

export function createSiteTypeScriptPaths(repositoryRoot) {
  return Object.fromEntries(
    siteAliasEntries.map(({ find, source }) => [
      `${find}/*`,
      [`${path.resolve(repositoryRoot, source).split("\\").join("/")}/*`],
    ]),
  );
}

export function assertSiteViteAliases(actual, repositoryRoot, label) {
  const expected = createSiteViteAliases(repositoryRoot);
  const matches = Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((entry, index) => (
      entry?.find === expected[index].find
      && entry?.replacement === expected[index].replacement
    ));
  if (!matches) {
    throw new Error(
      `${label} site alias drift: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`,
    );
  }
}
