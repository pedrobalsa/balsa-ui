import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { itemPath } from "../scripts/registry-lib.mjs";
import {
  adapterBridge,
  chartBridge,
  colorBridge,
  createBridgeStylesheet,
  createIntegrationManifest,
  extendedDimensions,
  sidebarBridge,
} from "../scripts/theme-bridge.mjs";

const foundation = readFileSync(itemPath("src/styles/balsa-foundation.css"), "utf8");
const theme = readFileSync(itemPath("src/styles/balsa-theme.css"), "utf8");
const bridge = readFileSync(itemPath("src/styles/balsa-shadcn-bridge.css"), "utf8");

/**
 * The semantic variables an upstream shadcn component styles itself from. A
 * component using one Balsa does not define falls back to shadcn's own default
 * and visibly ignores the active palette.
 */
const standardTokens = [
  "background", "foreground",
  "card", "card-foreground",
  "popover", "popover-foreground",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "muted", "muted-foreground",
  "accent", "accent-foreground",
  "destructive", "destructive-foreground",
  "border", "input", "ring",
];

describe("shadcn token bridge", () => {
  it("maps every standard semantic variable", () => {
    for (const token of standardTokens) {
      expect(colorBridge, token).toHaveProperty(token);
    }
  });

  it("only targets Balsa tokens that actually exist", () => {
    const declared = new Set(
      [...`${foundation}${theme}`.matchAll(/--(?:color|radius)-balsa-[a-z0-9-]+/g)].map((match) => match[0]),
    );
    const targets = [
      ...Object.values(colorBridge),
      ...Object.values(chartBridge),
      ...Object.values(sidebarBridge),
    ];
    for (const target of targets) {
      expect(declared, `${target} is not defined by the Balsa foundation or theme`).toContain(target);
    }
  });

  it("targets the Tailwind namespace so material and palette layering survive", () => {
    // --color-balsa-primary resolves material -> palette -> fallback. The raw
    // --balsa-color-primary skips the material override.
    for (const target of Object.values(colorBridge)) {
      expect(target.startsWith("--color-balsa-")).toBe(true);
    }
  });

  it("emits both the variables and their Tailwind mappings", () => {
    const stylesheet = createBridgeStylesheet();
    for (const token of standardTokens) {
      expect(stylesheet, token).toContain(`--${token}: var(`);
      expect(stylesheet, token).toContain(`--color-${token}: var(--${token});`);
    }
    expect(stylesheet).toContain("--radius: var(--balsa-radius-surface);");
  });

  it("keeps the generated stylesheet in step with the mapping", () => {
    expect(bridge).toBe(createBridgeStylesheet());
  });

  it("publishes extended dimensions the standard surface has no variable for", () => {
    const declared = `${foundation}${theme}`;
    for (const tokens of Object.values(extendedDimensions)) {
      for (const token of tokens) {
        expect(declared, `${token} is not defined`).toContain(token);
      }
    }
  });

  it("states what the bridge does not reach, with the reason", () => {
    const manifest = createIntegrationManifest({});
    expect(manifest.integration.strategy).toBe("token-bridge");
    expect(manifest.integration.alwaysApplied.selector).toBe(":root");
    expect(manifest.integration.optIn.selector).toBe("[data-balsa-adapt]");
    expect(manifest.integration.portals.length).toBeGreaterThan(0);
    expect(manifest.integration.scopedThemes.length).toBeGreaterThan(0);

    // A reason, not just a name, so a later adapter does not "fix" one of these
    // with a mapping that breaks upstream layout.
    for (const dimension of ["density", "typographyScale", "borderWidth", "elevation"]) {
      expect(manifest.integration.doesNotReach, dimension).toHaveProperty(dimension);
      expect(manifest.integration.doesNotReach[dimension].length).toBeGreaterThan(40);
    }
  });

  it("keeps density out of the adapter, because Balsa density is not a grid unit", () => {
    // Tailwind spends heights as calc(var(--spacing) * n). Balsa's density
    // tokens are absolute gaps, so mapping them onto --spacing would render a
    // comfortable h-9 at 6.75rem instead of 2.25rem.
    expect(Object.keys(adapterBridge)).not.toContain("spacing");
    expect(createBridgeStylesheet()).not.toMatch(/^\s*--spacing:/m);
  });

  it("scopes the Tailwind theme overrides instead of applying them at the root", () => {
    const stylesheet = createBridgeStylesheet();
    const scope = /\[data-balsa-adapt\]\s*\{([^}]*)\}/.exec(stylesheet);
    expect(scope, "the opt-in scope block is missing").not.toBeNull();

    // Every Balsa-sourced Tailwind override must live in the opt-in scope, or it
    // would silently restyle the consumer's own markup.
    for (const [token, sourceToken] of Object.entries(adapterBridge)) {
      expect(scope?.[1], token).toContain(`--${token}: var(${sourceToken});`);
    }

    // Each Tailwind-namespace mapping appears exactly once, so none of them is
    // also emitted at the root where it would escape the opt-in.
    for (const [token, sourceToken] of Object.entries(adapterBridge)) {
      const declaration = `--${token}: var(${sourceToken});`;
      expect(stylesheet.split(declaration).length - 1, token).toBe(1);
    }
  });
});
