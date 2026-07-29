<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import Button from "./Button.vue";
import Input from "./Input.vue";
import Select, { type SelectOption } from "./Select.vue";
import type { FieldVariant } from "./form";
import { type Shadow, type ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

interface HsvColor {
  h: number;
  s: number;
  v: number;
}

export type ColorPickerType = "field" | "palette";
export type ColorPickerLabelPosition = "inside" | "outside";
export type ColorPickerSize = "sm" | "md" | "lg";
type ColorCodeFormat = "hex" | "rgb" | "hsl";
type Rounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

defineSlots<{
  actions(props: { close: () => Promise<void> }): unknown;
}>();

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    accessibleLabel?: string;
    description?: string;
    name?: string;
    disabled?: boolean;
    theme?: ThemeInput;
    type?: ColorPickerType;
    labelPosition?: ColorPickerLabelPosition;
    size?: ColorPickerSize;
    variant?: FieldVariant;
    rounded?: Rounded;
    shadow?: Shadow;
  }>(),
  {
    disabled: false,
    type: "field",
    labelPosition: "outside",
  },
);
const { props, theme } = useResolvedThemeProps(
  "color-picker",
  "fields",
  rawProps,
  { size: "md", variant: "surface", rounded: "lg", shadow: "auto" } as const,
);

const model = defineModel<string>({ default: "#000000" });
const root = ref<HTMLElement | null>(null);
const portalPresentation = computed(() => theme.presentationForPortal(root.value));
const trigger = ref<HTMLButtonElement | null>(null);
const popover = ref<HTMLElement | null>(null);
const saturationField = ref<HTMLElement | null>(null);
const open = ref(false);
const popoverVisible = ref(false);
const supportsPopover = ref(false);
const dragging = ref(false);
const saturationPointerId = ref<number | undefined>();
const hue = ref(0);
const saturation = ref(0);
const brightness = ref(0);
const colorCodeFormat = ref<ColorCodeFormat>("hex");
const colorCodeDraft = ref("#000000");
const colorCodeTouched = ref(false);
const locallyAppliedHex = ref<string | undefined>();
const popoverLeft = ref(0);
const popoverTop = ref(0);
let closePopoverTimeout: ReturnType<typeof setTimeout> | undefined;

const labelId = computed(() => `${props.id}-label`);
const valueId = computed(() => `${props.id}-value`);
const descriptionId = computed(() =>
  props.description ? `${props.id}-description` : undefined,
);
const popoverId = computed(() => `${props.id}-popover`);
const colorCodeInputId = computed(() => `${props.id}-color-code`);
const colorCodeFormatId = computed(() => `${props.id}-color-code-format`);
const colorCodeOptions: readonly SelectOption[] = [
  { label: "HEX", value: "hex" },
  { label: "RGB", value: "rgb" },
  { label: "HSL", value: "hsl" },
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function parseHex(value: string): string | undefined {
  const source = value.trim();
  const short = source.match(/^#?([\da-f]{3})$/i)?.[1];
  if (short) {
    return `#${short.split("").map((channel) => channel + channel).join("")}`.toLowerCase();
  }
  const full = source.match(/^#?([\da-f]{6})$/i)?.[1];
  return full ? `#${full.toLowerCase()}` : undefined;
}

function normalizeHex(value: string): string {
  return parseHex(value) ?? "#000000";
}

function channelsToHex(red: number, green: number, blue: number): string {
  const channel = (value: number) =>
    Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0");

  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

function parseRgb(value: string): string | undefined {
  const source = value.trim();
  const channels = source.match(
    /^rgb\(\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)\s*\)$/i,
  )?.slice(1).map(Number);

  if (!channels || channels.some((channel) => channel < 0 || channel > 255)) {
    return undefined;
  }

  return channelsToHex(channels[0], channels[1], channels[2]);
}

function parseHsl(value: string): string | undefined {
  const source = value.trim();
  const channels = source.match(
    /^hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*\)$/i,
  )?.slice(1).map(Number);

  if (!channels || channels[1] > 100 || channels[2] > 100) return undefined;

  const hue = ((channels[0] % 360) + 360) % 360;
  const saturation = channels[1] / 100;
  const lightness = channels[2] / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) [red, green] = [chroma, secondary];
  else if (segment < 2) [red, green] = [secondary, chroma];
  else if (segment < 3) [green, blue] = [chroma, secondary];
  else if (segment < 4) [green, blue] = [secondary, chroma];
  else if (segment < 5) [red, blue] = [chroma, secondary];
  else [red, blue] = [chroma, secondary];

  return channelsToHex(
    (red + match) * 255,
    (green + match) * 255,
    (blue + match) * 255,
  );
}

function formatNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function hexToHsl(value: string): { h: number; s: number; l: number } {
  const normalized = normalizeHex(value);
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  if (hue < 0) hue += 360;
  return {
    h: hue,
    s: delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1)),
    l: lightness,
  };
}

