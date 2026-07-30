<script setup lang="ts">
import { computed, watchEffect } from "vue";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export type TabsVariant = "surface" | "outline" | "soft" | "glass";
export type TabsType = "segmented" | "underline" | "pills" | "tiles";
type TabsSize = "sm" | "md" | "lg";
type Rounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
type TabState = "active" | "inactive";

const rawProps = withDefaults(
  defineProps<{
    id: string;
    items: readonly TabItem[];
    label?: string;
    variant?: TabsVariant;
    type?: TabsType;
    panelSurface?: boolean;
    size?: TabsSize;
    rounded?: Rounded;
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    label: "Content tabs",
    panelSurface: undefined,
  },
);
const { props, theme } = useResolvedThemeProps(
  "tabs",
  "navigation",
  rawProps,
  {
    variant: "surface",
    type: "segmented",
    panelSurface: true,
    size: "md",
    rounded: "lg",
    shadow: "auto",
  } as const,
);

const model = defineModel<string>({ default: "" });

const enabledItems = computed(() => props.items.filter((item) => !item.disabled));
const activeItem = computed(() => {
  const selectedItem = props.items.find(
    (item) => item.id === model.value && !item.disabled,
  );

  return selectedItem ?? enabledItems.value[0];
});

const activeId = computed(() => activeItem.value?.id ?? "");
const activeTabId = computed(() => `${props.id}-${activeId.value}-tab`);
const activePanelId = computed(() => `${props.id}-${activeId.value}-panel`);
const resolvedRounded = computed<Rounded>(() =>
  rawProps.rounded === undefined
    && theme.defaults.value.rounded === undefined
    && props.type === "underline"
    ? "none"
    : props.rounded,
);
const sizeClasses: Readonly<Record<TabsSize, { tab: string; tile: string; panel: string }>> = {
  sm: { tab: "h-8 gap-1.5 px-3 text-xs", tile: "min-h-16 gap-1.5 px-3 py-2.5 text-xs", panel: "p-4 text-sm" },
  md: { tab: "h-9 gap-2 px-4 text-sm", tile: "min-h-20 gap-2 px-4 py-3 text-sm", panel: "p-5 text-sm" },
  lg: { tab: "h-10 gap-2 px-5 text-sm", tile: "min-h-24 gap-2 px-5 py-4 text-sm", panel: "p-6 text-sm" },
};
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};
const listClassesByType: Readonly<Record<TabsType, Record<TabsVariant, string[]>>> = {
  segmented: {
    surface: ["flex w-fit max-w-full flex-wrap gap-1 border border-balsa-border bg-balsa-muted p-1"],
    outline: ["flex w-fit max-w-full flex-wrap gap-1 border border-balsa-border-strong bg-transparent p-1"],
    soft: ["flex w-fit max-w-full flex-wrap gap-1 border border-balsa-primary/20 bg-balsa-primary/10 p-1"],
    glass: ["flex w-fit max-w-full flex-wrap gap-1 border border-balsa-border/70 bg-balsa-surface/70 p-1 backdrop-blur-md"],
  },
  underline: {
    surface: ["flex w-full min-w-0 items-end gap-1 border-b border-balsa-border bg-transparent p-0"],
    outline: ["flex w-full min-w-0 items-end gap-1 border-b-2 border-balsa-border-strong bg-transparent p-0"],
    soft: ["flex w-full min-w-0 items-end gap-1 border-b border-balsa-primary/20 bg-balsa-primary/5 p-0"],
    glass: ["flex w-full min-w-0 items-end gap-1 border-b border-balsa-border/70 bg-balsa-surface/50 p-0 backdrop-blur-md"],
  },
  pills: {
    surface: ["flex w-fit max-w-full flex-wrap gap-2 border-0 bg-transparent p-0"],
    outline: ["flex w-fit max-w-full flex-wrap gap-2 border-0 bg-transparent p-0"],
    soft: ["flex w-fit max-w-full flex-wrap gap-2 border-0 bg-transparent p-0"],
    glass: ["flex w-fit max-w-full flex-wrap gap-2 border-0 bg-transparent p-0"],
  },
  tiles: {
    surface: ["grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2 border-0 bg-transparent p-0"],
    outline: ["grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2 border-0 bg-transparent p-0"],
    soft: ["grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2 border-0 bg-transparent p-0"],
    glass: ["grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2 border-0 bg-transparent p-0"],
  },
};
const tabClassesByType: Readonly<Record<TabsType, Record<TabsVariant, Record<TabState, string[]>>>> = {
  segmented: {
    surface: { active: ["bg-balsa-selected text-balsa-selected-foreground shadow-balsa-detail hover:bg-balsa-selected hover:text-balsa-selected-foreground"], inactive: ["text-balsa-muted-foreground hover:bg-balsa-surface hover:text-balsa-foreground"] },
    outline: { active: ["bg-balsa-surface-elevated text-balsa-surface-elevated-foreground shadow-balsa-detail"], inactive: ["text-balsa-muted-foreground hover:bg-balsa-muted hover:text-balsa-foreground"] },
    soft: { active: ["bg-balsa-primary/20 text-balsa-primary hover:bg-balsa-primary/25"], inactive: ["text-balsa-muted-foreground hover:bg-balsa-primary/10 hover:text-balsa-primary"] },
    glass: { active: ["border border-balsa-border/70 bg-balsa-surface/80 text-balsa-foreground shadow-balsa-detail backdrop-blur-md"], inactive: ["text-balsa-muted-foreground hover:bg-balsa-surface/55 hover:text-balsa-foreground"] },
  },
  underline: {
    surface: { active: ["-mb-px rounded-none border-b-2 border-balsa-primary text-balsa-foreground"], inactive: ["rounded-none text-balsa-muted-foreground hover:text-balsa-foreground"] },
    outline: { active: ["-mb-0.5 rounded-none border-b-2 border-balsa-primary text-balsa-foreground"], inactive: ["rounded-none text-balsa-muted-foreground hover:text-balsa-foreground"] },
    soft: { active: ["-mb-px rounded-none border-b-2 border-balsa-primary bg-balsa-primary/10 text-balsa-primary"], inactive: ["rounded-none text-balsa-muted-foreground hover:bg-balsa-primary/5 hover:text-balsa-primary"] },
    glass: { active: ["-mb-px rounded-none border-b-2 border-balsa-primary bg-balsa-surface/60 text-balsa-foreground backdrop-blur-md"], inactive: ["rounded-none text-balsa-muted-foreground hover:bg-balsa-surface/45 hover:text-balsa-foreground"] },
  },
  pills: {
    surface: { active: ["bg-balsa-selected text-balsa-selected-foreground shadow-balsa-detail"], inactive: ["text-balsa-muted-foreground hover:bg-balsa-muted hover:text-balsa-foreground"] },
    outline: { active: ["border border-balsa-border-strong bg-balsa-surface text-balsa-surface-foreground shadow-balsa-detail"], inactive: ["border border-transparent text-balsa-muted-foreground hover:border-balsa-border hover:text-balsa-foreground"] },
    soft: { active: ["bg-balsa-primary/20 text-balsa-primary"], inactive: ["text-balsa-muted-foreground hover:bg-balsa-primary/10 hover:text-balsa-primary"] },
    glass: { active: ["border border-balsa-border/70 bg-balsa-surface/70 text-balsa-foreground shadow-balsa-detail backdrop-blur-md"], inactive: ["border border-transparent text-balsa-muted-foreground hover:bg-balsa-surface/45 hover:text-balsa-foreground"] },
  },
  tiles: {
    surface: { active: ["border border-balsa-selected bg-balsa-selected text-balsa-selected-foreground shadow-balsa-detail"], inactive: ["border border-transparent bg-balsa-muted text-balsa-muted-foreground hover:bg-balsa-surface hover:text-balsa-foreground"] },
    outline: { active: ["border border-balsa-border-strong bg-balsa-surface text-balsa-surface-foreground shadow-balsa-detail"], inactive: ["border border-balsa-border bg-transparent text-balsa-muted-foreground hover:bg-balsa-muted hover:text-balsa-foreground"] },
    soft: { active: ["border border-balsa-primary/30 bg-balsa-primary/20 text-balsa-primary"], inactive: ["border border-transparent bg-balsa-primary/5 text-balsa-muted-foreground hover:bg-balsa-primary/10 hover:text-balsa-primary"] },
    glass: { active: ["border border-balsa-border/70 bg-balsa-surface/75 text-balsa-foreground shadow-balsa-detail backdrop-blur-md"], inactive: ["border border-balsa-border/50 bg-balsa-surface/40 text-balsa-muted-foreground backdrop-blur-md hover:bg-balsa-surface/60 hover:text-balsa-foreground"] },
  },
};
const panelVariantClasses: Readonly<Record<TabsVariant, string[]>> = {
  surface: ["border border-balsa-border bg-balsa-surface text-balsa-surface-foreground"],
  outline: ["border border-balsa-border-strong bg-transparent text-balsa-foreground"],
  soft: ["border border-balsa-primary/20 bg-balsa-primary/5 text-balsa-foreground"],
  glass: ["border border-balsa-border/70 bg-balsa-surface/60 text-balsa-foreground backdrop-blur-md"],
};
const iconTypeClasses: Readonly<Record<TabsType, string>> = {
  segmented: "text-base", underline: "text-base", pills: "text-base", tiles: "text-xl",
};

