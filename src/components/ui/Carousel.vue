<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "@lucide/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import Button from "./Button.vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export interface CarouselItem {
  id: string;
  label: string;
}
export type CarouselOrientation = "horizontal" | "vertical";
export type CarouselAlign = "start" | "center" | "end";
export type CarouselVariant = "surface" | "outline" | "soft" | "glass";
export type CarouselArrowsPosition = "inside" | "bottom-start" | "bottom-end";
export type CarouselIndicatorsPosition = "inside" | "bottom-start" | "bottom-center" | "bottom-end";

defineOptions({ name: "BalsaCarousel", inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    items: readonly CarouselItem[];
    label: string;
    variant?: CarouselVariant;
    orientation?: CarouselOrientation;
    align?: CarouselAlign;
    loop?: boolean;
    slidesPerView?: number;
    gap?: number;
    controls?: boolean;
    arrowsPosition?: CarouselArrowsPosition;
    indicators?: boolean;
    indicatorsPosition?: CarouselIndicatorsPosition;
    autoplay?: number;
    rounded?: Rounded;
    shadow?: Shadow;
    emptyText?: string;
    theme?: ThemeInput;
  }>(),
  {
    orientation: "horizontal",
    align: "start",
    loop: false,
    slidesPerView: 1,
    gap: 16,
    controls: true,
    arrowsPosition: "bottom-start",
    indicators: true,
    indicatorsPosition: "bottom-end",
    autoplay: 0,
    emptyText: "No carousel items.",
  },
);
const { props, theme } = useResolvedThemeProps(
  "carousel",
  "surfaces",
  rawProps,
  { variant: "surface", rounded: "lg", shadow: "auto" } as const,
);

const emit = defineEmits<{ select: [index: number, item: CarouselItem] }>();
const attrs = useAttrs();
const viewport = ref<HTMLElement>();
const viewportSize = ref(0);
const selectedIndex = ref(0);
const pointerPaused = ref(false);
const focusPaused = ref(false);
const paused = computed(() => pointerPaused.value || focusPaused.value);
const dragging = ref(false);
const dragOffset = ref(0);
const canPrevious = computed(() => props.items.length > 1 && (props.loop || selectedIndex.value > 0));
const canNext = computed(() => props.items.length > 1 && (props.loop || selectedIndex.value < props.items.length - 1));
const normalizedSlidesPerView = computed(() =>
  Number.isFinite(props.slidesPerView) ? Math.max(1, props.slidesPerView) : 1,
);
const normalizedGap = computed(() =>
  Number.isFinite(props.gap) ? Math.max(0, props.gap) : 0,
);
const slideExtent = computed(() => {
  if (viewportSize.value <= 0) return 0;
  return Math.max(
    0,
    (viewportSize.value - (normalizedSlidesPerView.value - 1) * normalizedGap.value)
      / normalizedSlidesPerView.value,
  );
});
const slideStep = computed(() => slideExtent.value + normalizedGap.value);
const alignmentOffset = computed(() => {
  const available = Math.max(0, viewportSize.value - slideExtent.value);
  if (props.align === "center") return available / 2;
  if (props.align === "end") return available;
  return 0;
});
const trackOffset = computed(() =>
  alignmentOffset.value - selectedIndex.value * slideStep.value + dragOffset.value,
);
let autoplayTimer: ReturnType<typeof setInterval> | undefined;
let resizeObserver: ResizeObserver | undefined;
let activePointerId: number | undefined;
let pointerStart = 0;
let pointerLast = 0;
let pointerLastTime = 0;
let pointerVelocity = 0;
let movedDuringDrag = false;
let suppressClick = false;

