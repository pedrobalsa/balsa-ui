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
import { mergeClasses } from "./classes";
import {
  getAnchoredLayerPosition,
  type AnchoredAlign,
  type AnchoredSide,
  type LayerVariant,
} from "./anchored-layer";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export type PopupVariant = LayerVariant;
export type PopupSize = "sm" | "md" | "lg" | "trigger";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    side?: AnchoredSide;
    align?: AnchoredAlign;
    sideOffset?: number;
    alignOffset?: number;
    variant?: PopupVariant;
    size?: PopupSize;
    rounded?: Rounded;
    shadow?: Shadow;
    contained?: boolean;
    disabled?: boolean;
    initialFocus?: boolean;
    dismissOnOutside?: boolean;
    triggerAriaLabelledby?: string;
    triggerAriaDescribedby?: string;
    triggerAriaInvalid?: boolean;
    triggerAriaRequired?: boolean;
    theme?: ThemeInput;
  }>(),
  {
    side: "bottom",
    align: "center",
    sideOffset: 8,
    alignOffset: 0,
    contained: false,
    disabled: false,
    initialFocus: true,
    dismissOnOutside: true,
  },
);
const { props, theme } = useResolvedThemeProps(
  "popup",
  "overlays",
  rawProps,
  { variant: "surface", size: "md", rounded: "lg", shadow: "auto" } as const,
);

const model = defineModel<boolean>({ default: false });
const attrs = useAttrs();
const root = ref<HTMLElement | null>(null);
const portalPresentation = computed(() => theme.presentationForPortal(root.value));
const trigger = ref<HTMLButtonElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const resolvedPalette = ref<string>();
const resolvedSide = ref<AnchoredSide>(props.side);
const position = ref({ left: 0, top: 0, maxWidth: 0, maxHeight: 0 });

const variantClasses: Readonly<Record<PopupVariant, string[]>> = {
  surface: ["border-balsa-border-strong bg-balsa-surface-elevated text-balsa-surface-elevated-foreground"],
  outline: ["border-balsa-border-strong bg-balsa-background text-balsa-foreground"],
  soft: ["border-balsa-border bg-balsa-muted text-balsa-foreground"],
  glass: ["border-balsa-border/70 bg-balsa-surface/80 text-balsa-surface-foreground backdrop-blur-md"],
};
const sizeClasses: Readonly<Record<PopupSize, string>> = {
  sm: "w-64",
  md: "w-80",
  lg: "w-96",
  trigger: "w-[var(--balsa-popup-trigger-width)]",
};
const triggerClasses = computed(() =>
  mergeClasses(
    "inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-balsa-border-strong bg-balsa-surface px-3 py-1.5 text-sm font-semibold text-balsa-surface-foreground transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring disabled:cursor-not-allowed disabled:bg-balsa-disabled disabled:text-balsa-disabled-foreground",
  ),
);
const panelClasses = computed(() =>
  mergeClasses(
    "z-[60] max-w-[calc(100vw-1rem)] overflow-auto border p-3 shadow-balsa-panel outline-none transition-[opacity,transform] duration-150",
    props.contained ? "absolute" : "fixed",
    sizeClasses[props.size],
    roundedClasses[props.rounded],
    variantClasses[props.variant],
    attrs.class,
  ),
);
const panelStyle = computed(() => ({
  left: `${position.value.left}px`,
  top: `${position.value.top}px`,
  maxWidth: `${position.value.maxWidth}px`,
  maxHeight: `${position.value.maxHeight}px`,
  "--balsa-popup-trigger-width": `${trigger.value?.getBoundingClientRect().width ?? 0}px`,
  ...(typeof attrs.style === "object" ? attrs.style : {}),
}));

function resolveContext(): void {
  resolvedPalette.value = typeof attrs["data-palette"] === "string"
    ? attrs["data-palette"]
    : root.value?.closest<HTMLElement>("[data-palette]")?.dataset.palette;
}

function updatePosition(): void {
  if (!trigger.value || !panel.value || !model.value) return;
  const next = getAnchoredLayerPosition(trigger.value, panel.value, {
    side: props.side,
    align: props.align,
    sideOffset: props.sideOffset,
    alignOffset: props.alignOffset,
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

function focusPanel(): void {
  const first = panel.value?.querySelector<HTMLElement>(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  (first ?? panel.value)?.focus();
}

function close(restoreFocus = true): void {
  model.value = false;
  if (restoreFocus) void nextTick(() => trigger.value?.focus());
}

function handleDocumentPointer(event: PointerEvent): void {
  if (!model.value || !props.dismissOnOutside) return;
  const target = event.target as Node;
  if (root.value?.contains(target) || panel.value?.contains(target)) return;
  close(false);
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== "Escape" || !model.value) return;
  event.preventDefault();
  close();
}

watch(
  [model, () => props.side, () => props.align, () => props.theme],
  async ([open]) => {
    resolveContext();
    if (!open) return;
    await nextTick();
    updatePosition();
    if (props.initialFocus) focusPanel();
  },
  { immediate: true },
);

onMounted(() => {
  resolveContext();
  document.addEventListener("pointerdown", handleDocumentPointer, true);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", updatePosition, { passive: true });
  window.addEventListener("scroll", updatePosition, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointer, true);
  document.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("resize", updatePosition);
  window.removeEventListener("scroll", updatePosition, true);
});
</script>

<template>
  <span
    ref="root"
    data-balsa="popup"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :style="theme.explicitPresentation.value?.style"
    :data-palette="typeof attrs['data-palette'] === 'string' ? attrs['data-palette'] : undefined"
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
      :aria-labelledby="props.triggerAriaLabelledby"
      :aria-describedby="props.triggerAriaDescribedby"
      :aria-invalid="props.triggerAriaInvalid || undefined"
      :aria-required="props.triggerAriaRequired || undefined"
      aria-haspopup="dialog"
      :class="triggerClasses"
      @click="model = !model"
    >
      <slot name="trigger">Open popup</slot>
    </button>

    <Teleport to="body" :disabled="props.contained">
      <Transition
        enter-active-class="transition-[opacity,transform] duration-150 ease-out"
        enter-from-class="translate-y-1 opacity-0"
        leave-active-class="transition-[opacity,transform] duration-100 ease-in"
        leave-to-class="translate-y-1 opacity-0"
      >
        <section
          v-if="model"
          :id="props.id"
          ref="panel"
          data-balsa="popup-panel"
          :data-theme="portalPresentation.id"
          :data-theme-base="portalPresentation.base"
          :data-palette="resolvedPalette"
          :data-side="resolvedSide"
          :data-variant="props.variant"
          :data-rounded="props.rounded"
          :data-shadow="props.shadow"
          role="dialog"
          :aria-label="props.label"
          tabindex="-1"
          :class="panelClasses"
          :style="[panelStyle, portalPresentation.style]"
          @keydown="handleKeydown"
        >
          <slot :close="close" />
        </section>
      </Transition>
    </Teleport>
  </span>
</template>
