<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import Button from "./Button.vue";
import type { ThemeInput } from "./theme";
import { useComponentTheme } from "./theme-context";

export type PreviewViewport =
  | "responsive"
  | "fixed"
  | "desktop"
  | "tablet"
  | "mobile";

const props = withDefaults(
  defineProps<{
    title: string;
    viewport?: PreviewViewport;
    width?: number;
    height?: number;
    aspectRatio?: number;
    maxWidth?: number;
    maxHeight?: number;
    autoHeight?: boolean;
    fit?: boolean;
    edgeToEdge?: boolean;
    fullscreen?: boolean;
    fullscreenLabel?: string;
    closeLabel?: string;
    theme?: ThemeInput;
  }>(),
  {
    viewport: "responsive",
    width: 1366,
    height: 768,
    maxHeight: 480,
    autoHeight: false,
    fit: true,
    edgeToEdge: false,
    fullscreen: true,
    fullscreenLabel: "Open fullscreen preview",
    closeLabel: "Close fullscreen preview",
  },
);
const emit = defineEmits<{
  previewScroll: [deltaY: number];
}>();
const theme = useComponentTheme("preview", "surfaces", () => props.theme);

const iframeSource = "<!doctype html><html><head></head><body></body></html>";
const scaleArea = ref<HTMLElement | null>(null);
const portalPresentation = computed(() =>
  theme.presentationForPortal(scaleArea.value),
);
const frame = ref<HTMLIFrameElement | null>(null);
const teleportTarget = shallowRef<HTMLElement>();
const availableWidth = ref(0);
const availableHeight = ref(0);
const measuredContentHeight = ref(props.height);
const fullscreenOpen = ref(false);
let areaObserver: ResizeObserver | undefined;
let contentObserver: ResizeObserver | undefined;
let contentMutationObserver: MutationObserver | undefined;
let designObserver: MutationObserver | undefined;
let measurementFrame: number | undefined;
let observedDocument: Document | undefined;
let lastTouchY: number | undefined;

const presetViewportWidths: Readonly<
  Record<"desktop" | "tablet" | "mobile", number>
> = {
  desktop: 1600,
  tablet: 768,
  mobile: 390,
};

const logicalWidth = computed(() => Math.max(1, props.width));
const logicalHeight = computed(() => Math.max(1, props.height));
const canvasAspectRatio = computed(() =>
  props.aspectRatio !== undefined &&
  Number.isFinite(props.aspectRatio) &&
  props.aspectRatio > 0
    ? props.aspectRatio
    : undefined,
);
const effectiveHeight = computed(() =>
  props.autoHeight ? measuredContentHeight.value : logicalHeight.value,
);
const fixedViewport = computed(() => props.viewport === "fixed");
const scale = computed(() => {
  if (!fixedViewport.value || !props.fit) return 1;
  if (!availableWidth.value) return 1;
  if (props.autoHeight) {
    return Math.min(1, availableWidth.value / logicalWidth.value);
  }
  if (!availableHeight.value) return 1;
  return Math.min(
    1,
    availableWidth.value / logicalWidth.value,
    availableHeight.value / logicalHeight.value,
  );
});

const viewportStyle = computed(() => {
  const presetWidth =
    props.viewport === "desktop" ||
    props.viewport === "tablet" ||
    props.viewport === "mobile"
      ? presetViewportWidths[props.viewport]
      : undefined;
  const maximumWidth = props.maxWidth ?? presetWidth;
  return maximumWidth
    ? { maxWidth: `${Math.max(1, maximumWidth)}px` }
    : undefined;
});

const frameStyle = computed(() => {
  if (props.autoHeight) {
    return { height: `${effectiveHeight.value * scale.value}px` };
  }
  if (canvasAspectRatio.value) {
    return {
      aspectRatio: String(canvasAspectRatio.value),
      height: "auto",
    };
  }
  return {
    height: `${Math.min(logicalHeight.value, props.maxHeight)}px`,
  };
});
const scaledFrameStyle = computed(() => ({
  width: fixedViewport.value
    ? `${logicalWidth.value * scale.value}px`
    : "100%",
  height: fixedViewport.value
    ? `${effectiveHeight.value * scale.value}px`
    : "100%",
}));
const iframeStyle = computed(() => ({
  width: fixedViewport.value ? `${logicalWidth.value}px` : "100%",
  height: `${effectiveHeight.value}px`,
  transform: fixedViewport.value ? `scale(${scale.value})` : undefined,
  transformOrigin: fixedViewport.value ? "top left" : undefined,
}));
const hostClasses = computed(() => {
  if (props.autoHeight) {
    return props.edgeToEdge
      ? "w-full bg-balsa-background"
      : "w-full bg-balsa-background p-6";
  }
  return props.edgeToEdge
    ? "h-full w-full bg-balsa-background"
    : "flex h-full w-full items-center justify-center bg-balsa-background p-6";
});

