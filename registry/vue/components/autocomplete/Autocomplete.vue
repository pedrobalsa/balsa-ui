<script setup lang="ts">
import { Check, LoaderCircle, Search, X } from "@lucide/vue";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  watch,
} from "vue";
import Button from "./Button.vue";
import {
  fieldHintClasses,
  fieldLabelClasses,
  fieldStatusMessages,
  getAnchoredPopupPosition,
  getFieldStateColorClass,
  getFieldStatusIcon,
  getTextControlClasses,
  getTextControlPopupClasses,
  textControlOptionClasses,
  type FieldSize,
  type FieldStatus,
  type FieldVariant,
  type Rounded,
} from "./form";
import { type Shadow, type ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import { mergeClasses, withoutClassAttribute } from "./classes";
import Icon from "./Icon.vue";

defineOptions({ name: "BalsaAutocomplete", inheritAttrs: false });

export type AutocompleteModelValue = string | readonly string[];

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    suggestions: readonly string[];
    size?: FieldSize;
    variant?: FieldVariant;
    placeholder?: string;
    hint?: string;
    disabled?: boolean;
    loading?: boolean;
    status?: FieldStatus;
    statusMessage?: string;
    required?: boolean;
    multiple?: boolean;
    defaultOpen?: boolean;
    rounded?: Rounded;
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    disabled: false,
    loading: false,
    status: "default",
    required: false,
    multiple: false,
    defaultOpen: false,
  },
);

const attrs = useAttrs();
const { props, theme } = useResolvedThemeProps(
  "autocomplete",
  "fields",
  rawProps,
  { size: "md", variant: "surface", rounded: "lg", shadow: "auto" } as const,
);
const model = defineModel<AutocompleteModelValue>({ default: "" });

const root = ref<HTMLElement | null>(null);
const portalPresentation = computed(() => theme.presentationForPortal(root.value));
const input = ref<HTMLInputElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const supportsPopover = ref(false);
const activeSuggestionIndex = ref(-1);
const query = ref("");
const menuLeft = ref(0);
const menuTop = ref(0);
const menuWidth = ref(0);

const menuId = computed(() => `${props.id}-suggestions`);
const hintId = computed(() => (props.hint ? `${props.id}-hint` : undefined));
const statusId = computed(() =>
  props.status === "unvalidated" ? `${props.id}-status` : undefined,
);
const describedBy = computed(
  () => [hintId.value, statusId.value].filter(Boolean).join(" ") || undefined,
);
const isDisabled = computed(() => props.disabled || props.loading);
const ariaBusy = computed(() => (props.loading ? "true" : undefined));
const ariaInvalid = computed(() =>
  props.status === "unvalidated" ? "true" : undefined,
);
const selectedValues = computed<readonly string[]>(() =>
  props.multiple && Array.isArray(model.value) ? model.value : [],
);
const inputValue = computed(() =>
  props.multiple
    ? query.value
    : typeof model.value === "string"
      ? model.value
      : "",
);
const filteredSuggestions = computed(() => {
  const normalizedQuery = inputValue.value.trim().toLocaleLowerCase();

  if (!normalizedQuery) return props.suggestions;

  return props.suggestions.filter((suggestion) =>
    suggestion.toLocaleLowerCase().includes(normalizedQuery),
  );
});
const hasVisibleSuggestions = computed(
  () => isOpen.value && filteredSuggestions.value.length > 0,
);
const activeDescendant = computed(() =>
  activeSuggestionIndex.value >= 0 &&
  activeSuggestionIndex.value < filteredSuggestions.value.length
    ? `${props.id}-suggestion-${activeSuggestionIndex.value}`
    : undefined,
);
const stateIcon = computed(
  () =>
    (props.loading ? LoaderCircle : getFieldStatusIcon(props.status)) ?? Search,
);
const stateIconClasses = computed(() => [
  "pointer-events-none absolute top-1/2 -translate-y-1/2",
  props.size === "sm" ? "right-3 text-base" : "right-4 text-lg",
  props.loading ? "text-balsa-info" : getFieldStateColorClass(props.status),
  ...(props.loading ? ["animate-spin"] : []),
]);
const controlAttrs = computed(() => withoutClassAttribute(attrs));
const controlClasses = computed(() =>
  mergeClasses(
    getTextControlClasses(
      props.status,
      true,
      props.disabled,
      props.loading,
      props.size,
      props.rounded,
      props.variant,
    ),
    attrs.class,
  ),
);
const effectiveStatusMessage = computed(() => {
  if (props.status !== "unvalidated") return undefined;

  return props.statusMessage ?? fieldStatusMessages[props.status];
});
const statusRole = computed(() =>
  props.status === "unvalidated" ? "alert" : undefined,
);
const menuClasses = computed(() => [
  getTextControlPopupClasses(props.rounded, props.variant),
  supportsPopover.value
    ? "fixed z-[70] m-0"
    : "absolute left-0 right-0 z-30 mt-balsa-xs",
  hasVisibleSuggestions.value
    ? "visible translate-y-0 opacity-100"
    : "pointer-events-none invisible -translate-y-1 opacity-0",
]);
const menuStyle = computed(() =>
  supportsPopover.value
    ? {
        left: `${menuLeft.value}px`,
        top: `${menuTop.value}px`,
        width: `${menuWidth.value}px`,
      }
    : undefined,
);
const selectedValueClasses = computed(() =>
  "h-7 max-w-full gap-balsa-3xs px-balsa-xs text-xs",
);
const suggestionClasses = computed(() =>
  Object.fromEntries(
    filteredSuggestions.value.map((suggestion, index) => {
      const isActive = index === activeSuggestionIndex.value;
      const isSelected = isSuggestionSelected(suggestion);

      return [
        `${suggestion}-${index}`,
        [
          textControlOptionClasses,
          isSelected
            ? "cursor-pointer bg-balsa-selected text-balsa-selected-foreground"
            : [
                "cursor-pointer text-balsa-surface-elevated-foreground",
                isActive ? "bg-balsa-muted" : "",
              ],
        ],
      ];
    }),
  ),
);

