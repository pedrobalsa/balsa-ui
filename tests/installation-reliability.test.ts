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
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fakePackageManagerEnvironment } from "./helpers/fake-package-manager";

let packageManagerEnvironment: NodeJS.ProcessEnv;

function runCli(arguments_: readonly string[]) {
  return spawnSync(process.execPath, ["bin/balsa.mjs", ...arguments_], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: packageManagerEnvironment,
  });
}

let target: string;

function createConsumer(options: { stylesheet?: boolean; vue?: boolean } = {}) {
  const { stylesheet = true, vue = true } = options;
  writeFileSync(
    resolve(target, "package.json"),
    `${JSON.stringify({
      name: "balsa-consumer",
      private: true,
      dependencies: {
        ...(vue ? { vue: "^3.5.0" } : {}),
        tailwindcss: "^4.0.0",
      },
    }, null, 2)}\n`,
  );
  mkdirSync(resolve(target, "src"), { recursive: true });
  if (stylesheet) {
    writeFileSync(resolve(target, "src/index.css"), '@import "tailwindcss";\n');
  }
}

beforeEach(() => {
  target = mkdtempSync(resolve(tmpdir(), "balsa-install-"));
  packageManagerEnvironment = fakePackageManagerEnvironment(target);
});

afterEach(() => {
  rmSync(target, { recursive: true, force: true });
});

