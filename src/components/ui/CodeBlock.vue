<script setup lang="ts">
import { Check, Copy } from "@lucide/vue";
import { computed, onBeforeUnmount, ref, useAttrs, watch } from "vue";
import type { CSSProperties } from "vue";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import plaintext from "highlight.js/lib/languages/plaintext";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import Button from "./Button.vue";
import type { Shadow, ThemeInput } from "./theme";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { useResolvedThemeProps } from "./theme-context";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

defineOptions({ inheritAttrs: false });

const languageAliases: Readonly<Record<string, string>> = {
  bash: "bash",
  css: "css",
  html: "xml",
  javascript: "typescript",
  js: "typescript",
  json: "json",
  plaintext: "plaintext",
  prompt: "plaintext",
  shell: "bash",
  sh: "bash",
  text: "plaintext",
  ts: "typescript",
  typescript: "typescript",
  vue: "xml",
  xml: "xml",
};

type CodeBlockSize = "sm" | "md" | "lg";
type Rounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

/**
 * `block` is the full anatomy: a header carrying the caption and actions above
 * the source. `inline` is the one-line form for a single command — the source
 * and the copy action share one row, and the caption belongs outside the block.
 */
export type CodeBlockLayout = "block" | "inline";

const rawProps = withDefaults(
  defineProps<{
    code: string;
    language?: string;
    label?: string;
    layout?: CodeBlockLayout;
    copyable?: boolean;
    wrap?: boolean;
    lineNumbers?: boolean;
    collapsedLines?: number;
    size?: CodeBlockSize;
    rounded?: Rounded;
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    language: "text",
    layout: "block",
    copyable: true,
    wrap: false,
    lineNumbers: false,
  },
);
const { props, theme } = useResolvedThemeProps(
  "code-block",
  "surfaces",
  rawProps,
  { size: "md", rounded: "lg", shadow: "auto" } as const,
);

const attrs = useAttrs();
const copied = ref(false);
const copyUnavailable = ref(false);
const expanded = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

const copyLabel = computed(() => {
  if (copied.value) return "Copied";
  if (copyUnavailable.value) return "Copy unavailable";
  return "Copy";
});

const copyIcon = computed(() =>
  copied.value ? Check : Copy,
);

const sizeClasses: Readonly<Record<CodeBlockSize, { code: string; header: string; pre: string }>> = {
  sm: { code: "text-xs leading-5", header: "min-h-9 px-3", pre: "p-3" },
  md: { code: "text-sm leading-6", header: "min-h-10 px-3", pre: "p-4" },
  lg: { code: "text-base leading-7", header: "min-h-12 px-4", pre: "p-5" },
};
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};

const codeClasses = computed(() => [
  "hljs block bg-transparent p-0 text-balsa-code-foreground",
  sizeClasses[props.size].code,
  props.wrap
    ? "min-w-0 whitespace-pre-wrap break-words"
    : "min-w-max whitespace-pre",
]);

const rootAttrs = computed(() => withoutClassAttribute(attrs));

const rootClasses = computed(() =>
  mergeClasses(
    "w-full min-w-0 max-w-full overflow-hidden border border-balsa-code-foreground/10 bg-balsa-code text-balsa-code-foreground",
    roundedClasses[props.rounded],
    attrs.class,
  ),
);
const headerClasses = computed(() => [
  "flex items-center justify-between gap-3 border-b border-balsa-code-foreground/10",
  sizeClasses[props.size].header,
]);
const textActionClasses =
  "h-7 shrink-0 gap-1 border-transparent bg-transparent px-1.5 text-xs text-balsa-code-foreground hover:bg-transparent hover:underline focus-visible:outline-balsa-code-foreground";
const iconActionClasses =
  "h-7 w-7 shrink-0 border-transparent bg-transparent p-0 text-balsa-code-foreground hover:bg-transparent focus-visible:outline-balsa-code-foreground";
const preClasses = computed(() => ["overflow-x-auto", sizeClasses[props.size].pre]);
/** One row: the command takes the space, the copy action closes it. */
const inlineRowClasses = computed(() => [
  "flex items-center gap-3",
  sizeClasses[props.size].header,
]);
const lineHeightBySize: Readonly<Record<CodeBlockSize, number>> = {
  sm: 20,
  md: 24,
  lg: 28,
};
const verticalPaddingBySize: Readonly<Record<CodeBlockSize, number>> = {
  sm: 24,
  md: 32,
  lg: 40,
};
const normalizedCollapsedLines = computed(() => {
  if (props.collapsedLines === undefined || !Number.isFinite(props.collapsedLines)) {
    return undefined;
  }

  return Math.max(1, Math.floor(props.collapsedLines));
});
const canExpand = computed(() => {
  const lineLimit = normalizedCollapsedLines.value;
  return lineLimit !== undefined && props.code.split("\n").length > lineLimit;
});
const isCollapsed = computed(() => canExpand.value && !expanded.value);
const previewStyle = computed<CSSProperties | undefined>(() => {
  const lineLimit = normalizedCollapsedLines.value;
  if (!isCollapsed.value || lineLimit === undefined) return undefined;

  return {
    maxHeight: `${verticalPaddingBySize[props.size] + lineHeightBySize[props.size] * lineLimit}px`,
    overflowY: "hidden",
  };
});

