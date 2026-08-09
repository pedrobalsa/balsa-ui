<script setup lang="ts">
import Badge from "../ui/Badge.vue";
import ScrollArea from "../ui/ScrollArea.vue";
import Separator from "../ui/Separator.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface ReleaseEntry { id: string; version: string; date: string; kind: string; notes: readonly string[] }

/**
 * More content than the tile can hold, on purpose. A scroll area only justifies
 * itself when there is something below the fold, so the release history runs
 * past the bottom edge and the fade shows that it does.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  releases?: readonly ReleaseEntry[];
}>(), {
  title: "Release notes",
  description: "Everything shipped to Atlas this quarter.",
  releases: () => [
    { id: "4.12.0", version: "4.12.0", date: "Aug 6, 2026", kind: "Minor", notes: ["Rolling deploys hold at 10% until the health check passes twice.", "Environment variables are diffed before a promotion."] },
    { id: "4.11.6", version: "4.11.6", date: "Jul 29, 2026", kind: "Patch", notes: ["Fixed a rollback that skipped the São Paulo edge."] },
    { id: "4.11.0", version: "4.11.0", date: "Jul 14, 2026", kind: "Minor", notes: ["Preview branches inherit production secrets by default.", "Build logs stream from the first line rather than on completion.", "Deploy keys can be scoped to one environment."] },
    { id: "4.10.2", version: "4.10.2", date: "Jun 30, 2026", kind: "Patch", notes: ["Reduced cold start on the Frankfurt edge by 40 ms."] },
    { id: "4.10.0", version: "4.10.0", date: "Jun 11, 2026", kind: "Minor", notes: ["Added the deployment history table.", "Members can be invited straight into a role."] },
  ],
});
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="release-notes">
    <ScrollArea label="Release history" edge-fade rounded="none" class="min-h-0 flex-1 border-0 bg-transparent">
      <ol class="grid gap-balsa-lg pr-balsa-xs" role="list">
        <li v-for="(release, index) in props.releases" :key="release.id">
          <div class="flex items-baseline justify-between gap-balsa-md">
            <strong class="text-sm font-medium tabular-nums">{{ release.version }}</strong>
            <Badge variant="soft">{{ release.kind }}</Badge>
          </div>
          <p class="mt-balsa-4xs text-xs text-balsa-muted-foreground">{{ release.date }}</p>
          <ul class="mt-balsa-xs grid gap-balsa-2xs" role="list">
            <li v-for="note in release.notes" :key="note" class="text-sm text-balsa-muted-foreground">
              {{ note }}
            </li>
          </ul>
          <Separator v-if="index < props.releases.length - 1" class="mt-balsa-lg" />
        </li>
      </ol>
    </ScrollArea>
  </CompositionRoot>
</template>
