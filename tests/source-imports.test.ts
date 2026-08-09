import { describe, expect, it } from "vitest";
import { applyAdapter, hashContent } from "../scripts/apply-adapters.mjs";
import { requiredNpmDependencies } from "../scripts/agent-context.mjs";
import {
  importedPackages,
  moduleSpecifiers,
  packageForSpecifier,
  rewriteItemImports,
  rewriteRegistryImports,
  rewriteRenamedPackages,
} from "../scripts/source-imports.mjs";

/**
 * These cover the two ways `balsa add` produced a project that installed and
 * would not compile: a sibling import left pointing at shadcn's own repository
 * layout, and a dependency the source imports but the registry never declared.
 */

const configuration = {
  aliases: {
    ui: "@/components/upstream",
    components: "@/components",
    lib: "@/lib",
    hooks: "@/composables",
  },
};

describe("module specifiers", () => {
  it("reads every import form, not only the common one", () => {
    const source = [
      'import { cn } from "@/lib/utils"',
      'import type { VariantProps } from "class-variance-authority"',
      'export * from "./Field.vue"',
      'import "vue-sonner/style.css"',
      'const mod = await import("embla-carousel-vue")',
    ].join("\n");

    expect(moduleSpecifiers(source)).toEqual([
      "@/lib/utils",
      "class-variance-authority",
      "./Field.vue",
      "vue-sonner/style.css",
      "embla-carousel-vue",
    ]);
  });

  it("counts only specifiers that need a package installed", () => {
    expect(packageForSpecifier("reka-ui")).toBe("reka-ui");
    expect(packageForSpecifier("@vueuse/core")).toBe("@vueuse/core");
    expect(packageForSpecifier("vue-sonner/style.css")).toBe("vue-sonner");
    expect(packageForSpecifier("@/lib/utils")).toBeUndefined();
    expect(packageForSpecifier("./Field.vue")).toBeUndefined();
    expect(packageForSpecifier("node:path")).toBeUndefined();
  });
});

describe("sibling import rewriting", () => {
  it("points a registry import at the alias the file was installed under", () => {
    const source = 'import { Label } from "@/registry/new-york/ui/label"';
    expect(rewriteRegistryImports(source, configuration))
      .toBe('import { Label } from "@/components/upstream/label"');
  });

  it("rewrites any style, not only the one this project configures", () => {
    const source = 'import { Button } from "@/registry/default/ui/button"';
    expect(rewriteRegistryImports(source, configuration))
      .toContain('"@/components/upstream/button"');
  });

  it("preserves the quote character and a nested path", () => {
    const source = "import x from '@/registry/new-york/ui/chart/utils'";
    expect(rewriteRegistryImports(source, configuration))
      .toBe("import x from '@/components/upstream/chart/utils'");
  });

  // A wrong component is far harder to notice than a missing one, so a
  // directory with no alias must fail loudly rather than resolve to a guess.
  it("leaves a directory it has no alias for alone", () => {
    const source = 'import x from "@/registry/new-york/blocks/dashboard"';
    expect(rewriteRegistryImports(source, configuration)).toBe(source);
  });

  it("leaves an already-correct alias import untouched", () => {
    const source = 'import { cn } from "@/lib/utils"';
    expect(rewriteRegistryImports(source, configuration)).toBe(source);
  });
});

/**
 * Only a rename belongs in this map — the same library under its current name.
 * `lucide-vue-next` was renamed `@lucide/vue` after Lucide v1 and deprecated,
 * with the migration documented as a find-and-replace. Without the rewrite an
 * install pulls a deprecated duplicate of an icon package the project already
 * depends on, and 22 upstream items do it.
 */
