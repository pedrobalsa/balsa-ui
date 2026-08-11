<script setup lang="ts">
defineOptions({ name: "BalsaModal" });

import { X } from "@lucide/vue";
import { computed, nextTick, onBeforeUnmount, ref, useAttrs, watch } from "vue";
import type { Shadow, ThemeInput } from "./theme";
import { semanticColorClasses, type ActionColor } from "./types";
import { useResolvedThemeProps } from "./theme-context";
import Icon from "./Icon.vue";

export type ModalPresentation = "dialog" | "sheet" | "fullscreen";
export type ModalVariant = "surface" | "solid" | "outline" | "soft" | "glass";
type ModalSize = "sm" | "md" | "lg" | "full";
type Rounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

const rawProps = withDefaults(
  defineProps<{
    id: string;
    title: string;
    description?: string;
    presentation?: ModalPresentation;
    variant?: ModalVariant;
    color?: ActionColor;
    contained?: boolean;
    closeLabel?: string;
    size?: ModalSize;
    rounded?: Rounded;
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    presentation: "dialog",
    color: "primary",
    contained: false,
    closeLabel: "Close modal",
  },
);
const { props, theme } = useResolvedThemeProps(
  "modal",
  "overlays",
  rawProps,
  { variant: "surface", size: "md", rounded: "2xl", shadow: "auto" } as const,
);

const model = defineModel<boolean>({ default: false });
const attrs = useAttrs();
const themeAnchor = ref<HTMLElement | null>(null);
const portalPresentation = computed(() =>
  theme.presentationForPortal(themeAnchor.value)
);
/**
 * The panel teleports to the body, so a palette scoped to a subtree upstream --
 * a studio that is always dark, say -- would otherwise stop at the boundary.
 * Resolved on open, the way every other teleporting Balsa layer does it.
 */
const resolvedPalette = ref<string>();
let lockedScrollX = 0;
let lockedScrollY = 0;
let returnFocusElement: HTMLElement | null = null;

const titleId = computed(() => `${props.id}-title`);
const descriptionId = computed(() =>
  props.description ? `${props.id}-description` : undefined,
);
const layerPositionClasses = computed(() =>
  props.contained ? "absolute inset-0" : "fixed inset-0",
);
const backdropClasses = computed(() => [
  layerPositionClasses.value,
  "z-40 cursor-default bg-balsa-overlay backdrop-balsa",
]);

const viewportClasses = computed(() => [
  "pointer-events-none z-50 flex",
  layerPositionClasses.value,
  props.presentation === "fullscreen"
    ? "items-stretch justify-stretch p-0"
    : props.presentation === "sheet"
    ? "items-end justify-center p-0"
    : "items-center justify-center p-balsa-lg",
]);

const dialogSizeClasses: Readonly<Record<ModalSize, string>> = {
  sm: "max-w-md p-balsa-xl",
  md: "max-w-lg p-balsa-2xl",
  lg: "max-w-2xl p-balsa-2xl",
  full: "h-full max-w-none p-balsa-xl",
};
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};
const topRoundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-t-none",
  sm: "rounded-t-sm",
  md: "rounded-t-md",
  lg: "rounded-t-lg",
  xl: "rounded-t-xl",
  "2xl": "rounded-t-2xl",
  "3xl": "rounded-t-3xl",
  full: "rounded-t-full",
};
const panelVariantClasses: Readonly<Record<ModalVariant, string>> = {
  surface: "border-balsa-border-strong bg-balsa-surface-elevated text-balsa-surface-elevated-foreground",
  solid: "border",
  outline: "border-balsa-border-strong bg-balsa-background text-balsa-foreground",
  soft: "text-balsa-foreground",
  glass: "text-balsa-surface-foreground",
};
const panelColorClasses: Readonly<Record<ActionColor, Record<ModalVariant, string[]>>> = {
  neutral: {
    surface: [], solid: ["border-balsa-inverse", "bg-balsa-inverse", "text-balsa-inverse-foreground"],
    outline: ["border-balsa-border-strong"], soft: ["bg-balsa-muted"], glass: [],
  },
  primary: {
    surface: ["border-balsa-primary/30"], solid: ["border-balsa-primary", ...semanticColorClasses.primary.solid],
    outline: ["border-balsa-primary"], soft: ["border-balsa-primary/25", "bg-balsa-primary/15"], glass: ["border-balsa-primary/40", "bg-balsa-primary/10"],
  },
  secondary: {
    surface: ["border-balsa-secondary/30"], solid: ["border-balsa-secondary", ...semanticColorClasses.secondary.solid],
    outline: ["border-balsa-secondary"], soft: ["border-balsa-secondary/25", "bg-balsa-secondary/15"], glass: ["border-balsa-secondary/40", "bg-balsa-secondary/10"],
  },
  accent: {
    surface: ["border-balsa-accent/30"], solid: ["border-balsa-accent", ...semanticColorClasses.accent.solid],
    outline: ["border-balsa-accent"], soft: ["border-balsa-accent/25", "bg-balsa-accent/15"], glass: ["border-balsa-accent/40", "bg-balsa-accent/10"],
  },
  destructive: {
    surface: ["border-balsa-destructive/30"], solid: ["border-balsa-destructive", ...semanticColorClasses.destructive.solid],
    outline: ["border-balsa-destructive"], soft: ["border-balsa-destructive/25", "bg-balsa-destructive/15"], glass: ["border-balsa-destructive/40", "bg-balsa-destructive/10"],
  },
};

