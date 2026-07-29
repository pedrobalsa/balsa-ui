<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import Toggle, {
  type ToggleSize,
  type ToggleVariant,
} from "./Toggle.vue";
import { type Shadow, type ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import type { ActionColor } from "./types";

export interface ToggleGroupOption {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export type ToggleGroupType = "single" | "multiple";
export type ToggleGroupOrientation = "horizontal" | "vertical";

const rawProps = withDefaults(
  defineProps<{
    options: readonly ToggleGroupOption[];
    label: string;
    type?: ToggleGroupType;
    orientation?: ToggleGroupOrientation;
    allowEmpty?: boolean;
    disabled?: boolean;
    variant?: ToggleVariant;
    color?: ActionColor;
    size?: ToggleSize;
    rounded?: Rounded;
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    type: "single",
    orientation: "horizontal",
    allowEmpty: true,
    disabled: false,
    color: "primary",
  },
);
const { props, theme } = useResolvedThemeProps(
  "toggle-group",
  "controls",
  rawProps,
  { variant: "surface", size: "md", rounded: "lg", shadow: "auto" } as const,
);

const model = defineModel<string | readonly string[]>({ required: true });
const rootElement = ref<HTMLElement | null>(null);
const rovingIndex = ref(0);

const enabledIndexes = computed(() =>
  props.options
    .map((option, index) => (!props.disabled && !option.disabled ? index : -1))
    .filter((index) => index >= 0),
);

const rootClasses = computed(() =>
  mergeClasses(
    "inline-flex w-fit max-w-full cursor-pointer overflow-auto border border-balsa-border-strong bg-balsa-surface",
    props.orientation === "horizontal" ? "flex-row" : "flex-col",
    roundedClasses[props.rounded],
  ),
);

function isPressed(id: string): boolean {
  return Array.isArray(model.value)
    ? model.value.includes(id)
    : model.value === id;
}

function isDisabled(option: ToggleGroupOption): boolean {
  return props.disabled || option.disabled === true;
}

function setPressed(id: string, pressed: boolean): void {
  if (props.type === "multiple") {
    const current = Array.isArray(model.value) ? [...model.value] : [];
    model.value = pressed
      ? [...new Set([...current, id])]
      : current.filter((value) => value !== id);
    return;
  }

  if (pressed) {
    model.value = id;
  } else if (props.allowEmpty) {
    model.value = "";
  }
}

function focusIndex(index: number): void {
  rovingIndex.value = index;
  void nextTick(() => {
    rootElement.value
      ?.querySelectorAll<HTMLButtonElement>('[data-balsa="toggle"]')
      .item(index)
      .focus();
  });
}

function moveFocus(currentIndex: number, direction: 1 | -1): void {
  const indexes = enabledIndexes.value;
  if (indexes.length === 0) return;
  const position = indexes.indexOf(currentIndex);
  const nextPosition = position < 0
    ? 0
    : (position + direction + indexes.length) % indexes.length;
  focusIndex(indexes[nextPosition] ?? indexes[0] ?? 0);
}

function onKeydown(event: KeyboardEvent, index: number): void {
  const forward =
    (props.orientation === "horizontal" && event.key === "ArrowRight") ||
    (props.orientation === "vertical" && event.key === "ArrowDown");
  const backward =
    (props.orientation === "horizontal" && event.key === "ArrowLeft") ||
    (props.orientation === "vertical" && event.key === "ArrowUp");

  if (forward || backward) {
    event.preventDefault();
    moveFocus(index, forward ? 1 : -1);
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    const indexes = enabledIndexes.value;
    const target = event.key === "Home" ? indexes[0] : indexes.at(-1);
    if (target !== undefined) focusIndex(target);
  }
}

function itemClasses(index: number): string {
  return mergeClasses(
    "relative shrink-0 rounded-none border-0 shadow-none focus-visible:z-10",
    props.orientation === "horizontal"
      ? index === 0 ? "" : "border-l border-balsa-border-strong"
      : index === 0 ? "" : "border-t border-balsa-border-strong",
  );
}

watch(
  [() => props.options, () => model.value, enabledIndexes],
  () => {
    const selectedIndex = props.options.findIndex(
      (option) => isPressed(option.id) && !isDisabled(option),
    );
    const fallback = enabledIndexes.value[0] ?? -1;
    if (selectedIndex >= 0) rovingIndex.value = selectedIndex;
    else if (!enabledIndexes.value.includes(rovingIndex.value)) {
      rovingIndex.value = fallback;
    }
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div
    ref="rootElement"
    data-balsa="toggle-group"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-type="props.type"
    :data-orientation="props.orientation"
    :data-disabled="props.disabled || undefined"
    :data-shadow="props.shadow"
    role="group"
    :aria-label="props.label"
    :class="rootClasses"
    :style="theme.explicitPresentation.value?.style"
  >
    <Toggle
      v-for="(option, index) in props.options"
      :key="option.id"
      :model-value="isPressed(option.id)"
      :variant="props.variant"
      :color="props.color"
      :size="props.size"
      rounded="none"
      :prefix-icon="option.icon"
      :disabled="isDisabled(option)"
      :theme="props.theme"
      :aria-label="option.label"
      :tabindex="rovingIndex === index && !isDisabled(option) ? 0 : -1"
      :class="itemClasses(index)"
      @update:model-value="setPressed(option.id, $event)"
      @focus="rovingIndex = index"
      @keydown="onKeydown($event, index)"
    >
      {{ option.label }}
    </Toggle>
  </div>
</template>
