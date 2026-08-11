<script setup lang="ts">
import { X } from "@lucide/vue";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useAttrs,
  watch,
} from "vue";
import { mergeClasses } from "./classes";
import type { LayerVariant } from "./anchored-layer";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import Icon from "./Icon.vue";

export type DrawerSide = "left" | "right" | "top" | "bottom";
export type DrawerSize = "sm" | "md" | "lg";

defineOptions({ name: "BalsaDrawer", inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    title: string;
    description?: string;
    side?: DrawerSide;
    size?: DrawerSize;
    variant?: LayerVariant;
    rounded?: Rounded;
    shadow?: Shadow;
    contained?: boolean;
    dismissible?: boolean;
    showHandle?: boolean;
    closeLabel?: string;
    initialFocus?: string;
    theme?: ThemeInput;
  }>(),
  {
    side: "bottom",
    contained: false,
    dismissible: true,
    showHandle: false,
    closeLabel: "Close drawer",
  },
);
const { props, theme } = useResolvedThemeProps(
  "drawer",
  "overlays",
  rawProps,
  { size: "md", variant: "surface", rounded: "2xl", shadow: "auto" } as const,
);

const model = defineModel<boolean>({ default: false });
const attrs = useAttrs();
const anchor = ref<HTMLElement | null>(null);
const portalPresentation = computed(() => theme.presentationForPortal(anchor.value));
const drawer = ref<HTMLDialogElement | null>(null);
const resolvedPalette = ref<string>();
const dragOffset = ref(0);
const isPresent = ref(false);
const motionState = ref<"closed" | "opening" | "open" | "closing">("closed");
let returnFocus: HTMLElement | null = null;
let previousOverflow = "";
let dragStart = 0;
let dragging = false;
let animationFrame = 0;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

