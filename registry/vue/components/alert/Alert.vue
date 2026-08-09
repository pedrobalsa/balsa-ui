<script setup lang="ts">
import { CircleAlert, CircleCheckBig, Info, TriangleAlert, X } from "@lucide/vue";
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  ref,
  useAttrs,
  useSlots,
  watch,
} from "vue";
import Button from "./Button.vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { surfaceRoundedClasses, type SurfaceRounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import Icon, { type IconComponent, type IconSize } from "./Icon.vue";

export type AlertMode = "inline" | "dialog";
export type AlertColor = "neutral" | "info" | "success" | "warning" | "destructive";
export type AlertVariant = "surface" | "outline" | "soft" | "solid" | "glass";
export type AlertSize = "sm" | "md" | "lg";
export type AlertInitialFocus = "dialog" | "action" | "close";

defineOptions({ name: "BalsaAlert", inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    title: string;
    description?: string;
    mode?: AlertMode;
    color?: AlertColor;
    variant?: AlertVariant;
    size?: AlertSize;
    rounded?: SurfaceRounded;
    shadow?: Shadow;
    icon?: IconComponent;
    persistent?: boolean;
    closeLabel?: string;
    outsideDismiss?: boolean;
    escapeDismiss?: boolean;
    initialFocus?: AlertInitialFocus;
    theme?: ThemeInput;
  }>(),
  {
    mode: "inline",
    color: "neutral",
    persistent: false,
    closeLabel: "Dismiss alert",
    outsideDismiss: false,
    escapeDismiss: true,
    initialFocus: "action",
  },
);
const { props, theme } = useResolvedThemeProps(
  "alert",
  "surfaces",
  rawProps,
  { variant: "surface", size: "md", rounded: "auto", shadow: "auto" } as const,
);

const emit = defineEmits<{
  dismiss: [];
  "update:modelValue": [value: boolean];
}>();
const model = defineModel<boolean>();
const instance = getCurrentInstance();
const uncontrolledVisible = ref(props.mode === "inline");
const attrs = useAttrs();
const slots = useSlots();
const rootAttrs = computed(() => withoutClassAttribute(attrs));
const rootElement = ref<HTMLElement | null>(null);
const portalPresentation = computed(() =>
  theme.presentationForPortal(rootElement.value)
);
const dialogElement = computed(() =>
  props.mode === "dialog"
    ? rootElement.value as HTMLDialogElement | null
    : null,
);
const previousOverflow = ref("");
let returnFocusElement: HTMLElement | null = null;
let scrollLocked = false;

const visible = computed({
  get: () => hasModelBinding()
    ? Boolean(model.value)
    : uncontrolledVisible.value,
  set: (value: boolean) => {
    if (hasModelBinding()) model.value = value;
    else {
      uncontrolledVisible.value = value;
      emit("update:modelValue", value);
    }
  },
});
const titleId = computed(() => `${props.id}-title`);
const descriptionId = computed(() =>
  props.description || slots.default
    ? `${props.id}-description`
    : undefined,
);

const defaultIcons: Readonly<Record<AlertColor, IconComponent>> = {
  neutral: Info,
  info: Info,
  success: CircleCheckBig,
  warning: TriangleAlert,
  destructive: CircleAlert,
};
const colorVariantClasses: Readonly<
  Record<AlertColor, Record<AlertVariant, string[]>>
