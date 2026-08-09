<script setup lang="ts">
import { GripHorizontal, GripVertical } from "@lucide/vue";
import { computed, ref, useAttrs, watch } from "vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { surfaceRoundedClasses, type SurfaceRounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import Icon from "./Icon.vue";

export type ResizableOrientation = "horizontal" | "vertical";
export type ResizableVariant = "surface" | "outline" | "soft" | "glass";
export type ResizableSize = "sm" | "md" | "lg";

defineOptions({ name: "BalsaResizable", inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    orientation?: ResizableOrientation;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    showGrip?: boolean;
    variant?: ResizableVariant;
    size?: ResizableSize;
    rounded?: SurfaceRounded;
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    orientation: "horizontal",
    min: 10,
    max: 90,
    step: 5,
    disabled: false,
    showGrip: true,
  },
);
const { props, theme } = useResolvedThemeProps(
  "resizable",
  "surfaces",
  rawProps,
  { variant: "surface", size: "md", rounded: "auto", shadow: "auto" } as const,
);

const model = defineModel<number>({ default: 50 });
const emit = defineEmits<{ resize: [value: number] }>();
const attrs = useAttrs();
const root = ref<HTMLElement | null>(null);
const dragging = ref(false);

const limits = computed(() => {
  const minimum = Math.min(100, Math.max(0, props.min));
  const maximum = Math.max(minimum, Math.min(100, props.max));
  return { minimum, maximum };
});
const value = computed(() =>
  Math.min(limits.value.maximum, Math.max(limits.value.minimum, model.value)),
);

watch(
  [() => model.value, limits],
  () => {
    if (model.value !== value.value) model.value = value.value;
  },
  { immediate: true },
);

const variantClasses: Readonly<Record<ResizableVariant, string[]>> = {
  surface: ["border-balsa-border", "bg-balsa-surface"],
  outline: ["border-balsa-border-strong", "bg-transparent"],
  soft: ["border-transparent", "bg-balsa-muted"],
  glass: ["border-balsa-border/60", "bg-balsa-surface/55", "backdrop-blur-md"],
};
const handleSizeClasses: Readonly<
  Record<ResizableOrientation, Record<ResizableSize, string>>
> = {
  horizontal: { sm: "w-1", md: "w-2", lg: "w-3" },
  vertical: { sm: "h-1", md: "h-2", lg: "h-3" },
};

const rootAttrs = computed(() => withoutClassAttribute(attrs));
const classes = computed(() =>
  mergeClasses(
    "grid min-h-0 min-w-0 overflow-hidden text-balsa-foreground",
    variantClasses[props.variant],
    surfaceRoundedClasses[props.rounded],
    dragging.value && "select-none",
    attrs.class,
  ),
);
const layoutStyle = computed(() =>
  props.orientation === "horizontal"
    ? {
        gridTemplateColumns: `minmax(0, ${value.value}fr) auto minmax(0, ${100 - value.value}fr)`,
      }
    : {
        gridTemplateRows: `minmax(0, ${value.value}fr) auto minmax(0, ${100 - value.value}fr)`,
      },
);
const panelClasses = computed(() =>
  props.orientation === "horizontal"
    ? "min-h-0 min-w-0 overflow-auto"
    : "min-h-0 min-w-0 overflow-auto",
);
const handleClasses = computed(() =>
  mergeClasses(
    "group relative z-10 flex shrink-0 touch-none items-center justify-center bg-balsa-border-strong text-balsa-muted-foreground outline-none transition-colors hover:bg-balsa-primary focus-visible:bg-balsa-primary focus-visible:text-balsa-primary-foreground focus-visible:ring-2 focus-visible:ring-balsa-focus-ring disabled:cursor-not-allowed",
    props.orientation === "horizontal" ? "h-full cursor-col-resize" : "w-full cursor-row-resize",
    handleSizeClasses[props.orientation][props.size],
    props.disabled && "cursor-not-allowed opacity-50",
  ),
);
const gripIcon = computed(() => props.orientation === "horizontal" ? GripVertical : GripHorizontal);

function update(next: number): void {
  const clamped = Math.min(
    limits.value.maximum,
    Math.max(limits.value.minimum, next),
  );
  if (clamped === value.value) return;
  model.value = clamped;
  emit("resize", clamped);
}

function updateFromPointer(event: PointerEvent): void {
  const element = root.value;
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const position = props.orientation === "horizontal"
    ? event.clientX - rect.left
    : event.clientY - rect.top;
  const length = props.orientation === "horizontal" ? rect.width : rect.height;
  if (length > 0) update((position / length) * 100);
}

function handlePointerDown(event: PointerEvent): void {
  if (props.disabled) return;
  dragging.value = true;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  updateFromPointer(event);
}

function handlePointerMove(event: PointerEvent): void {
  if (!dragging.value || props.disabled) return;
  event.preventDefault();
  updateFromPointer(event);
}

function handlePointerEnd(event: PointerEvent): void {
  dragging.value = false;
  const element = event.currentTarget as HTMLElement;
  if (element.hasPointerCapture(event.pointerId)) {
    element.releasePointerCapture(event.pointerId);
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (props.disabled) return;
  const step = Math.max(0.1, props.step);
  const decrease =
    (props.orientation === "horizontal" && event.key === "ArrowLeft") ||
    (props.orientation === "vertical" && event.key === "ArrowUp");
  const increase =
    (props.orientation === "horizontal" && event.key === "ArrowRight") ||
    (props.orientation === "vertical" && event.key === "ArrowDown");
  if (decrease) update(value.value - step);
  else if (increase) update(value.value + step);
  else if (event.key === "Home") update(limits.value.minimum);
  else if (event.key === "End") update(limits.value.maximum);
  else return;
  event.preventDefault();
}
</script>

<template>
  <div
    :id="props.id"
    ref="root"
    v-bind="rootAttrs"
    data-balsa="resizable"
    :data-rounded="props.rounded"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-orientation="props.orientation"
    :data-variant="props.variant"
    :data-size="props.size"
    :data-dragging="dragging"
    :data-shadow="props.shadow"
    :class="classes"
    :style="[layoutStyle, attrs.style, theme.explicitPresentation.value?.style]"
  >
    <section data-balsa="resizable-panel" :class="panelClasses">
      <slot name="first" />
    </section>
    <div
      data-balsa="resizable-handle"
      role="separator"
      :aria-label="props.label"
      :aria-orientation="props.orientation"
      :aria-valuemin="limits.minimum"
      :aria-valuemax="limits.maximum"
      :aria-valuenow="Math.round(value)"
      :aria-disabled="props.disabled"
      :tabindex="props.disabled ? undefined : 0"
      :class="handleClasses"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerEnd"
      @pointercancel="handlePointerEnd"
      @keydown="handleKeydown"
    >
      <Icon v-if="props.showGrip" :icon="gripIcon" size="sm" />
    </div>
    <section data-balsa="resizable-panel" :class="panelClasses">
      <slot name="second" />
    </section>
  </div>
</template>
