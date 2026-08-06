<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useAttrs, watch } from "vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "rounded" | "square";
export type AvatarLoadState = "idle" | "loading" | "loaded" | "error";

defineOptions({ name: "BalsaAvatar", inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    src?: string;
    label: string;
    fallback?: string;
    size?: AvatarSize;
    shape?: AvatarShape;
    loading?: "eager" | "lazy";
    fallbackDelay?: number;
    theme?: ThemeInput;
  }>(),
  {
    loading: "lazy",
    fallbackDelay: 0,
  },
);
const { props, theme } = useResolvedThemeProps(
  "avatar",
  "controls",
  rawProps,
  { size: "md", shape: "circle" } as const,
);

const emit = defineEmits<{
  loadState: [state: AvatarLoadState];
}>();

const attrs = useAttrs();
const loadState = ref<AvatarLoadState>("idle");
const fallbackReady = ref(true);
let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

const sizeClasses: Readonly<Record<AvatarSize, string[]>> = {
  sm: ["size-8", "text-xs"],
  md: ["size-10", "text-sm"],
  lg: ["size-14", "text-base"],
  xl: ["size-20", "text-xl"],
};
const shapeClasses: Readonly<Record<AvatarShape, string>> = {
  circle: "rounded-full",
  rounded: "rounded-balsa-control",
  square: "rounded-none",
};

function initials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join("") || "?";
}

function setLoadState(state: AvatarLoadState): void {
  loadState.value = state;
  emit("loadState", state);
}

function clearFallbackTimer(): void {
  if (fallbackTimer !== undefined) {
    clearTimeout(fallbackTimer);
    fallbackTimer = undefined;
  }
}

function prepareImage(): void {
  clearFallbackTimer();
  if (!props.src) {
    fallbackReady.value = true;
    setLoadState("idle");
    return;
  }
  setLoadState("loading");
  const delay = Math.max(0, props.fallbackDelay);
  fallbackReady.value = delay === 0;
  if (delay > 0) {
    fallbackTimer = setTimeout(() => {
      fallbackReady.value = true;
      fallbackTimer = undefined;
    }, delay);
  }
}

function handleLoad(): void {
  clearFallbackTimer();
  setLoadState("loaded");
}

function handleError(): void {
  clearFallbackTimer();
  fallbackReady.value = true;
  setLoadState("error");
}

watch(() => props.src, prepareImage, { immediate: true });
onBeforeUnmount(clearFallbackTimer);

const fallbackText = computed(() => props.fallback?.trim() || initials(props.label));
const showFallback = computed(
  () => loadState.value !== "loaded" && fallbackReady.value,
);
const rootAttrs = computed(() => withoutClassAttribute(attrs));
const classes = computed(() =>
  mergeClasses(
    "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden border border-balsa-border bg-balsa-muted font-balsa-body font-medium text-balsa-muted-foreground",
    sizeClasses[props.size],
    shapeClasses[props.shape],
    attrs.class,
  ),
);
const imageClasses = computed(() =>
  mergeClasses("absolute inset-0 size-full object-cover", shapeClasses[props.shape]),
);
</script>

<template>
  <span
    v-bind="rootAttrs"
    data-balsa="avatar"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    :data-size="props.size"
    :data-shape="props.shape"
    :data-load-state="loadState"
    :aria-label="props.label"
    role="img"
    :class="classes"
  >
    <span
      v-if="showFallback"
      data-balsa="avatar-fallback"
      aria-hidden="true"
    >
      <slot name="fallback">{{ fallbackText }}</slot>
    </span>
    <img
      v-if="props.src"
      data-balsa="avatar-image"
      :src="props.src"
      alt=""
      :loading="props.loading"
      :class="imageClasses"
      @load="handleLoad"
      @error="handleError"
    />
    <span
      v-if="$slots.badge"
      data-balsa="avatar-badge"
      class="absolute bottom-0 right-0"
      aria-hidden="true"
    >
      <slot name="badge" />
    </span>
  </span>
</template>
