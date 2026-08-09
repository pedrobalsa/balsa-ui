/**
 * Visual conformance, measured in a real browser.
 *
 * Static analysis proves a component no longer contains a hardcoded literal.
 * It cannot prove the design system actually reaches the rendered pixel: a
 * token could be mapped to a variable nothing reads, or shadowed by a later
 * rule, and the source would still look correct.
 *
 * The test here is therefore differential rather than absolute. Rather than
 * asserting a component renders a particular radius -- which would only prove
 * the default value -- it changes a Balsa token and asserts the computed style
 * changes with it. A component whose rendering is unaffected by the design
 * system is not integrated, whatever its adapter claims.
 *
 * Needs a browser, so this is not part of `npm run check`.
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { chromium } from "playwright";
import { applyAdapter, loadAdapter } from "./apply-adapters.mjs";
import { createResolver, loadProjectConfiguration } from "./registry-resolve.mjs";
import { rootDir } from "./registry-lib.mjs";
import { stringLiterals } from "./source-literals.mjs";

const workDir = path.join(rootDir, "node_modules", ".tmp", "conformance");

/**
 * The dimensions a token bridge or patch claims to carry, each with the Balsa
 * token that drives it and a probe value far from any default so a change is
 * unambiguous.
 */
const dimensionProbes = [
  {
    dimension: "radius",
    tokens: ["--balsa-radius-badge", "--balsa-radius-control", "--balsa-radius-surface", "--balsa-radius-panel"],
    probe: "13px",
    property: "borderRadius",
    scope: "adapt",
    // A component that never rounds a corner cannot respond to a radius token,
    // and reporting that as a failure would be a false alarm rather than a
    // finding. Each probe therefore declares what makes it applicable.
    uses: /(?:^|\s)rounded(?:-|\s|$)/,
  },
  {
    dimension: "border",
    tokens: ["--balsa-outline-border-width", "--balsa-border-width", "--balsa-solid-border-width"],
    probe: "7px",
    property: "borderTopWidth",
    scope: "root",
    uses: /balsa-outline-border-width/,
  },
  {
    dimension: "elevation",
    tokens: ["--balsa-shadow-control", "--balsa-shadow-sm", "--balsa-shadow-md", "--balsa-shadow-lg"],
    probe: "rgb(255, 0, 0) 0px 0px 0px 9px",
    property: "boxShadow",
    scope: "root",
    uses: /balsa-shadow-/,
  },
  {
    dimension: "color",
    // The foundation resolves material first, so the palette token underneath
    // it is never read when a material is active.
    tokens: ["--balsa-material-primary", "--balsa-material-secondary", "--balsa-material-accent", "--balsa-material-destructive"],
    probe: "rgb(1, 2, 3)",
    property: "backgroundColor",
    scope: "root",
    uses: /(?:^|\s)bg-(?:primary|secondary|accent|destructive)(?:\s|\/|$)/,
  },
  {
    dimension: "motion",
    tokens: ["--balsa-motion-normal", "--balsa-motion-fast", "--balsa-motion-slow"],
    probe: "1234ms",
    property: "transitionDuration",
    scope: "adapt",
    uses: /(?:^|\s)transition(?:-[a-z]+)?(?:\s|$)/,
  },
];

/**
 * Class strings from the patched source, preferring those that carry a utility
 * a probe measures. Taking the first few literals instead would sample whatever
 * happens to appear at the top of the first file -- for Button that is the
 * script imports, never the cva base string where `rounded-md` lives -- and
 * report a false "did not respond".
 */
const probedUtilities = /\b(?:rounded|shadow|border|bg-|transition|duration-)/;