function clampActiveSuggestionIndex(): void {
  if (!filteredSuggestions.value.length) {
    activeSuggestionIndex.value = -1;
    return;
  }

  if (
    activeSuggestionIndex.value < 0 ||
    activeSuggestionIndex.value >= filteredSuggestions.value.length
  ) {
    activeSuggestionIndex.value = 0;
  }
}

function positionMenu(): void {
  if (!hasVisibleSuggestions.value || !input.value || !menu.value) return;

  const position = getAnchoredPopupPosition(input.value, menu.value);
  menuWidth.value = position.width;
  menuLeft.value = position.left;
  menuTop.value = position.top;
}

async function syncMenuPopover(): Promise<void> {
  await nextTick();

  if (!hasVisibleSuggestions.value) {
    if (supportsPopover.value && menu.value?.matches(":popover-open")) {
      menu.value.hidePopover();
    }
    return;
  }

  if (supportsPopover.value && !menu.value?.matches(":popover-open")) {
    menu.value?.showPopover();
  }
  positionMenu();
}

function openMenu(): void {
  if (isDisabled.value) return;

  isOpen.value = true;
  clampActiveSuggestionIndex();
  void syncMenuPopover();
}

function closeMenu(): void {
  if (supportsPopover.value && menu.value?.matches(":popover-open")) {
    menu.value.hidePopover();
  }
  isOpen.value = false;
}

function isSuggestionSelected(suggestion: string): boolean {
  return props.multiple
    ? selectedValues.value.includes(suggestion)
    : suggestion === model.value;
}

function selectSuggestion(suggestion: string): void {
  if (props.multiple) {
    model.value = isSuggestionSelected(suggestion)
      ? selectedValues.value.filter((value) => value !== suggestion)
      : [...selectedValues.value, suggestion];
    query.value = "";
    activeSuggestionIndex.value = 0;
    openMenu();
    void nextTick(() => input.value?.focus());
    return;
  }

  model.value = suggestion;
  closeMenu();
  void nextTick(() => input.value?.focus());
}

function removeSuggestion(suggestion: string): void {
  if (!props.multiple) return;
  model.value = selectedValues.value.filter((value) => value !== suggestion);
  void nextTick(() => input.value?.focus());
}

function activateSuggestion(index: number): void {
  activeSuggestionIndex.value = index;
}

function handleInput(event: Event): void {
  const nextValue = (event.target as HTMLInputElement).value;
  if (props.multiple) query.value = nextValue;
  else model.value = nextValue;
  activeSuggestionIndex.value = 0;
  openMenu();
}

function handleFocus(): void {
  openMenu();
}

function handleKeydown(event: KeyboardEvent): void {
  if (
    props.multiple
    && event.key === "Backspace"
    && !query.value
    && selectedValues.value.length
  ) {
    event.preventDefault();
    removeSuggestion(selectedValues.value.at(-1) ?? "");
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();

    if (!filteredSuggestions.value.length) return;

    if (!isOpen.value) {
      openMenu();
      return;
    }

    activeSuggestionIndex.value =
      (activeSuggestionIndex.value + 1) % filteredSuggestions.value.length;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();

    if (!filteredSuggestions.value.length) return;

    if (!isOpen.value) {
      openMenu();
      return;
    }

    activeSuggestionIndex.value =
      (activeSuggestionIndex.value - 1 + filteredSuggestions.value.length) %
      filteredSuggestions.value.length;
  }

  if (event.key === "Enter" && isOpen.value) {
    const suggestion = filteredSuggestions.value[activeSuggestionIndex.value];

    if (suggestion) {
      event.preventDefault();
      selectSuggestion(suggestion);
    }
  }

  if (event.key === "Escape") {
    closeMenu();
  }

  if (event.key === "Tab") {
    closeMenu();
  }
}

