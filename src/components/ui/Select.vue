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
import {
  fieldHintClasses,
  fieldLabelClasses,
  fieldStatusMessages,
  getAnchoredPopupPosition,
  getFieldStateColorClass,
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

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export type SelectModelValue = string | readonly string[];

defineOptions({ inheritAttrs: false });
defineSlots<{
  selected(props: {
    option: SelectOption | undefined;
    options: readonly SelectOption[];
    text: string;
  }): unknown;
  option(props: {
    option: SelectOption;
    selected: boolean;
    active: boolean;
  }): unknown;
}>();

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    options: readonly SelectOption[];
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
  },
);

const attrs = useAttrs();
const { props, theme } = useResolvedThemeProps(
  "select",
  "fields",
  rawProps,
  { size: "md", variant: "surface", rounded: "lg", shadow: "auto" } as const,
);
const model = defineModel<SelectModelValue>({ default: "" });

const root = ref<HTMLElement | null>(null);
const portalPresentation = computed(() => theme.presentationForPortal(root.value));
const trigger = ref<HTMLButtonElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const supportsPopover = ref(false);
const activeOptionIndex = ref(-1);
const menuLeft = ref(0);
const menuTop = ref(0);
const menuWidth = ref(0);

const menuId = computed(() => `${props.id}-menu`);
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
const selectedValues = computed<readonly string[]>(() => {
  if (Array.isArray(model.value)) return model.value;
  return props.multiple ? [] : [model.value];
});
const selectedOptions = computed(() =>
  props.options.filter((option) => selectedValues.value.includes(option.value)),
);
const selectedOption = computed(() => selectedOptions.value[0]);
const triggerText = computed(
  () => {
    const labels = selectedOptions.value.map((option) => option.label);
    if (labels.length) return labels.join(", ");
    return props.placeholder ?? "Select an option";
  },
);
const activeDescendant = computed(() =>
  activeOptionIndex.value >= 0
    ? `${props.id}-option-${activeOptionIndex.value}`
    : undefined,
);
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
    "flex items-center text-left",
    selectedOptions.value.length ? "" : "text-balsa-muted-foreground",
    attrs.class,
  ),
);
const iconClasses = computed(() => [
  "mdi",
  props.loading
    ? "mdi-loading"
    : isOpen.value
      ? "mdi-chevron-up"
      : "mdi-chevron-down",
  "pointer-events-none absolute top-1/2 -translate-y-1/2",
  "right-3 text-lg",
  props.loading ? "text-balsa-info" : getFieldStateColorClass(props.status),
  ...(props.loading ? ["animate-spin"] : []),
]);
const effectiveStatusMessage = computed(() => {
  if (props.status !== "unvalidated") return undefined;

  return props.statusMessage ?? fieldStatusMessages[props.status];
});
const statusRole = computed(() =>
  props.status === "unvalidated" ? "alert" : undefined,
);
const menuClasses = computed(() => [
  getTextControlPopupClasses(props.rounded, props.variant),
  "space-y-1",
  supportsPopover.value
    ? "fixed z-[70] m-0"
    : "absolute left-0 right-0 z-30 mt-2",
  isOpen.value
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
const optionClasses = computed(() =>
  Object.fromEntries(
    props.options.map((option, index) => {
      const isActive = index === activeOptionIndex.value;
      const isSelected = isOptionSelected(option);

      return [
        option.value,
        [
          textControlOptionClasses,
          option.disabled
            ? "cursor-not-allowed bg-balsa-disabled text-balsa-disabled-foreground"
            : isSelected
              ? "cursor-pointer bg-balsa-selected/80 text-balsa-selected-foreground"
              : [
                  "cursor-pointer text-balsa-surface-elevated-foreground",
                  isActive ? "bg-balsa-muted" : "",
                ],
        ],
      ];
    }),
  ),
);

function findFirstEnabledOptionIndex(): number {
  return props.options.findIndex((option) => !option.disabled);
}

function findNextEnabledOptionIndex(
  currentIndex: number,
  step: 1 | -1,
): number {
  if (!props.options.length) return -1;

  for (let offset = 1; offset <= props.options.length; offset += 1) {
    const nextIndex =
      (currentIndex + offset * step + props.options.length) %
      props.options.length;

    if (!props.options[nextIndex].disabled) return nextIndex;
  }

  return -1;
}

function positionMenu(): void {
  if (!isOpen.value || !trigger.value || !menu.value) return;

  const position = getAnchoredPopupPosition(trigger.value, menu.value);
  menuWidth.value = position.width;
  menuLeft.value = position.left;
  menuTop.value = position.top;
}

async function openMenu(): Promise<void> {
  if (isDisabled.value || isOpen.value) return;

  const selectedIndex = props.options.findIndex(
    (option) => isOptionSelected(option) && !option.disabled,
  );

  activeOptionIndex.value =
    selectedIndex >= 0 ? selectedIndex : findFirstEnabledOptionIndex();
  isOpen.value = true;
  await nextTick();

  if (supportsPopover.value && !menu.value?.matches(":popover-open")) {
    menu.value?.showPopover();
  }
  positionMenu();
}

function closeMenu(): void {
  if (supportsPopover.value && menu.value?.matches(":popover-open")) {
    menu.value.hidePopover();
  }
  isOpen.value = false;
}

function toggleMenu(): void {
  if (isOpen.value) {
    closeMenu();
    return;
  }

  void openMenu();
}

function selectOption(option: SelectOption): void {
  if (option.disabled) return;

  if (props.multiple) {
    model.value = isOptionSelected(option)
      ? selectedValues.value.filter((value) => value !== option.value)
      : [...selectedValues.value, option.value];
    return;
  }

  model.value = option.value;
  closeMenu();
  void nextTick(() => trigger.value?.focus());
}

function isOptionSelected(option: SelectOption): boolean {
  return selectedValues.value.includes(option.value);
}

function activateOption(index: number): void {
  if (props.options[index]?.disabled) return;

  activeOptionIndex.value = index;
}

function handleKeydown(event: KeyboardEvent): void {
  if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    event.preventDefault();

    if (!isOpen.value) {
      void openMenu();
      return;
    }
  }

  if (event.key === "ArrowDown") {
    activeOptionIndex.value = findNextEnabledOptionIndex(
      activeOptionIndex.value,
      1,
    );
  }

  if (event.key === "ArrowUp") {
    activeOptionIndex.value = findNextEnabledOptionIndex(
      activeOptionIndex.value,
      -1,
    );
  }

  if (event.key === "Home") {
    activeOptionIndex.value = findFirstEnabledOptionIndex();
  }

  if (event.key === "End") {
    activeOptionIndex.value = findNextEnabledOptionIndex(0, -1);
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();

    if (!isOpen.value) {
      void openMenu();
      return;
    }

    const option = props.options[activeOptionIndex.value];

    if (option) selectOption(option);
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
  if (isOpen.value) positionMenu();
}

watch(isDisabled, (disabled) => {
  if (disabled) closeMenu();
});

onMounted(() => {
  supportsPopover.value = "showPopover" in HTMLElement.prototype;
  document.addEventListener("pointerdown", handleDocumentPointerDown);
  window.addEventListener("resize", handleViewportChange);
  window.addEventListener("scroll", handleViewportChange, true);
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
    data-balsa="select"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-rounded="props.rounded"
    :data-variant="props.variant"
    :style="theme.explicitPresentation.value?.style"
  >
    <label v-if="props.label" :for="props.id" :class="fieldLabelClasses">
      {{ props.label }}
      <span v-if="props.required" class="text-balsa-primary" aria-hidden="true"
        >*</span
      >
    </label>
    <div class="relative">
      <button
        v-bind="controlAttrs"
        ref="trigger"
        :id="props.id"
        type="button"
        :disabled="isDisabled"
        :aria-busy="ariaBusy"
        :aria-invalid="ariaInvalid"
        :aria-required="props.required"
        :aria-describedby="describedBy"
        :aria-expanded="isOpen"
        :aria-controls="menuId"
        :aria-activedescendant="activeDescendant"
        :class="controlClasses"
        data-balsa-control
        aria-haspopup="listbox"
        role="combobox"
        @click="toggleMenu"
        @keydown="handleKeydown"
      >
        <slot
          name="selected"
          :option="selectedOption"
          :options="selectedOptions"
          :text="triggerText"
        >
          {{ triggerText }}
        </slot>
      </button>
      <div
        data-balsa="select-popover"
        :data-theme="portalPresentation.id"
        :data-theme-base="portalPresentation.base"
        :data-shadow="props.shadow"
        :id="menuId"
        ref="menu"
        popover="auto"
        :class="menuClasses"
        :style="[menuStyle, portalPresentation.style]"
        role="listbox"
        :aria-multiselectable="props.multiple || undefined"
        @toggle="handleNativeToggle"
      >
        <button
          v-for="option in props.options"
          :key="option.value"
          :id="`${props.id}-option-${props.options.indexOf(option)}`"
          type="button"
          role="option"
          :disabled="option.disabled"
          :aria-selected="isOptionSelected(option)"
          :class="optionClasses[option.value]"
          @pointerenter="activateOption(props.options.indexOf(option))"
          @click="selectOption(option)"
        >
          <slot
            name="option"
            :option="option"
            :selected="isOptionSelected(option)"
            :active="props.options.indexOf(option) === activeOptionIndex"
          >
            <span>{{ option.label }}</span>
          </slot>
          <i
            v-if="isOptionSelected(option)"
            class="mdi mdi-check shrink-0 text-lg leading-none"
            aria-hidden="true"
          />
        </button>
      </div>
      <i :class="iconClasses" aria-hidden="true"></i>
    </div>
    <span v-if="props.hint" :id="hintId" :class="fieldHintClasses">
      {{ props.hint }}
    </span>
    <span
      v-if="effectiveStatusMessage"
      :id="statusId"
      :role="statusRole"
      class="mt-2 block text-sm font-bold text-balsa-destructive"
    >
      {{ effectiveStatusMessage }}
    </span>
  </div>
</template>
