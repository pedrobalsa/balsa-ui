<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { LayerVariant } from "./anchored-layer";
import type { CommandGroup, CommandItem } from "./command";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow } from "./theme";

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    groups: readonly CommandGroup[];
    placeholder?: string;
    loading?: boolean;
    open?: boolean;
    dropdown?: boolean;
    variant?: LayerVariant;
    rounded?: Rounded;
    shadow?: Shadow;
  }>(),
  {
    placeholder: "Search commands",
    loading: false,
    open: true,
    dropdown: false,
    variant: "surface",
    rounded: "xl",
    shadow: "auto",
  },
);
const emit = defineEmits<{
  select: [item: CommandItem];
  escape: [];
  open: [];
  close: [];
}>();
const query = defineModel<string>("query", { default: "" });
const activeIndex = ref(0);

const normalizedQuery = computed(() => normalize(query.value.trim()));
const filteredGroups = computed(() =>
  props.groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!normalizedQuery.value) return true;
        return normalize([item.label, ...(item.keywords ?? [])].join(" "))
          .includes(normalizedQuery.value);
      }),
    }))
    .filter((group) => group.items.length > 0),
);
const items = computed(() => filteredGroups.value.flatMap((group) => group.items));
const activeItem = computed(() => items.value[activeIndex.value]);
const activeId = computed(() =>
  activeItem.value ? `${props.id}-item-${activeItem.value.id}` : undefined,
);
const variantClasses: Readonly<Record<LayerVariant, string[]>> = {
  surface: ["border-balsa-border-strong bg-balsa-surface-elevated text-balsa-surface-elevated-foreground"],
  outline: ["border-balsa-border-strong bg-balsa-background text-balsa-foreground"],
  soft: ["border-balsa-border bg-balsa-muted text-balsa-foreground"],
  glass: ["border-balsa-border/70 bg-balsa-surface/80 text-balsa-surface-foreground backdrop-blur-md"],
};
const rootClasses = computed(() => (props.dropdown ? "relative" : "overflow-hidden"));
const queryClasses = computed(() => [
  "flex items-center gap-3 px-4",
  props.dropdown
    ? ["border shadow-balsa-surface", roundedClasses[props.rounded], variantClasses[props.variant]]
    : "border-b border-balsa-border",
]);
const listboxClasses = computed(() => [
  "max-h-80 overflow-y-auto p-2",
  props.dropdown
    ? [
        "absolute left-0 right-0 z-30 mt-2 border shadow-balsa-panel",
        roundedClasses[props.rounded],
        variantClasses[props.variant],
      ]
    : "",
]);

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

function move(direction: 1 | -1): void {
  if (!items.value.some((item) => !item.disabled)) return;
  let next = activeIndex.value;
  do {
    next = (next + direction + items.value.length) % items.value.length;
  } while (items.value[next]?.disabled);
  activeIndex.value = next;
  scrollActiveIntoView();
}

function select(item: CommandItem | undefined): void {
  if (!item || item.disabled) return;
  emit("select", item);
}

function openList(): void {
  emit("open");
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!props.open) {
      openList();
      return;
    }
    move(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!props.open) {
      openList();
      return;
    }
    move(-1);
  } else if (event.key === "Home") {
    event.preventDefault();
    activeIndex.value = 0;
    scrollActiveIntoView();
  } else if (event.key === "End") {
    event.preventDefault();
    activeIndex.value = Math.max(0, items.value.length - 1);
    scrollActiveIntoView();
  } else if (event.key === "Enter") {
    event.preventDefault();
    select(activeItem.value);
  } else if (event.key === "Escape") {
    event.preventDefault();
    emit("escape");
  } else if (event.key === "Tab") {
    emit("close");
  }
}

function handleListboxKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    event.preventDefault();
    emit("escape");
  } else if (event.key === "Tab") {
    emit("close");
  }
}

function itemClasses(item: CommandItem, index: number): string[] {
  return [
    "flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm outline-none transition-colors",
    index === activeIndex.value
      ? "bg-balsa-selected text-balsa-selected-foreground"
      : "text-inherit",
    item.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
  ];
}

function itemIndex(item: CommandItem): number {
  return items.value.findIndex((candidate) => candidate.id === item.id);
}

function scrollActiveIntoView(): void {
  void nextTick(() => {
    if (activeId.value) document.getElementById(activeId.value)?.scrollIntoView({ block: "nearest" });
  });
}

watch([query, items], () => {
  activeIndex.value = Math.max(0, items.value.findIndex((item) => !item.disabled));
});

</script>

<template>
  <div data-balsa="command-list" :data-dropdown="props.dropdown || undefined" :class="rootClasses">
    <div :data-shadow="props.dropdown ? props.shadow : undefined" :class="queryClasses">
      <i class="mdi mdi-magnify text-xl text-balsa-muted-foreground" aria-hidden="true"></i>
      <input
        v-model="query"
        type="search"
        role="combobox"
        :aria-label="props.label"
        :aria-controls="`${props.id}-listbox`"
        :aria-expanded="props.open"
        :aria-activedescendant="activeId"
        aria-autocomplete="list"
        :placeholder="props.placeholder"
        autocomplete="off"
        class="h-12 min-w-0 flex-1 bg-transparent text-balsa-input-foreground outline-none placeholder:text-balsa-muted-foreground"
        @click="openList"
        @focus="openList"
        @input="openList"
        @keydown="handleKeydown"
      />
      <i v-if="props.loading" class="mdi mdi-loading animate-spin text-balsa-info" aria-hidden="true"></i>
    </div>

    <div
      v-if="props.open"
      :id="`${props.id}-listbox`"
      data-balsa="command-listbox"
      :data-shadow="props.dropdown ? props.shadow : undefined"
      role="listbox"
      :aria-label="props.label"
      :class="listboxClasses"
      @keydown="handleListboxKeydown"
    >
      <div v-if="props.loading" class="px-3 py-8 text-center text-sm text-balsa-muted-foreground">
        <slot name="loading">Loading commands…</slot>
      </div>
      <div
        v-else-if="filteredGroups.length === 0"
        class="px-3 py-8 text-center text-sm text-balsa-muted-foreground"
      >
        <slot name="empty">No commands found.</slot>
      </div>
      <section
        v-for="group in filteredGroups"
        v-else
        :key="group.id"
        role="group"
        :aria-labelledby="`${props.id}-group-${group.id}`"
        class="not-first:mt-2"
      >
        <div
          :id="`${props.id}-group-${group.id}`"
          class="px-3 py-2 text-xs font-bold uppercase tracking-wider text-balsa-muted-foreground"
        >
          {{ group.label }}
        </div>
        <button
          v-for="item in group.items"
          :id="`${props.id}-item-${item.id}`"
          :key="item.id"
          type="button"
          role="option"
          :aria-selected="item.id === activeItem?.id"
          :disabled="item.disabled"
          :class="itemClasses(item, itemIndex(item))"
          @mouseenter="activeIndex = itemIndex(item)"
          @focus="activeIndex = itemIndex(item)"
          @click="select(item)"
        >
          <i v-if="item.icon" :class="['mdi', item.icon, 'text-lg']" aria-hidden="true"></i>
          <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
          <span v-if="item.shortcut" class="text-xs text-current/70">{{ item.shortcut }}</span>
        </button>
      </section>
    </div>
  </div>
</template>