const tabListClasses = computed(() => [
  roundedClasses[props.type === "underline" ? "none" : resolvedRounded.value],
  ...listClassesByType[props.type][props.variant],
]);
const panelClasses = computed(() => [
  "mt-6 min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-balsa-focus-ring",
  ...(props.panelSurface
    ? [
        "overflow-hidden",
        roundedClasses[resolvedRounded.value],
        ...panelVariantClasses[props.variant],
        sizeClasses[props.size].panel,
      ]
    : []),
]);
const panelSurfaceState = computed(() => (props.panelSurface ? "true" : "false"));
const tabClasses = computed(() =>
  Object.fromEntries(
    props.items.map((item) => {
      const state: TabState = item.id === activeId.value ? "active" : "inactive";
      const geometry = props.type === "tiles"
        ? sizeClasses[props.size].tile
        : sizeClasses[props.size].tab;
      const shape = props.type === "underline" ? "rounded-none" : roundedClasses[resolvedRounded.value];
      const layout = props.type === "tiles" ? "flex-col text-center" : "";
      const stateClasses = item.disabled
        ? ["cursor-not-allowed bg-balsa-disabled text-balsa-disabled-foreground opacity-70"]
        : tabClassesByType[props.type][props.variant][state];

      return [
        item.id,
        [
          "inline-flex cursor-pointer items-center justify-center font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring",
          geometry,
          shape,
          layout,
          ...stateClasses,
        ],
      ];
    }),
  ),
);
const tabIndexById = computed(() =>
  Object.fromEntries(
    props.items.map((item) => [item.id, item.id === activeId.value ? 0 : -1]),
  ),
);
const iconClasses = computed(() =>
  Object.fromEntries(
    props.items.map((item) => [item.id, ["mdi", "shrink-0", iconTypeClasses[props.type], item.icon]]),
  ),
);