const rootAttrs = computed(() => withoutClassAttribute(attrs));
const variantClasses: Readonly<Record<CarouselVariant, string[]>> = {
  surface: ["border-balsa-border", "bg-balsa-surface"],
  outline: ["border-balsa-border-strong", "bg-transparent"],
  soft: ["border-balsa-border", "bg-balsa-muted"],
  glass: ["border-balsa-border", "bg-balsa-surface/70", "backdrop-blur-md"],
};
const classes = computed(() =>
  mergeClasses("relative min-w-0", attrs.class),
);
const viewportClasses = computed(() =>
  mergeClasses(
    "overflow-hidden",
    roundedClasses[props.rounded],
    variantClasses[props.variant],
    props.orientation === "vertical" && "h-96",
  ),
);
const emptyClasses = computed(() =>
  mergeClasses(
    "border border-dashed p-balsa-3xl text-center text-sm text-balsa-muted-foreground",
    roundedClasses[props.rounded],
    variantClasses[props.variant],
  ),
);
const trackClasses = computed(() =>
  mergeClasses(
    "transition-transform duration-balsa-slow ease-balsa motion-reduce:transition-none",
    props.orientation === "horizontal"
      ? "flex touch-pan-y"
      : "flex h-full flex-col touch-pan-x",
    dragging.value && "transition-none",
  ),
);
const slideStyle = computed(() => {
  const count = normalizedSlidesPerView.value;
  const basis = `calc((100% - ${(count - 1) * normalizedGap.value}px) / ${count})`;
  return props.orientation === "horizontal"
    ? { flex: `0 0 ${basis}`, minWidth: "0" }
    : { flex: `0 0 ${basis}`, minHeight: "0" };
});
const trackStyle = computed(() => {
  if (props.orientation === "horizontal") {
    return {
      columnGap: `${normalizedGap.value}px`,
      transform: `translate3d(${trackOffset.value}px, 0, 0)`,
    };
  }
  return {
    rowGap: `${normalizedGap.value}px`,
    transform: `translate3d(0, ${trackOffset.value}px, 0)`,
  };
});
const hasInsideArrows = computed(() =>
  props.controls && props.arrowsPosition === "inside",
);
const hasInsideIndicators = computed(() =>
  props.indicators && props.indicatorsPosition === "inside",
);
const hasOutsideNavigation = computed(() =>
  (props.controls && props.arrowsPosition !== "inside")
  || (props.indicators && props.indicatorsPosition !== "inside"),
);
const arrowsClasses = computed(() =>
  props.arrowsPosition === "bottom-end" ? "order-last ml-auto" : "order-first",
);
const indicatorsClasses = computed(() => {
  if (props.indicatorsPosition === "bottom-start") return "order-first";
  if (props.indicatorsPosition === "bottom-center") return "order-none mx-auto";
  return "order-last ml-auto";
});
const previousIcon = computed(() =>
  props.orientation === "horizontal" ? ChevronLeft : ChevronUp,
);
const nextIcon = computed(() =>
  props.orientation === "horizontal" ? ChevronRight : ChevronDown,
);

function emitSelection(): void {
  const item = props.items[selectedIndex.value];
  if (item) emit("select", selectedIndex.value, item);
}

function normalizeIndex(index: number): number {
  const length = props.items.length;
  if (length === 0) return 0;
  if (props.loop) return ((index % length) + length) % length;
  return Math.min(length - 1, Math.max(0, index));
}
function select(index: number): void {
  const nextIndex = normalizeIndex(index);
  dragOffset.value = 0;
  if (nextIndex === selectedIndex.value) return;
  selectedIndex.value = nextIndex;
  emitSelection();
}
function previous(): void {
  select(selectedIndex.value - 1);
}
function next(): void {
  select(selectedIndex.value + 1);
}
function goTo(index: number): void {
  select(index);
}
function indicatorClasses(index: number): string {
  return mergeClasses(
    "size-3 rounded-full border border-balsa-border-strong bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring",
    index === selectedIndex.value && "bg-balsa-primary",
  );
}
function clearAutoplay(): void {
  if (autoplayTimer !== undefined) clearInterval(autoplayTimer);
  autoplayTimer = undefined;
}
function configureAutoplay(): void {
  clearAutoplay();
  if (
    props.autoplay <= 0
    || paused.value
    || dragging.value
    || props.items.length <= 1
    || (typeof document !== "undefined" && document.hidden)
  ) return;
  autoplayTimer = setInterval(() => {
    if (canNext.value) next();
  }, Math.max(1000, props.autoplay));
}