function formatColorCode(value: string, format: ColorCodeFormat): string {
  const normalized = normalizeHex(value);
  if (format === "hex") return normalized.toUpperCase();

  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  if (format === "rgb") return `rgb(${red}, ${green}, ${blue})`;

  const hsl = hexToHsl(normalized);
  return `hsl(${formatNumber(hsl.h)}, ${formatNumber(hsl.s * 100)}%, ${formatNumber(hsl.l * 100)}%)`;
}

function parseColorCode(
  value: string,
  format: ColorCodeFormat,
): string | undefined {
  if (format === "hex") return parseHex(value);
  if (format === "rgb") return parseRgb(value);
  return parseHsl(value);
}

function relativeLuminance(value: string): number {
  const hex = normalizeHex(value);
  const channels = [1, 3, 5].map((index) => {
    const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function hexToHsv(value: string): HsvColor {
  const normalized = normalizeHex(value);
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let nextHue = 0;

  if (delta !== 0) {
    if (max === red) nextHue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) nextHue = 60 * ((blue - red) / delta + 2);
    else nextHue = 60 * ((red - green) / delta + 4);
  }

  if (nextHue < 0) nextHue += 360;

  return {
    h: nextHue,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  };
}

function hsvToHex(color: HsvColor): string {
  const normalizedHue = ((color.h % 360) + 360) % 360;
  const normalizedSaturation = clamp(color.s) / 100;
  const normalizedBrightness = clamp(color.v) / 100;
  const chroma = normalizedBrightness * normalizedSaturation;
  const segment = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = normalizedBrightness - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) [red, green] = [chroma, secondary];
  else if (segment < 2) [red, green] = [secondary, chroma];
  else if (segment < 3) [green, blue] = [chroma, secondary];
  else if (segment < 4) [green, blue] = [secondary, chroma];
  else if (segment < 5) [red, blue] = [secondary, chroma];
  else [red, blue] = [chroma, secondary];

  const channel = (value: number) =>
    Math.round((value + match) * 255).toString(16).padStart(2, "0");

  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

const colorValue = computed(() => normalizeHex(model.value));
const displayValue = computed(() => colorValue.value.toUpperCase());
const validColorCodeDraft = computed(() =>
  Boolean(parseColorCode(colorCodeDraft.value, colorCodeFormat.value)),
);
const colorCodeStatus = computed<"default" | "unvalidated">(() =>
  colorCodeTouched.value && !validColorCodeDraft.value
    ? "unvalidated"
    : "default",
);
const colorCodePlaceholder = computed(() => {
  if (colorCodeFormat.value === "rgb") return "rgb(15, 118, 110)";
  if (colorCodeFormat.value === "hsl") return "hsl(175, 77%, 46%)";
  return "#0F766E";
});
const colorCodeStatusMessage = computed(() => {
  if (colorCodeFormat.value === "rgb") return "Use rgb(red, green, blue) with channels from 0 to 255.";
  if (colorCodeFormat.value === "hsl") return "Use hsl(hue, saturation%, lightness%).";
  return "Use a three- or six-digit hex value.";
});
const triggerStyle = computed(() => ({ backgroundColor: colorValue.value }));
const saturationStyle = computed(() => ({
  backgroundColor: `hsl(${hue.value} 100% 50%)`,
  backgroundImage:
    "linear-gradient(to top, rgb(0 0 0), transparent), linear-gradient(to right, rgb(255 255 255), transparent)",
}));
const saturationIndicatorStyle = computed(() => ({
  left: `${saturation.value}%`,
  top: `${100 - brightness.value}%`,
}));
const popoverStyle = computed(() => ({
  left: `${popoverLeft.value}px`,
  top: `${popoverTop.value}px`,
}));
const popoverMotionClasses = computed(() => [
  "origin-top transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none",
  popoverVisible.value
    ? "translate-y-0 opacity-100"
    : "pointer-events-none -translate-y-1 opacity-0",
]);
const isFieldLabelInside = computed(
  () => props.type === "field" && props.labelPosition === "inside",
);
const rootClasses = computed(() =>
  props.type === "palette"
    ? "flex h-full min-w-0 flex-1"
    : isFieldLabelInside.value
      ? "inline-flex shrink-0"
      : "inline-flex shrink-0 flex-col items-start gap-1",
);
const fieldSizeClasses: Readonly<Record<ColorPickerSize, string>> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-14",
};
const fieldLabelSizeClasses: Readonly<Record<ColorPickerSize, string>> = {
  sm: "text-xs",
  md: "text-xs",
  lg: "text-sm",
};
const fieldTagSizeClasses: Readonly<Record<ColorPickerSize, string>> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
};
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};
const triggerVariantClasses: Readonly<Record<FieldVariant, string>> = {
  outline: "border-balsa-border-strong",
  surface: "border-balsa-input-border ring-1 ring-balsa-input",
  soft: "border-transparent ring-2 ring-balsa-muted",
  glass: "border-balsa-border/70 ring-1 ring-balsa-border/50 backdrop-blur-md",
};
const outsideLabelClasses = computed(() =>
  props.type === "palette"
    ? "sr-only"
    : [
        "block whitespace-nowrap text-left text-balsa-muted-foreground",
        fieldLabelSizeClasses[props.size],
      ],
);
const triggerClasses = computed(() => [
  props.type === "palette"
    ? ["h-full w-full rounded-none border", triggerVariantClasses[props.variant]]
    : [
        "relative border",
        roundedClasses[props.rounded],
        fieldSizeClasses[props.size],
        triggerVariantClasses[props.variant],
      ],
  props.disabled
    ? "cursor-not-allowed border-balsa-disabled opacity-70"
    : "cursor-pointer border-balsa-border-strong hover:border-balsa-focus-ring",
]);
const colorTagClasses = computed(() => {
  return [
    "pointer-events-none absolute inset-1 flex items-center justify-center overflow-hidden px-1 text-center font-bold leading-tight",
    fieldTagSizeClasses[props.size],
  ];
});
const colorTagStyle = computed(() => {
  const luminance = relativeLuminance(colorValue.value);
  const whiteContrast = 1.05 / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;

  return {
    color: whiteContrast >= blackContrast ? "#FFFFFF" : "#000000",
  };
});