function selectItem(id: string): void {
  const item = props.items.find((tab) => tab.id === id);
  if (!item || item.disabled) return;
  model.value = id;
}

function focusTab(id: string): void {
  document.getElementById(`${props.id}-${id}-tab`)?.focus();
}

function selectRelativeItem(currentId: string, direction: 1 | -1): void {
  const currentIndex = enabledItems.value.findIndex((item) => item.id === currentId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeIndex + direction + enabledItems.value.length) % enabledItems.value.length;
  const nextItem = enabledItems.value[nextIndex];
  if (!nextItem) return;
  selectItem(nextItem.id);
  focusTab(nextItem.id);
}

function selectEdgeItem(edge: "first" | "last"): void {
  const nextItem = edge === "first" ? enabledItems.value[0] : enabledItems.value[enabledItems.value.length - 1];
  if (!nextItem) return;
  selectItem(nextItem.id);
  focusTab(nextItem.id);
}

function handleKeydown(event: KeyboardEvent, id: string): void {
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    selectRelativeItem(id, 1);
  }
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    selectRelativeItem(id, -1);
  }
  if (event.key === "Home") {
    event.preventDefault();
    selectEdgeItem("first");
  }
  if (event.key === "End") {
    event.preventDefault();
    selectEdgeItem("last");
  }
}

watchEffect(() => {
  if (activeId.value && model.value !== activeId.value) model.value = activeId.value;
});
</script>

<template>
  <div
    data-balsa="tabs"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="props.variant"
    :data-type="props.type"
    :data-size="props.size"
    :data-rounded="resolvedRounded"
    :data-shadow="props.shadow"
    :style="theme.explicitPresentation.value?.style"
    class="min-w-0"
  >
    <div
      data-balsa="tabs-list"
      :data-type="props.type"
      role="tablist"
      :aria-label="props.label"
      :class="tabListClasses"
    >
      <button
        v-for="item in props.items"
        :id="`${props.id}-${item.id}-tab`"
        :key="item.id"
        type="button"
        role="tab"
        :aria-selected="item.id === activeId"
        :aria-controls="`${props.id}-${item.id}-panel`"
        :tabindex="tabIndexById[item.id]"
        :disabled="item.disabled"
        :class="tabClasses[item.id]"
        @click="selectItem(item.id)"
        @keydown="handleKeydown($event, item.id)"
      >
        <i v-if="item.icon" :class="iconClasses[item.id]" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </button>
    </div>

    <section
      data-balsa="tabs-panel"
      :data-surface="panelSurfaceState"
      :id="activePanelId"
      :class="panelClasses"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="activeTabId"
    >
      <slot :name="activeId" :active-id="activeId">
        <slot :active-id="activeId" />
      </slot>
    </section>
  </div>
</template>