function syncDesign(documentElement: HTMLElement): void {
  const source = window.document.documentElement;
  documentElement.className = source.className;
  documentElement.style.cssText = source.style.cssText;
  for (const key of Object.keys(documentElement.dataset)) {
    delete documentElement.dataset[key];
  }
  for (const [key, value] of Object.entries(source.dataset)) {
    if (value !== undefined) documentElement.dataset[key] = value;
  }
  if (
    props.theme ||
    theme.inheritedFromContext ||
    portalPresentation.value.id !== source.dataset.theme
  ) {
    const presentation = portalPresentation.value;
    documentElement.dataset.theme = presentation.id;
    if (presentation.base) {
      documentElement.dataset.themeBase = presentation.base;
    }
    for (const [property, value] of Object.entries(presentation.style)) {
      documentElement.style.setProperty(property, value);
    }
  }
}

function copyStyles(targetDocument: Document): void {
  const base = targetDocument.createElement("base");
  base.href = window.document.baseURI;
  targetDocument.head.append(base);
  window.document.head
    .querySelectorAll('style, link[rel="stylesheet"]')
    .forEach((node) => targetDocument.head.append(node.cloneNode(true)));
}

function measureContent(): void {
  const targetDocument = frame.value?.contentDocument;
  const target = teleportTarget.value;
  const frameElement = frame.value;
  if (!props.autoHeight || !targetDocument || !target || !frameElement) return;

  const renderedHeight = measuredContentHeight.value;
  frameElement.style.height = "1px";
  const nextHeight = Math.ceil(
    Math.max(
      target.scrollHeight,
      target.getBoundingClientRect().height,
      targetDocument.body.scrollHeight,
      targetDocument.documentElement.scrollHeight,
    ),
  );
  frameElement.style.height = `${renderedHeight}px`;
  if (nextHeight > 0 && nextHeight !== measuredContentHeight.value) {
    measuredContentHeight.value = nextHeight;
  }
}

function scheduleMeasurement(): void {
  if (!props.autoHeight) return;
  if (measurementFrame !== undefined) {
    window.cancelAnimationFrame(measurementFrame);
  }
  measurementFrame = window.requestAnimationFrame(() => {
    measurementFrame = undefined;
    measureContent();
  });
}

function scrollOwnerBy(deltaY: number): void {
  const preview = scaleArea.value;
  const explicitOwner = preview?.closest<HTMLElement>(
    "[data-balsa-preview-scroll-owner]",
  );
  if (explicitOwner && explicitOwner !== preview) {
    explicitOwner.scrollTop += deltaY;
    return;
  }

  let ancestor = preview?.parentElement;
  while (ancestor) {
    const overflowY = window.getComputedStyle(ancestor).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") {
      ancestor.scrollTop += deltaY;
      return;
    }
    ancestor = ancestor.parentElement;
  }

  window.scrollBy({ top: deltaY, behavior: "auto" });
}

function handleFrameWheel(event: WheelEvent): void {
  if (!props.autoHeight) return;
  event.preventDefault();
  scrollOwnerBy(event.deltaY);
  emit("previewScroll", event.deltaY);
}

function handleFrameTouchStart(event: TouchEvent): void {
  if (!props.autoHeight) return;
  lastTouchY = event.touches[0]?.clientY;
}

function handleFrameTouchMove(event: TouchEvent): void {
  if (!props.autoHeight) return;
  const touchY = event.touches[0]?.clientY;
  if (touchY === undefined || lastTouchY === undefined) return;
  event.preventDefault();
  const deltaY = lastTouchY - touchY;
  scrollOwnerBy(deltaY);
  emit("previewScroll", deltaY);
  lastTouchY = touchY;
}

function handleFrameTouchEnd(): void {
  lastTouchY = undefined;
}

function disconnectFrameEvents(): void {
  observedDocument?.removeEventListener("wheel", handleFrameWheel);
  observedDocument?.removeEventListener("touchstart", handleFrameTouchStart);
  observedDocument?.removeEventListener("touchmove", handleFrameTouchMove);
  observedDocument?.removeEventListener("touchend", handleFrameTouchEnd);
  observedDocument = undefined;
  lastTouchY = undefined;
}

async function prepareFrame(): Promise<void> {
  const targetDocument = frame.value?.contentDocument;
  if (!targetDocument) return;
  disconnectFrameEvents();
  contentObserver?.disconnect();
  contentMutationObserver?.disconnect();
  designObserver?.disconnect();
  teleportTarget.value = undefined;
  targetDocument.head.replaceChildren();
  targetDocument.body.replaceChildren();
  copyStyles(targetDocument);
  syncDesign(targetDocument.documentElement);
  targetDocument.documentElement.style.overflow = props.autoHeight
    ? "hidden"
    : "";
  targetDocument.body.style.margin = "0";
  targetDocument.body.style.height = props.autoHeight ? "auto" : "100%";
  targetDocument.body.style.overflow = props.autoHeight ? "hidden" : "";
  targetDocument.body.style.background = "var(--balsa-color-background)";
  targetDocument.body.style.color = "var(--balsa-color-foreground)";
  const target = targetDocument.createElement("div");
  target.id = "balsa-preview-root";
  target.style.width = "100%";
  target.style.height = props.autoHeight ? "auto" : "100%";
  targetDocument.body.append(target);
  teleportTarget.value = target;
  observedDocument = targetDocument;
  targetDocument.addEventListener("wheel", handleFrameWheel, {
    passive: false,
  });
  targetDocument.addEventListener("touchstart", handleFrameTouchStart, {
    passive: true,
  });
  targetDocument.addEventListener("touchmove", handleFrameTouchMove, {
    passive: false,
  });
  targetDocument.addEventListener("touchend", handleFrameTouchEnd);
  designObserver = new MutationObserver(() => {
    syncDesign(targetDocument.documentElement);
  });
  designObserver.observe(window.document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-palette", "data-theme", "style"],
  });
  await nextTick();
  if (props.autoHeight) {
    if (typeof ResizeObserver !== "undefined") {
      contentObserver = new ResizeObserver(scheduleMeasurement);
      contentObserver.observe(target);
    }
    contentMutationObserver = new MutationObserver(scheduleMeasurement);
    contentMutationObserver.observe(target, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    void targetDocument.fonts?.ready.then(scheduleMeasurement);
    scheduleMeasurement();
  }
}

