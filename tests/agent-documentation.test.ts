import { describe, expect, it } from "vitest";
import {
  formatComponentMarkdown,
  loadCatalog,
  loadComponentSpec,
  suggestItemNames,
  unknownItemError,
} from "../scripts/agent-context.mjs";

interface CatalogItem {
  name: string;
  title: string;
  category: string;
  description: string;
}

interface Catalog {
  items: CatalogItem[];
}

const catalog = (await loadCatalog()) as Catalog;

const requiredSections = [
  "## Use for",
  "## Avoid for",
  "## Accessibility",
  "## Public API",
  "## Tokens",
  "## Examples",
  "## Common mistakes",
];

describe("agent documentation generation", () => {
  it("covers the complete catalog", () => {
    expect(catalog.items.length).toBeGreaterThan(0);
  });

  it.each(catalog.items.map((item) => [item.name, item] as const))(
    "renders complete Markdown for %s",
    async (name, item) => {
      const spec = await loadComponentSpec(item);
      const markdown = formatComponentMarkdown(item, spec);

      expect(markdown.startsWith("# ")).toBe(true);
      expect(markdown).toContain(`npx balsa-ui@latest add ${name}`);
      for (const section of requiredSections) {
        expect(markdown, `${name} is missing ${section}`).toContain(section);
      }
      for (const section of ["### Props", "### Events", "### Slots"]) {
        expect(markdown, `${name} is missing ${section}`).toContain(section);
      }
      // A TypeScript union may legitimately mention undefined; a bare rendered
      // value never should.
      expect(markdown, `${name} rendered an undefined value`).not.toMatch(
        /: undefined$/m,
      );
      expect(markdown).not.toMatch(/^- undefined$/m);
    },
  );

  it("produces valid empty sections when contract information is unavailable", () => {
    const item = { name: "ghost", title: "Ghost", category: "component", description: "" };
    const markdown = formatComponentMarkdown(item, { title: "Ghost", purpose: "Nothing." });

    for (const section of requiredSections) {
      expect(markdown).toContain(section);
    }
    expect(markdown).toContain("No props.");
    expect(markdown).toContain("Not documented in this specification.");
    expect(markdown).not.toMatch(/: undefined$/m);
  });

  it("still renders a hand-written contract from an older specification", () => {
    const item = { name: "ghost", title: "Ghost", category: "component", description: "" };
    const markdown = formatComponentMarkdown(item, {
      publicApi: { props: ["size", "color"], events: ["click"], slots: [] },
    });

    expect(markdown).toContain("- Props: size, color");
    expect(markdown).toContain("- Events: click");
    expect(markdown).toContain("- Slots: None");
  });

  it("enumerates a closed union so an invalid value is visibly absent", async () => {
    const badge = catalog.items.find((item) => item.name === "badge");
    const spec = (await loadComponentSpec(badge)) as {
      publicApi: { props: Array<{ name: string; values?: string[] }> };
    };
    const color = spec.publicApi.props.find((prop) => prop.name === "color");

    expect(color?.values).toContain("accent");
    // Balsa's SemanticColor excludes neutral; an agent must be able to see that.
    expect(color?.values).not.toContain("neutral");
    expect(formatComponentMarkdown(badge, spec)).toContain("one of:");
  });

  it("falls back to catalog identity when a specification is unusable", () => {
    const item = { name: "ghost", title: "Ghost", category: "component", description: "A fallback." };

    expect(formatComponentMarkdown(item, undefined)).toContain("# Ghost");
    expect(formatComponentMarkdown(item, undefined)).toContain("A fallback.");
  });

  it("explains unknown item names instead of failing opaquely", () => {
    expect(suggestItemNames(catalog, "tabel")).toContain("table");
    expect(unknownItemError(catalog, "tabel").message).toContain("Did you mean");
    expect(unknownItemError(catalog, "zzzzzzzzzz").message).toContain("balsa search");
  });

  it("reports a missing specification by name and expected path", async () => {
    await expect(loadComponentSpec({ name: "not-a-balsa-item" })).rejects.toThrow(
      /specs\/components\/not-a-balsa-item\.json/,
    );
  });
});
