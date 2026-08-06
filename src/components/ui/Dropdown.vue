<script setup lang="ts">
defineOptions({ name: "BalsaDropdown" });

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import type { ThemeInput } from "./theme";
import type { Shadow } from "./theme";
import type { ActionColor } from "./types";
import { roundedClasses, type Rounded } from "./form";
import { useResolvedThemeProps } from "./theme-context";

export type DropdownVariant = "surface" | "outline" | "soft" | "glass";
export type DropdownAlign = "auto" | "start" | "end" | "center";
export type DropdownWidth = "sm" | "md" | "lg" | "xl";
type ResolvedDropdownAlign = Exclude<DropdownAlign, "auto">;

const rawProps = withDefaults(
  defineProps<{
    open: boolean;
    variant?: DropdownVariant;
    color?: ActionColor;
    align?: DropdownAlign;
    width?: DropdownWidth;
    rounded?: Rounded;
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    color: "primary",
    align: "start",
    width: "md",
  },
);
const { props, theme } = useResolvedThemeProps(
  "dropdown",
  "overlays",
  rawProps,
  { variant: "surface", rounded: "lg", shadow: "auto" } as const,
);

const variantClasses: Readonly<Record<DropdownVariant, string[]>> = {
  surface: ["bg-balsa-background/90", "text-balsa-foreground", "backdrop-blur-xl"],
  outline: ["bg-balsa-background/80", "text-balsa-foreground", "backdrop-blur-xl"],
  soft: ["text-balsa-foreground", "backdrop-blur-xl"],
  glass: ["text-balsa-surface-elevated-foreground", "backdrop-blur-md"],
};
const colorClasses: Readonly<Record<ActionColor, Record<DropdownVariant, string[]>>> = {
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

const rootElement = ref<HTMLElement | null>(null);
const resolvedAlign = ref<ResolvedDropdownAlign>(
  props.align === "auto" ? "start" : props.align,
);

const alignClasses: Readonly<Record<ResolvedDropdownAlign, string[]>> = {
  start: ["left-0"],
  end: ["right-0"],
  center: ["left-1/2", "-translate-x-1/2"],
};
const widthClasses: Readonly<Record<DropdownWidth, string>> = {
  sm: "w-[min(16rem,calc(100vw-2rem))]",
  md: "w-[min(22rem,calc(100vw-2rem))]",
  lg: "w-[min(28rem,calc(100vw-2rem))]",
  xl: "w-[min(36rem,calc(100vw-2rem))]",
};

function resolveAutoAlignment(): void {
  if (props.align !== "auto") {
    resolvedAlign.value = props.align;
    return;
  }

  void nextTick(() => {
    const bounds = rootElement.value?.getBoundingClientRect();
    if (!bounds) return;

    const viewportInset = 16;
    if (bounds.right > window.innerWidth - viewportInset) {
      resolvedAlign.value = "end";
    } else if (bounds.left < viewportInset) {
      resolvedAlign.value = "start";
    }
  });
}

const stateClasses = computed(() =>
  props.open
    ? ["visible", "translate-y-0", "opacity-100"]
    : ["invisible", "pointer-events-none", "-translate-y-1", "opacity-0"],
);

const classes = computed(() => [
  "absolute top-full z-50 mt-2 border p-2 transition-[opacity,transform,visibility] duration-150 ease-out",
  widthClasses[props.width],
  roundedClasses[props.rounded],
  ...alignClasses[resolvedAlign.value],
  ...variantClasses[props.variant],
  ...colorClasses[props.color][props.variant],
  ...stateClasses.value,
]);

watch(() => [props.align, props.open], resolveAutoAlignment, { immediate: true });

onMounted(() => {
  resolveAutoAlignment();
  window.addEventListener("resize", resolveAutoAlignment, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resolveAutoAlignment);
});
</script>

<template>
  <div
    ref="rootElement"
    data-balsa="dropdown"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="props.variant"
    :data-color="props.color"
    :data-align="resolvedAlign"
    :data-width="props.width"
    :data-rounded="props.rounded"
    :data-state="props.open ? 'open' : 'closed'"
    :data-shadow="props.shadow"
    :aria-hidden="!props.open"
    :class="classes"
    :style="theme.explicitPresentation.value?.style"
  >
    <slot />
  </div>
</template>