function measureViewport(): void {
  const element = viewport.value;
  if (!element) return;
  viewportSize.value = props.orientation === "horizontal"
    ? element.clientWidth
    : element.clientHeight;
}
function pointerCoordinate(event: PointerEvent): number {
  return props.orientation === "horizontal" ? event.clientX : event.clientY;
}
function beginDrag(event: PointerEvent): void {
  if (props.items.length <= 1 || (event.pointerType === "mouse" && event.button !== 0)) return;
  activePointerId = event.pointerId;
  pointerStart = pointerCoordinate(event);
  pointerLast = pointerStart;
  pointerLastTime = event.timeStamp;
  pointerVelocity = 0;
  movedDuringDrag = false;
  suppressClick = false;
  dragOffset.value = 0;
  dragging.value = true;
  clearAutoplay();
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
}
function updateDrag(event: PointerEvent): void {
  if (activePointerId !== event.pointerId) return;
  const coordinate = pointerCoordinate(event);
  const elapsed = Math.max(1, event.timeStamp - pointerLastTime);
  pointerVelocity = (coordinate - pointerLast) / elapsed;
  pointerLast = coordinate;
  pointerLastTime = event.timeStamp;
  let offset = coordinate - pointerStart;
  if (!props.loop) {
    const beyondStart = selectedIndex.value === 0 && offset > 0;
    const beyondEnd = selectedIndex.value === props.items.length - 1 && offset < 0;
    if (beyondStart || beyondEnd) offset *= 0.25;
  }
  dragOffset.value = offset;
  movedDuringDrag ||= Math.abs(offset) > 4;
  if (movedDuringDrag && event.cancelable) event.preventDefault();
}
function finishDrag(event: PointerEvent, cancelled = false): void {
  if (activePointerId !== event.pointerId) return;
  const element = event.currentTarget as HTMLElement;
  activePointerId = undefined;
  if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId);
  dragging.value = false;
  const projectedOffset = dragOffset.value + pointerVelocity * 140;
  const threshold = Math.min(48, Math.max(16, slideStep.value * 0.15));
  if (!cancelled && Math.abs(projectedOffset) >= threshold) {
    const distance = Math.max(1, slideStep.value);
    const steps = Math.max(1, Math.min(props.items.length - 1, Math.round(Math.abs(projectedOffset) / distance)));
    select(selectedIndex.value + (projectedOffset < 0 ? steps : -steps));
  } else {
    dragOffset.value = 0;
  }
  suppressClick = movedDuringDrag;
  if (suppressClick) window.setTimeout(() => { suppressClick = false; }, 0);
  configureAutoplay();
}
function cancelDrag(event: PointerEvent): void {
  finishDrag(event, true);
}
function preventDraggedClick(event: MouseEvent): void {
  if (!suppressClick) return;
  event.preventDefault();
  event.stopPropagation();
  suppressClick = false;
}
function handleFocusOut(event: FocusEvent): void {
  const root = event.currentTarget as HTMLElement;
  if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
  focusPaused.value = false;
}

watch([() => props.autoplay, () => props.items.length, paused], configureAutoplay);
watch(
  () => props.items.length,
  () => {
    const nextIndex = normalizeIndex(selectedIndex.value);
    if (nextIndex !== selectedIndex.value) {
      selectedIndex.value = nextIndex;
      emitSelection();
    }
  },
);
watch(
  () => [props.orientation, props.align, props.slidesPerView, props.gap],
  () => {
    dragOffset.value = 0;
    void nextTick(measureViewport);
  },
);
onMounted(() => {
  measureViewport();
  if (typeof ResizeObserver !== "undefined" && viewport.value) {
    resizeObserver = new ResizeObserver(measureViewport);
    resizeObserver.observe(viewport.value);
  }
  window.addEventListener("resize", measureViewport);
  emitSelection();
  configureAutoplay();
  document.addEventListener("visibilitychange", configureAutoplay);
});
onBeforeUnmount(() => {
  clearAutoplay();
  resizeObserver?.disconnect();
  window.removeEventListener("resize", measureViewport);
  document.removeEventListener("visibilitychange", configureAutoplay);
});
</script>

