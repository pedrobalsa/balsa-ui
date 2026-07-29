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
import type { Rounded } from "./form";
import MenuList from "./MenuList.vue";
import type { MenuItem, MenuSelection, MenuVariant } from "./menu";
import type { Shadow, ThemeInput } from "./theme";
import type { ActionColor } from "./types";
import { useResolvedThemeProps } from "./theme-context";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    items: readonly MenuItem[];
    variant?: MenuVariant;
    color?: ActionColor;
    rounded?: Rounded;
    shadow?: Shadow;
    contained?: boolean;
    disabled?: boolean;
    theme?: ThemeInput;
  }>(),
  {
    color: "primary",
    contained: false,
    disabled: false,
  },
);
const { props, theme } = useResolvedThemeProps(
  "context-menu",
  "overlays",
  rawProps,
  { variant: "surface", rounded: "lg", shadow: "auto" } as const,
);

const emit = defineEmits<{
  select: [selection: MenuSelection];
}>();
const model = defineModel<boolean>({ default: false });
const attrs = useAttrs();
const root = ref<HTMLElement | null>(null);
const portalPresentation = computed(() => theme.presentationForPortal(root.value));
const layer = ref<HTMLElement | null>(null);
const list = ref<{ focusFirst: () => void } | null>(null);
const resolvedPalette = ref<string>();
const position = ref({ left: 0, top: 0 });
const requestedPosition = ref({ left: 0, top: 0 });

const rootClasses = computed(() => [
  "relative",
  attrs.class,
]);
const layerClasses = computed(() => [
  "z-[65]",
  props.contained ? "absolute" : "fixed",
]);
const layerStyle = computed(() => ({
  left: `${position.value.left}px`,
  top: `${position.value.top}px`,
}));

function resolveContext(): void {
  resolvedPalette.value = typeof attrs["data-palette"] === "string"
    ? attrs["data-palette"]
    : root.value?.closest<HTMLElement>("[data-palette]")?.dataset.palette;
}

function clampPosition(): void {
  if (!layer.value) return;
  const rect = layer.value.getBoundingClientRect();
  const padding = 8;
  const rootRect = root.value?.getBoundingClientRect();
  const bounds = props.contained && rootRect
    ? {
      left: rootRect.left + padding,
      top: rootRect.top + padding,
      right: rootRect.right - padding,
      bottom: rootRect.bottom - padding,
    }
    : {
      left: padding,
      top: padding,
      right: window.innerWidth - padding,
      bottom: window.innerHeight - padding,
    };
  const left = Math.min(
    Math.max(requestedPosition.value.left, bounds.left),
    Math.max(bounds.left, bounds.right - rect.width),
  );
  const top = Math.min(
    Math.max(requestedPosition.value.top, bounds.top),
    Math.max(bounds.top, bounds.bottom - rect.height),
  );
  position.value = {
    left: left - (props.contained ? rootRect?.left ?? 0 : 0),
    top: top - (props.contained ? rootRect?.top ?? 0 : 0),
  };
}

function openAt(left: number, top: number): void {
  if (props.disabled) return;
  requestedPosition.value = { left, top };
  model.value = true;
}

function handleContextMenu(event: MouseEvent): void {
  if (props.disabled) return;
  event.preventDefault();
  openAt(event.clientX, event.clientY);
}

function handleTargetKeydown(event: KeyboardEvent): void {
  if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
  event.preventDefault();
  const rect = root.value?.getBoundingClientRect();
  if (rect) openAt(rect.left + 16, rect.top + 16);
}

function close(restoreFocus = true): void {
  model.value = false;
  if (restoreFocus) void nextTick(() => root.value?.focus());
}

function handleSelection(selection: MenuSelection): void {
  emit("select", selection);
  close();
}

function handleDocumentPointer(event: PointerEvent): void {
  if (!model.value) return;
  const target = event.target as Node;
  if (layer.value?.contains(target)) return;
  close(false);
}

watch(model, async (open) => {
  resolveContext();
  if (!open) return;
  await nextTick();
  clampPosition();
  list.value?.focusFirst();
});

onMounted(() => {
  resolveContext();
  document.addEventListener("pointerdown", handleDocumentPointer, true);
  window.addEventListener("resize", clampPosition, { passive: true });
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointer, true);
  window.removeEventListener("resize", clampPosition);
});
</script>

<template>
  <div
    ref="root"
    data-balsa="context-menu"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-palette="typeof attrs['data-palette'] === 'string' ? attrs['data-palette'] : undefined"
    :data-state="model ? 'open' : 'closed'"
    tabindex="0"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    :class="rootClasses"
    @contextmenu="handleContextMenu"
    @keydown="handleTargetKeydown"
  >
    <slot />

    <Teleport to="body" :disabled="props.contained">
      <div
        v-if="model"
        ref="layer"
        :data-theme="portalPresentation.id"
        :data-theme-base="portalPresentation.base"
        :data-palette="resolvedPalette"
        :data-shadow="props.shadow"
        :class="layerClasses"
        :style="[layerStyle, portalPresentation.style]"
      >
        <MenuList
          :id="props.id"
          ref="list"
          :label="props.label"
          :items="props.items"
          :variant="props.variant"
          :color="props.color"
          :rounded="props.rounded"
          :theme="theme.input.value"
          :palette="resolvedPalette"
          @select="handleSelection"
          @dismiss="close"
        />
      </div>
    </Teleport>
  </div>
</template>