describe("renamed packages", () => {
  it("rewrites the deprecated icon package to its current name", () => {
    expect(rewriteRenamedPackages('import { Minus } from "lucide-vue-next"'))
      .toBe('import { Minus } from "@lucide/vue"');
  });

  it("keeps a subpath", () => {
    expect(rewriteRenamedPackages('import x from "lucide-vue-next/icons/plus"'))
      .toBe('import x from "@lucide/vue/icons/plus"');
  });

  it("leaves a package whose name merely starts the same", () => {
    const source = 'import x from "lucide-vue-next-extras"';
    expect(rewriteRenamedPackages(source)).toBe(source);
  });

  it("reports the current name as the dependency", () => {
    const item = {
      dependencies: ["lucide-vue-next"],
      files: [{ content: 'import { X } from "lucide-vue-next"' }],
    };
    const rewritten = rewriteItemImports(item, configuration);
    // The declared name is upstream's and stays in `dependencies`; what the
    // files import is what a consumer actually has to install.
    expect(importedPackages(rewritten.files)).toEqual(["@lucide/vue"]);
  });
});

describe("required npm dependencies", () => {
  it("reports a package the source imports but the registry never declared", () => {
    const item = {
      dependencies: [],
      files: [{ content: 'import { cva } from "class-variance-authority"' }],
    };
    expect(requiredNpmDependencies([item])).toEqual(["class-variance-authority"]);
  });

  it("keeps a declared dependency the source does not visibly import", () => {
    const item = { dependencies: ["reka-ui"], files: [{ content: "const x = 1" }] };
    expect(requiredNpmDependencies([item])).toEqual(["reka-ui"]);
  });

  it("unions the two without duplicating", () => {
    const item = {
      dependencies: ["reka-ui"],
      files: [{ content: 'import { Primitive } from "reka-ui"\nimport "vue"' }],
    };
    expect(requiredNpmDependencies([item])).toEqual(["reka-ui", "vue"]);
  });

  it("ignores a file whose content was never loaded", () => {
    const item = { dependencies: ["reka-ui"], files: [{ path: "ui/x.vue" }] };
    expect(() => requiredNpmDependencies([item])).not.toThrow();
    expect(requiredNpmDependencies([item])).toEqual(["reka-ui"]);
  });

  it("collects across every file of every item", () => {
    expect(importedPackages([
      { content: 'import "reka-ui"' },
      { content: 'import "@vueuse/core"' },
    ])).toEqual(["@vueuse/core", "reka-ui"]);
  });
});

/**
 * The ordering constraint, asserted rather than assumed. An adapter refuses to
 * apply when the source no longer hashes to what it was written against, so
 * rewriting before the patches would drift every hash at once and silently
 * downgrade every adapter to unpatched -- the exact failure the hash check
 * exists to catch.
 */
describe("rewrite ordering against adapter hashes", () => {
  const upstream = 'import { Label } from "@/registry/new-york/ui/label"\nconst x = "shadow"\n';

  function itemWith(content: string) {
    return {
      name: "field",
      namespace: "@shadcn",
      reference: "@shadcn/field",
      files: [{ path: "ui/field/Field.vue", target: "src/components/upstream/field/Field.vue", content }],
    };
  }

  const adapter = {
    schemaVersion: 1,
    item: "@shadcn/field",
    status: "integrated-with-patch",
    upstream: { version: null, files: { "ui/field/Field.vue": hashContent(upstream) } },
    dimensions: {},
    patches: [{
      file: "ui/field/Field.vue",
      find: '"shadow"',
      replace: '"shadow-[var(--balsa-shadow-control)]"',
      reason: "Shadow utilities compile to literal offsets and cannot read a variable.",
    }],
  };

  it("applies the patch and then rewrites, keeping both", () => {
    const patched = applyAdapter(itemWith(upstream), adapter);
    expect(patched.applied).toBe(true);

    const rewritten = rewriteItemImports(patched.item, configuration);
    const content = rewritten.files[0].content;
    expect(content).toContain("--balsa-shadow-control");
    expect(content).toContain('"@/components/upstream/label"');
    expect(content).not.toContain("@/registry/");
  });

  it("would downgrade the adapter if the rewrite ran first", () => {
    const rewrittenFirst = rewriteItemImports(itemWith(upstream), configuration);
    const result = applyAdapter(rewrittenFirst, adapter);

    expect(result.applied).toBe(false);
    expect(result.conflict?.reason).toBe("upstream-changed");
  });
});
