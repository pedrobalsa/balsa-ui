<script setup lang="ts">
import { Check, ChevronRight, Circle } from "@lucide/vue";
import { computed, nextTick, ref } from "vue";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import type { ActionColor } from "./types";
import {
  isInteractiveMenuItem,
  type MenuItem,
  type MenuSelection,
  type MenuVariant,
} from "./menu";
import { useResolvedThemeProps } from "./theme-context";
import Icon from "./Icon.vue";

defineOptions({ name: "MenuList" });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    items: readonly MenuItem[];
    variant?: MenuVariant;
    color?: ActionColor;
    rounded?: Rounded;
    shadow?: Shadow;
    theme?: ThemeInput;
    palette?: string;
    submenu?: boolean;
  }>(),
  {
    submenu: false,
  },
);
const { props, theme } = useResolvedThemeProps(
  "dropdown-menu",
  "overlays",
  rawProps,
  { variant: "surface", rounded: "lg", shadow: "auto" } as const,
);

const emit = defineEmits<{
  select: [selection: MenuSelection];
  dismiss: [];
  closeSubmenu: [];
}>();

const root = ref<HTMLElement | null>(null);
const activeIndex = ref(firstInteractiveIndex());
const openSubmenuIndex = ref<number | null>(null);
let typeahead = "";
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

const variantClasses: Readonly<Record<MenuVariant, string[]>> = {
  surface: ["border-balsa-border-strong bg-balsa-surface-elevated text-balsa-surface-elevated-foreground"],
  outline: ["border-balsa-border-strong bg-balsa-background text-balsa-foreground"],
  soft: ["border-balsa-border bg-balsa-muted text-balsa-foreground"],
  glass: ["border-balsa-border/70 text-balsa-surface-foreground backdrop-balsa"],
};
const colorClasses: Readonly<Record<ActionColor, Record<MenuVariant, string[]>>> = {
  neutral: {
    surface: [], outline: [], soft: [], glass: [],
  },
  primary: {
    surface: ["border-balsa-primary/30"], outline: ["border-balsa-primary"], soft: ["border-balsa-primary/20", "bg-balsa-primary/10"], glass: ["border-balsa-primary/30"],
  },
  secondary: {
    surface: ["border-balsa-secondary/30"], outline: ["border-balsa-secondary"], soft: ["border-balsa-secondary/20", "bg-balsa-secondary/10"], glass: ["border-balsa-secondary/30"],
  },
  accent: {
    surface: ["border-balsa-accent/30"], outline: ["border-balsa-accent"], soft: ["border-balsa-accent/20", "bg-balsa-accent/10"], glass: ["border-balsa-accent/30"],
  },
  destructive: {
    surface: ["border-balsa-destructive/30"], outline: ["border-balsa-destructive"], soft: ["border-balsa-destructive/20", "bg-balsa-destructive/10"], glass: ["border-balsa-destructive/30"],
  },
};
const rootClasses = computed(() => [
  "min-w-52 max-w-[min(22rem,calc(100vw-1rem))] overflow-y-auto border p-balsa-3xs shadow-balsa-panel outline-none",
  roundedClasses[props.rounded],
  props.submenu ? "absolute left-full top-0 z-[70] ml-balsa-3xs" : "",
  ...variantClasses[props.variant],
  ...(props.color ? colorClasses[props.color][props.variant] : []),
]);

function firstInteractiveIndex(): number {
  const index = props.items.findIndex(isInteractiveMenuItem);
  return index < 0 ? 0 : index;
}

function itemRole(item: MenuItem): "menuitem" | "menuitemcheckbox" | "menuitemradio" {
  if (item.type === "checkbox") return "menuitemcheckbox";
  if (item.type === "radio") return "menuitemradio";
  return "menuitem";
}

function itemClasses(item: MenuItem, index: number): string[] {
  return [
    "relative flex min-h-9 w-full items-center gap-balsa-xs rounded-md px-balsa-md py-balsa-xs text-left text-sm outline-none transition-colors",
    index === activeIndex.value
      ? item.destructive
        ? "bg-balsa-destructive text-balsa-destructive-foreground"
        : "bg-balsa-selected text-balsa-selected-foreground"
      : item.destructive
        ? "text-balsa-destructive"
        : "text-inherit",
    item.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
  ];
}

function moveActive(direction: 1 | -1): void {
  if (!props.items.some(isInteractiveMenuItem)) return;
  let next = activeIndex.value;
  do {
    next = (next + direction + props.items.length) % props.items.length;
  } while (!isInteractiveMenuItem(props.items[next]!));
  activeIndex.value = next;
  focusActive();
}

function focusActive(): void {
  void nextTick(() => {
    root.value
      ?.querySelector<HTMLElement>(`[data-menu-index="${activeIndex.value}"]`)
      ?.focus();
  });
}