function openFullscreen(): void {
  fullscreenOpen.value = true;
}

function closeFullscreen(): void {
  fullscreenOpen.value = false;
}

watch(
  () => [
    props.viewport,
    props.width,
    props.height,
    props.aspectRatio,
    props.maxWidth,
  ],
  async () => {
    if (!props.autoHeight) {
      measuredContentHeight.value = props.height;
    }
    await nextTick();
    scheduleMeasurement();
  },
);

watch(
  () => props.autoHeight,
  async () => {
    measuredContentHeight.value = props.height;
    await nextTick();
    await prepareFrame();
  },
);

onMounted(() => {
  const element = scaleArea.value;
  if (!element) return;
  availableWidth.value = element.clientWidth;
  availableHeight.value = canvasAspectRatio.value
    ? element.clientWidth / canvasAspectRatio.value
    : props.autoHeight
      ? effectiveHeight.value
      : Math.min(logicalHeight.value, props.maxHeight);
  if (typeof ResizeObserver !== "undefined") {
    areaObserver = new ResizeObserver(([entry]) => {
      availableWidth.value = Math.max(0, entry?.contentRect.width ?? 0);
      availableHeight.value = Math.max(0, entry?.contentRect.height ?? 0);
      scheduleMeasurement();
    });
    areaObserver.observe(element);
  }
});

onBeforeUnmount(() => {
  disconnectFrameEvents();
  areaObserver?.disconnect();
  contentObserver?.disconnect();
  contentMutationObserver?.disconnect();
  designObserver?.disconnect();
  if (measurementFrame !== undefined) {
    window.cancelAnimationFrame(measurementFrame);
  }
});
</script>

<template>
  <section
    ref="scaleArea"
    data-balsa="preview"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-viewport="props.viewport"
    :data-auto-height="props.autoHeight || undefined"
    class="relative mx-auto w-full min-w-0"
    :aria-label="props.title"
    :style="[theme.explicitPresentation.value?.style, viewportStyle]"
  >
    <div
      data-balsa="preview-workbench"
      class="flex w-full items-center justify-center overflow-hidden rounded-balsa-surface border border-balsa-border bg-balsa-background"
      :style="frameStyle"
    >
      <div :style="scaledFrameStyle" class="shrink-0">
        <iframe
          ref="frame"
          :srcdoc="iframeSource"
          :title="props.title"
          :style="iframeStyle"
          :scrolling="props.autoHeight ? 'no' : 'auto'"
          class="block border-0 bg-balsa-background"
          @load="prepareFrame"
        />
      </div>
    </div>
    <Button
      v-if="props.fullscreen"
      shape="fab"
      size="sm"
      variant="solid"
      color="primary"
      shadow="lg"
      prefix-icon="mdi-fullscreen"
      :aria-label="props.fullscreenLabel"
      class="absolute bottom-3 right-3 border border-balsa-border bg-balsa-background/90 text-balsa-foreground shadow-balsa-lg backdrop-blur-xl hover:bg-balsa-background active:bg-balsa-muted"
      @click="openFullscreen"
    />
    <Teleport v-if="teleportTarget" :to="teleportTarget">
      <div :class="hostClasses"><slot /></div>
    </Teleport>
    <Teleport to="body">
      <dialog
        v-if="fullscreenOpen"
        open
        data-balsa="preview-fullscreen"
        :data-theme="portalPresentation.id"
        :data-theme-base="portalPresentation.base"
        :aria-label="props.title"
        :style="portalPresentation.style"
        class="fixed inset-0 z-[100] m-0 size-full max-h-none max-w-none border-0 bg-balsa-background p-0 text-balsa-foreground"
        @cancel.prevent="closeFullscreen"
      >
        <div class="flex size-full items-center justify-center overflow-auto">
          <slot name="fullscreen"><slot /></slot>
        </div>
        <Button
          shape="fab"
          size="sm"
          variant="glass"
          prefix-icon="mdi-close"
          :aria-label="props.closeLabel"
          class="fixed right-4 top-4"
          @click="closeFullscreen"
        />
      </dialog>
    </Teleport>
  </section>
</template>