const panelClasses = computed(() => [
  "pointer-events-auto relative w-full outline-none",
  props.presentation === "fullscreen"
    ? "h-full overflow-hidden rounded-none border-0 bg-transparent shadow-none"
    : [
        "border shadow-balsa-surface",
        panelVariantClasses[props.variant],
        panelColorClasses[props.color][props.variant],
        props.presentation === "sheet"
          ? [
              props.contained
                ? "max-h-[calc(100%-2rem)] p-balsa-xl"
                : "max-h-[calc(100dvh-2rem)] p-balsa-xl sm:p-6",
              "overflow-auto border-b-0",
              topRoundedClasses[props.rounded],
            ]
          : [
              // A dialog is as tall as its content until the viewport runs out,
              // at which point the body scrolls rather than the panel growing
              // past the screen and taking its close button with it.
              "flex flex-col",
              props.contained ? "max-h-full" : "max-h-[calc(100dvh-2rem)]",
              dialogSizeClasses[props.size],
              roundedClasses[props.rounded],
            ],
      ],
]);

const panelEnterFromClass = computed(() =>
  props.presentation === "sheet"
    ? "translate-y-[105%] opacity-100"
    : "translate-y-20 scale-95 opacity-0",
);
const panelLeaveToClass = computed(() =>
  props.presentation === "sheet"
    ? "translate-y-[105%] opacity-100"
    : "translate-y-20 scale-95 opacity-0",
);
const panelEnterActiveClass = computed(() =>
  props.presentation === "sheet"
    ? "transition-all duration-500 ease-out"
    : "transition-all duration-300 ease-out",
);
const panelLeaveActiveClass = computed(() =>
  props.presentation === "sheet"
    ? "transition-all duration-300 ease-in"
    : "transition-all duration-300 ease-in",
);
const closeButtonClasses = computed(() =>
  props.presentation === "fullscreen"
    ? "absolute right-6 top-6 z-10 flex size-11 cursor-pointer items-center justify-center rounded-full border border-balsa-border bg-balsa-surface/70 text-balsa-surface-foreground shadow-balsa-surface backdrop-balsa transition-colors hover:bg-balsa-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
    : props.variant === "solid"
    ? "absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-md text-current/80 transition-colors hover:bg-current/10 hover:text-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
    : "absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-md text-balsa-muted-foreground transition-colors hover:bg-balsa-muted hover:text-balsa-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring",
);
const headerClasses = computed(() =>
  props.presentation === "fullscreen" ? "sr-only" : "mb-balsa-xl shrink-0 pr-10",
);
const eyebrowClasses = computed(() =>
  props.variant === "solid"
    ? "mb-balsa-xs block text-current/75"
    : "mb-balsa-xs block text-balsa-accent",
);
/**
 * The scroll container in a dialog: `min-h-0` is what lets it shrink inside the
 * capped panel instead of pushing the footer out of view. Sheet and fullscreen
 * scroll the panel itself, so the body stays a plain block there.
 */
const bodyClasses = computed(() =>
  props.presentation === "dialog"
    ? "min-h-0 flex-1 overflow-y-auto"
    : undefined,
);
const descriptionClasses = computed(() =>
  props.variant === "solid"
    ? "text-sm text-current/80"
    : "text-sm text-balsa-muted-foreground",
);

