<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";
import type { AnchoredAlign, AnchoredSide } from "./anchored-layer";
import { mergeClasses } from "./classes";
import DropdownMenu from "./DropdownMenu.vue";
import { roundedClasses, type Rounded } from "./form";
import Icon, { type IconComponent } from "./Icon.vue";
import type { MenuItem, MenuSelection, MenuVariant } from "./menu";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

/**
 * A full-width property row: a quiet caption over the current value, with a
 * trailing icon or swatch. Supply `items` to pick a value from a menu, or omit
 * them and put an interactive control in the `trailing` slot — the whole row
 * forwards clicks to it, so the visible target matches the clickable one.
 *
 * It resolves against the `dropdown-menu` contract because that is the surface
 * it presents; geometry therefore tracks live Radius edits like any other menu.
 */
defineOptions({ inheritAttrs: false });
defineSlots<{
  trailing(): unknown;
}>();

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    value?: string;
    items?: readonly MenuItem[];
    icon?: IconComponent;
    /** Renders the value in its own family, for font pickers. */
    valueFontFamily?: string;
    side?: AnchoredSide;
    align?: AnchoredAlign;
    sideOffset?: number;
    disabled?: boolean;
    variant?: MenuVariant;
    rounded?: Rounded;
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    side: "bottom",
    align: "start",
    sideOffset: 8,
    disabled: false,
  },
);
const { props } = useResolvedThemeProps(
  "dropdown-menu",
  "overlays",
  rawProps,
  { variant: "surface", rounded: "lg", shadow: "auto" } as const,
);

const emit = defineEmits<{
  select: [selection: MenuSelection];
  activate: [];
}>();

const attrs = useAttrs();
const trailingHost = ref<HTMLElement | null>(null);
const hasMenu = computed(() => Boolean(props.items?.length));
const controlClasses = computed(() =>
  mergeClasses(
    "flex w-full min-w-0 cursor-pointer items-center justify-start gap-0 overflow-hidden border border-balsa-border bg-balsa-surface p-0 text-left text-sm font-semibold text-balsa-surface-foreground transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-balsa-focus-ring",
    // Follow the live control-radius token unless a corner was requested.
    rawProps.rounded === undefined ? "rounded-balsa-control" : roundedClasses[props.rounded],
    props.disabled ? "cursor-not-allowed bg-balsa-disabled text-balsa-disabled-foreground" : "",
    attrs.class,
  ),
);

/**
 * Keeps the row and its trailing control a single target without nesting
 * buttons. Anything the trailing control owns — including a popover it renders
 * as its own descendant — handles its own clicks, so opening a picker from the
 * row does not immediately toggle it back shut.
 */
function forwardToTrailing(event: MouseEvent): void {
  if (props.disabled) return;
  const target = event.target as Node | null;
  if (target && trailingHost.value?.contains(target)) return;
  emit("activate");
  trailingHost.value?.querySelector<HTMLElement>("button, [role='button'], input")?.click();
}
</script>

<template>
  <DropdownMenu
    v-if="hasMenu"
    :id="props.id"
    :label="props.label"
    :items="props.items ?? []"
    :side="props.side"
    :align="props.align"
    :side-offset="props.sideOffset"
    :variant="props.variant"
    :rounded="rawProps.rounded"
    :shadow="props.shadow"
    :disabled="props.disabled"
    :theme="props.theme"
    :class="controlClasses"
    @select="emit('select', $event)"
  >
    <template #trigger>
      <span class="min-w-0 flex-1 py-2 pl-3">
        <small class="block text-xs font-normal text-balsa-muted-foreground">{{ props.label }}</small>
        <strong
          class="block truncate"
          :style="props.valueFontFamily ? { fontFamily: props.valueFontFamily } : undefined"
        >{{ props.value }}</strong>
      </span>
      <slot name="trailing">
        <Icon v-if="props.icon" :icon="props.icon" size="md" class="mr-3 shrink-0 self-center" />
      </slot>
    </template>
  </DropdownMenu>

  <div
    v-else
    :id="props.id"
    data-balsa="property-select"
    :data-rounded="props.rounded"
    :class="controlClasses"
    @click="forwardToTrailing"
  >
    <span class="min-w-0 flex-1 py-2 pl-3" aria-hidden="true">
      <small class="block text-xs font-normal text-balsa-muted-foreground">{{ props.label }}</small>
      <strong
        class="block truncate"
        :style="props.valueFontFamily ? { fontFamily: props.valueFontFamily } : undefined"
      >{{ props.value }}</strong>
    </span>
    <span ref="trailingHost" class="contents">
      <slot name="trailing">
        <Icon v-if="props.icon" :icon="props.icon" size="md" class="mr-3 shrink-0 self-center" />
      </slot>
    </span>
  </div>
</template>
