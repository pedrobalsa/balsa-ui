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
          dependencies: { vue: "^3.5.0", tailwindcss: "^4.0.0" },
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
      expect(existsSync(resolve(target, ".balsa/catalog-index.json"))).toBe(true);
      expect(existsSync(resolve(target, ".balsa/specs/components/button.json"))).toBe(true);
      expect(existsSync(resolve(target, ".agents/skills/balsa-ui/SKILL.md"))).toBe(true);
      expect(existsSync(resolve(target, ".balsa/skills/balsa-ui/SKILL.md"))).toBe(true);

      writeFileSync(
        resolve(target, ".agents/skills/balsa-ui/SKILL.md"),
        "Project-owned Balsa guidance.\n",
      );
      const add = runCli(["add", "badge", "--cwd", target, "--json"]);
      expect(add.status, add.stderr).toBe(0);
      expect(
        readFileSync(resolve(target, ".agents/skills/balsa-ui/SKILL.md"), "utf8"),
      ).toBe("Project-owned Balsa guidance.\n");
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  });
});