function applyHsv(next: HsvColor): void {
  hue.value = ((next.h % 360) + 360) % 360;
  saturation.value = clamp(next.s);
  brightness.value = clamp(next.v);
  const nextHex = hsvToHex({
    h: hue.value,
    s: saturation.value,
    v: brightness.value,
  });
  locallyAppliedHex.value = nextHex;
  colorCodeDraft.value = formatColorCode(nextHex, colorCodeFormat.value);
  colorCodeTouched.value = false;
  model.value = nextHex;
}

function applyColorCode(parsed: string): void {
  const hsv = hexToHsv(parsed);
  hue.value = hsv.h;
  saturation.value = hsv.s;
  brightness.value = hsv.v;
  locallyAppliedHex.value = parsed;
  model.value = parsed;
  colorCodeDraft.value = formatColorCode(parsed, colorCodeFormat.value);
  colorCodeTouched.value = false;
}

function updateColorCode(value: string | number): void {
  colorCodeTouched.value = true;
  colorCodeDraft.value = String(value);
  const parsed = parseColorCode(colorCodeDraft.value, colorCodeFormat.value);
  if (!parsed) return;

  applyColorCode(parsed);
}

function restoreColorCode(): void {
  if (!validColorCodeDraft.value) {
    colorCodeDraft.value = formatColorCode(colorValue.value, colorCodeFormat.value);
  }
  colorCodeTouched.value = false;
}

