<script setup lang="ts">
defineOptions({ name: "BalsaAccordion" });

import { computed, ref } from "vue";
import { mergeClasses } from "./classes";
import Collapsible, {
  type CollapsibleHeadingLevel,
  type CollapsibleSize,
  type CollapsibleVariant,
} from "./Collapsible.vue";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export interface AccordionItem {
  id: string;
  title: string;
  content?: string;
  disabled?: boolean;
}

export type AccordionType = "single" | "multiple";

const rawProps = withDefaults(
  defineProps<{
    id: string;
    items: readonly AccordionItem[];
    type?: AccordionType;
    collapsible?: boolean;
    label?: string;
    variant?: CollapsibleVariant;
    size?: CollapsibleSize;
    rounded?: Rounded;
    shadow?: Shadow;
    headingLevel?: CollapsibleHeadingLevel;
    disabled?: boolean;
    theme?: ThemeInput;
  }>(),
  {
    type: "single",
    collapsible: true,
    label: "Accordion",
    headingLevel: 3,
    disabled: false,
  },
);
const { props, theme } = useResolvedThemeProps(
  "accordion",
  "surfaces",
  rawProps,
  { variant: "surface", size: "md", rounded: "lg", shadow: "auto" } as const,
);

const model = defineModel<string | readonly string[]>({ required: true });
const rootElement = ref<HTMLElement | null>(null);

const variantClasses: Readonly<Record<CollapsibleVariant, string[]>> = {
  underline: ["border-0", "bg-transparent", "text-balsa-foreground"],
  surface: ["border-balsa-border", "bg-balsa-surface", "text-balsa-surface-foreground"],
  outline: ["border-balsa-border-strong", "bg-transparent", "text-balsa-foreground"],
  soft: ["border-balsa-primary/20", "bg-balsa-primary/5", "text-balsa-foreground"],
  glass: [
    "border-balsa-border/70",
    "bg-balsa-surface/60",
    "text-balsa-foreground",
    "backdrop-balsa",
  ],
};
const rootClasses = computed(() =>
  mergeClasses(
    props.variant === "underline"
      ? "min-w-0 font-balsa-body"
      : ["min-w-0 overflow-hidden font-balsa-body", roundedClasses[props.rounded]],
    variantClasses[props.variant],
  ),
);

function itemIsDisabled(item: AccordionItem): boolean {
  return props.disabled || item.disabled === true;
}

function isOpen(id: string): boolean {
  return Array.isArray(model.value)
    ? model.value.includes(id)
    : model.value === id;
}

function updateItem(id: string, open: boolean): void {
  const item = props.items.find((candidate) => candidate.id === id);
  if (!item || itemIsDisabled(item)) return;

  if (props.type === "multiple") {
    const current = Array.isArray(model.value) ? [...model.value] : [];
    model.value = open
      ? [...new Set([...current, id])]
      : current.filter((value) => value !== id);
    return;
  }

  if (open) {
    model.value = id;
  } else if (props.collapsible) {
    model.value = "";
  }
}

function itemClasses(index: number): string {
  return mergeClasses(
    "rounded-none border-0 bg-transparent",
    // The rule between two items is an edge like any other, so its width reads
    // the border token rather than compiling to a literal 1px.
    props.variant === "underline" || index === 0
      ? ""
      : "border-t-(length:--balsa-border-width) border-balsa-border/80",
  );
}

function enabledTriggers(): HTMLButtonElement[] {
  return Array.from(
    rootElement.value?.querySelectorAll<HTMLButtonElement>(
      '[data-balsa="collapsible-trigger"]:not(:disabled)',
    ) ?? [],
  );
}

function moveFocus(
  current: HTMLButtonElement,
  target: "next" | "previous" | "first" | "last",
): void {
  const triggers = enabledTriggers();
  if (triggers.length === 0) return;
  const currentIndex = triggers.indexOf(current);
  const targetIndex =
    target === "first"
      ? 0
      : target === "last"
        ? triggers.length - 1
        : target === "next"
          ? (Math.max(currentIndex, 0) + 1) % triggers.length
          : (Math.max(currentIndex, 0) - 1 + triggers.length) % triggers.length;
  triggers[targetIndex]?.focus();
}

function handleKeydown(event: KeyboardEvent): void {
  const target = event.target;
  if (
    !(target instanceof HTMLButtonElement)
    || target.dataset.balsa !== "collapsible-trigger"
  ) {
    return;
  }

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    moveFocus(target, event.key === "ArrowDown" ? "next" : "previous");
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    moveFocus(target, event.key === "Home" ? "first" : "last");
  }
}
</script>

<template>
  <div
    :id="props.id"
    ref="rootElement"
    data-balsa="accordion"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-type="props.type"
    :data-variant="props.variant"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :data-disabled="props.disabled || undefined"
    :data-shadow="props.shadow"
    role="group"
    :aria-label="props.label"
    :class="rootClasses"
    :style="theme.explicitPresentation.value?.style"
    @keydown="handleKeydown"
  >
    <Collapsible
      v-for="(item, index) in props.items"
      :id="`${props.id}-${item.id}`"
      :key="item.id"
      :model-value="isOpen(item.id)"
      :title="item.title"
      :variant="props.variant"
      :size="props.size"
      rounded="none"
      shadow="none"
      :heading-level="props.headingLevel"
      :disabled="itemIsDisabled(item)"
      :theme="props.theme"
      :class="itemClasses(index)"
      @update:model-value="updateItem(item.id, $event)"
    >
      <slot :name="item.id" :item="item">
        {{ item.content }}
      </slot>
    </Collapsible>
  </div>
</template>
