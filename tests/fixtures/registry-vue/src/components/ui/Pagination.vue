<script setup lang="ts">
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "@lucide/vue";
import { computed, useAttrs, watch } from "vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import Icon from "./Icon.vue";

export type PaginationSize = "sm" | "md" | "lg";
export type PaginationPresentation = "pages" | "action-labels" | "icons";
type PaginationToken =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string };

defineOptions({ name: "BalsaPagination", inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    total: number;
    pageSize?: number;
    siblingCount?: number;
    presentation?: PaginationPresentation;
    showEdges?: boolean;
    showLabels?: boolean;
    disabled?: boolean;
    label?: string;
    previousLabel?: string;
    nextLabel?: string;
    firstLabel?: string;
    lastLabel?: string;
    pageLabel?: (page: number) => string;
    size?: PaginationSize;
    rounded?: Rounded;
    theme?: ThemeInput;
  }>(),
  {
    pageSize: 10,
    siblingCount: 1,
    presentation: "pages",
    showEdges: true,
    showLabels: true,
    disabled: false,
    label: "Pagination",
    previousLabel: "Previous page",
    nextLabel: "Next page",
    firstLabel: "First page",
    lastLabel: "Last page",
    pageLabel: (page: number) => `Page ${page}`,
  },
);
const { props, theme } = useResolvedThemeProps(
  "pagination",
  "navigation",
  rawProps,
  { size: "md", rounded: "lg" } as const,
);

const model = defineModel<number>({ default: 1 });
const emit = defineEmits<{ change: [page: number] }>();
const attrs = useAttrs();

const pageCount = computed(() =>
  Math.max(1, Math.ceil(Math.max(0, props.total) / Math.max(1, props.pageSize))),
);
const currentPage = computed(() =>
  Math.min(pageCount.value, Math.max(1, Math.round(model.value || 1))),
);

watch(
  [() => model.value, pageCount],
  () => {
    if (model.value !== currentPage.value) model.value = currentPage.value;
  },
  { immediate: true },
);

const tokens = computed<PaginationToken[]>(() => {
  const count = pageCount.value;
  if (count <= 1) return [{ type: "page", page: 1 }];
  const siblings = Math.max(0, Math.floor(props.siblingCount));
  const included = new Set<number>([1, count, currentPage.value]);
  for (
    let page = currentPage.value - siblings;
    page <= currentPage.value + siblings;
    page += 1
  ) {
    if (page > 1 && page < count) included.add(page);
  }
  const pages = [...included].sort((a, b) => a - b);
  const result: PaginationToken[] = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous > 1) {
      result.push({ type: "ellipsis", key: `${previous}-${page}` });
    }
    result.push({ type: "page", page });
  });
  return result;
});
const visibleTokens = computed(() =>
  props.presentation === "pages" ? tokens.value : [],
);

const sizeClasses: Readonly<Record<PaginationSize, string[]>> = {
  sm: ["min-h-8", "min-w-8", "px-balsa-xs", "text-xs"],
  md: ["min-h-9", "min-w-9", "px-balsa-md", "text-sm"],
  lg: ["min-h-10", "min-w-10", "px-balsa-lg", "text-sm"],
};

const rootAttrs = computed(() => withoutClassAttribute(attrs));
const classes = computed(() =>
  mergeClasses("max-w-full font-balsa-body", attrs.class),
);
const listClasses = computed(() =>
  mergeClasses(
    "flex max-w-full items-center gap-balsa-3xs overflow-x-auto",
    props.presentation === "action-labels" ? "w-full justify-between" : "justify-center",
  ),
);
const actionLabelClasses = computed(() =>
  props.presentation === "pages" ? "max-sm:sr-only" : undefined,
);
const showActionLabels = computed(() =>
  props.presentation === "action-labels"
    || (props.presentation === "pages" && props.showLabels),
);
const buttonClasses = computed(() =>
  mergeClasses(
    "inline-flex shrink-0 items-center justify-center gap-balsa-2xs border border-balsa-border bg-balsa-surface font-medium tabular-nums text-balsa-foreground transition-colors hover:bg-balsa-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-balsa-focus-ring disabled:cursor-not-allowed disabled:opacity-45",
    sizeClasses[props.size],
    roundedClasses[props.rounded],
  ),
);
const selectedButtonClasses = computed(() =>
  mergeClasses(
    buttonClasses.value,
    "border-balsa-primary bg-balsa-primary text-balsa-primary-foreground hover:bg-balsa-primary-hover",
  ),
);
function pageTokenClasses(token: Extract<PaginationToken, { type: "page" }>): string {
  return mergeClasses(
    token.page === currentPage.value
      ? selectedButtonClasses.value
      : buttonClasses.value,
    token.page !== currentPage.value && "max-sm:hidden",
  );
}

function setPage(page: number): void {
  if (props.disabled) return;
  const next = Math.min(pageCount.value, Math.max(1, page));
  if (next === currentPage.value) return;
  model.value = next;
  emit("change", next);
}
</script>

<template>
  <nav
    v-bind="rootAttrs"
    data-balsa="pagination"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :data-presentation="props.presentation"
    :aria-label="props.label"
    :class="classes"
  >
    <ul :class="listClasses" role="list">
      <li v-if="props.presentation === 'pages' && props.showEdges" class="max-sm:hidden">
        <button
          type="button"
          :class="buttonClasses"
          :aria-label="props.firstLabel"
          :disabled="props.disabled || currentPage === 1"
          @click="setPage(1)"
        >
          <Icon :icon="ChevronFirst" size="md" />
        </button>
      </li>
      <li>
        <button
          type="button"
          :class="buttonClasses"
          :aria-label="props.previousLabel"
          :disabled="props.disabled || currentPage === 1"
          @click="setPage(currentPage - 1)"
        >
          <Icon v-if="props.presentation !== 'action-labels'" :icon="ChevronLeft" size="md" />
          <span v-if="showActionLabels" :class="actionLabelClasses">{{ props.previousLabel }}</span>
        </button>
      </li>
      <li v-for="token in visibleTokens" :key="token.type === 'page' ? token.page : token.key">
        <span
          v-if="token.type === 'ellipsis'"
          class="inline-flex min-h-10 min-w-8 items-center justify-center text-balsa-muted-foreground max-sm:hidden"
          aria-hidden="true"
        >
          …
        </span>
        <button
          v-else
          type="button"
          :class="pageTokenClasses(token)"
          :aria-label="props.pageLabel(token.page)"
          :aria-current="token.page === currentPage ? 'page' : undefined"
          :disabled="props.disabled"
          @click="setPage(token.page)"
        >
          {{ token.page }}
        </button>
      </li>
      <li>
        <button
          type="button"
          :class="buttonClasses"
          :aria-label="props.nextLabel"
          :disabled="props.disabled || currentPage === pageCount"
          @click="setPage(currentPage + 1)"
        >
          <span v-if="showActionLabels" :class="actionLabelClasses">{{ props.nextLabel }}</span>
          <Icon v-if="props.presentation !== 'action-labels'" :icon="ChevronRight" size="md" />
        </button>
      </li>
      <li v-if="props.presentation === 'pages' && props.showEdges" class="max-sm:hidden">
        <button
          type="button"
          :class="buttonClasses"
          :aria-label="props.lastLabel"
          :disabled="props.disabled || currentPage === pageCount"
          @click="setPage(pageCount)"
        >
          <Icon :icon="ChevronLast" size="md" />
        </button>
      </li>
    </ul>
  </nav>
</template>