function updateSaturationFromPointer(event: PointerEvent): void {
  const field = saturationField.value;
  if (!field) return;
  const rect = field.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  const nextSaturation = ((event.clientX - rect.left) / rect.width) * 100;
  const nextBrightness = (1 - (event.clientY - rect.top) / rect.height) * 100;
  applyHsv({ h: hue.value, s: nextSaturation, v: nextBrightness });
}

function startSaturationDrag(event: PointerEvent): void {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  dragging.value = true;
  saturationPointerId.value = event.pointerId;
  saturationField.value?.setPointerCapture?.(event.pointerId);
  updateSaturationFromPointer(event);
}

function continueSaturationDrag(event: PointerEvent): void {
  if (!dragging.value || event.pointerId !== saturationPointerId.value) return;
  event.preventDefault();
  event.stopPropagation();
  updateSaturationFromPointer(event);
}

function stopSaturationDrag(event: PointerEvent): void {
  if (event.pointerId !== saturationPointerId.value) return;
  event.preventDefault();
  event.stopPropagation();
  dragging.value = false;
  saturationPointerId.value = undefined;
  saturationField.value?.releasePointerCapture?.(event.pointerId);
}

function handleSaturationKeydown(event: KeyboardEvent): void {
  const step = event.shiftKey ? 10 : 1;
  let nextSaturation = saturation.value;
  let nextBrightness = brightness.value;

  if (event.key === "ArrowLeft") nextSaturation -= step;
  else if (event.key === "ArrowRight") nextSaturation += step;
  else if (event.key === "ArrowUp") nextBrightness += step;
  else if (event.key === "ArrowDown") nextBrightness -= step;
  else return;

  event.preventDefault();
  applyHsv({ h: hue.value, s: nextSaturation, v: nextBrightness });
}

function updateHue(event: Event): void {
  applyHsv({
    h: Number((event.target as HTMLInputElement).value),
    s: saturation.value,
    v: brightness.value,
  });
}

function positionPopover(): void {
  if (!open.value || !trigger.value || !popover.value) return;
  const triggerRect = trigger.value.getBoundingClientRect();
  const popoverRect = popover.value.getBoundingClientRect();
  const width = popoverRect.width || 288;
  const height = popoverRect.height || 360;
  const viewportPadding = 12;
  const gap = 8;
  const centeredLeft = triggerRect.left + triggerRect.width / 2 - width / 2;
  popoverLeft.value = clamp(
    centeredLeft,
    viewportPadding,
    Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
  );
  popoverTop.value =
    triggerRect.bottom + gap + height <= window.innerHeight - viewportPadding
      ? triggerRect.bottom + gap
      : Math.max(viewportPadding, triggerRect.top - height - gap);
}

async function openPicker(): Promise<void> {
  if (props.disabled || open.value) return;
  if (closePopoverTimeout) {
    window.clearTimeout(closePopoverTimeout);
    closePopoverTimeout = undefined;
  }
  open.value = true;
  popoverVisible.value = false;
  await nextTick();
  positionPopover();
  if (
    supportsPopover.value
    && !popover.value?.matches(":popover-open")
  ) {
    popover.value?.showPopover();
  }
  await nextTick();
  positionPopover();
  document.getElementById(colorCodeInputId.value)?.focus();
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  if (open.value) popoverVisible.value = true;
}

