<script setup lang="ts">
import { ref } from "vue";
import Badge from "../ui/Badge.vue";
import CodeBlock from "../ui/CodeBlock.vue";
import ScrollArea from "../ui/ScrollArea.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface WorkspaceFile { id: string; path: string; added: number; removed: number }

/**
 * A file list against the diff it selects, at a fixed split.
 *
 * It was resizable, and that was the wrong control here: the two panes have
 * settled proportions — a path list is narrow, a diff is wide — so a handle only
 * invited the reader to make it worse. Resizable belongs where the trade is
 * genuinely theirs, which is the before-and-after comparison.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  files?: readonly WorkspaceFile[];
  source?: string;
}>(), {
  title: "Review changes",
  description: "Nine files changed in this pull request.",
  files: () => [
    { id: "config", path: "deploy/atlas.config.ts", added: 18, removed: 4 },
    { id: "runner", path: "deploy/runner.ts", added: 7, removed: 7 },
    { id: "environments", path: "deploy/environments.ts", added: 2, removed: 0 },
    { id: "health", path: "deploy/health-check.ts", added: 24, removed: 3 },
    { id: "rollback", path: "deploy/rollback.ts", added: 12, removed: 9 },
    { id: "regions", path: "config/regions.json", added: 3, removed: 1 },
    { id: "workflow", path: ".github/workflows/deploy.yml", added: 6, removed: 6 },
    { id: "tests", path: "tests/rollout.test.ts", added: 41, removed: 0 },
    { id: "readme", path: "README.md", added: 11, removed: 1 },
  ],
  source: `export const atlas = {
  regions: ["iad1", "fra1", "gru1"],
  strategy: "rolling",
  healthCheck: "/internal/ready",
  healthChecksBeforePromotion: 2,
  holdAtPercent: 10,
  rollbackAfter: 90,
  notifyOnFailure: ["#atlas-deploys"],
};`,
});

const active = ref("config");
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="split-workspace">
    <template #action><Badge variant="soft">+124 &minus;31</Badge></template>
    <div class="grid min-h-0 flex-1 grid-rows-1 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <ScrollArea label="Changed files" class="min-h-0 rounded-r-none border-r-0">
        <ul class="grid gap-balsa-3xs p-balsa-xs" role="list">
          <li v-for="file in props.files" :key="file.id">
            <button
              type="button"
              :aria-current="active === file.id ? 'true' : undefined"
              :class="['flex w-full items-center justify-between gap-balsa-xs rounded-balsa-control px-balsa-sm py-balsa-xs text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring',
                       active === file.id ? 'bg-balsa-muted font-medium' : 'hover:bg-balsa-muted']"
              @click="active = file.id"
            >
              <span class="min-w-0 truncate text-xs">{{ file.path }}</span>
              <span class="shrink-0 text-xs tabular-nums text-balsa-muted-foreground">
                +{{ file.added }} &minus;{{ file.removed }}
              </span>
            </button>
          </li>
        </ul>
      </ScrollArea>
      <CodeBlock
        :code="props.source"
        language="ts"
        class="min-h-0 rounded-l-none border-l-0 [&>pre]:h-full [&_pre]:min-h-full"
      />
    </div>
  </CompositionRoot>
</template>
