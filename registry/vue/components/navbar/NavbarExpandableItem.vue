<script setup lang="ts">
import { ChevronDown, ChevronUp } from "@lucide/vue";
import { computed } from "vue";
import type { NavigationGroup } from "./navigation";
import Icon from "./Icon.vue";

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
  navigate: [item: NavigationGroup, event: MouseEvent];
}>();

const hasLinks = computed(() => Boolean(props.item.links?.length));

const icon = computed(() => props.expanded ? ChevronUp : ChevronDown);
</script>

<template>
  <!-- Desktop navigation is a compact action row, so each item keeps its
       intrinsic label width. Tailwind documents `whitespace-nowrap` as the
       standard no-wrap utility: https://tailwindcss.com/docs/white-space -->
  <li
    class="group relative flex h-full shrink-0 items-center gap-balsa-3xs px-balsa-lg"
    @mouseenter="emit('open', props.item)"
    @mouseleave="emit('close')"
    @keydown.escape.stop="emit('close')"
  >
    <a
      :href="props.item.link"
      class="flex h-full cursor-pointer items-center whitespace-nowrap font-balsa-title font-medium text-balsa-foreground no-underline decoration-balsa-accent decoration-2 underline-offset-8 transition-colors hover:text-balsa-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
      :aria-expanded="hasLinks ? props.expanded : undefined"
      :aria-controls="hasLinks ? props.menuId : undefined"
      :aria-haspopup="hasLinks ? 'true' : undefined"
      @focus="emit('open', props.item)"
      @click="emit('navigate', props.item, $event)"
    >
      {{ props.item.title }}
    </a>
    <Icon v-if="hasLinks" :icon="icon" size="md" class="text-balsa-accent transition-transform duration-200" />
    <slot />
  </li>
</template>
