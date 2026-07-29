<script setup lang="ts">
import { computed } from "vue";
import type { NavigationGroup } from "./navigation";

const props = withDefaults(
  defineProps<{
    item: NavigationGroup;
    expanded?: boolean;
    menuId?: string;
  }>(),
  {
    expanded: false,
  },
);

const emit = defineEmits<{
  open: [item: NavigationGroup];
  close: [];
  navigate: [item: NavigationGroup];
}>();

const hasLinks = computed(() => Boolean(props.item.links?.length));

const iconClasses = computed(() => [
  "mdi text-xl text-balsa-accent transition-transform duration-200",
  props.expanded ? "mdi-chevron-up" : "mdi-chevron-down",
]);
</script>

<template>
  <li
    class="group relative flex h-full items-center gap-1 px-4"
    @mouseenter="emit('open', props.item)"
    @mouseleave="emit('close')"
    @keydown.escape.stop="emit('close')"
  >
    <a
      :href="props.item.link"
      class="flex h-full cursor-pointer items-center font-balsa-title font-medium text-balsa-foreground no-underline decoration-balsa-accent decoration-2 underline-offset-8 transition-colors hover:text-balsa-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
      :aria-expanded="hasLinks ? props.expanded : undefined"
      :aria-controls="hasLinks ? props.menuId : undefined"
      :aria-haspopup="hasLinks ? 'true' : undefined"
      @focus="emit('open', props.item)"
      @click="emit('navigate', props.item)"
    >
      {{ props.item.title }}
    </a>
    <i v-if="hasLinks" :class="iconClasses" aria-hidden="true"></i>
    <slot />
  </li>
</template>