const titleId = computed(() => `${props.id}-title`);
const descriptionId = computed(() =>
  props.description ? `${props.id}-description` : undefined,
);
const vertical = computed(() => props.side === "top" || props.side === "bottom");
const variantClasses: Readonly<Record<LayerVariant, string[]>> = {
  surface: ["border-balsa-border-strong bg-balsa-surface-elevated text-balsa-surface-elevated-foreground"],
  outline: ["border-balsa-border-strong bg-balsa-background text-balsa-foreground"],
  soft: ["border-balsa-border bg-balsa-muted text-balsa-foreground"],
  glass: ["border-balsa-border/70 bg-balsa-surface/85 text-balsa-surface-foreground backdrop-balsa"],
};
const sideClasses: Readonly<Record<DrawerSide, string[]>> = {
  bottom: ["bottom-0 left-0 right-0 top-auto border-b-0"],
  top: ["bottom-auto left-0 right-0 top-0 border-t-0"],
  left: ["bottom-0 left-0 right-auto top-0 border-l-0"],
  right: ["bottom-0 left-auto right-0 top-0 border-r-0"],
};
const edgeRoundedClasses: Readonly<Record<DrawerSide, string>> = {
  bottom: "rounded-b-none",
  top: "rounded-t-none",
  left: "rounded-l-none",
  right: "rounded-r-none",
};
const motionClasses: Readonly<Record<DrawerSide, string>> = {
  bottom: "translate-y-full",
  top: "-translate-y-full",
  left: "-translate-x-full",
  right: "translate-x-full",
};
const handlePositionClasses: Readonly<Record<DrawerSide, string>> = {
  bottom: "left-1/2 top-3 h-1.5 w-14 -translate-x-1/2 cursor-ns-resize",
  top: "bottom-3 left-1/2 h-1.5 w-14 -translate-x-1/2 cursor-ns-resize",
  left: "right-3 top-1/2 h-14 w-1.5 -translate-y-1/2 cursor-ew-resize",
  right: "left-3 top-1/2 h-14 w-1.5 -translate-y-1/2 cursor-ew-resize",
};
const sizeClasses: Readonly<Record<DrawerSize, Record<"vertical" | "horizontal", string>>> = {
  sm: { vertical: "max-h-[min(20rem,calc(100dvh-3rem))]", horizontal: "w-[min(20rem,calc(100vw-3rem))]" },
  md: { vertical: "max-h-[min(32rem,calc(100dvh-3rem))]", horizontal: "w-[min(26rem,calc(100vw-3rem))]" },
  lg: { vertical: "max-h-[calc(100dvh-3rem)]", horizontal: "w-[min(36rem,calc(100vw-1rem))]" },
};
const drawerClasses = computed(() =>
  mergeClasses(
    "inset-auto m-0 flex max-w-none flex-col border p-0 shadow-balsa-panel outline-none open:flex transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none [&::backdrop]:bg-balsa-overlay [&::backdrop]:backdrop-balsa-overlay",
    props.contained ? "absolute z-50" : "fixed",
    vertical.value ? "h-auto w-full" : "h-full max-h-none",
    sideClasses[props.side],
    sizeClasses[props.size][vertical.value ? "vertical" : "horizontal"],
    roundedClasses[props.rounded],
    edgeRoundedClasses[props.side],
    variantClasses[props.variant],
    motionState.value === "open" ? "translate-x-0 translate-y-0 opacity-100" : [motionClasses[props.side], "opacity-0"],
    attrs.class,
  ),
);
const drawerStyle = computed(() => {
  const signedOffset = props.side === "top" || props.side === "left"
    ? -dragOffset.value
    : dragOffset.value;
  return {
    transform: dragOffset.value > 0
      ? vertical.value
        ? `translateY(${signedOffset}px)`
        : `translateX(${signedOffset}px)`
      : undefined,
    ...(typeof attrs.style === "object" ? attrs.style : {}),
  };
});
const handleClasses = computed(() => [
  "absolute z-10 rounded-full bg-balsa-border-strong",
  handlePositionClasses[props.side],
]);
const containedBackdropClasses = computed(() => [
  "absolute inset-0 z-40 bg-balsa-overlay backdrop-balsa transition-opacity duration-200 motion-reduce:transition-none",
  motionState.value === "open" ? "opacity-100" : "opacity-0",
]);
const headerClasses = computed(() => [
  "flex shrink-0 items-start justify-between gap-balsa-lg border-b border-balsa-border p-balsa-xl",
  props.showHandle && vertical.value ? "pt-10" : "",
  props.showHandle && props.side === "left" ? "pr-10" : "",
  props.showHandle && props.side === "right" ? "pl-10" : "",
]);

function resolveContext(): void {
  resolvedPalette.value = typeof attrs["data-palette"] === "string"
    ? attrs["data-palette"]
    : anchor.value?.closest<HTMLElement>("[data-palette]")?.dataset.palette;
}

function close(): void {
  model.value = false;
}

function dismiss(): void {
  if (props.dismissible) close();
}

function handleCancel(event: Event): void {
  event.preventDefault();
  dismiss();
}

