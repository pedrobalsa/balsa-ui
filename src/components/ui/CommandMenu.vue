<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import type { LayerVariant } from "./anchored-layer";
import { mergeClasses } from "./classes";
import type { CommandGroup, CommandItem } from "./command";
import CommandList from "./CommandList.vue";
import type { Rounded } from "./form";
import Modal from "./Modal.vue";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export type CommandMenuMode = "inline" | "dialog";
export type CommandMenuSize = "sm" | "md" | "lg";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    groups: readonly CommandGroup[];
    mode?: CommandMenuMode;
    title?: string;
    description?: string;
    placeholder?: string;
    loading?: boolean;
    variant?: LayerVariant;
    size?: CommandMenuSize;
    rounded?: Rounded;
    shadow?: Shadow;
    hotkey?: string;
    contained?: boolean;
    theme?: ThemeInput;
  }>(),
  {
    mode: "inline",
    title: "Command menu",
    placeholder: "Search commands",
    loading: false,
    hotkey: "k",
    contained: false,
  },
);
const { props, theme } = useResolvedThemeProps(
  "command-menu",
  "overlays",
  rawProps,
  { variant: "surface", size: "lg", rounded: "xl", shadow: "auto" } as const,
);

const emit = defineEmits<{
  select: [item: CommandItem];
}>();
const model = defineModel<boolean>({ default: false });
const query = defineModel<string>("query", { default: "" });
const attrs = useAttrs();
const root = ref<HTMLElement | null>(null);

const inlineSizeClasses: Readonly<Record<CommandMenuSize, string>> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
};
const inlineClasses = computed(() =>
  mergeClasses(
    "w-full",
    inlineSizeClasses[props.size],
    attrs.class,
  ),
);

function select(item: CommandItem): void {
  emit("select", item);
  model.value = false;
}

function handleDocumentPointerDown(event: PointerEvent): void {
  const target = event.target as Node;
  if (props.mode === "inline" && model.value && !root.value?.contains(target)) {
    model.value = false;
  }
}

function handleGlobalKeydown(event: KeyboardEvent): void {
  if (
    props.mode !== "dialog"
    || event.key.toLocaleLowerCase() !== props.hotkey.toLocaleLowerCase()
    || !(event.metaKey || event.ctrlKey)
  ) return;
  event.preventDefault();
  model.value = !model.value;
}

onMounted(() => {
  document.addEventListener("keydown", handleGlobalKeydown);
  document.addEventListener("pointerdown", handleDocumentPointerDown);
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleGlobalKeydown);
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
});
</script>

<template>
  <div
    ref="root"
    data-balsa="command-menu"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-palette="typeof attrs['data-palette'] === 'string' ? attrs['data-palette'] : undefined"
    :data-mode="props.mode"
    :data-size="props.size"
    :style="theme.explicitPresentation.value?.style"
  >
    <Modal
      v-if="props.mode === 'dialog'"
      :id="props.id"
      v-model="model"
      :title="props.title"
      :description="props.description"
      :variant="props.variant"
      :rounded="props.rounded"
      :shadow="props.shadow"
      :contained="props.contained"
      :theme="theme.input.value"
      :size="props.size"
    >
      <CommandList
        :id="`${props.id}-commands`"
        v-model:query="query"
        :label="props.label"
        :groups="props.groups"
        :placeholder="props.placeholder"
        :loading="props.loading"
        :variant="props.variant"
        :rounded="props.rounded"
        shadow="none"
        @select="select"
        @escape="model = false"
      >
        <template v-if="$slots.empty" #empty><slot name="empty" /></template>
        <template v-if="$slots.loading" #loading><slot name="loading" /></template>
      </CommandList>
    </Modal>
    <div v-else :class="inlineClasses" :data-shadow="props.shadow" :style="attrs.style">
      <CommandList
        :id="`${props.id}-commands`"
        v-model:query="query"
        :label="props.label"
        :groups="props.groups"
        :placeholder="props.placeholder"
        :loading="props.loading"
        :open="model"
        dropdown
        :variant="props.variant"
        :rounded="props.rounded"
        :shadow="props.shadow"
        @open="model = true"
        @close="model = false"
        @select="select"
        @escape="model = false"
      >
        <template v-if="$slots.empty" #empty><slot name="empty" /></template>
        <template v-if="$slots.loading" #loading><slot name="loading" /></template>
      </CommandList>
    </div>
  </div>
</template>