async function closePicker(restoreFocus = false): Promise<void> {
  if (!open.value) return;
  open.value = false;
  popoverVisible.value = false;
  dragging.value = false;
  saturationPointerId.value = undefined;
  restoreColorCode();

  if (supportsPopover.value && popover.value?.matches(":popover-open")) {
    closePopoverTimeout = window.setTimeout(() => {
      if (!open.value && popover.value?.matches(":popover-open")) {
        popover.value.hidePopover();
      }
      closePopoverTimeout = undefined;
    }, 150);
  }
  if (restoreFocus) {
    await nextTick();
    trigger.value?.focus();
  }
}

function togglePicker(): void {
  if (open.value) void closePicker();
  else void openPicker();
}

function handleNativeToggle(): void {
  if (popover.value?.matches(":popover-open")) return;
  open.value = false;
  popoverVisible.value = false;
  dragging.value = false;
  saturationPointerId.value = undefined;
}

function handleDocumentPointerDown(event: PointerEvent): void {
  if (!open.value || root.value?.contains(event.target as Node)) return;
  void closePicker();
}

function handleViewportChange(): void {
  if (open.value) positionPopover();
}

watch(
  colorValue,
  (value) => {
    if (value === locallyAppliedHex.value) {
      locallyAppliedHex.value = undefined;
      colorCodeDraft.value = formatColorCode(value, colorCodeFormat.value);
      colorCodeTouched.value = false;
      return;
    }

    const hsv = hexToHsv(value);
    hue.value = hsv.h;
    saturation.value = hsv.s;
    brightness.value = hsv.v;
    colorCodeDraft.value = formatColorCode(value, colorCodeFormat.value);
    colorCodeTouched.value = false;
  },
  { immediate: true },
);

watch(colorCodeFormat, () => {
  colorCodeDraft.value = formatColorCode(colorValue.value, colorCodeFormat.value);
  colorCodeTouched.value = false;
});

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) void closePicker();
  },
);

onMounted(() => {
  supportsPopover.value = "showPopover" in HTMLElement.prototype;
  document.addEventListener("pointerdown", handleDocumentPointerDown, true);
  window.addEventListener("resize", handleViewportChange);
  window.addEventListener("scroll", handleViewportChange, true);
});

onBeforeUnmount(() => {
  if (closePopoverTimeout) window.clearTimeout(closePopoverTimeout);
  document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
  window.removeEventListener("resize", handleViewportChange);
  window.removeEventListener("scroll", handleViewportChange, true);
});
</script>

