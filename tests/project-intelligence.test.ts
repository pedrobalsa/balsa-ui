import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { inspectInstallation } from "../scripts/project-diagnostics.mjs";

/**
 * The manifest has recorded origin, versions, hashes and adapter status since
 * provenance was added, and none of it was surfaced. These cover the three
 * questions a consumer or an agent actually asks of an existing installation:
 * what is here, what have I changed, and what has Balsa changed since.
 */

const projects: string[] = [];

function project(manifest: unknown): string {
  const root = mkdtempSync(resolve(tmpdir(), "balsa-intel-"));
  projects.push(root);
  mkdirSync(resolve(root, ".balsa"), { recursive: true });
  writeFileSync(resolve(root, ".balsa/installed.json"), JSON.stringify(manifest), "utf8");
  return root;
}

afterEach(() => {
  for (const root of projects.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("installation intelligence", () => {
  it("reports nothing rather than failing when no install exists", async () => {
    const root = mkdtempSync(resolve(tmpdir(), "balsa-empty-"));
    projects.push(root);
    const report = await inspectInstallation(root);
    expect(report.installed).toEqual([]);
    expect(report.designSystemVersion).toBeUndefined();
  });

  it("summarises what is installed, with its namespace and adapter status", async () => {
    const root = project({
      schemaVersion: 2,
      components: {
        "@balsa/button": {
          registry: "@balsa/button",
          namespace: "@balsa",
          installedVersion: "0.1.0",
          designSystemVersion: "0.4.0",
          files: ["src/components/ui/Button.vue"],
        },
        "@shadcn/field": {
          registry: "@shadcn/field",
          namespace: "@shadcn",
          installedVersion: "unversioned",
          adapterStatus: "integrated-with-patch",
          files: ["src/components/upstream/field/Field.vue"],
        },
      },
    });

    const report = await inspectInstallation(root);
    expect(report.installed).toHaveLength(2);
    expect(report.designSystemVersion).toBe("0.4.0");
    expect(report.installed.find((e) => e.registry === "@shadcn/field")?.adapterStatus)
      .toBe("integrated-with-patch");
  });

  /**
   * An adapter that has moved on is not the same as a locally modified file:
   * one is Balsa's adaptation changing under source the user never touched, the
   * other is the user's own work. Reporting them together would make the safe
   * action ambiguous.
   */
  it("reports an adapter whose status moved since the install", async () => {
    const root = project({
      schemaVersion: 2,
      components: {
        "@shadcn/field": {
          registry: "@shadcn/field",
          namespace: "@shadcn",
          adapterStatus: "integrated",
          files: [],
        },
      },
    });

    const report = await inspectInstallation(root, {
      loadAdapter: async () => ({ status: "integrated-with-patch" }),
    });
    expect(report.outdatedAdapters).toEqual([
      { registry: "@shadcn/field", installedWith: "integrated", available: "integrated-with-patch" },
    ]);
  });

  it("stays quiet when the adapter still matches", async () => {
    const root = project({
      schemaVersion: 2,
      components: {
        "@shadcn/field": { registry: "@shadcn/field", namespace: "@shadcn", adapterStatus: "integrated", files: [] },
      },
    });
    const report = await inspectInstallation(root, {
      loadAdapter: async () => ({ status: "integrated" }),
    });
    expect(report.outdatedAdapters).toEqual([]);
  });

  it("never reports a Balsa item as having an outdated adapter", async () => {
    const root = project({
      schemaVersion: 2,
      components: {
        "@balsa/button": { registry: "@balsa/button", namespace: "@balsa", adapterStatus: "integrated", files: [] },
      },
    });
    // Balsa's own components are not adapted; an adapter lookup for one would
    // be answering a question that does not apply.
    const report = await inspectInstallation(root, {
      loadAdapter: async () => ({ status: "integrated-with-patch" }),
    });
    expect(report.outdatedAdapters).toEqual([]);
  });

  it("passes local modifications through from the detector", async () => {
    const root = project({ schemaVersion: 2, components: {} });
    const report = await inspectInstallation(root, {
      detectLocalModifications: async () => [
        { reference: "@balsa/card", registry: "@balsa/card", state: "modified" },
      ],
    });
    expect(report.modified).toHaveLength(1);
    expect(report.modified[0].state).toBe("modified");
  });
});
