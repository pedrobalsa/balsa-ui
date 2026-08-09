<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  watch,
} from "vue";
import { getAnchoredLayerPosition } from "./anchored-layer";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import MenuList from "./MenuList.vue";
import type { MenuItem, MenuSelection, MenuVariant } from "./menu";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export interface MenubarMenu {
  id: string;
  label: string;
  items: readonly MenuItem[];
  disabled?: boolean;
}

defineOptions({ name: "BalsaMenubar", inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    menus: readonly MenubarMenu[];
    variant?: MenuVariant;
    rounded?: Rounded;
    shadow?: Shadow;
    contained?: boolean;
    theme?: ThemeInput;
  }>(),
  {
    contained: false,
  },
);
const { props, theme } = useResolvedThemeProps(
  "menubar",
  "navigation",
  rawProps,
  { variant: "surface", rounded: "lg", shadow: "auto" } as const,
);

const emit = defineEmits<{
  select: [selection: MenuSelection & { menuId: string }];
}>();
const model = defineModel<string | null>({ default: null });
const attrs = useAttrs();
const root = ref<HTMLElement | null>(null);
const portalPresentation = computed(() => theme.presentationForPortal(root.value));
const triggers = ref<(HTMLButtonElement | null)[]>([]);
const layer = ref<HTMLElement | null>(null);
const list = ref<{ focusFirst: () => void } | null>(null);
const focusIndex = ref(firstEnabledIndex());
const position = ref({ left: 0, top: 0 });

const rootClasses = computed(() =>
  mergeClasses(
    "flex max-w-full items-center gap-balsa-3xs rounded-lg border border-balsa-border-strong bg-balsa-surface p-balsa-3xs text-balsa-surface-foreground",
    roundedClasses[props.rounded],
    "relative",
    props.contained ? "overflow-visible" : "overflow-x-auto",
    attrs.class,
  ),
);
const triggerClasses = computed(() => [
  "shrink-0 cursor-pointer rounded-md px-balsa-md py-balsa-xs text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-balsa-focus-ring",
]);
const layerClasses = computed(() => [
  "z-[65]",
  props.contained ? "absolute" : "fixed",
]);
const layerStyle = computed(() => ({
  left: `${position.value.left}px`,
  top: `${position.value.top}px`,
}));
const activeMenu = computed(() =>
  props.menus.find((menu) => menu.id === model.value),
);

function firstEnabledIndex(): number {
  const index = props.menus.findIndex((menu) => !menu.disabled);
  return index < 0 ? 0 : index;
}

function setTrigger(element: unknown, index: number): void {
  triggers.value[index] = element instanceof HTMLButtonElement ? element : null;
}

function updatePosition(): void {
  const index = props.menus.findIndex((menu) => menu.id === model.value);
  const anchor = triggers.value[index];
  if (!anchor || !layer.value || !model.value) return;
  const next = getAnchoredLayerPosition(anchor, layer.value, {
    side: "bottom",
    align: "start",
    sideOffset: 6,
    alignOffset: 0,
  });
  const rootRect = root.value?.getBoundingClientRect();
  position.value = {
    left: next.left - (props.contained ? rootRect?.left ?? 0 : 0),
    top: next.top - (props.contained ? rootRect?.top ?? 0 : 0),
  };
}

function openMenu(index: number): void {
  const menu = props.menus[index];
  if (!menu || menu.disabled) return;
  focusIndex.value = index;
  model.value = menu.id;
}

function close(restoreFocus = true): void {
  const index = focusIndex.value;
  model.value = null;
  if (restoreFocus) void nextTick(() => triggers.value[index]?.focus());
}

function moveTrigger(direction: 1 | -1, open = Boolean(model.value)): void {
  if (!props.menus.some((menu) => !menu.disabled)) return;
  let next = focusIndex.value;
  do {
    next = (next + direction + props.menus.length) % props.menus.length;
  } while (props.menus[next]?.disabled);
  focusIndex.value = next;
  triggers.value[next]?.focus();
  if (open) openMenu(next);
}

function handleTriggerKeydown(event: KeyboardEvent, index: number): void {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveTrigger(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveTrigger(-1);
  } else if (event.key === "Home") {
    event.preventDefault();
    focusIndex.value = firstEnabledIndex();
    triggers.value[focusIndex.value]?.focus();
  } else if (event.key === "End") {
    event.preventDefault();
    const reversed = [...props.menus].reverse().findIndex((menu) => !menu.disabled);
    focusIndex.value = reversed < 0 ? 0 : props.menus.length - reversed - 1;
    triggers.value[focusIndex.value]?.focus();
  } else if (["ArrowDown", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    openMenu(index);
  } else if (event.key === "Escape") {
    close();
  }
}

function handleSelection(selection: MenuSelection): void {
  if (!activeMenu.value) return;
  emit("select", { ...selection, menuId: activeMenu.value.id });
  close();
}

function handleDocumentPointer(event: PointerEvent): void {
  if (!model.value) return;
  const target = event.target as Node;
  if (root.value?.contains(target) || layer.value?.contains(target)) return;
  close(false);
}

watch(model, async (openMenuId) => {
  if (!openMenuId) return;
  await nextTick();
  updatePosition();
  list.value?.focusFirst();
});

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointer, true);
  window.addEventListener("resize", updatePosition, { passive: true });
  window.addEventListener("scroll", updatePosition, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointer, true);
  window.removeEventListener("resize", updatePosition);
  window.removeEventListener("scroll", updatePosition, true);
});
</script>

<template>
  <div
    :id="props.id"
    ref="root"
    data-balsa="menubar"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-palette="typeof attrs['data-palette'] === 'string' ? attrs['data-palette'] : undefined"
    role="menubar"
    :data-shadow="props.shadow"
    :aria-label="props.label"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    :class="rootClasses"
  >
    <button
      v-for="(menu, index) in props.menus"
      :id="`${props.id}-${menu.id}-trigger`"
      :key="menu.id"
      :ref="(element) => setTrigger(element, index)"
      type="button"
      role="menuitem"
      :tabindex="index === focusIndex ? 0 : -1"
      :disabled="menu.disabled"
      aria-haspopup="menu"
      :aria-expanded="model === menu.id"
      :aria-controls="model === menu.id ? `${props.id}-${menu.id}` : undefined"
      :class="triggerClasses"
      @focus="focusIndex = index"
      @mouseenter="model ? openMenu(index) : undefined"
      @click="model === menu.id ? close() : openMenu(index)"
      @keydown="handleTriggerKeydown($event, index)"
    >
      {{ menu.label }}
    </button>

    <Teleport to="body" :disabled="props.contained">
      <div
        v-if="model && activeMenu"
        ref="layer"
        :data-theme="portalPresentation.id"
        :data-theme-base="portalPresentation.base"
        :data-palette="typeof attrs['data-palette'] === 'string' ? attrs['data-palette'] : undefined"
        :data-shadow="props.shadow"
        :class="layerClasses"
        :style="[layerStyle, portalPresentation.style]"
      >
        <MenuList
          :id="`${props.id}-${activeMenu.id}`"
          ref="list"
          :label="activeMenu.label"
          :items="activeMenu.items"
          :variant="props.variant"
          :theme="theme.input.value"
          :palette="typeof attrs['data-palette'] === 'string' ? attrs['data-palette'] : undefined"
          @select="handleSelection"
          @dismiss="close"
        />
      </div>
    </Teleport>
  </div>
</template>
