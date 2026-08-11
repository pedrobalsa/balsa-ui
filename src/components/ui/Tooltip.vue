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
  type LayerVariant,
} from "./anchored-layer";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

defineOptions({ name: "BalsaTooltip", inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    side?: AnchoredSide;
    align?: AnchoredAlign;
    sideOffset?: number;
    openDelay?: number;
    closeDelay?: number;
    variant?: LayerVariant;
    rounded?: Rounded;
    shadow?: Shadow;
    contained?: boolean;
    disabled?: boolean;
    theme?: ThemeInput;
  }>(),
  {
    side: "top",
    align: "center",
    sideOffset: 8,
    openDelay: 300,
    closeDelay: 180,
    contained: false,
    disabled: false,
  },
);
const { props, theme } = useResolvedThemeProps(
  "tooltip",
  "overlays",
  rawProps,
  { variant: "surface", rounded: "lg", shadow: "auto" } as const,
);

const model = defineModel<boolean>({ default: false });
const attrs = useAttrs();
const root = ref<HTMLElement | null>(null);
const portalPresentation = computed(() => theme.presentationForPortal(root.value));
const trigger = ref<HTMLElement | null>(null);
const tooltip = ref<HTMLElement | null>(null);
const resolvedPalette = ref<string>();
const resolvedSide = ref<AnchoredSide>(props.side);
const position = ref({ left: 0, top: 0, maxWidth: 0, maxHeight: 0 });
let openTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

const variantClasses: Readonly<Record<LayerVariant, string[]>> = {
  surface: ["border-balsa-border-strong bg-balsa-surface-elevated text-balsa-surface-elevated-foreground"],
  outline: ["border-balsa-border-strong bg-balsa-background text-balsa-foreground"],
  soft: ["border-balsa-border bg-balsa-muted text-balsa-foreground"],
  glass: ["border-balsa-border/70 bg-balsa-surface/80 text-balsa-surface-foreground backdrop-balsa"],
};
const tooltipClasses = computed(() =>
  mergeClasses(
    "pointer-events-none z-[60] max-w-[calc(100vw-1rem)] overflow-auto border px-balsa-md py-balsa-xs text-sm shadow-balsa-panel outline-none",
    props.contained ? "absolute" : "fixed",
    roundedClasses[props.rounded],
    variantClasses[props.variant],
    attrs.class,
  ),
);
const tooltipStyle = computed(() => ({
  left: `${position.value.left}px`,
  top: `${position.value.top}px`,
  maxWidth: `${position.value.maxWidth}px`,
  maxHeight: `${position.value.maxHeight}px`,
  ...(typeof attrs.style === "object" ? attrs.style : {}),
}));

function resolveContext(): void {
  resolvedPalette.value = typeof attrs["data-palette"] === "string"
    ? attrs["data-palette"]
    : root.value?.closest<HTMLElement>("[data-palette]")?.dataset.palette;
}

function updatePosition(): void {
  if (!trigger.value || !tooltip.value || !model.value) return;
  const next = getAnchoredLayerPosition(trigger.value, tooltip.value, {
    side: props.side,
    align: props.align,
    sideOffset: props.sideOffset,
    alignOffset: 0,
  });
  const rootRect = root.value?.getBoundingClientRect();
  position.value = {
    left: next.left - (props.contained ? rootRect?.left ?? 0 : 0),
    top: next.top - (props.contained ? rootRect?.top ?? 0 : 0),
    maxWidth: next.maxWidth,
    maxHeight: next.maxHeight,
  };
  resolvedSide.value = next.side;
}

function scheduleOpen(): void {
  if (props.disabled) return;
  clearTimeout(closeTimer);
  openTimer = setTimeout(() => {
    model.value = true;
  }, Math.max(0, props.openDelay));
}

function scheduleClose(): void {
  clearTimeout(openTimer);
  closeTimer = setTimeout(() => {
    model.value = false;
  }, Math.max(0, props.closeDelay));
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape" && model.value) {
    model.value = false;
  }
}

watch(model, async (open) => {
  resolveContext();
  if (!open) return;
  await nextTick();
  updatePosition();
});

onMounted(() => {
  resolveContext();
  window.addEventListener("resize", updatePosition, { passive: true });
  window.addEventListener("scroll", updatePosition, true);
});

onBeforeUnmount(() => {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  window.removeEventListener("resize", updatePosition);
  window.removeEventListener("scroll", updatePosition, true);
});
</script>

<template>
  <span
    ref="root"
    data-balsa="tooltip"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :style="theme.explicitPresentation.value?.style"
    :data-palette="typeof attrs['data-palette'] === 'string' ? attrs['data-palette'] : undefined"
    :data-state="model ? 'open' : 'closed'"
    class="relative inline-flex"
    @keydown="handleKeydown"
  >
    <span
      :id="`${props.id}-trigger`"
      ref="trigger"
      tabindex="0"
      :aria-describedby="model ? props.id : undefined"
      class="inline-flex cursor-help rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-balsa-focus-ring"
      @mouseenter="scheduleOpen"
      @mouseleave="scheduleClose"
      @focus="scheduleOpen"
      @blur="scheduleClose"
    >
      <slot name="trigger">Tooltip</slot>
    </span>

    <Teleport to="body" :disabled="props.contained">
      <Transition
        enter-active-class="transition-[opacity,transform] duration-150 ease-out"
        enter-from-class="translate-y-1 opacity-0"
        leave-active-class="transition-[opacity,transform] duration-100 ease-in"
        leave-to-class="translate-y-1 opacity-0"
      >
        <span
          v-if="model"
          :id="props.id"
          ref="tooltip"
          data-balsa="tooltip-panel"
          :data-theme="portalPresentation.id"
          :data-theme-base="portalPresentation.base"
          :data-palette="resolvedPalette"
          :data-side="resolvedSide"
          :data-variant="props.variant"
          :data-shadow="props.shadow"
          role="tooltip"
          :aria-label="props.label"
          :class="tooltipClasses"
          :style="[tooltipStyle, portalPresentation.style]"
        >
          <slot />
        </span>
      </Transition>
    </Teleport>
  </span>
</template>
