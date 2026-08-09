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
import {
  getAnchoredLayerPosition,
  type AnchoredAlign,
  type AnchoredSide,
} from "./anchored-layer";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import MenuList from "./MenuList.vue";
import type { MenuItem, MenuSelection, MenuVariant } from "./menu";
import type { Shadow, ThemeInput } from "./theme";
import type { ActionColor } from "./types";
import { useResolvedThemeProps } from "./theme-context";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    items: readonly MenuItem[];
    side?: AnchoredSide;
    align?: AnchoredAlign;
    sideOffset?: number;
    variant?: MenuVariant;
    color?: ActionColor;
    rounded?: Rounded;
    shadow?: Shadow;
    contained?: boolean;
    disabled?: boolean;
    theme?: ThemeInput;
  }>(),
  {
    side: "bottom",
    align: "start",
    sideOffset: 8,
    color: "primary",
    contained: false,
    disabled: false,
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
}>();
const model = defineModel<boolean>({ default: false });
const attrs = useAttrs();
const root = ref<HTMLElement | null>(null);
const portalPresentation = computed(() => theme.presentationForPortal(root.value));
const trigger = ref<HTMLButtonElement | null>(null);
const layer = ref<HTMLElement | null>(null);
const list = ref<{ focusFirst: () => void } | null>(null);
const resolvedPalette = ref<string>();
const resolvedSide = ref<AnchoredSide>(props.side);
const position = ref({ left: 0, top: 0, maxHeight: 0 });

const triggerClasses = computed(() =>
  mergeClasses(
    "inline-flex min-h-9 cursor-pointer items-center justify-center gap-balsa-xs border border-balsa-border-strong bg-balsa-surface px-balsa-md py-balsa-2xs text-sm font-semibold text-balsa-surface-foreground transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring disabled:cursor-not-allowed disabled:bg-balsa-disabled disabled:text-balsa-disabled-foreground",
    // Without an explicit corner the trigger follows the live control-radius
    // token, so Radius edits restyle it instead of leaving a fixed corner behind.
    rawProps.rounded === undefined ? "rounded-balsa-control" : roundedClasses[props.rounded],
    attrs.class,
  ),
);
const layerClasses = computed(() => [
  "z-[65]",
  props.contained ? "absolute" : "fixed",
]);
const layerStyle = computed(() => ({
  left: `${position.value.left}px`,
  top: `${position.value.top}px`,
  maxHeight: `${position.value.maxHeight}px`,
}));

function resolveContext(): void {
  resolvedPalette.value = typeof attrs["data-palette"] === "string"
    ? attrs["data-palette"]
    : root.value?.closest<HTMLElement>("[data-palette]")?.dataset.palette;
}

function updatePosition(): void {
  if (!trigger.value || !layer.value || !model.value) return;
  const next = getAnchoredLayerPosition(trigger.value, layer.value, {
    side: props.side,
    align: props.align,
    sideOffset: props.sideOffset,
    alignOffset: 0,
  });
  const rootRect = root.value?.getBoundingClientRect();
  position.value = {
    left: next.left - (props.contained ? rootRect?.left ?? 0 : 0),
    top: next.top - (props.contained ? rootRect?.top ?? 0 : 0),
    maxHeight: next.maxHeight,
  };
  resolvedSide.value = next.side;
}

function close(restoreFocus = true): void {
  model.value = false;
  if (restoreFocus) void nextTick(() => trigger.value?.focus());
}

function handleSelection(selection: MenuSelection): void {
  emit("select", selection);
  close();
}

function handleDocumentPointer(event: PointerEvent): void {
  if (!model.value) return;
  const target = event.target as Node;
  if (root.value?.contains(target) || layer.value?.contains(target)) return;
  close(false);
}

function handleTriggerKeydown(event: KeyboardEvent): void {
  if (["ArrowDown", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    model.value = true;
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    model.value = true;
    void nextTick(() => {
      const buttons = layer.value?.querySelectorAll<HTMLElement>('[role^="menuitem"]');
      buttons?.item(buttons.length - 1)?.focus();
    });
  }
}

watch(
  [model, () => props.side, () => props.align, () => props.theme],
  async ([open]) => {
    resolveContext();
    if (!open) return;
    await nextTick();
    updatePosition();
    list.value?.focusFirst();
  },
  { immediate: true },
);

onMounted(() => {
  resolveContext();
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
  <span
    ref="root"
    data-balsa="dropdown-menu"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :style="theme.explicitPresentation.value?.style"
    :data-palette="typeof attrs['data-palette'] === 'string' ? attrs['data-palette'] : undefined"
    :data-color="props.color"
    :data-rounded="props.rounded"
    :data-state="model ? 'open' : 'closed'"
    class="relative inline-flex"
  >
    <button
      :id="`${props.id}-trigger`"
      ref="trigger"
      type="button"
      :disabled="props.disabled"
      :aria-expanded="model"
      :aria-controls="props.id"
      aria-haspopup="menu"
      :class="triggerClasses"
      @click="model = !model"
      @keydown="handleTriggerKeydown"
    >
      <slot name="trigger">Open menu</slot>
    </button>

    <Teleport to="body" :disabled="props.contained">
      <Transition
        enter-active-class="transition-[opacity,transform] duration-150 ease-out"
        enter-from-class="translate-y-1 opacity-0"
        leave-active-class="transition-[opacity,transform] duration-100 ease-in"
        leave-to-class="translate-y-1 opacity-0"
      >
        <div
          v-if="model"
          ref="layer"
          :data-theme="portalPresentation.id"
          :data-theme-base="portalPresentation.base"
          :data-palette="resolvedPalette"
          :data-side="resolvedSide"
          :data-shadow="props.shadow"
          :class="layerClasses"
          :style="[layerStyle, portalPresentation.style]"
        >
          <MenuList
            :id="props.id"
            ref="list"
            :label="props.label"
            :items="props.items"
            :variant="props.variant"
            :color="props.color"
            :rounded="props.rounded"
            :theme="theme.input.value"
            :palette="resolvedPalette"
            @select="handleSelection"
            @dismiss="close"
          />
        </div>
      </Transition>
    </Teleport>
  </span>
</template>