> = {
  neutral: {
    surface: ["border-balsa-border-strong", "bg-balsa-surface", "text-balsa-surface-foreground"],
    outline: ["border-balsa-border-strong", "bg-balsa-background", "text-balsa-foreground"],
    soft: ["border-balsa-border", "bg-balsa-muted", "text-balsa-foreground"],
    solid: ["border-balsa-inverse", "bg-balsa-inverse", "text-balsa-inverse-foreground"],
    glass: ["border-balsa-border/60", "bg-balsa-surface/45", "text-balsa-surface-foreground", "backdrop-blur-md"],
  },
  info: {
    surface: ["border-balsa-info/40", "bg-balsa-surface", "text-balsa-surface-foreground"],
    outline: ["border-balsa-info", "bg-balsa-background", "text-balsa-foreground"],
    soft: ["border-balsa-info/25", "bg-balsa-info/15", "text-balsa-info"],
    solid: ["border-balsa-info", "bg-balsa-info", "text-balsa-info-foreground"],
    glass: ["border-balsa-info/40", "bg-balsa-info/10", "text-balsa-info", "backdrop-blur-md"],
  },
  success: {
    surface: ["border-balsa-success/40", "bg-balsa-surface", "text-balsa-surface-foreground"],
    outline: ["border-balsa-success", "bg-balsa-background", "text-balsa-foreground"],
    soft: ["border-balsa-success/25", "bg-balsa-success/15", "text-balsa-success"],
    solid: ["border-balsa-success", "bg-balsa-success", "text-balsa-success-foreground"],
    glass: ["border-balsa-success/40", "bg-balsa-success/10", "text-balsa-success", "backdrop-blur-md"],
  },
  warning: {
    surface: ["border-balsa-warning/40", "bg-balsa-surface", "text-balsa-surface-foreground"],
    outline: ["border-balsa-warning", "bg-balsa-background", "text-balsa-foreground"],
    soft: ["border-balsa-warning/25", "bg-balsa-warning/15", "text-balsa-warning"],
    solid: ["border-balsa-warning", "bg-balsa-warning", "text-balsa-warning-foreground"],
    glass: ["border-balsa-warning/40", "bg-balsa-warning/10", "text-balsa-warning", "backdrop-blur-md"],
  },
  destructive: {
    surface: ["border-balsa-destructive/40", "bg-balsa-surface", "text-balsa-surface-foreground"],
    outline: ["border-balsa-destructive", "bg-balsa-background", "text-balsa-foreground"],
    soft: ["border-balsa-destructive/25", "bg-balsa-destructive/15", "text-balsa-destructive"],
    solid: ["border-balsa-destructive", "bg-balsa-destructive", "text-balsa-destructive-foreground"],
    glass: ["border-balsa-destructive/40", "bg-balsa-destructive/10", "text-balsa-destructive", "backdrop-blur-md"],
  },
};
const iconColorClasses: Readonly<Record<AlertColor, string>> = {
  neutral: "text-balsa-muted-foreground",
  info: "text-balsa-info",
  success: "text-balsa-success",
  warning: "text-balsa-warning",
  destructive: "text-balsa-destructive",
};
const sizeClasses: Readonly<Record<AlertSize, string>> = {
  sm: "p-balsa-md text-sm",
  md: "p-balsa-lg text-sm",
  lg: "p-balsa-xl text-base",
};
const contentGapClasses: Readonly<Record<AlertSize, string>> = {
  sm: "gap-balsa-md",
  md: "gap-balsa-lg",
  lg: "gap-balsa-xl",
};
const dialogSizeClasses: Readonly<Record<AlertSize, string>> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};
const iconSizes: Readonly<Record<AlertSize, IconSize>> = {
  sm: "md",
  md: "lg",
  lg: "xl",
};
const titleSizeClasses: Readonly<Record<AlertSize, string>> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const isColoredTextVariant = computed(() =>
  props.variant === "soft" || props.variant === "solid" || props.variant === "glass",
);
const currentIcon = computed(() => props.icon ?? defaultIcons[props.color]);
const canDismiss = computed(() => !props.persistent);
const classes = computed(() =>
  mergeClasses(
    "relative min-w-0 font-balsa-body",
    sizeClasses[props.size],
    surfaceRoundedClasses[props.rounded],
    colorVariantClasses[props.color][props.variant],
    props.mode === "dialog"
      ? [
          "fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-auto shadow-balsa-surface outline-none",
          "[&::backdrop]:bg-balsa-overlay [&::backdrop]:backdrop-blur-sm",
          dialogSizeClasses[props.size],
          visible.value ? "" : "hidden",
        ]
      : "w-full",
    attrs.class,
  ),
);
const contentClasses = computed(() => [
  "flex min-w-0 items-start",
  contentGapClasses[props.size],
]);
const iconClasses = computed(() => [
  "shrink-0",
  isColoredTextVariant.value ? "text-current" : iconColorClasses[props.color],
]);
const titleClasses = computed(() => [
  "m-0 font-semibold leading-tight",
  titleSizeClasses[props.size],
]);
const descriptionClasses = computed(() => [
  "mt-balsa-3xs leading-relaxed",
  isColoredTextVariant.value ? "text-current" : "text-balsa-muted-foreground",
]);
const closeClasses = computed(() =>
  mergeClasses(
    "absolute right-2 top-2 size-8 min-h-0 min-w-0 border-0 bg-transparent p-0 text-lg shadow-none",
    isColoredTextVariant.value
      ? "text-current hover:bg-current/15 active:bg-current/25"
      : "text-balsa-muted-foreground hover:bg-balsa-muted hover:text-balsa-foreground active:bg-balsa-muted",
  ),
);
const contentPaddingClasses = computed(() => canDismiss.value ? "pr-balsa-3xl" : "");

function hasModelBinding(): boolean {
  const vnodeProps = instance?.vnode.props;
  return Boolean(
    vnodeProps
    && (
      Object.prototype.hasOwnProperty.call(vnodeProps, "modelValue")
      || Object.prototype.hasOwnProperty.call(vnodeProps, "model-value")
    )
  );
}

