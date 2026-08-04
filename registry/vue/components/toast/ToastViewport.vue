<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import type { ThemeInput } from "./theme";
import Toast, {
  type ToastSize,
  type ToastVariant,
} from "./Toast.vue";
import type { Rounded } from "./form";
import type { SemanticColor } from "./types";
import { useComponentTheme } from "./theme-context";
import type { IconComponent } from "./Icon.vue";

export type ToastPosition =
  | "top-start"
  | "top-center"
  | "top-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end";
export type ToastDismissReason = "close" | "escape" | "timeout" | "action";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  color?: SemanticColor;
  variant?: ToastVariant;
  size?: ToastSize;
  rounded?: Rounded;
  icon?: IconComponent;
  actionLabel?: string;
  actionDismiss?: boolean;
  dismissible?: boolean;
  closeLabel?: string;
  duration?: number;
  sticky?: boolean;
}

interface TimerState {
  duration: number;
  remaining: number;
  startedAt: number;
  handle?: ReturnType<typeof setTimeout>;
}

const props = withDefaults(
  defineProps<{
    label?: string;
    position?: ToastPosition;
    limit?: number;
    duration?: number;
    pauseOnHover?: boolean;
    pauseOnFocus?: boolean;
    contained?: boolean;
    teleportTo?: string;
    theme?: ThemeInput;
  }>(),
  {
    label: "Notifications",
    position: "bottom-end",
    limit: 5,
    duration: 5000,
    pauseOnHover: true,
    pauseOnFocus: true,
    contained: false,
    teleportTo: "body",
  },
);
const theme = useComponentTheme("toast", "overlays", () => props.theme);
const emit = defineEmits<{
  action: [item: ToastItem];
  dismiss: [item: ToastItem, reason: ToastDismissReason];
}>();
const model = defineModel<readonly ToastItem[]>({ default: () => [] });
const anchor = ref<HTMLElement | null>(null);
const portalPresentation = computed(() => theme.presentationForPortal(anchor.value));
const resolvedPalette = ref<string>();
const timers = new Map<string, TimerState>();
const pauseReasons = new Set<string>();
let contextObserver: MutationObserver | undefined;

const positionClasses: Readonly<Record<ToastPosition, string[]>> = {
  "top-start": ["left-4 top-4 items-start"],
  "top-center": ["left-1/2 top-4 -translate-x-1/2 items-center"],
  "top-end": ["right-4 top-4 items-end"],
  "bottom-start": ["bottom-4 left-4 flex-col-reverse items-start"],
  "bottom-center": ["bottom-4 left-1/2 -translate-x-1/2 flex-col-reverse items-center"],
  "bottom-end": ["bottom-4 right-4 flex-col-reverse items-end"],
};
const transitionClasses: Readonly<
  Record<ToastPosition, { enterFrom: string; leaveTo: string }>
> = {
  "top-start": {
    enterFrom: "-translate-y-3 opacity-0 motion-reduce:translate-y-0",
    leaveTo: "-translate-y-3 opacity-0 motion-reduce:translate-y-0",
  },
  "top-center": {
    enterFrom: "-translate-y-3 opacity-0 motion-reduce:translate-y-0",
    leaveTo: "-translate-y-3 opacity-0 motion-reduce:translate-y-0",
  },
  "top-end": {
    enterFrom: "-translate-y-3 opacity-0 motion-reduce:translate-y-0",
    leaveTo: "-translate-y-3 opacity-0 motion-reduce:translate-y-0",
  },
  "bottom-start": {
    enterFrom: "translate-y-3 opacity-0 motion-reduce:translate-y-0",
    leaveTo: "translate-y-3 opacity-0 motion-reduce:translate-y-0",
  },
  "bottom-center": {
    enterFrom: "translate-y-3 opacity-0 motion-reduce:translate-y-0",
    leaveTo: "translate-y-3 opacity-0 motion-reduce:translate-y-0",
  },
  "bottom-end": {
    enterFrom: "translate-y-3 opacity-0 motion-reduce:translate-y-0",
    leaveTo: "translate-y-3 opacity-0 motion-reduce:translate-y-0",
  },
};
const safeLimit = computed(() =>
  Number.isFinite(props.limit)
    ? Math.max(1, Math.min(10, Math.floor(props.limit)))
    : 5,
);
const visibleItems = computed(() =>
  model.value.slice(-safeLimit.value).reverse(),
);
const viewportClasses = computed(() => [
  "pointer-events-none z-[70] flex max-h-[calc(100dvh-2rem)] max-w-sm gap-3 overflow-y-auto overscroll-contain",
  props.contained
    ? "absolute w-[calc(100%-2rem)]"
    : "fixed w-[calc(100vw-2rem)]",
  positionClasses[props.position],
]);
const currentTransitionClasses = computed(() => transitionClasses[props.position]);

function itemDuration(item: ToastItem): number {
  const duration = item.duration ?? props.duration;
  return Number.isFinite(duration) && duration > 0 ? duration : 5000;
}

function clearTimer(timer: TimerState): void {
  if (timer.handle !== undefined) clearTimeout(timer.handle);
  timer.handle = undefined;
}

function scheduleTimer(item: ToastItem, timer: TimerState): void {
  clearTimer(timer);
  if (item.sticky || pauseReasons.size > 0) return;
  timer.startedAt = Date.now();
  timer.handle = setTimeout(() => {
    dismiss(item.id, "timeout");
  }, timer.remaining);
}