describe("installation reliability", () => {
  // Installing into a directory that is not an npm project yet is legitimate;
  // Balsa creates what it needs. The problems are reported, never fatal.
  it("reports what a bare target is missing but still installs", () => {
    const result = runCli(["add", "button", "--cwd", target]);

    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toContain("missing-package-json");
    expect(result.stderr).toContain("missing-source-directory");
    expect(result.stdout).toContain("@balsa/button");
  });

  it("reports project problems by code through doctor", () => {
    createConsumer({ stylesheet: false, vue: false });
    const result = runCli(["doctor", "--cwd", target, "--json"]);

    expect(result.status).toBe(1);
    const report = JSON.parse(result.stdout) as {
      ready: boolean;
      problems: Array<{ code: string; level: string; fix: string }>;
    };
    expect(report.ready).toBe(false);
    const codes = report.problems.map((problem) => problem.code);
    expect(codes).toContain("missing-vue");
    expect(codes).toContain("missing-stylesheet");
    for (const problem of report.problems) {
      expect(problem.fix.length).toBeGreaterThan(0);
    }
  });

  it("passes doctor once the project is ready", () => {
    createConsumer();
    writeFileSync(
      resolve(target, "tsconfig.json"),
      `${JSON.stringify({ compilerOptions: { paths: { "@/*": ["src/*"] } } }, null, 2)}\n`,
    );
    const result = runCli(["doctor", "--cwd", target, "--json"]);

    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout) as { ready: boolean; problems: unknown[] };
    expect(report.ready).toBe(true);
    expect(report.problems).toEqual([]);
  });

  it("records what installed before a refusal so a rerun is recoverable", () => {
    createConsumer();
    expect(runCli(["init", "--cwd", target]).status).toBe(0);

    writeFileSync(resolve(target, "src/components/ui/Table.vue"), "customized\n");
    const result = runCli(["add", "data-table", "--cwd", target, "--json"]);

    expect(result.status).toBe(1);
    const failure = JSON.parse(result.stderr) as { error: string; installed?: string[] };
    expect(failure.error).toContain("src/components/ui/Table.vue");
    expect(failure.error).toContain("--force");
    expect(failure.installed?.length).toBeGreaterThan(0);

    const manifest = JSON.parse(
      readFileSync(resolve(target, ".balsa/installed.json"), "utf8"),
    ) as { components: Record<string, unknown> };
    // Manifest keys are fully qualified references, so two registries can
    // publish the same component name without overwriting each other.
    expect(Object.keys(manifest.components)).toEqual(
      expect.arrayContaining(failure.installed ?? []),
    );
    expect(readFileSync(resolve(target, "src/components/ui/Table.vue"), "utf8")).toBe(
      "customized\n",
    );
  });

  it("reports dependency installation as its own completed phase", () => {
    createConsumer();
    const result = runCli(["add", "charts", "--cwd", target]);

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("Component source installed:");
    expect(result.stdout).toContain("Stylesheet configured: src/index.css");
    expect(result.stdout).toMatch(/npm dependencies installed with npm: .*@unovis\/vue/);
    expect(result.stdout).not.toContain("npm dependencies unresolved");
  });

  it("maps --implementation onto bare names but respects explicit namespaces", () => {
    createConsumer();
    const result = runCli([
      "add", "button", "@balsa/badge", "--implementation", "shadcn", "--cwd", target, "--json",
    ]);

    expect(result.status, result.stderr).toBe(0);
    const output = JSON.parse(result.stdout) as { installed: string[] };
    expect(output.installed).toContain("@shadcn/button");
    expect(output.installed).toContain("@balsa/badge");
  });

  it("views a Balsa item with its classification and upstream equivalent", () => {
    const result = runCli(["view", "modal", "--json"]);

    expect(result.status, result.stderr).toBe(0);
    const view = JSON.parse(result.stdout) as {
      reference: string;
      classification: string;
      upstream: string;
      files: string[];
      install: string;
    };
    expect(view.reference).toBe("@balsa/modal");
    expect(view.classification).toBe("balsa-alternative");
    expect(view.upstream).toBe("@shadcn/dialog");
    expect(view.files).toContain("src/components/ui/Modal.vue");
    expect(view.install).toBe("npx balsa-ui@latest add modal");
  });

  it("applies a theme preset and wires it into the stylesheet", () => {
    createConsumer();
    const result = runCli(["theme", "apply", "brutalism", "--cwd", target, "--json"]);

    expect(result.status, result.stderr).toBe(0);
    const applied = JSON.parse(result.stdout) as { theme: string; activate: string; module: string };
    expect(applied.theme).toBe("brutalism");
    expect(applied.activate).toBe('<html data-theme="brutalism">');

    // Creating the module is not enough; nothing reads a theme the stylesheet
    // never imports.
    const css = readFileSync(resolve(target, "src/index.css"), "utf8");
    expect(css).toContain('@import "./styles/balsa-theme.css";');
    expect(existsSync(resolve(target, applied.module))).toBe(true);
  });

  it("names the available presets when an unknown theme is applied", () => {
    createConsumer();
    const result = runCli(["theme", "apply", "not-a-theme", "--cwd", target]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("modern-flat");
    expect(result.stderr).toContain("glassmorphism");
  });

  it("wires generated design-system stylesheets into the CSS entry point", () => {
    createConsumer();
    const payload = Buffer.from(JSON.stringify({
      schemaVersion: 1,
      palette: {
        schemaVersion: 1,
        base: "light",
        colors: {
          background: "#ffffff",
          foreground: "#111111",
          surface: "#fafafa",
          muted: "#f0f0f0",
          primary: "#2563eb",
          secondary: "#7c3aed",
          accent: "#0ea5e9",
        },
      },
      theme: { schemaVersion: 1, base: "modern-flat" },
    })).toString("base64url");

    const result = runCli(["design-system", "create", "my-ds", "--config", payload, "--cwd", target]);
    expect(result.status, result.stderr).toBe(0);

    const css = readFileSync(resolve(target, "src/index.css"), "utf8");
    expect(css).toContain('@import "tailwindcss";');
    expect(css).toContain('@import "./styles/balsa-foundation.css";');
    expect(css).toContain('@import "./styles/balsa-theme.css";');
    expect(css).toContain('@import "./styles/my-ds-palette.css";');
    // The generated palette must win over the defaults it extends.
    expect(css.indexOf("my-ds-palette.css")).toBeGreaterThan(css.indexOf("balsa-theme.css"));
  });
});
