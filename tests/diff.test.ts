import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { diffInstalled, diffStateSummary } from "../scripts/diff-installed.mjs";
import { hashContent } from "../scripts/install-registry.mjs";

/**
 * An update is only safe if it can tell three states apart: what the install
 * wrote, what is on disk now, and what a fresh install would write today. A
 * two-way diff collapses two of those and cannot answer whether overwriting is
 * safe — which is the only question anyone asks before updating.
 */

const component = "src/components/ui/Icon.vue";
let root: string;
let pristine: string;
let pristineHash: string;

function recordInstall(overrides: Record<string, unknown> = {}) {
  writeFileSync(
    resolve(root, ".balsa/installed.json"),
    JSON.stringify({
      schemaVersion: 2,
      components: {
        "@balsa/icon": {
          registry: "@balsa/icon",
          namespace: "@balsa",
          files: [component],
          installedSourceHash: pristineHash,
          originalSourceHash: pristineHash,
          ...overrides,
        },
      },
    }),
    "utf8",
  );
}

const stateOf = async () => (await diffInstalled(root))[0]?.state;

beforeEach(() => {
  root = mkdtempSync(resolve(tmpdir(), "balsa-diff-"));
  mkdirSync(resolve(root, "src/components/ui"), { recursive: true });
  mkdirSync(resolve(root, ".balsa"), { recursive: true });
  writeFileSync(resolve(root, "components.json"), JSON.stringify({ style: "new-york", aliases: {} }), "utf8");
  cpSync(resolve(process.cwd(), component), resolve(root, component));
  pristine = readFileSync(resolve(root, component), "utf8");
  pristineHash = hashContent([pristine]);
  recordInstall();
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("three-way diff", () => {
  it("reports nothing when neither side has moved", async () => {
    expect(await stateOf()).toBe("unchanged");
  });

  it("reports a local edit, which an update would overwrite", async () => {
    writeFileSync(resolve(root, component), `${pristine}\n/* edited */\n`, "utf8");
    expect(await stateOf()).toBe("local");
    expect(diffStateSummary.local).toContain("overwrite");
  });

  it("reports an upstream change to an untouched file as safe to update", async () => {
    // The install originally wrote something else, so what `add` produces today
    // differs from what is recorded.
    recordInstall({ originalSourceHash: `sha256-${"0".repeat(64)}` });
    expect(await stateOf()).toBe("upstream");
  });

  /**
   * The case a two-way diff cannot see, and the only one that needs a person:
   * the local change and the upstream change both exist and no automatic merge
   * knows why the local one was made.
   */
  it("reports divergence when both sides moved", async () => {
    recordInstall({ originalSourceHash: `sha256-${"0".repeat(64)}` });
    writeFileSync(resolve(root, component), `${pristine}\n/* edited */\n`, "utf8");
    expect(await stateOf()).toBe("diverged");
  });

  it("reports a recorded file that is gone", async () => {
    rmSync(resolve(root, component));
    expect(await stateOf()).toBe("missing");
  });

  it("reports nothing at all when no install exists", async () => {
    rmSync(resolve(root, ".balsa/installed.json"));
    expect(await diffInstalled(root)).toEqual([]);
  });

  it("narrows to the items asked for", async () => {
    expect(await diffInstalled(root, { names: ["icon"] })).toHaveLength(1);
    expect(await diffInstalled(root, { names: ["button"] })).toHaveLength(0);
  });
});

/**
 * `update` is only worth having if it declines, so declining is what these
 * cover. A run against an untouched project proves nothing.
 */
describe("update", () => {
  const runUpdate = (args: readonly string[]) =>
    spawnSync(process.execPath, ["bin/balsa.mjs", "update", "--cwd", root, ...args], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

  const localEdit = "/* my own change */";
  const editLocally = () =>
    writeFileSync(resolve(root, component), `${pristine}\n${localEdit}\n`, "utf8");
  const editSurvives = () =>
    readFileSync(resolve(root, component), "utf8").includes(localEdit);

  it("keeps a local edit when upstream has not moved", () => {
    editLocally();
    const result = runUpdate([]);
    expect(result.status, result.stderr).toBe(0);
    expect(editSurvives(), "update overwrote a local edit").toBe(true);
    expect(result.stdout).toContain("--force");
  });

  it("keeps a local edit even when upstream has moved", () => {
    recordInstall({ originalSourceHash: `sha256-${"0".repeat(64)}` });
    editLocally();
    const result = runUpdate([]);
    expect(result.status, result.stderr).toBe(0);
    expect(editSurvives(), "update resolved a divergence on its own").toBe(true);
  });

  it("overwrites only when explicitly forced", () => {
    recordInstall({ originalSourceHash: `sha256-${"0".repeat(64)}` });
    editLocally();
    const result = runUpdate(["--force"]);
    expect(result.status, result.stderr).toBe(0);
    expect(editSurvives()).toBe(false);
  });

  it("takes an upstream change to an untouched file without being asked", () => {
    recordInstall({ originalSourceHash: `sha256-${"0".repeat(64)}` });
    const result = runUpdate([]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("updated");
  });
});