const highlightedCode = computed(() => {
  const language = languageAliases[props.language.toLowerCase()] ?? "plaintext";
  return hljs.highlight(props.code, {
    language,
    ignoreIllegals: true,
  }).value;
});

const highlightedLines = computed(() => highlightedCode.value.split("\n"));

const numberedLineClasses = computed(() => [
  "min-w-0 flex-1",
  props.wrap
    ? "whitespace-pre-wrap break-words"
    : "whitespace-pre",
]);

const numberedRowClasses = computed(() => [
  "flex",
  props.wrap ? "min-w-0" : "min-w-max",
]);

async function copyCode(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    copyUnavailable.value = false;
    if (resetTimer) window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      copied.value = false;
      resetTimer = undefined;
    }, 1800);
  } catch {
    copyUnavailable.value = true;
  }
}

function collapseCode(): void {
  expanded.value = false;
}

onBeforeUnmount(() => {
  if (resetTimer) window.clearTimeout(resetTimer);
});

watch(
  () => [props.code, props.collapsedLines],
  () => {
    expanded.value = false;
  },
);
</script>

<template>
  <div
    v-bind="rootAttrs"
    data-balsa="code-block"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-size="props.size"
    :data-layout="props.layout"
    :data-rounded="props.rounded"
    :data-shadow="props.shadow"
    :class="rootClasses"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
  >
    <div v-if="props.layout === 'inline'" :class="inlineRowClasses">
      <!-- highlight.js escapes source before producing this markup. -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <pre class="min-w-0 flex-1 overflow-x-auto"><code :class="codeClasses" v-html="highlightedCode"></code></pre>
      <slot name="actions" />
      <Button
        v-if="props.copyable"
        variant="outline"
        color="primary"
        :size="null"
        :theme="props.theme"
        :prefix-icon="copyIcon"
        :aria-label="`${copyLabel} code`"
        :class="iconActionClasses"
        @click="copyCode"
      />
    </div>

    <template v-else>
    <div
      v-if="props.label || props.copyable || $slots.actions || (canExpand && expanded)"
      :class="headerClasses"
    >
      <span
        data-balsa-code-label
        class="min-w-0 truncate font-mono text-xs"
      >{{ props.label ?? props.language }}</span>
      <div data-balsa-code-actions class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
        <Button
          v-if="canExpand && expanded"
          data-balsa-code-collapse
          type="button"
          variant="outline"
          color="primary"
          :size="null"
          :theme="props.theme"
          :class="textActionClasses"
          @click="collapseCode"
        >
          Show less
        </Button>
        <Button
          v-if="props.copyable"
          variant="outline"
          color="primary"
          :size="null"
          :theme="props.theme"
          :prefix-icon="copyIcon"
          :aria-label="`${copyLabel} code`"
          :class="iconActionClasses"
          @click="copyCode"
        />
      </div>
    </div>
    <div class="relative min-w-0">
      <!-- highlight.js escapes source before producing this markup. -->
      <!-- eslint-disable vue/no-v-html -->
      <pre :class="preClasses" :style="previewStyle"><code v-if="!props.lineNumbers" :class="codeClasses" v-html="highlightedCode"></code><code
        v-else
        :class="[codeClasses, 'min-w-0']"
      ><span
        v-for="(line, index) in highlightedLines"
        :key="`${index}-${line}`"
        :class="numberedRowClasses"
      ><span
        class="mr-4 w-6 shrink-0 select-none text-right text-balsa-code-foreground/40"
        aria-hidden="true"
      >{{ index + 1 }}</span><span :class="numberedLineClasses" v-html="line || ' '"></span></span></code></pre>
      <!-- eslint-enable vue/no-v-html -->
      <div
        v-if="isCollapsed"
        class="pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-balsa-code via-balsa-code/95 to-transparent pb-3"
      >
        <Button
          data-balsa-code-expand
          type="button"
          variant="outline"
          color="primary"
          :size="null"
          class="pointer-events-auto border-transparent bg-transparent px-1.5 text-xs text-balsa-code-foreground hover:bg-transparent hover:underline focus-visible:outline-balsa-code-foreground"
          @click="expanded = true"
        >
          See more
        </Button>
      </div>
    </div>
    </template>
    <span class="sr-only" aria-live="polite">{{ copied ? "Code copied to clipboard." : "" }}</span>
  </div>
</template>
