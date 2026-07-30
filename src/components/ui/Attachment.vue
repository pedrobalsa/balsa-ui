<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";
import Button from "./Button.vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export interface AttachmentRejection {
  file: File;
  reason: "type" | "size" | "count";
  message: string;
}
export type AttachmentStatus = "default" | "unvalidated";
export type AttachmentSize = "sm" | "md" | "lg";

defineOptions({ inheritAttrs: false });
const rawProps = withDefaults(defineProps<{
  id: string;
  label: string;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  status?: AttachmentStatus;
  statusMessage?: string;
  hint?: string;
  size?: AttachmentSize;
  rounded?: Rounded;
  shadow?: Shadow;
  theme?: ThemeInput;
}>(), {
  multiple: false,
  maxSize: Number.POSITIVE_INFINITY,
  maxFiles: Number.POSITIVE_INFINITY,
  required: false,
  disabled: false,
  loading: false,
  status: "default",
  statusMessage: "Choose a valid file.",
});
const { props, theme } = useResolvedThemeProps(
  "attachment",
  "fields",
  rawProps,
  { size: "md", rounded: "lg", shadow: "auto" } as const,
);
const model = defineModel<readonly File[]>({ default: () => [] });
const emit = defineEmits<{ reject: [rejections: readonly AttachmentRejection[]]; remove: [file: File] }>();
const attrs = useAttrs();
const input = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const localError = ref("");
const describedBy = computed(() => [
  props.hint ? `${props.id}-hint` : "",
  props.status === "unvalidated" || localError.value ? `${props.id}-error` : "",
].filter(Boolean).join(" ") || undefined);
const sizeClasses: Readonly<Record<AttachmentSize, string>> = {
  sm: "min-h-20 p-3 text-sm",
  md: "min-h-24 p-4 text-sm",
  lg: "min-h-32 p-5 text-sm",
};
const rootAttrs = computed(() => withoutClassAttribute(attrs));
const classes = computed(() => mergeClasses("space-y-3", attrs.class));
const dropClasses = computed(() => mergeClasses(
  "flex cursor-pointer flex-col items-center justify-center border border-dashed border-balsa-input-border bg-balsa-input text-center text-balsa-input-foreground transition-colors hover:border-balsa-primary focus-within:ring-2 focus-within:ring-balsa-focus-ring",
  sizeClasses[props.size],
  roundedClasses[props.rounded],
  dragging.value && "border-balsa-primary bg-balsa-selected text-balsa-selected-foreground",
  (props.disabled || props.loading) && "cursor-not-allowed opacity-55",
  (props.status === "unvalidated" || localError.value) && "border-balsa-destructive",
));

function accepted(file: File): boolean {
  if (!props.accept) return true;
  return props.accept.split(",").map((value) => value.trim()).some((rule) =>
    rule.startsWith(".")
      ? file.name.toLowerCase().endsWith(rule.toLowerCase())
      : rule.endsWith("/*")
        ? file.type.startsWith(rule.slice(0, -1))
        : file.type === rule,
  );
}
function addFiles(files: readonly File[]): void {
  if (props.disabled || props.loading) return;
  const base = props.multiple ? [...model.value] : [];
  const rejections: AttachmentRejection[] = [];
  for (const file of files) {
    if (!accepted(file)) rejections.push({ file, reason: "type", message: `${file.name} has an unsupported type.` });
    else if (file.size > props.maxSize) rejections.push({ file, reason: "size", message: `${file.name} is too large.` });
    else if (base.length >= props.maxFiles || (!props.multiple && base.length >= 1)) rejections.push({ file, reason: "count", message: `${file.name} exceeds the file limit.` });
    else base.push(file);
  }
  localError.value = rejections[0]?.message ?? "";
  if (rejections.length) emit("reject", rejections);
  model.value = base;
}
function handleInput(event: Event): void {
  addFiles([...(event.target as HTMLInputElement).files ?? []]);
  if (input.value) input.value.value = "";
}
function handleDrop(event: DragEvent): void {
  dragging.value = false;
  addFiles([...(event.dataTransfer?.files ?? [])]);
}
function remove(file: File): void {
  model.value = model.value.filter((candidate) => candidate !== file);
  emit("remove", file);
}
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<template>
  <div
    v-bind="rootAttrs"
    data-balsa="attachment"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-status="props.status"
    :data-shadow="props.shadow"
    :class="classes"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
  >
    <label :for="props.id" class="block font-balsa-body text-sm font-bold text-balsa-foreground">
      {{ props.label }} <span v-if="props.required" class="text-balsa-destructive" aria-hidden="true">*</span>
    </label>
    <label
      :for="props.id"
      :class="dropClasses"
      @dragenter.prevent="dragging = true"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="handleDrop"
    >
      <i class="mdi mdi-paperclip mb-2 text-2xl text-balsa-primary" aria-hidden="true"></i>
      <span class="font-bold">Choose files or drop them here</span>
      <span v-if="props.accept" class="mt-1 text-xs text-balsa-muted-foreground">{{ props.accept }}</span>
      <input
        :id="props.id"
        ref="input"
        type="file"
        class="sr-only"
        :multiple="props.multiple"
        :accept="props.accept"
        :required="props.required && model.length === 0"
        :disabled="props.disabled || props.loading"
        :aria-busy="props.loading"
        :aria-invalid="props.status === 'unvalidated' || Boolean(localError)"
        :aria-describedby="describedBy"
        @change="handleInput"
      />
    </label>
    <ul v-if="model.length" class="space-y-2" aria-label="Selected files">
      <li v-for="(file, index) in model" :key="`${file.name}-${file.size}-${index}`" class="flex items-center gap-3 rounded-balsa-control border border-balsa-border bg-balsa-surface p-3">
        <i class="mdi mdi-file-outline text-xl text-balsa-primary" aria-hidden="true"></i>
        <span class="min-w-0 flex-1"><span class="block truncate font-bold">{{ file.name }}</span><span class="text-xs text-balsa-muted-foreground">{{ formatSize(file.size) }}</span></span>
        <Button shape="fab" size="sm" variant="outline" color="destructive" prefix-icon="mdi-close" :aria-label="`Remove ${file.name}`" :disabled="props.disabled || props.loading" @click="remove(file)" />
      </li>
    </ul>
    <p v-if="props.hint" :id="`${props.id}-hint`" class="text-xs text-balsa-muted-foreground">{{ props.hint }}</p>
    <p v-if="props.status === 'unvalidated' || localError" :id="`${props.id}-error`" class="text-sm font-bold text-balsa-destructive" role="alert">{{ localError || props.statusMessage }}</p>
  </div>
</template>