<template>
  <div
    ref="root"
    data-balsa="color-picker"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-rounded="props.rounded"
    :data-variant="props.variant"
    :class="rootClasses"
    :style="theme.explicitPresentation.value?.style"
  >
    <span
      v-if="!isFieldLabelInside"
      :id="labelId"
      :class="outsideLabelClasses"
    >
      {{ props.label }}
    </span>
    <button
      :id="props.id"
      ref="trigger"
      type="button"
      :disabled="props.disabled"
      :aria-label="props.accessibleLabel ? `${props.accessibleLabel}: ${displayValue}` : undefined"
      :aria-labelledby="props.accessibleLabel ? undefined : `${labelId} ${valueId}`"
      :aria-describedby="descriptionId"
      aria-haspopup="dialog"
      :aria-controls="popoverId"
      :aria-expanded="open"
      :title="displayValue"
      class="shrink-0 transition-[border-color,box-shadow,opacity] focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
      :class="triggerClasses"
      :style="triggerStyle"
      data-balsa-color-picker-trigger
      @click="togglePicker"
    >
      <span
        v-if="isFieldLabelInside"
        :id="labelId"
        :class="colorTagClasses"
        :style="colorTagStyle"
      >
        {{ props.label }}
      </span>
      <span class="sr-only">Choose {{ props.label }} color</span>
    </button>
    <output :id="valueId" class="sr-only">{{ displayValue }}</output>
    <input v-if="props.name" type="hidden" :name="props.name" :value="colorValue" />
    <span v-if="props.description" :id="descriptionId" class="sr-only">
      {{ props.description }}
    </span>

    <div
      data-balsa="color-picker-popover"
      :data-theme="portalPresentation.id"
      :data-theme-base="portalPresentation.base"
      :data-shadow="props.shadow"
      :id="popoverId"
      ref="popover"
      popover="auto"
      role="dialog"
      :aria-label="`Choose ${props.label} color`"
      :aria-hidden="!open"
      class="fixed z-[70] m-0 w-72 rounded-balsa-surface border border-balsa-border-strong bg-balsa-surface-elevated p-4 text-balsa-surface-elevated-foreground shadow-balsa-panel"
      :class="popoverMotionClasses"
      :style="[popoverStyle, portalPresentation.style]"
      data-balsa-color-picker-popover
      @toggle="handleNativeToggle"
      @keydown.esc.stop.prevent="closePicker(true)"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <small class="block truncate text-balsa-muted-foreground">{{ props.label }}</small>
          <p class="mt-1 text-sm font-bold">Choose a color</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <slot name="actions" :close="closePicker" />
          <Button
            :size="null"
            :theme="props.theme"
            variant="outline"
            prefix-icon="mdi-close"
            class="h-9 w-9 shrink-0 p-0"
            aria-label="Close color picker"
            @click="closePicker(true)"
          >
            <span class="sr-only">Close</span>
          </Button>
        </div>
      </div>

      <div
        ref="saturationField"
        role="slider"
        tabindex="0"
        aria-label="Saturation and brightness"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(saturation)"
        :aria-valuetext="`${displayValue}, ${Math.round(saturation)}% saturation, ${Math.round(brightness)}% brightness`"
        class="relative h-40 touch-none cursor-crosshair overflow-hidden rounded-balsa-control border border-balsa-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
        :style="saturationStyle"
        @pointerdown="startSaturationDrag"
        @pointermove="continueSaturationDrag"
        @pointerup="stopSaturationDrag"
        @pointercancel="stopSaturationDrag"
        @keydown="handleSaturationKeydown"
      >
        <span
          class="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-balsa-background ring-1 ring-balsa-foreground shadow-balsa-surface"
          :style="saturationIndicatorStyle"
          aria-hidden="true"
        ></span>
      </div>

      <label :for="`${props.id}-hue`" class="mt-4 block text-sm font-bold">Hue</label>
      <input
        :id="`${props.id}-hue`"
        type="range"
        min="0"
        max="360"
        step="1"
        :value="hue"
        aria-label="Hue"
        class="mt-2 h-3 w-full cursor-pointer appearance-none rounded-full border border-balsa-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-balsa-background [&::-moz-range-thumb]:bg-balsa-foreground [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-balsa-background [&::-webkit-slider-thumb]:bg-balsa-foreground"
        :style="{ backgroundImage: 'linear-gradient(to right, rgb(255 0 0), rgb(255 255 0), rgb(0 255 0), rgb(0 255 255), rgb(0 0 255), rgb(255 0 255), rgb(255 0 0))' }"
        @input="updateHue"
      />

      <div class="mt-5 grid grid-cols-[5.5rem_minmax(0,1fr)] items-end gap-2">
        <Select
          :id="colorCodeFormatId"
          v-model="colorCodeFormat"
          label=""
          aria-label="Color code format"
          :options="colorCodeOptions"
          size="sm"
          :variant="props.variant"
          :theme="props.theme"
          class="h-10 px-2 pr-7 text-xs"
        />
        <Input
          :id="colorCodeInputId"
          :model-value="colorCodeDraft"
          label="Color code"
          :placeholder="colorCodePlaceholder"
          autocomplete="off"
          spellcheck="false"
          size="sm"
          :variant="props.variant"
          :status="colorCodeStatus"
          :theme="props.theme"
          :status-message="colorCodeStatusMessage"
          @update:model-value="updateColorCode"
          @blur="restoreColorCode"
        />
      </div>
    </div>
  </div>
</template>