function handleDocumentPointerDown(event: PointerEvent): void {
  if (isOpen.value && !root.value?.contains(event.target as Node)) {
    closeMenu();
  }
}

function handleNativeToggle(): void {
  if (!menu.value?.matches(":popover-open")) isOpen.value = false;
}

function handleViewportChange(): void {
  if (hasVisibleSuggestions.value) positionMenu();
}

watch(filteredSuggestions, () => {
  clampActiveSuggestionIndex();
  if (isOpen.value) void syncMenuPopover();
});

watch(isDisabled, (disabled) => {
  if (disabled) closeMenu();
});

onMounted(() => {
  supportsPopover.value = "showPopover" in HTMLElement.prototype;
  document.addEventListener("pointerdown", handleDocumentPointerDown);
  window.addEventListener("resize", handleViewportChange);
  window.addEventListener("scroll", handleViewportChange, true);

  if (props.defaultOpen) {
    openMenu();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  window.removeEventListener("resize", handleViewportChange);
  window.removeEventListener("scroll", handleViewportChange, true);
});
</script>

<template>
  <div
    ref="root"
    data-balsa="autocomplete"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-rounded="props.rounded"
    :data-variant="props.variant"
    :style="theme.explicitPresentation.value?.style"
  >
    <label :for="props.id" :class="fieldLabelClasses">
      {{ props.label }}
      <span v-if="props.required" class="text-balsa-primary" aria-hidden="true"
        >*</span
      >
    </label>
    <div class="relative">
      <input
        v-bind="controlAttrs"
        ref="input"
        :id="props.id"
        :value="inputValue"
        :placeholder="props.placeholder"
        :disabled="isDisabled"
        :required="props.required"
        :aria-busy="ariaBusy"
        :aria-invalid="ariaInvalid"
        :aria-describedby="describedBy"
        :aria-expanded="hasVisibleSuggestions"
        :aria-controls="menuId"
        :aria-activedescendant="activeDescendant"
        autocomplete="off"
        :class="controlClasses"
        data-balsa-control
        role="combobox"
        aria-autocomplete="list"
        @input="handleInput"
        @focus="handleFocus"
        @keydown="handleKeydown"
      />
      <div
        data-balsa="autocomplete-popover"
        :data-theme="portalPresentation.id"
        :data-theme-base="portalPresentation.base"
        :data-shadow="props.shadow"
        :id="menuId"
        ref="menu"
        popover="manual"
        :class="menuClasses"
        :style="[menuStyle, portalPresentation.style]"
        role="listbox"
        :aria-multiselectable="props.multiple || undefined"
        @toggle="handleNativeToggle"
      >
        <button
          v-for="(suggestion, index) in filteredSuggestions"
          :key="`${suggestion}-${index}`"
          :id="`${props.id}-suggestion-${index}`"
          type="button"
          role="option"
          :aria-selected="isSuggestionSelected(suggestion)"
          :class="suggestionClasses[`${suggestion}-${index}`]"
          @pointerenter="activateSuggestion(index)"
          @click="selectSuggestion(suggestion)"
        >
          <span>{{ suggestion }}</span>
          <Icon
            v-if="isSuggestionSelected(suggestion)"
            :icon="Check"
            size="md"
          />
        </button>
      </div>
      <Icon :icon="stateIcon" size="md" :class="stateIconClasses" />
    </div>
    <div
      v-if="props.multiple && selectedValues.length"
      class="mt-balsa-xs flex flex-wrap gap-balsa-3xs"
      aria-label="Selected suggestions"
    >
      <Button
        v-for="suggestion in selectedValues"
        :key="suggestion"
        :size="null"
        :theme="props.theme"
        variant="outline"
        :suffix-icon="X"
        :class="selectedValueClasses"
        :aria-label="`Remove ${suggestion}`"
        @click="removeSuggestion(suggestion)"
      >
        <span class="truncate">{{ suggestion }}</span>
      </Button>
    </div>
    <span v-if="props.hint" :id="hintId" :class="fieldHintClasses">
      {{ props.hint }}
    </span>
    <span
      v-if="effectiveStatusMessage"
      :id="statusId"
      :role="statusRole"
      class="mt-balsa-xs block text-sm font-medium text-balsa-destructive"
    >
      {{ effectiveStatusMessage }}
    </span>
  </div>
</template>
