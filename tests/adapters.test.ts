import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applyAdapter, hashContent, listAdapters } from "../scripts/apply-adapters.mjs";

const schema = JSON.parse(
  readFileSync(resolve(process.cwd(), "specs/adapter.schema.json"), "utf8"),
);
const validate = new Ajv2020({ allErrors: true }).compile(schema);
const adapters = await listAdapters();

/** An upstream item shaped like a resolved registry item. */
function upstreamItem(content: string, filePath = "ui/button/index.ts") {
  return {
    name: "button",
    namespace: "@shadcn",
    reference: "@shadcn/button",
    files: [{ path: filePath, target: "src/components/ui/button/index.ts", content }],
  };
}

function adapterFor(content: string, patches: unknown[] = []) {
  return {
    schemaVersion: 1,
    item: "@shadcn/button",
    status: "integrated-with-patch",
    upstream: { version: null, files: { "ui/button/index.ts": hashContent(content) } },
    dimensions: {},
    patches,
  };
}

describe("theme adapters", () => {
  it("publishes at least one adapter and validates every one", () => {
    expect(adapters.length).toBeGreaterThan(0);
    for (const adapter of adapters) {
      const valid = validate(adapter);
      expect(valid, `${adapter.item}: ${JSON.stringify(validate.errors)}`).toBe(true);
    }
  });

  it("records a hash for every file it patches", () => {
    for (const adapter of adapters) {
      for (const patch of adapter.patches ?? []) {
        expect(adapter.upstream.files, `${adapter.item} patches ${patch.file}`)
          .toHaveProperty(patch.file);
      }
    }
  });

  it("gives every patch a stated reason", () => {
    for (const adapter of adapters) {
      for (const patch of adapter.patches ?? []) {
        expect(patch.reason.length, `${adapter.item} ${patch.file}`).toBeGreaterThan(20);
      }
    }
  });

  it("applies a patch when the source matches", () => {
    const content = 'const x = "bg-primary shadow hover:bg-primary/90";\n';
    const result = applyAdapter(
      upstreamItem(content),
      adapterFor(content, [{
        file: "ui/button/index.ts",
        find: '"bg-primary shadow hover:bg-primary/90"',
        replace: '"bg-primary shadow-[var(--balsa-shadow-control)] hover:bg-primary/90"',
        reason: "Shadow utilities compile to literal offsets and cannot read a variable.",
      }]),
    );

    expect(result.applied).toBe(true);
    expect(result.status).toBe("integrated-with-patch");
    expect(result.item.files[0].content).toContain("--balsa-shadow-control");
  });

  // The dangerous case: a patch written against source that has since changed
  // either fails to apply or applies to the wrong place.
  it("degrades to unpatched when upstream source has changed", () => {
    const original = 'const x = "bg-primary shadow";\n';
    const changed = 'const x = "bg-primary shadow-md";\n';
    const result = applyAdapter(
      upstreamItem(changed),
      adapterFor(original, [{
        file: "ui/button/index.ts",
        find: '"bg-primary shadow"',
        replace: '"bg-primary shadow-[var(--balsa-shadow-control)]"',
        reason: "Shadow utilities compile to literal offsets and cannot read a variable.",
      }]),
    );

    expect(result.applied).toBe(false);
    expect(result.status).toBe("compatible");
    expect(result.conflict?.reason).toBe("upstream-changed");
    expect(result.item.files[0].content).toBe(changed);
  });

  it("refuses an ambiguous match rather than patching the wrong occurrence", () => {
    const content = 'const a = "shadow";\nconst b = "shadow";\n';
    const result = applyAdapter(
      upstreamItem(content),
      adapterFor(content, [{
        file: "ui/button/index.ts",
        find: '"shadow"',
        replace: '"shadow-[var(--balsa-shadow-control)]"',
        reason: "Shadow utilities compile to literal offsets and cannot read a variable.",
      }]),
    );

    expect(result.applied).toBe(false);
    expect(result.conflict?.reason).toBe("ambiguous-match");
    expect(result.item.files[0].content).toBe(content);
  });

  it("leaves an item untouched when no adapter exists", () => {
    const content = 'const x = "bg-primary";\n';
    const result = applyAdapter(upstreamItem(content), undefined);

    expect(result.applied).toBe(false);
    expect(result.status).toBe("compatible");
    expect(result.item.files[0].content).toBe(content);
  });

  it("only changes styling, never API or behavior", () => {
    // A styling-only patch may not introduce identifiers, props or handlers.
    // Tailwind arbitrary values legitimately contain selector syntax --
    // `[&:has([role=checkbox])]:pe-0` is a class, not markup -- so they are
    // stripped before the check rather than tripping it.
    // `aria-` is matched only in its attribute form. `aria-disabled:opacity-50`
    // is a Tailwind variant selecting on state, not an attribute the patch
    // adds, and a bare `aria-` fails any styling patch that happens to touch a
    // literal containing one.
    const behavioral = /\b(defineProps|defineEmits|defineExpose|addEventListener|role=|tabindex|@click|v-if|v-for)\b|\baria-[a-z-]+\s*=/;
    const withoutArbitraryValues = (value: string) => value.replace(/\[[^\]]*\]/g, "");

    for (const adapter of adapters) {
      for (const patch of adapter.patches ?? []) {
        expect(
          withoutArbitraryValues(patch.replace),
          `${adapter.item} ${patch.file}`,
        ).not.toMatch(behavioral);

        // Nothing may be dropped: a styling patch rewrites or adds tokens.
        const before = patch.find.slice(1, -1).trim().split(/\s+/);
        const after = patch.replace.slice(1, -1).trim().split(/\s+/);
        expect(after.length, `${adapter.item} ${patch.file}`).toBeGreaterThanOrEqual(before.length);

        // Both sides must be complete string literals, in the same quote style.
        // Rewriting the quote character is a gratuitous edit and breaks outright
        // if the class list contains that quote.
        const quote = patch.find[0];
        expect(["'", '"'], `${adapter.item} ${patch.file}`).toContain(quote);
        expect(patch.find.endsWith(quote)).toBe(true);
        expect(patch.replace.startsWith(quote), `${adapter.item} ${patch.file}`).toBe(true);
        expect(patch.replace.endsWith(quote)).toBe(true);

        // A styling patch changes classes, so the token count may grow but the
        // literal must stay a single class list.
        expect(patch.replace.slice(1, -1)).not.toContain(quote);
      }
    }
  });
});