function selectItem(item: MenuItem, index: number): void {
  if (!isInteractiveMenuItem(item)) return;
  activeIndex.value = index;
  if (item.type === "submenu" || item.children?.length) {
    openSubmenuIndex.value = index;
    return;
  }
  emit("select", {
    id: item.id,
    type: item.type === "checkbox"
      ? "checkbox"
      : item.type === "radio"
        ? "radio"
        : "action",
    value: item.value,
    checked: item.type === "checkbox" ? !item.checked : item.checked,
  });
}

function handleKeydown(event: KeyboardEvent, item: MenuItem, index: number): void {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveActive(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    moveActive(-1);
  } else if (event.key === "Home") {
    event.preventDefault();
    activeIndex.value = firstInteractiveIndex();
    focusActive();
  } else if (event.key === "End") {
    event.preventDefault();
    const reversed = [...props.items].reverse().findIndex(isInteractiveMenuItem);
    activeIndex.value = reversed < 0 ? 0 : props.items.length - reversed - 1;
    focusActive();
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectItem(item, index);
  } else if (event.key === "ArrowRight" && (item.children?.length || item.type === "submenu")) {
    event.preventDefault();
    openSubmenuIndex.value = index;
  } else if (event.key === "ArrowLeft" && props.submenu) {
    event.preventDefault();
    emit("closeSubmenu");
  } else if (event.key === "Escape") {
    event.preventDefault();
    emit("dismiss");
  } else if (event.key.length === 1 && /\S/.test(event.key)) {
    typeahead += event.key.toLocaleLowerCase();
    clearTimeout(typeaheadTimer);
    typeaheadTimer = setTimeout(() => {
      typeahead = "";
    }, 500);
    const match = props.items.findIndex((candidate) =>
      isInteractiveMenuItem(candidate)
      && candidate.label?.toLocaleLowerCase().startsWith(typeahead),
    );
    if (match >= 0) {
      activeIndex.value = match;
      focusActive();
    }
  }
}

defineExpose({ focusFirst: focusActive });
</script>

<template>
  <div
    :id="props.id"
    ref="root"
    data-balsa="menu-list"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-palette="props.palette"
    :data-variant="props.variant"
    :data-color="props.color"
    :data-rounded="props.rounded"
    :data-shadow="props.shadow"
    role="menu"
    :aria-label="props.label"
    :class="rootClasses"
    :style="theme.explicitPresentation.value?.style"
  >
    <template v-for="(item, index) in props.items" :key="item.id">
      <div
        v-if="item.type === 'separator'"
        class="my-balsa-3xs h-px bg-balsa-border"
        role="separator"
      ></div>
      <div
        v-else-if="item.type === 'label'"
        class="px-balsa-md py-balsa-xs text-xs font-medium uppercase tracking-wider text-balsa-muted-foreground"
        role="presentation"
      >
        {{ item.label }}
      </div>
      <div v-else class="relative">
        <button
          type="button"
          :data-menu-index="index"
          :role="itemRole(item)"
          :tabindex="index === activeIndex ? 0 : -1"
          :disabled="item.disabled"
          :aria-checked="item.type === 'checkbox' || item.type === 'radio' ? item.checked : undefined"
          :aria-haspopup="item.children?.length ? 'menu' : undefined"
          :aria-expanded="item.children?.length ? openSubmenuIndex === index : undefined"
          :class="itemClasses(item, index)"
          @focus="activeIndex = index"
          @mouseenter="activeIndex = index"
          @click="selectItem(item, index)"
          @keydown="handleKeydown($event, item, index)"
        >
          <Icon v-if="item.icon" :icon="item.icon" size="md" />
          <span
            class="min-w-0 flex-1 truncate"
            :style="item.labelFontFamily ? { fontFamily: item.labelFontFamily } : undefined"
          >{{ item.label }}</span>
          <Icon
            v-if="item.type === 'checkbox' && item.checked"
            :icon="Check"
            size="md"
          />
          <Icon
            v-else-if="item.type === 'radio' && item.checked"
            :icon="Circle"
            size="sm"
            class="fill-current"
          />
          <span v-if="item.shortcut" class="ml-balsa-lg text-xs text-current/70">
            {{ item.shortcut }}
          </span>
          <Icon
            v-if="item.children?.length"
            :icon="ChevronRight"
            size="md"
          />
        </button>
        <MenuList
          v-if="item.children?.length && openSubmenuIndex === index"
          :id="`${props.id}-${item.id}`"
          :label="item.label ?? props.label"
          :items="item.children"
          :variant="props.variant"
          :color="props.color"
          :rounded="props.rounded"
          :theme="theme.input.value"
          :shadow="props.shadow"
          :palette="props.palette"
          submenu
          @select="emit('select', $event)"
          @dismiss="emit('dismiss')"
          @close-submenu="openSubmenuIndex = null"
        />
      </div>
    </template>
  </div>
</template>
