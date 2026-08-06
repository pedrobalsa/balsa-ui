import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  aliasToDirectory,
  builtinRegistries,
  createResolver,
  findTargetCollisions,
  loadProjectConfiguration,
  parseItemReference,
  registryUrl,
  resolveFileTarget,
} from "../scripts/registry-resolve.mjs";

const configuration = {
  style: "new-york",
  aliases: { ui: "@/components/ui", components: "@/components", lib: "@/lib", hooks: "@/composables" },
  registries: { ...builtinRegistries, "@acme": "https://acme.test/r/{name}.json" },
};

/** A registry that answers from memory, so resolution is testable offline. */
function fakeRegistry(items: Record<string, unknown>) {
  return async (url: string) => {
    const item = items[url];
    if (!item) throw new Error(`${url} responded 404.`);
    return item;
  };
}

describe("registry references", () => {
  it("defaults a bare name to the Balsa namespace", () => {
    expect(parseItemReference("button")).toEqual({
      namespace: "@balsa",
      name: "button",
      explicit: false,
    });
  });

  it("parses an explicit namespace", () => {
    expect(parseItemReference("@shadcn/button")).toEqual({
      namespace: "@shadcn",
      name: "button",
      explicit: true,
    });
  });

  it("rejects a malformed namespace instead of guessing", () => {
    expect(() => parseItemReference("@shadcn")).toThrow(/@namespace\/name/);
  });

  it("names the known registries when one is not configured", () => {
    expect(() => registryUrl(configuration, "@nope", "button")).toThrow(/@balsa, @shadcn, @acme/);
  });

  it("expands style-scoped and flat registry templates", () => {
    expect(registryUrl(configuration, "@shadcn", "button")).toBe(
      "https://shadcn-vue.com/r/styles/new-york/button.json",
    );
    expect(registryUrl(configuration, "@acme", "button")).toBe("https://acme.test/r/button.json");
  });
});

describe("file targets", () => {
  it("maps module aliases to directories", () => {
    expect(aliasToDirectory("@/components/ui")).toBe("src/components/ui");
    expect(aliasToDirectory("~/components/ui")).toBe("components/ui");
    expect(aliasToDirectory("src/components/ui")).toBe("src/components/ui");
  });

  it("derives a target for an upstream item that publishes none", () => {
    const target = resolveFileTarget(
      configuration,
      { type: "registry:ui" },
      { path: "ui/button/Button.vue", type: "registry:ui", target: "" },
    );
    expect(target).toBe("src/components/ui/button/Button.vue");
  });

  it("uses an explicit target verbatim", () => {
    const target = resolveFileTarget(
      configuration,
      { type: "registry:ui" },
      { path: "src/components/ui/Button.vue", target: "src/components/ui/Button.vue" },
    );
    expect(target).toBe("src/components/ui/Button.vue");
  });
});

describe("cross-registry resolution", () => {
  const items = {
    "https://acme.test/r/card.json": {
      name: "card",
      type: "registry:ui",
      registryDependencies: ["surface"],
      files: [{ path: "ui/card/Card.vue", type: "registry:ui", target: "", content: "card" }],
    },
    "https://acme.test/r/surface.json": {
      name: "surface",
      type: "registry:ui",
      registryDependencies: [],
      files: [{ path: "ui/surface/Surface.vue", type: "registry:ui", target: "", content: "surface" }],
    },
  };

  it("resolves a bare dependency against the registry that declared it", async () => {
    const resolver = createResolver({
      configuration,
      local: false,
      fetchItem: fakeRegistry(items),
    });
    const resolved = await resolver.resolve(["@acme/card"]);

    // Dependencies first, and `surface` must not resolve against @balsa.
    expect(resolved.map((item) => item.reference)).toEqual(["@acme/surface", "@acme/card"]);
  });

  it("reports a circular dependency instead of hanging", async () => {
    const resolver = createResolver({
      configuration,
      local: false,
      fetchItem: fakeRegistry({
        "https://acme.test/r/a.json": { name: "a", registryDependencies: ["b"], files: [] },
        "https://acme.test/r/b.json": { name: "b", registryDependencies: ["a"], files: [] },
      }),
    });

    await expect(resolver.resolve(["@acme/a"])).rejects.toThrow(/Circular registry dependency/);
  });

  it("explains an unreachable item by URL", async () => {
    const resolver = createResolver({
      configuration,
      local: false,
      fetchItem: fakeRegistry(items),
    });
    await expect(resolver.resolve(["@acme/missing"])).rejects.toThrow(/404/);
  });
});

describe("target collisions", () => {
  it("does not flag two items shipping identical shared source", () => {
    const shared = { target: "src/components/ui/classes.ts", content: "shared" };
    expect(findTargetCollisions([
      { reference: "@balsa/button", files: [shared] },
      { reference: "@balsa/input", files: [shared] },
    ])).toEqual([]);
  });

  it("flags two registries writing different content to one path", () => {
    const collisions = findTargetCollisions([
      { reference: "@balsa/button", files: [{ target: "src/components/ui/Button.vue", content: "balsa" }] },
      { reference: "@acme/button", files: [{ target: "src/components/ui/Button.vue", content: "acme" }] },
    ]);
    expect(collisions).toHaveLength(1);
    expect(collisions[0].between).toEqual(["@balsa/button", "@acme/button"]);
  });

  it("allows Balsa and shadcn implementations of one component to coexist", () => {
    expect(findTargetCollisions([
      { reference: "@balsa/button", files: [{ target: "src/components/ui/Button.vue", content: "balsa" }] },
      { reference: "@shadcn/button", files: [{ target: "src/components/ui/button/Button.vue", content: "shadcn" }] },
    ])).toEqual([]);
  });
});

describe("catalog audit", () => {
  it("classifies every catalog item and justifies each alternative", async () => {
    const catalog = JSON.parse(
      await readFile(".balsa/catalog.json", "utf8"),
    ) as { items: Array<{ name: string; classification: string; upstream?: { registry: string; name: string } }> };

    const allowed = new Set([
      "upstream-default",
      "balsa-addition",
      "balsa-composition",
      "balsa-alternative",
      "legacy",
      "retire",
    ]);
    for (const item of catalog.items) {
      expect(allowed, `${item.name} has no classification`).toContain(item.classification);
      // An item with no upstream equivalent is an addition, not an alternative.
      if (item.classification === "balsa-alternative") {
        expect(item.upstream, `${item.name} is an alternative to nothing`).toBeDefined();
        expect(item.upstream?.registry).toMatch(/^@/);
      } else {
        expect(item.upstream).toBeUndefined();
      }
    }
  });
});

describe("project configuration", () => {
  it("merges declared registries over the built-in namespaces", async () => {
    const loaded = await loadProjectConfiguration("starters/vue");
    expect(loaded.registries["@balsa"]).toContain("balsa-ui.com");
    expect(loaded.registries["@shadcn"]).toBe(builtinRegistries["@shadcn"]);
    expect(loaded.style).toBe("new-york");
  });
});