function focusDialogTarget(): void {
  const dialog = dialogElement.value;
  if (!dialog) return;
  if (props.initialFocus === "dialog") {
    dialog.focus();
    return;
  }
  const selector = props.initialFocus === "close"
    ? "[data-balsa-alert-close]"
    : "[data-balsa-alert-actions] button:not([disabled]), [data-balsa-alert-actions] a[href]";
  const target = dialog.querySelector<HTMLElement>(selector);
  if (target) target.focus();
  else dialog.focus();
}

function openDialog(): void {
  const dialog = dialogElement.value;
  if (!dialog || dialog.open) return;
  returnFocusElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  previousOverflow.value = document.documentElement.style.overflow;
  document.documentElement.style.overflow = "hidden";
  scrollLocked = true;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  nextTick(focusDialogTarget);
}

function closeDialog(): void {
  const dialog = dialogElement.value;
  if (dialog?.open && typeof dialog.close === "function") dialog.close();
  else dialog?.removeAttribute("open");
  if (scrollLocked) {
    document.documentElement.style.overflow = previousOverflow.value;
    scrollLocked = false;
  }
  nextTick(() => {
    if (returnFocusElement?.isConnected) returnFocusElement.focus();
    returnFocusElement = null;
  });
}

function dismiss(): void {
  if (!canDismiss.value) return;
  visible.value = false;
  emit("dismiss");
}

function handleCancel(event: Event): void {
  event.preventDefault();
  if (props.escapeDismiss) dismiss();
}

function handleDialogClick(event: MouseEvent): void {
  const dialog = dialogElement.value;
  if (!dialog || event.target !== dialog || !props.outsideDismiss) return;
  const bounds = dialog.getBoundingClientRect();
  const inside = event.clientX >= bounds.left
    && event.clientX <= bounds.right
    && event.clientY >= bounds.top
    && event.clientY <= bounds.bottom;
  if (!inside) dismiss();
}

function handleNativeClose(): void {
  if (visible.value) visible.value = false;
  if (scrollLocked) {
    document.documentElement.style.overflow = previousOverflow.value;
    scrollLocked = false;
  }
}

watch(
  [visible, () => props.mode, () => props.theme],
  async ([isVisible, mode]) => {
    if (mode !== "dialog") {
      closeDialog();
      return;
    }
    await nextTick();
    if (isVisible) openDialog();
    else closeDialog();
  },
  { immediate: true },
);

watch(
  () => props.mode,
  (mode, previousMode) => {
    if (!hasModelBinding() && mode !== previousMode) {
      uncontrolledVisible.value = mode === "inline";
    }
  },
);

onBeforeUnmount(closeDialog);
</script>

<template>
  <component
    :is="props.mode === 'dialog' ? 'dialog' : 'section'"
    v-if="props.mode === 'dialog' || visible"
    :id="props.id"
    ref="rootElement"
    v-bind="rootAttrs"
    data-balsa="alert"
    :data-theme="props.mode === 'dialog' ? portalPresentation.id : theme.explicitPresentation.value?.id"
    :data-theme-base="props.mode === 'dialog' ? portalPresentation.base : theme.explicitPresentation.value?.base"
    :data-mode="props.mode"
    :data-color="props.color"
    :data-variant="props.variant"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :data-shadow="props.shadow"
    :role="props.mode === 'dialog' ? 'alertdialog' : 'alert'"
    :tabindex="props.mode === 'dialog' ? -1 : undefined"
    :aria-modal="props.mode === 'dialog' ? 'true' : undefined"
    :aria-labelledby="titleId"
    :aria-describedby="descriptionId"
    :class="classes"
    :style="[
      attrs.style,
      props.mode === 'dialog'
        ? portalPresentation.style
        : theme.explicitPresentation.value?.style,
    ]"
    @cancel="handleCancel"
    @click="handleDialogClick"
    @close="handleNativeClose"
  >
    <div :class="contentClasses">
      <Icon :icon="currentIcon" :size="iconSizes[props.size]" :class="iconClasses" />

      <div :class="['min-w-0 flex-1', contentPaddingClasses]">
        <h3 :id="titleId" :class="titleClasses">{{ props.title }}</h3>
        <div
          v-if="props.description || $slots.default"
          :id="descriptionId"
          :class="descriptionClasses"
        >
          <p v-if="props.description">{{ props.description }}</p>
          <slot />
        </div>
      </div>
    </div>

    <div
      v-if="$slots.actions"
      data-balsa-alert-actions
      class="mt-balsa-md flex min-w-0 flex-wrap justify-end gap-balsa-xs"
    >
      <slot name="actions" :close="dismiss" />
    </div>

    <Button
      v-if="canDismiss"
      data-balsa-alert-close
      :size="null"
      shape="fab"
      variant="outline"
      color="secondary"
      :prefix-icon="X"
      :theme="theme.input.value"
      :aria-label="props.closeLabel"
      :class="closeClasses"
      @click="dismiss"
    />
  </component>
</template>
