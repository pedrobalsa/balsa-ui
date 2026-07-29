import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const implementationExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".mjs",
  ".ts",
  ".vue",
]);
const scanRoots = [
  "src",
  "registry/vue",
  "starters/vue/src",
  "tests/fixtures/registry-vue/src",
];
const importantDeclaration = /^\s*[a-z-]+\s*:[^;{}]*!important\s*;/gmi;
const bangUtility = new RegExp(
  String.raw`(?:^|[\s"'` + "`" + String.raw`])(?:[a-z0-9_[\]&>./-]+:)*![a-z][a-z0-9]*(?:-[^\s"'` + "`" + String.raw`]+)+`,
  "gmi",
);
const reducedMotionImportantDeclarations = new Set([
  "scroll-behavior: auto !important;",
  "animation-duration: 0.01ms !important;",
  "animation-iteration-count: 1 !important;",
  "transition-duration: 0.01ms !important;",
  "transition-duration: 1ms !important;",
  "animation-duration: 1ms !important;",
]);

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

function reducedMotionRanges(source: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const media = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/gi;

  for (const match of source.matchAll(media)) {
    const start = match.index;
    if (start === undefined) continue;
    const openingBrace = source.indexOf("{", start);
    let depth = 0;

    for (let index = openingBrace; index < source.length; index += 1) {
      if (source[index] === "{") depth += 1;
      if (source[index] === "}") depth -= 1;
      if (depth === 0) {
        ranges.push([start, index]);
        break;
      }
    }
  }

  return ranges;
}

function scanImplementation(path: string, source: string): string[] {
  const issues: string[] = [];
  const displayPath = relative(root, path).replaceAll("\\", "/");

  for (const match of source.matchAll(bangUtility)) {
    issues.push(`${displayPath}: Tailwind important utility ${match[0].trim()}`);
  }

  if (extname(path) !== ".css") return issues;

  const reducedMotion = reducedMotionRanges(source);
  for (const match of source.matchAll(importantDeclaration)) {
    const declaration = match[0].replace(/\s+/g, " ").trim();
    const index = match.index ?? -1;
    const isReducedMotionSafeguard = reducedMotion.some(
      ([start, end]) => index >= start && index <= end,
    );

    if (
      !isReducedMotionSafeguard ||
      !reducedMotionImportantDeclarations.has(declaration)
    ) {
      issues.push(`${displayPath}: unjustified ${declaration}`);
    }
  }

  return issues;
}

describe("important modifier policy", () => {
  it("rejects component-customization importance across canonical and generated code", () => {
    const issues = scanRoots.flatMap((directory) =>
      filesUnder(resolve(root, directory))
        .filter((path) => implementationExtensions.has(extname(path)))
        .flatMap((path) => scanImplementation(path, readFileSync(path, "utf8"))),
    );

    expect(issues).toEqual([]);
  });

  it("checks hosted registry payload source with the same policy", () => {
    const issues = filesUnder(resolve(root, "public/r"))
      .filter((path) => extname(path) === ".json")
      .flatMap((path) => {
        const payload = JSON.parse(readFileSync(path, "utf8")) as {
          files?: Array<{ target?: string; path?: string; content?: string }>;
        };

        return (payload.files ?? []).flatMap((file) => {
          const target = file.target ?? file.path ?? "";
          if (
            !file.content ||
            !implementationExtensions.has(extname(target))
          ) {
            return [];
          }

          return scanImplementation(
            join(path, target.replaceAll("/", "_")),
            file.content,
          );
        });
      });

    expect(issues).toEqual([]);
  });
});