function syncTimers(): void {
  const currentIds = new Set(model.value.map(({ id }) => id));
  for (const [id, timer] of timers) {
    if (!currentIds.has(id)) {
      clearTimer(timer);
      timers.delete(id);
    }
  }
  for (const item of model.value) {
    if (item.sticky) {
      const timer = timers.get(item.id);
      if (timer) clearTimer(timer);
      timers.delete(item.id);
      continue;
    }
    const duration = itemDuration(item);
    const existing = timers.get(item.id);
    if (existing && existing.duration === duration) continue;
    if (existing) clearTimer(existing);
    const timer: TimerState = {
      duration,
      remaining: duration,
      startedAt: 0,
    };
    timers.set(item.id, timer);
    scheduleTimer(item, timer);
  }
}

function pause(reason: string): void {
  if (pauseReasons.has(reason)) return;
  pauseReasons.add(reason);
  const now = Date.now();
  for (const timer of timers.values()) {
    if (timer.handle === undefined) continue;
    timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
    clearTimer(timer);
  }
}

function resume(reason: string): void {
  pauseReasons.delete(reason);
  if (pauseReasons.size > 0) return;
  for (const item of model.value) {
    const timer = timers.get(item.id);
    if (timer) scheduleTimer(item, timer);
  }
}

function dismiss(id: string, reason: ToastDismissReason): void {
  const item = model.value.find((candidate) => candidate.id === id);
  if (!item) return;
  const timer = timers.get(id);
  if (timer) clearTimer(timer);
  timers.delete(id);
  model.value = model.value.filter((candidate) => candidate.id !== id);
  emit("dismiss", item, reason);
}

function handleAction(item: ToastItem): void {
  emit("action", item);
  if (item.actionDismiss !== false) dismiss(item.id, "action");
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented || event.key !== "Escape" || model.value.length === 0) return;
  const item = [...visibleItems.value].find((candidate) => candidate.dismissible !== false);
  if (!item) return;
  event.preventDefault();
  dismiss(item.id, "escape");
}

function handleVisibility(): void {
  if (document.hidden) pause("document-hidden");
  else resume("document-hidden");
}

function handleWindowBlur(): void {
  pause("window-blur");
}

function handleWindowFocus(): void {
  resume("window-blur");
}

function handlePointerEnter(): void {
  if (props.pauseOnHover) pause("hover");
}

function handlePointerLeave(): void {
  if (props.pauseOnHover) resume("hover");
}

function handleFocusIn(): void {
  if (props.pauseOnFocus) pause("focus");
}

function handleFocusOut(event: FocusEvent): void {
  if (!props.pauseOnFocus) return;
  const next = event.relatedTarget;
  if (next instanceof Node && event.currentTarget instanceof Node && event.currentTarget.contains(next)) {
    return;
  }
  resume("focus");
}

function resolveContext(): void {
  const boundary = anchor.value?.parentElement;
  resolvedPalette.value = boundary
    ?.closest<HTMLElement>("[data-palette]")
    ?.dataset.palette;
}

watch(
  [model, () => props.duration],
  syncTimers,
  { deep: true, immediate: true },
);
onMounted(() => {
  resolveContext();
  contextObserver = new MutationObserver(resolveContext);
  contextObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-palette"],
    subtree: true,
  });
  document.addEventListener("keydown", handleDocumentKeydown);
  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("blur", handleWindowBlur);
  window.addEventListener("focus", handleWindowFocus);
});

onBeforeUnmount(() => {
  contextObserver?.disconnect();
  document.removeEventListener("keydown", handleDocumentKeydown);
  document.removeEventListener("visibilitychange", handleVisibility);
  window.removeEventListener("blur", handleWindowBlur);
  window.removeEventListener("focus", handleWindowFocus);
  for (const timer of timers.values()) clearTimer(timer);
  timers.clear();
});
</script>

<template>
  <span
    ref="anchor"
    data-balsa="toast-anchor"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :style="theme.explicitPresentation.value?.style"
    class="contents"
  >
    <Teleport :to="props.teleportTo" :disabled="props.contained">
      <TransitionGroup
        appear
        tag="section"
        data-balsa="toast-viewport"
        :data-theme="portalPresentation.id"
        :data-theme-base="portalPresentation.base"
        :style="portalPresentation.style"
        :data-palette="resolvedPalette"
        :data-position="props.position"
        :aria-label="props.label"
        :class="viewportClasses"
        enter-active-class="transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none"
        :enter-from-class="currentTransitionClasses.enterFrom"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition-[opacity,transform] duration-150 ease-in motion-reduce:transition-none"
        leave-from-class="translate-y-0 opacity-100"
        :leave-to-class="currentTransitionClasses.leaveTo"
        move-class="transition-transform duration-200 motion-reduce:transition-none"
        @mouseenter="handlePointerEnter"
        @mouseleave="handlePointerLeave"
        @focusin="handleFocusIn"
        @focusout="handleFocusOut"
      >
        <Toast
          v-for="item in visibleItems"
          :id="item.id"
          :key="item.id"
          :title="item.title"
          :description="item.description"
          :color="item.color"
          :variant="item.variant"
          :size="item.size"
          :rounded="item.rounded"
          :icon="item.icon"
          :action-label="item.actionLabel"
          :dismissible="item.dismissible"
          :close-label="item.closeLabel"
          :theme="theme.input.value"
          @action="handleAction(item)"
          @dismiss="dismiss(item.id, 'close')"
        >
          <template v-if="$slots.action" #action="{ dismiss: dismissToast }">
            <slot
              name="action"
              :item="item"
              :dismiss="dismissToast"
              :run="() => handleAction(item)"
            />
          </template>
        </Toast>
      </TransitionGroup>
    </Teleport>
  </span>
</template>