function closeModal(): void {
  model.value = false;
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape" && model.value) {
    closeModal();
  }

  if (event.key !== "Tab" || !model.value) return;

  const dialog = document.getElementById(props.id);
  const focusable = Array.from(
    dialog?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (!first || !last) {
    event.preventDefault();
    dialog?.focus();
    return;
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function preventPageScroll(event: Event): void {
  const target = event.target;
  if (target instanceof Element && target.closest('[role="dialog"]')) return;
  event.preventDefault();
}

function preventPageKeyboardScroll(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null;

  if (target instanceof Element && target.closest('[role="dialog"]')) return;

  if (
    ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(
      event.key,
    )
  ) {
    event.preventDefault();
  }
}

function restoreLockedScrollPosition(): void {
  if (window.scrollX !== lockedScrollX || window.scrollY !== lockedScrollY) {
    window.scrollTo(lockedScrollX, lockedScrollY);
  }
}

function lockPageScroll(): void {
  lockedScrollX = window.scrollX;
  lockedScrollY = window.scrollY;

  window.addEventListener("wheel", preventPageScroll, { passive: false });
  window.addEventListener("touchmove", preventPageScroll, { passive: false });
  window.addEventListener("keydown", preventPageKeyboardScroll);
  window.addEventListener("scroll", restoreLockedScrollPosition);
}

function unlockPageScroll(): void {
  window.removeEventListener("wheel", preventPageScroll);
  window.removeEventListener("touchmove", preventPageScroll);
  window.removeEventListener("keydown", preventPageKeyboardScroll);
  window.removeEventListener("scroll", restoreLockedScrollPosition);
}

watch(model, async (isOpen) => {
  if (isOpen) {
    resolvedPalette.value = typeof attrs["data-palette"] === "string"
      ? attrs["data-palette"]
      : themeAnchor.value?.closest<HTMLElement>("[data-palette]")?.dataset.palette;
    returnFocusElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  }

  if (!props.contained) {
    if (isOpen) {
      lockPageScroll();
    } else {
      unlockPageScroll();
    }
  }

  if (isOpen) {
    await nextTick();
    document.getElementById(props.id)?.focus();
  } else {
    await nextTick();
    if (returnFocusElement?.isConnected) returnFocusElement.focus();
    returnFocusElement = null;
  }
});

onBeforeUnmount(() => {
  unlockPageScroll();
});
</script>

<template>
  <span
    ref="themeAnchor"
    data-balsa="modal"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-size="props.size"
    :data-variant="props.variant"
    :data-color="props.color"
    :data-rounded="props.rounded"
    :style="theme.explicitPresentation.value?.style"
    class="contents"
  >
  <Teleport to="body" :disabled="props.contained">
    <Transition
      appear
      enter-active-class="transition-opacity duration-500 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <button
        v-if="model"
        data-balsa="modal-backdrop"
        :data-theme="portalPresentation.id"
        :data-theme-base="portalPresentation.base"
        :data-palette="resolvedPalette"
        :style="portalPresentation.style"
        type="button"
        :class="backdropClasses"
        :aria-label="props.closeLabel"
        @click="closeModal"
      ></button>
    </Transition>

    <div
      :data-theme="portalPresentation.id"
      :data-theme-base="portalPresentation.base"
      :data-palette="resolvedPalette"
      :style="portalPresentation.style"
      :class="viewportClasses"
      @keydown="handleKeydown"
    >
      <Transition
        appear
        :enter-active-class="panelEnterActiveClass"
        :enter-from-class="panelEnterFromClass"
        enter-to-class="translate-y-0 scale-100 opacity-100"
        :leave-active-class="panelLeaveActiveClass"
        leave-from-class="translate-y-0 scale-100 opacity-100"
        :leave-to-class="panelLeaveToClass"
      >
        <section
          v-if="model"
          data-balsa="modal-panel"
          :data-theme="portalPresentation.id"
          :data-theme-base="portalPresentation.base"
          :data-palette="resolvedPalette"
          :data-size="props.size"
          :data-variant="props.variant"
          :data-color="props.color"
          :data-presentation="props.presentation"
          :data-shadow="props.presentation === 'fullscreen' ? 'none' : props.shadow"
          :id="props.id"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descriptionId"
          :class="panelClasses"
        >
          <button
            type="button"
            :class="closeButtonClasses"
            :aria-label="props.closeLabel"
            @click="closeModal"
          >
            <Icon :icon="X" :size="props.presentation === 'fullscreen' ? 'lg' : 'md'" />
          </button>

          <header :class="headerClasses">
            <!-- Only when the caller has one to give: an eyebrow reading
                 "Modal" names the mechanism instead of the task. -->
            <small v-if="$slots.eyebrow" :class="eyebrowClasses">
              <slot name="eyebrow"></slot>
            </small>
            <h3
              :id="titleId"
              class="mb-balsa-xs font-balsa-title text-lg font-semibold leading-none tracking-tight"
            >
              {{ props.title }}
            </h3>
            <p
              v-if="props.description"
              :id="descriptionId"
              :class="descriptionClasses"
            >
              {{ props.description }}
            </p>
          </header>

          <div :class="bodyClasses">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="mt-balsa-2xl flex shrink-0 flex-wrap gap-balsa-xs">
            <slot name="footer" :close="closeModal" />
          </footer>
        </section>
      </Transition>
    </div>
  </Teleport>
  </span>
</template>