function handleBackdropClick(event: MouseEvent): void {
  const element = drawer.value;
  if (!props.dismissible || !element || event.target !== element) return;
  const rect = element.getBoundingClientRect();
  const outside = event.clientX < rect.left
    || event.clientX > rect.right
    || event.clientY < rect.top
    || event.clientY > rect.bottom;
  if (outside) dismiss();
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== "Tab" || !model.value) return;
  const focusable = Array.from(
    drawer.value?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  );
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) {
    event.preventDefault();
    drawer.value?.focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function pointerCoordinate(event: PointerEvent): number {
  return vertical.value ? event.clientY : event.clientX;
}

function beginDrag(event: PointerEvent): void {
  if (!props.dismissible) return;
  dragging = true;
  dragStart = pointerCoordinate(event);
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function updateDrag(event: PointerEvent): void {
  if (!dragging) return;
  const delta = pointerCoordinate(event) - dragStart;
  const outward = props.side === "top" || props.side === "left" ? -delta : delta;
  dragOffset.value = Math.max(0, outward);
}

function endDrag(): void {
  if (!dragging) return;
  dragging = false;
  const shouldClose = dragOffset.value >= 80;
  dragOffset.value = 0;
  if (shouldClose) dismiss();
}

function restoreAfterClose(): void {
  document.documentElement.style.overflow = previousOverflow;
  if (returnFocus?.isConnected) returnFocus.focus();
  returnFocus = null;
}

function finishClose(): void {
  if (drawer.value?.open && !props.contained) drawer.value.close();
  isPresent.value = false;
  motionState.value = "closed";
  restoreAfterClose();
}

async function openDrawer(): Promise<void> {
  if (closeTimer) clearTimeout(closeTimer);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  resolveContext();
  if (!isPresent.value) {
    returnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    isPresent.value = true;
    previousOverflow = document.documentElement.style.overflow;
    if (!props.contained) document.documentElement.style.overflow = "hidden";
  }
  motionState.value = "opening";
  await nextTick();
  if (!model.value) return;
  if (!props.contained && drawer.value && !drawer.value.open) drawer.value.showModal();
  const initial = props.initialFocus
    ? drawer.value?.querySelector<HTMLElement>(props.initialFocus)
    : drawer.value?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
  (initial ?? drawer.value)?.focus();
  animationFrame = requestAnimationFrame(() => {
    if (model.value) motionState.value = "open";
  });
}

function closeDrawer(): void {
  if (!isPresent.value) return;
  if (animationFrame) cancelAnimationFrame(animationFrame);
  motionState.value = "closing";
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(finishClose, 200);
}

watch(model, (open) => {
  if (open) void openDrawer();
  else closeDrawer();
}, { immediate: true });

onBeforeUnmount(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (closeTimer) clearTimeout(closeTimer);
  if (isPresent.value) restoreAfterClose();
});
</script>

<template>
  <span
    ref="anchor"
    data-balsa="drawer"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :style="theme.explicitPresentation.value?.style"
    :data-palette="typeof attrs['data-palette'] === 'string' ? attrs['data-palette'] : undefined"
    :data-state="motionState"
    class="contents"
  >
    <Teleport to="body" :disabled="props.contained">
      <button
        v-if="isPresent && props.contained"
        type="button"
        :aria-label="props.closeLabel"
        :class="containedBackdropClasses"
        @click="dismiss"
      ></button>
      <dialog
        v-if="isPresent"
        :id="props.id"
        ref="drawer"
        data-balsa="drawer-panel"
        :data-theme="portalPresentation.id"
        :data-theme-base="portalPresentation.base"
        :data-palette="resolvedPalette"
        :data-side="props.side"
        :data-size="props.size"
        :data-variant="props.variant"
        :data-shadow="props.shadow"
        :open="props.contained || undefined"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        tabindex="-1"
        :class="drawerClasses"
        :style="[drawerStyle, portalPresentation.style]"
        @cancel="handleCancel"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div
          v-if="props.showHandle"
          :class="handleClasses"
          aria-hidden="true"
          @pointerdown="beginDrag"
          @pointermove="updateDrag"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        ></div>
        <header :class="headerClasses">
          <div>
            <h3 :id="titleId">{{ props.title }}</h3>
            <p v-if="props.description" :id="descriptionId" class="mt-balsa-xs text-sm text-balsa-muted-foreground">
              {{ props.description }}
            </p>
          </div>
          <button
            type="button"
            class="grid size-10 shrink-0 cursor-pointer place-items-center rounded-md text-balsa-muted-foreground hover:bg-balsa-muted hover:text-balsa-foreground focus-visible:outline-2 focus-visible:outline-balsa-focus-ring"
            :aria-label="props.closeLabel"
            @click="close"
          >
            <Icon :icon="X" size="lg" />
          </button>
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto p-balsa-xl">
          <slot :close="close" />
        </div>
        <footer v-if="$slots.footer" class="shrink-0 border-t border-balsa-border p-balsa-xl">
          <slot name="footer" :close="close" />
        </footer>
      </dialog>
    </Teleport>
  </span>
</template>
