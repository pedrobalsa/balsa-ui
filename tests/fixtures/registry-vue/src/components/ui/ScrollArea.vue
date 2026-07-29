<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";
export type ScrollAreaVisibility = "auto" | "always" | "hover";
export type ScrollAreaSize = "thin" | "regular";
export interface ScrollAreaScrollOptions {
  top?: number;
  left?: number;
  behavior?: "auto" | "smooth";
}

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    label: string;
    orientation?: ScrollAreaOrientation;
    visibility?: ScrollAreaVisibility;
    size?: ScrollAreaSize;
    edgeFade?: boolean;
    rounded?: Rounded;
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    orientation: "vertical",
    visibility: "auto",
    edgeFade: false,
  },
);
const { props, theme } = useResolvedThemeProps(
  "scroll-area",
  "surfaces",
  rawProps,
  { size: "regular", rounded: "lg", shadow: "auto" } as const,
);

const emit = defineEmits<{ scroll: [event: Event] }>();
const attrs = useAttrs();
const viewport = ref<HTMLElement | null>(null);

const overflowClasses: Readonly<Record<ScrollAreaOrientation, string[]>> = {
  vertical: ["overflow-x-hidden", "overflow-y-auto"],
  horizontal: ["overflow-x-auto", "overflow-y-hidden"],
  both: ["overflow-auto"],
};

const rootAttrs = computed(() => withoutClassAttribute(attrs));
const classes = computed(() =>
  mergeClasses(
    "relative min-h-0 min-w-0 overflow-hidden border border-balsa-border bg-balsa-surface",
    roundedClasses[props.rounded],
    attrs.class,
  ),
);
const viewportClasses = computed(() =>
  mergeClasses(
    "size-full min-h-0 min-w-0 overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-balsa-focus-ring",
    overflowClasses[props.orientation],
    roundedClasses[props.rounded],
  ),
);

function scrollTo(options: ScrollAreaScrollOptions): void {
  viewport.value?.scrollTo(options);
}

function scrollBy(options: ScrollAreaScrollOptions): void {
  viewport.value?.scrollBy(options);
}

defineExpose({ viewport, scrollTo, scrollBy });
</script>

<template>
  <div
    v-bind="rootAttrs"
    data-balsa="scroll-area"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-orientation="props.orientation"
    :data-visibility="props.visibility"
    :data-size="props.size"
    :data-edge-fade="props.edgeFade"
    :data-shadow="props.shadow"
    :class="classes"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
  >
    <div
      ref="viewport"
      data-balsa="scroll-area-viewport"
      role="region"
      :aria-label="props.label"
      tabindex="0"
      :class="viewportClasses"
      @scroll="emit('scroll', $event)"
    >
      <slot />
    </div>
  </div>
</template>
