<script setup lang="ts">
defineOptions({ name: "BalsaBreadcrumb" });

import { ChevronRight, Dot } from "@lucide/vue";
import { computed } from "vue";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import Icon from "./Icon.vue";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
  current?: boolean;
}

export type BreadcrumbSeparator = "chevron" | "slash" | "dot";
export type BreadcrumbSize = "sm" | "md";

const rawProps = withDefaults(
  defineProps<{
    items: readonly BreadcrumbItem[];
    separator?: BreadcrumbSeparator;
    size?: BreadcrumbSize;
    ariaLabel?: string;
    theme?: ThemeInput;
  }>(),
  {
    separator: "chevron",
    ariaLabel: "Breadcrumb",
  },
);
const { props, theme } = useResolvedThemeProps(
  "breadcrumb",
  "navigation",
  rawProps,
  { size: "sm" } as const,
);

const currentIndex = computed(() => {
  const explicitIndex = props.items.findIndex((item) => item.current);
  return explicitIndex === -1 ? props.items.length - 1 : explicitIndex;
});

const sizeClasses: Readonly<Record<BreadcrumbSize, string>> = {
  sm: "gap-balsa-2xs text-xs",
  md: "gap-balsa-xs text-sm",
};
const linkSizeClasses: Readonly<Record<BreadcrumbSize, string>> = {
  sm: "min-h-7 px-balsa-3xs",
  md: "min-h-8 px-balsa-2xs",
};
const separatorClasses: Readonly<Record<BreadcrumbSeparator, string>> = {
  chevron: "",
  slash: "font-medium text-sm",
  dot: "",
};
const separatorIcons = { chevron: ChevronRight, dot: Dot } as const;

function isCurrent(index: number): boolean {
  return index === currentIndex.value;
}

function separatorText(): string {
  return props.separator === "slash" ? "/" : "";
}

function linkRel(item: BreadcrumbItem): string | undefined {
  if (item.rel) return item.rel;
  return item.target === "_blank" ? "noreferrer" : undefined;
}

function itemClasses(index: number): string[] {
  return [
    "inline-flex items-center rounded-balsa-control font-medium",
    linkSizeClasses[props.size],
    isCurrent(index) ? "text-balsa-foreground" : "text-balsa-muted-foreground",
  ];
}
</script>

<template>
  <nav
    data-balsa="breadcrumb"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :style="theme.explicitPresentation.value?.style"
    :data-size="props.size"
    :data-separator="props.separator"
    :aria-label="props.ariaLabel"
    class="min-w-0 font-balsa-body"
  >
    <ol :class="['m-0 flex min-w-0 list-none flex-wrap items-center p-0 text-balsa-muted-foreground', sizeClasses[props.size]]">
      <template v-for="(item, index) in props.items" :key="`${item.label}-${index}`">
        <li v-if="index > 0" aria-hidden="true" class="flex items-center text-balsa-muted-foreground/70">
          <Icon v-if="props.separator !== 'slash'" :icon="separatorIcons[props.separator]" size="sm" />
          <span v-else :class="separatorClasses.slash">{{ separatorText() }}</span>
        </li>
        <li class="min-w-0">
          <a
            v-if="item.href && !isCurrent(index)"
            :href="item.href"
            :target="item.target"
            :rel="linkRel(item)"
            :class="['inline-flex items-center rounded-balsa-control font-medium text-balsa-muted-foreground no-underline transition-colors hover:bg-balsa-muted hover:text-balsa-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring', linkSizeClasses[props.size]]"
          >
            {{ item.label }}
          </a>
          <span
            v-else
            :aria-current="isCurrent(index) ? 'page' : undefined"
            :class="itemClasses(index)"
          >
            {{ item.label }}
          </span>
        </li>
      </template>
    </ol>
  </nav>
</template>