function sampleClassLists(item, limit = 12) {
  const relevant = [];
  const other = [];
  for (const file of item.files) {
    for (const literal of stringLiterals(file.content, { minLength: 12, maxLength: 900 })) {
      const value = literal.value;
      const tokens = value.trim().split(/\s+/);
      if (tokens.length < 3) continue;
      if (!tokens.every((token) => /^[!@a-z0-9[\]()/:_.,#&>*+~=%$-]+$/i.test(token))) continue;
      (probedUtilities.test(value) ? relevant : other).push(value);
    }
  }
  return [...relevant, ...other].slice(0, limit);
}

async function buildStylesheet(classLists) {
  await mkdir(workDir, { recursive: true });
  const styles = path.join(rootDir, "src", "styles");
  await writeFile(
    path.join(workDir, "input.css"),
    [
      '@import "tailwindcss";',
      `@import "${path.join(styles, "balsa-foundation.css").split("\\").join("/")}";`,
      `@import "${path.join(styles, "balsa-theme.css").split("\\").join("/")}";`,
      `@import "${path.join(styles, "balsa-shadcn-bridge.css").split("\\").join("/")}";`,
      "",
    ].join("\n"),
    "utf8",
  );
  await writeFile(
    path.join(workDir, "content.html"),
    classLists.map((value) => `<div class="${value}"></div>`).join("\n"),
    "utf8",
  );

  const result = spawnSync(
    process.execPath,
    [
      path.join(rootDir, "node_modules", "@tailwindcss", "cli", "dist", "index.mjs"),
      "-i", path.join(workDir, "input.css"),
      "-o", path.join(workDir, "output.css"),
      "--content", path.join(workDir, "content.html"),
    ],
    { cwd: rootDir, encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(`Tailwind build failed: ${result.stderr || result.stdout}`);
  }
  return readFile(path.join(workDir, "output.css"), "utf8");
}

const targets = process.argv.slice(2).filter((value) => !value.startsWith("--"));
const items = targets.length ? targets : ["button", "input", "checkbox", "select", "dialog", "card"];

const configuration = await loadProjectConfiguration(path.join(rootDir, "starters", "vue"));
const resolver = createResolver({ configuration });

const findings = [];
const measured = [];

const browser = await chromium.launch();
try {
  for (const name of items) {
    const reference = `@shadcn/${name}`;
    const resolved = await resolver.resolve([reference]);
    const upstream = resolved.find((candidate) => candidate.name === name);
    if (!upstream) {
      findings.push(`${reference}: not resolvable upstream.`);
      continue;
    }
    const adapter = await loadAdapter(reference);
    const patched = applyAdapter(upstream, adapter).item;
    const classLists = sampleClassLists(patched);
    if (!classLists.length) {
      findings.push(`${reference}: no class lists to measure.`);
      continue;
    }

    const css = await buildStylesheet(classLists);
    const page = await browser.newPage();
    await page.setContent(
      `<!doctype html><html><head><style>${css}</style></head>`
      + `<body><div id="root"><div id="adapt" data-balsa-adapt>`
      + classLists.map((value, index) => `<div id="probe-${index}" style="border-style:solid" class="${value}"></div>`).join("")
      + `</div></div></body></html>`,
    );

    for (const probe of dimensionProbes) {
      // Only assert a dimension the component actually spends. Otherwise a
      // component that legitimately never rounds a corner would be reported as
      // failing radius conformance.
      if (!classLists.some((value) => probe.uses.test(value))) {
        measured.push({ item: reference, dimension: probe.dimension, applicable: false });
        continue;
      }

      const outcome = await page.evaluate(
        ({ tokens, probeValue, property, count, scope }) => {
          // A derived variable is substituted where it is DECLARED. The bridge
          // declares its root chain on :root, so probing a div would change a
          // token nothing reads.
          const host = scope === "adapt"
            ? document.getElementById("adapt")
            : document.documentElement;
          const read = () => Array.from(
            { length: count },
            (_, index) => getComputedStyle(document.getElementById(`probe-${index}`))[property],
          );
          const before = read();
          for (const token of tokens) host.style.setProperty(token, probeValue);
          const after = read();
          for (const token of tokens) host.style.removeProperty(token);
          return { before, after };
        },
        {
          tokens: probe.tokens,
          probeValue: probe.probe,
          property: probe.property,
          count: classLists.length,
          scope: probe.scope,
        },
      );

      const responded = outcome.before.some((value, index) => value !== outcome.after[index]);
      measured.push({ item: reference, dimension: probe.dimension, applicable: true, responded });
      if (!responded) {
        findings.push(
          `${reference}: ${probe.dimension} did not respond to ${probe.tokens.join(", ")}.`
          + ` The sampled classes render the same before and after the token changes.`,
        );
      }
    }

    // Direction is a rendered property, not a class one: the same markup must
    // mirror when the document direction flips.
    const mirrored = await page.evaluate((count) => {
      const read = () => Array.from({ length: count }, (_, index) => {
        const style = getComputedStyle(document.getElementById(`probe-${index}`));
        return `${style.paddingLeft}|${style.paddingRight}|${style.marginLeft}|${style.marginRight}`;
      });
      document.documentElement.dir = "ltr";
      const ltr = read();
      document.documentElement.dir = "rtl";
      const rtl = read();
      document.documentElement.dir = "ltr";
      return { ltr, rtl };
    }, classLists.length);

    const asymmetric = mirrored.ltr.some((value) => {
      const [left, right] = value.split("|");
      return left !== right;
    });
    const mirrors = mirrored.ltr.some((value, index) => value !== mirrored.rtl[index]);
    measured.push({ item: reference, dimension: "rtl", applicable: asymmetric, responded: !asymmetric || mirrors });
    if (asymmetric && !mirrors) {
      findings.push(
        `${reference}: horizontal spacing is asymmetric but does not mirror when dir=rtl.`,
      );
    }

    await page.close();
  }
} finally {
  await browser.close();
  await rm(workDir, { recursive: true, force: true });
}

// Record what was measured, so an adapter's coverage reflects a run rather than
// an intention. Only a component whose every applicable dimension responded is
// marked covered; anything else keeps `visual: false`, which is the honest
// value when a probe could not confirm it.
if (process.argv.includes("--write")) {
  const byItem = new Map();
  for (const entry of measured) {
    byItem.set(entry.item, [...(byItem.get(entry.item) ?? []), entry]);
  }
  for (const [reference, entries] of byItem) {
    const adapter = await loadAdapter(reference);
    if (!adapter) continue;
    const applicableEntries = entries.filter((entry) => entry.applicable);
    const covered = applicableEntries.length > 0
      && applicableEntries.every((entry) => entry.responded);
    const next = {
      ...adapter,
      coverage: { ...adapter.coverage, visual: covered },
    };
    const target = path.join(
      rootDir,
      "adapters",
      reference.slice(1).split("/")[0],
      `${reference.split("/")[1]}.json`,
    );
    await writeFile(target, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  }
  console.log(`Recorded visual coverage for ${byItem.size} adapters.`);
}

const applicable = measured.filter((entry) => entry.applicable);
const responded = applicable.filter((entry) => entry.responded).length;
console.log(`Probed ${items.length} components; ${applicable.length} of ${measured.length} dimensions applied.`);
console.log(`Responded to the design system: ${responded}/${applicable.length}`);

if (findings.length) {
  console.error(`\n${findings.length} conformance findings:`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log("Every measured dimension responded to the Balsa design system.");
}
