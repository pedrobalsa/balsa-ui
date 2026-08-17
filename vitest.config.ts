import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { createSiteViteAliases } from "./scripts/site-aliases.mjs";

const repositoryRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Registry-installed components import through `@/`, so tests resolve it
    // the same way the application and tsconfig do.
    alias: createSiteViteAliases(repositoryRoot),
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    restoreMocks: true,
    // Several suites drive the published CLI through spawnSync. Each command is
    // fast on its own, but spawning Node repeatedly while the whole suite runs
    // in parallel exceeds the 5s default. Still short enough to catch a hang.
    testTimeout: 30_000,
  },
});
