import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
    // Several suites drive the published CLI through spawnSync. Each command is
    // fast on its own, but spawning Node repeatedly while the whole suite runs
    // in parallel exceeds the 5s default. Still short enough to catch a hang.
    testTimeout: 30_000,
  },
});
