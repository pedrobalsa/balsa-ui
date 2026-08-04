<script setup lang="ts">
import Skeleton from "../ui/Skeleton.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; rows?: number }>(), { title: "Loading activity", description: "Fetching the latest workspace events.", rows: 4 });
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="loading-state" aria-busy="true" aria-live="polite">
    <span class="sr-only">Loading</span>
    <div class="grid gap-4">
      <div v-for="index in props.rows" :key="index" class="grid grid-cols-[2.5rem_minmax(0,1fr)_4rem] items-center gap-3">
        <Skeleton class="size-10 rounded-balsa-control" />
        <div class="grid gap-2"><Skeleton class="h-3 w-2/3" /><Skeleton class="h-3 w-1/2" /></div>
        <Skeleton class="h-3 w-full" />
      </div>
    </div>
  </CompositionRoot>
</template>
