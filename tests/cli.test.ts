import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function runCli(arguments_: readonly string[]) {
  return spawnSync(process.execPath, ["bin/balsa.mjs", ...arguments_], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

describe("Balsa CLI introspection", () => {
  /**
   * The differentiated answer: an agent asking what a dimension means here, or
   * whether it reaches an upstream component, should get it from the CLI rather
   * than by parsing generated CSS and guessing.
   */
  it("reports every dimension and how far it reaches upstream", () => {
    const result = runCli(["design-system", "show", "--json"]);
    expect(result.status, result.stderr).toBe(0);
    const report = JSON.parse(result.stdout) as {
      dimensions: { dimension: string; tokens: string[]; upstreamReach: Record<string, number> }[];
      adapters: number;
    };

    const spacing = report.dimensions.find((entry) => entry.dimension === "spacing");
    expect(spacing, "spacing is not reported as a dimension").toBeDefined();
    expect(spacing?.tokens).toContain("--balsa-space-unit");
    // Spacing reaches upstream by patch; a report claiming otherwise would mean
    // the adapter rules and the manifest had drifted apart.
    expect(spacing?.upstreamReach.patch).toBeGreaterThan(0);

    // Every dimension resolves against the manifests. `unmeasured` means a name
    // in the recipe has no counterpart in the adapters — as `shape` and `radius`
    // did until they were mapped.
    for (const entry of report.dimensions) {
      expect(entry.upstreamReach.unmeasured, `${entry.dimension} is unmeasured`).toBeUndefined();
    }
    expect(report.adapters).toBeGreaterThan(0);
  });

  it("still requires a name to create one", () => {
    const result = runCli(["design-system"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("design-system create <name>");
  });
});

describe("Balsa CLI agent workflow", () => {
  it("supports compact discovery without reading the complete catalog", () => {
    const search = runCli(["search", "text", "input", "--json"]);
    expect(search.status, search.stderr).toBe(0);
    const results = JSON.parse(search.stdout) as Array<{
      name: string;
      install: string;
      markdown: string;
    }>;
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((item) => item.name === "input")).toBe(true);
    expect(results[0]).toHaveProperty("install");
    expect(results[0]?.markdown).toMatch(
      /^https:\/\/balsa-ui\.com\/docs\/components\/.+\.md$/,
    );

    const info = runCli(["info", "button", "--markdown"]);
    expect(info.status, info.stderr).toBe(0);
    expect(info.stdout).toContain("# Button");
    expect(info.stdout).toContain("## Use for");
    expect(info.stdout).toContain("## Public API");
    expect(info.stdout).toContain("npx balsa-ui@latest add button");
  });

  it("initializes styles and local agent context without replacing existing instructions", () => {
    const target = mkdtempSync(resolve(tmpdir(), "balsa-init-"));
    try {
      writeFileSync(
        resolve(target, "package.json"),
        `${JSON.stringify({
          name: "balsa-consumer",
          private: true,
          // @lucide/vue is here because theme.ts imports it. A consumer that
          // omits it is reported, which is the assertion below.
          dependencies: {
            vue: "^3.5.0",
            tailwindcss: "^4.0.0",
            "@lucide/vue": "^0.500.0",
          },
        }, null, 2)}\n`,
      );
      writeFileSync(
        resolve(target, "AGENTS.md"),
        "# Project instructions\n\nPreserve this guidance.\n",
      );
      mkdirSync(resolve(target, "src"), { recursive: true });
      writeFileSync(resolve(target, "src/index.css"), '@import "tailwindcss";\n');

      const result = runCli(["init", "--cwd", target, "--json"]);
      expect(result.status, result.stderr).toBe(0);
      const output = JSON.parse(result.stdout) as {
        stylesheet: string;
        missingNpmDependencies: string[];
      };
      expect(output.stylesheet).toBe(resolve(target, "src/index.css"));
      expect(output.missingNpmDependencies).toEqual([]);

      const css = readFileSync(resolve(target, "src/index.css"), "utf8");
      expect(css).toContain('@import "./styles/balsa-foundation.css";');
      expect(css).toContain('@import "./styles/balsa-theme.css";');
      expect(existsSync(resolve(target, "src/styles/balsa-foundation.css"))).toBe(true);
      expect(existsSync(resolve(target, "src/styles/balsa-theme.css"))).toBe(true);

      const instructions = readFileSync(resolve(target, "AGENTS.md"), "utf8");
      expect(instructions).toContain("Preserve this guidance.");
      expect(instructions).toContain("balsa-ui-agent-context:start");
      expect(instructions).toContain('balsa-ui@latest search "<intent>"');
      expect(existsSync(resolve(target, ".balsa/catalog-index.json"))).toBe(true);
      expect(existsSync(resolve(target, ".balsa/specs/components/button.json"))).toBe(true);
      expect(existsSync(resolve(target, ".agents/skills/balsa-ui/SKILL.md"))).toBe(true);
      expect(existsSync(resolve(target, ".balsa/skills/balsa-ui/SKILL.md"))).toBe(true);

      writeFileSync(
        resolve(target, ".agents/skills/balsa-ui/SKILL.md"),
        "Project-owned Balsa guidance.\n",
      );
      const add = runCli(["add", "button", "--cwd", target, "--json"]);
      expect(add.status, add.stderr).toBe(0);
      expect(
        readFileSync(resolve(target, ".agents/skills/balsa-ui/SKILL.md"), "utf8"),
      ).toBe("Project-owned Balsa guidance.\n");
      const updatedCss = readFileSync(resolve(target, "src/index.css"), "utf8");
      expect(updatedCss).not.toContain("balsa-icons.css");
      expect(existsSync(resolve(target, "src/styles/balsa-icons.css"))).toBe(false);
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  });

  /**
   * An install that reports a clean dependency result for source that cannot
   * resolve its own imports is worse than no diagnostic: it is an answer to a
   * question nobody checked. The registry's declaration is not enough on its
   * own, because a registry can under-declare -- upstream `@shadcn/field`
   * declares nothing and imports `class-variance-authority`.
   */
  it("reports a dependency the installed source imports but the project lacks", () => {
    const target = mkdtempSync(resolve(tmpdir(), "balsa-deps-"));
    try {
      writeFileSync(
        resolve(target, "package.json"),
        `${JSON.stringify({
          name: "balsa-consumer",
          private: true,
          dependencies: { vue: "^3.5.0", tailwindcss: "^4.0.0" },
        }, null, 2)}\n`,
      );
      mkdirSync(resolve(target, "src"), { recursive: true });
      writeFileSync(resolve(target, "src/index.css"), '@import "tailwindcss";\n');

      const result = runCli(["init", "--cwd", target, "--json"]);
      expect(result.status, result.stderr).toBe(0);
      const output = JSON.parse(result.stdout) as { missingNpmDependencies: string[] };
      expect(output.missingNpmDependencies).toContain("@lucide/vue");
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  });
});