<template>
  <section
    v-bind="rootAttrs"
    data-balsa="carousel"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="props.variant"
    :data-orientation="props.orientation"
    :data-shadow="props.shadow"
    :aria-label="props.label"
    role="region"
    :class="classes"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    @mouseenter="pointerPaused = true"
    @mouseleave="pointerPaused = false"
    @focusin="focusPaused = true"
    @focusout="handleFocusOut"
  >
    <div v-if="props.items.length" class="relative">
      <div
        ref="viewport"
        data-balsa="carousel-viewport"
        :class="viewportClasses"
        @pointerdown="beginDrag"
        @pointermove="updateDrag"
        @pointerup="finishDrag"
        @pointercancel="cancelDrag"
        @lostpointercapture="cancelDrag"
        @click.capture="preventDraggedClick"
        @dragstart.prevent
      >
        <div data-balsa="carousel-track" :class="trackClasses" :style="trackStyle">
          <article
            v-for="(item, index) in props.items"
            :key="item.id"
            data-balsa="carousel-slide"
            role="group"
            :aria-label="`${index + 1} of ${props.items.length}: ${item.label}`"
            :aria-roledescription="'slide'"
            :style="slideStyle"
          >
            <slot name="item" :item="item" :index="index">
              <div class="p-balsa-2xl">{{ item.label }}</div>
            </slot>
          </article>
        </div>
      </div>
      <div
        v-if="props.items.length > 1 && hasInsideArrows"
        data-balsa="carousel-arrows"
        class="pointer-events-none absolute inset-x-3 top-1/2 z-10 flex -translate-y-1/2 justify-between"
        role="group"
        aria-label="Carousel controls"
      >
        <Button shape="fab" size="sm" variant="glass" :prefix-icon="previousIcon" aria-label="Previous slide" class="pointer-events-auto" :disabled="!props.loop && !canPrevious" @click="previous" />
        <Button shape="fab" size="sm" variant="glass" :prefix-icon="nextIcon" aria-label="Next slide" class="pointer-events-auto" :disabled="!props.loop && !canNext" @click="next" />
      </div>
      <div
        v-if="props.items.length > 1 && hasInsideIndicators"
        data-balsa="carousel-indicators"
        class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-wrap justify-center gap-balsa-xs"
        role="group"
        aria-label="Choose slide"
      >
        <button
          v-for="(item, index) in props.items"
          :key="item.id"
          type="button"
          :class="indicatorClasses(index)"
          :aria-label="`Go to slide ${index + 1}: ${item.label}`"
          :aria-current="index === selectedIndex ? 'true' : undefined"
          @click="goTo(index)"
        />
      </div>
    </div>
    <div v-else :class="emptyClasses">
      <slot name="empty">{{ props.emptyText }}</slot>
    </div>
    <div v-if="props.items.length > 1 && hasOutsideNavigation" class="mt-balsa-md flex min-h-9 flex-wrap items-center gap-balsa-md">
      <div v-if="props.controls && props.arrowsPosition !== 'inside'" data-balsa="carousel-arrows" :class="['flex gap-balsa-xs', arrowsClasses]" role="group" aria-label="Carousel controls">
        <Button shape="fab" size="sm" variant="outline" :prefix-icon="previousIcon" aria-label="Previous slide" :disabled="!props.loop && !canPrevious" @click="previous" />
        <Button shape="fab" size="sm" variant="outline" :prefix-icon="nextIcon" aria-label="Next slide" :disabled="!props.loop && !canNext" @click="next" />
      </div>
      <div v-if="props.indicators && props.indicatorsPosition !== 'inside'" data-balsa="carousel-indicators" :class="['flex flex-wrap gap-balsa-xs', indicatorsClasses]" role="group" aria-label="Choose slide">
        <button
          v-for="(item, index) in props.items"
          :key="item.id"
          type="button"
          :class="indicatorClasses(index)"
          :aria-label="`Go to slide ${index + 1}: ${item.label}`"
          :aria-current="index === selectedIndex ? 'true' : undefined"
          @click="goTo(index)"
        />
      </div>
    </div>
    <p v-if="props.items.length > 1" class="sr-only" aria-live="polite">Slide {{ selectedIndex + 1 }} of {{ props.items.length }}</p>
  </section>
</template>
