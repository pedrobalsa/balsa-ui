<script setup lang="ts">
import emblaCarouselVue from "embla-carousel-vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
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

defineOptions({ inheritAttrs: false });

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
const carouselOptions = computed(() => ({
  axis: props.orientation === "horizontal" ? "x" as const : "y" as const,
  align: props.align,
  loop: props.loop,
}));
const [emblaRoot, emblaApi] = emblaCarouselVue(carouselOptions);
const selectedIndex = ref(0);
const canPrevious = ref(false);
const canNext = ref(false);
const paused = ref(false);
let autoplayTimer: ReturnType<typeof setInterval> | undefined;

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
    "overflow-hidden border",
    roundedClasses[props.rounded],
    variantClasses[props.variant],
    props.orientation === "vertical" && "h-96",
  ),
);
const emptyClasses = computed(() =>
  mergeClasses(
    "border border-dashed p-8 text-center text-sm text-balsa-muted-foreground",
    roundedClasses[props.rounded],
    variantClasses[props.variant],
  ),
);
const trackClasses = computed(() =>
  props.orientation === "horizontal"
    ? "flex touch-pan-y"
    : "flex h-full flex-col touch-pan-x",
);
const slideStyle = computed(() => {
  const count = Math.max(1, props.slidesPerView);
  const basis = `calc((100% - ${(count - 1) * Math.max(0, props.gap)}px) / ${count})`;
  return props.orientation === "horizontal"
    ? { flex: `0 0 ${basis}`, minWidth: "0" }
    : { flex: `0 0 ${basis}`, minHeight: "0" };
});
const trackStyle = computed(() =>
  props.orientation === "horizontal"
    ? { columnGap: `${Math.max(0, props.gap)}px` }
    : { rowGap: `${Math.max(0, props.gap)}px` },
);
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
  props.orientation === "horizontal" ? "mdi-chevron-left" : "mdi-chevron-up",
);
const nextIcon = computed(() =>
  props.orientation === "horizontal" ? "mdi-chevron-right" : "mdi-chevron-down",
);

function synchronize(): void {
  const api = emblaApi.value;
  if (!api) return;
  selectedIndex.value = api.selectedScrollSnap();
  canPrevious.value = api.canScrollPrev();
  canNext.value = api.canScrollNext();
  const item = props.items[selectedIndex.value];
  if (item) emit("select", selectedIndex.value, item);
}

function previous(): void {
  emblaApi.value?.scrollPrev();
}
function setCarouselRoot(element: unknown): void {
  emblaRoot.value = element instanceof HTMLElement ? element : undefined;
}
function next(): void {
  emblaApi.value?.scrollNext();
}
function goTo(index: number): void {
  emblaApi.value?.scrollTo(index);
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
  if (props.autoplay <= 0 || paused.value || props.items.length <= 1) return;
  autoplayTimer = setInterval(() => {
    const api = emblaApi.value;
    if (!api) return;
    if (api.canScrollNext()) api.scrollNext();
    else if (props.loop) api.scrollTo(0);
  }, Math.max(1000, props.autoplay));
}

watch([() => props.autoplay, () => props.items.length, paused], configureAutoplay);
watch(
  () => [props.orientation, props.align, props.loop, props.slidesPerView, props.gap],
  () => emblaApi.value?.reInit(),
);
onMounted(() => {
  emblaApi.value?.on("select", synchronize).on("reInit", synchronize);
  synchronize();
  configureAutoplay();
  document.addEventListener("visibilitychange", configureAutoplay);
});
onBeforeUnmount(() => {
  clearAutoplay();
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
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <div v-if="props.items.length" class="relative">
      <div :ref="setCarouselRoot" data-balsa="carousel-viewport" :class="viewportClasses">
        <div :class="trackClasses" :style="trackStyle">
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
              <div class="p-6">{{ item.label }}</div>
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
        class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-wrap justify-center gap-2"
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
    <div v-if="props.items.length > 1 && hasOutsideNavigation" class="mt-3 flex min-h-9 flex-wrap items-center gap-3">
      <div v-if="props.controls && props.arrowsPosition !== 'inside'" data-balsa="carousel-arrows" :class="['flex gap-2', arrowsClasses]" role="group" aria-label="Carousel controls">
        <Button shape="fab" size="sm" variant="outline" :prefix-icon="previousIcon" aria-label="Previous slide" :disabled="!props.loop && !canPrevious" @click="previous" />
        <Button shape="fab" size="sm" variant="outline" :prefix-icon="nextIcon" aria-label="Next slide" :disabled="!props.loop && !canNext" @click="next" />
      </div>
      <div v-if="props.indicators && props.indicatorsPosition !== 'inside'" data-balsa="carousel-indicators" :class="['flex flex-wrap gap-2', indicatorsClasses]" role="group" aria-label="Choose slide">
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
      <p class="sr-only" aria-live="polite">Slide {{ selectedIndex + 1 }} of {{ props.items.length }}</p>
    </div>
  </section>
</template>
