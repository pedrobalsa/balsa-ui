<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
} from "vue";
import Button from "./Button.vue";
import type { ThemeInput } from "./theme";
import { useComponentTheme } from "./theme-context";

export type PreviewViewport = "responsive" | "fixed";

const props = withDefaults(
  defineProps<{
    title: string;
    viewport?: PreviewViewport;
    width?: number;
    height?: number;
    maxHeight?: number;
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
    fit: true,
    edgeToEdge: false,
    fullscreen: true,
    fullscreenLabel: "Open fullscreen preview",
    closeLabel: "Close fullscreen preview",
  },
);
const theme = useComponentTheme("preview", "surfaces", () => props.theme);

const iframeSource = "<!doctype html><html><head></head><body></body></html>";
const scaleArea = ref<HTMLElement | null>(null);
const portalPresentation = computed(() =>
  theme.presentationForPortal(scaleArea.value)
);
const frame = ref<HTMLIFrameElement | null>(null);
const teleportTarget = shallowRef<HTMLElement>();
const availableWidth = ref(0);
const availableHeight = ref(0);
const fullscreenOpen = ref(false);
let areaObserver: ResizeObserver | undefined;
let designObserver: MutationObserver | undefined;

const logicalWidth = computed(() => Math.max(1, props.width));
const logicalHeight = computed(() => Math.max(1, props.height));
const scale = computed(() => {
  if (props.viewport === "responsive" || !props.fit) return 1;
  if (!availableWidth.value || !availableHeight.value) return 1;
  return Math.min(
    1,
    availableWidth.value / logicalWidth.value,
    availableHeight.value / logicalHeight.value,
  );
});
const frameStyle = computed(() => ({
  height: props.viewport === "responsive"
    ? `${Math.min(logicalHeight.value, props.maxHeight)}px`
    : `${Math.min(logicalHeight.value, props.maxHeight)}px`,
}));
const scaledFrameStyle = computed(() => ({
  width: props.viewport === "responsive"
    ? "100%"
    : `${logicalWidth.value * scale.value}px`,
  height: props.viewport === "responsive"
    ? "100%"
    : `${logicalHeight.value * scale.value}px`,
}));
const iframeStyle = computed(() => ({
  width: props.viewport === "responsive" ? "100%" : `${logicalWidth.value}px`,
  height: props.viewport === "responsive" ? "100%" : `${logicalHeight.value}px`,
  transform: props.viewport === "responsive" ? undefined : `scale(${scale.value})`,
  transformOrigin: "top left",
}));
const hostClasses = computed(() =>
  props.edgeToEdge
    ? "h-full w-full bg-balsa-background"
    : "flex h-full w-full items-center justify-center bg-balsa-background p-6",
);

function syncDesign(documentElement: HTMLElement): void {
  const source = window.document.documentElement;
  documentElement.className = source.className;
  documentElement.style.cssText = source.style.cssText;
  for (const key of Object.keys(documentElement.dataset)) delete documentElement.dataset[key];
  for (const [key, value] of Object.entries(source.dataset)) {
    if (value !== undefined) documentElement.dataset[key] = value;
  }
  if (props.theme || theme.inheritedFromContext || portalPresentation.value.id !== source.dataset.theme) {
    const presentation = portalPresentation.value;
    documentElement.dataset.theme = presentation.id;
    if (presentation.base) documentElement.dataset.themeBase = presentation.base;
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

async function prepareFrame(): Promise<void> {
  const targetDocument = frame.value?.contentDocument;
  if (!targetDocument) return;
  designObserver?.disconnect();
  teleportTarget.value = undefined;
  targetDocument.head.replaceChildren();
  targetDocument.body.replaceChildren();
  copyStyles(targetDocument);
  syncDesign(targetDocument.documentElement);
  targetDocument.body.style.margin = "0";
  targetDocument.body.style.height = "100%";
  targetDocument.body.style.background = "var(--balsa-color-background)";
  targetDocument.body.style.color = "var(--balsa-color-foreground)";
  const target = targetDocument.createElement("div");
  target.id = "balsa-preview-root";
  target.style.height = "100%";
  targetDocument.body.append(target);
  teleportTarget.value = target;
  designObserver = new MutationObserver(() => syncDesign(targetDocument.documentElement));
  designObserver.observe(window.document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-palette", "data-theme", "style"],
  });
  await nextTick();
}

function openFullscreen(): void {
  fullscreenOpen.value = true;
}

function closeFullscreen(): void {
  fullscreenOpen.value = false;
}

onMounted(() => {
  const element = scaleArea.value;
  if (!element) return;
  availableWidth.value = element.clientWidth;
  availableHeight.value = Math.min(logicalHeight.value, props.maxHeight);
  if (typeof ResizeObserver !== "undefined") {
    areaObserver = new ResizeObserver(([entry]) => {
      availableWidth.value = Math.max(0, entry?.contentRect.width ?? 0);
      availableHeight.value = Math.max(0, entry?.contentRect.height ?? 0);
    });
    areaObserver.observe(element);
  }
});

onBeforeUnmount(() => {
  areaObserver?.disconnect();
  designObserver?.disconnect();
});
</script>

<template>
  <section
    data-balsa="preview"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-viewport="props.viewport"
    class="relative min-w-0"
    :aria-label="props.title"
    :style="theme.explicitPresentation.value?.style"
  >
    <div
      ref="scaleArea"
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
          class="block border-0 bg-balsa-background"
          @load="prepareFrame"
        ></iframe>
      </div>
    </div>
    <Button
      v-if="props.fullscreen"
      shape="fab"
      size="sm"
      variant="glass"
      prefix-icon="mdi-fullscreen"
      :aria-label="props.fullscreenLabel"
      class="absolute bottom-3 right-3"
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
