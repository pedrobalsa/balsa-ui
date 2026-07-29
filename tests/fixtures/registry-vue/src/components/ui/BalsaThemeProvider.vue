<script setup lang="ts">
import { computed } from "vue";
import { provideBalsaTheme } from "./theme-context";
import { themePresentation, type ThemeDefaults, type ThemeInput } from "./theme";

const props = defineProps<{
  theme: ThemeInput;
  defaults?: ThemeDefaults;
}>();

const providerTheme = computed<ThemeInput>(() => {
  if (!props.defaults) return props.theme;
  return {
    id: typeof props.theme === "string" ? props.theme : props.theme.id,
    name: typeof props.theme === "string" ? props.theme : props.theme.name,
    extends: props.theme,
    overrides: { defaults: props.defaults },
  };
});
const presentation = computed(() => themePresentation(providerTheme.value));

provideBalsaTheme(providerTheme);
</script>

<template>
  <div
    data-balsa="theme-provider"
    :data-theme="presentation.id"
    :data-theme-base="presentation.base"
    :style="presentation.style"
    class="contents"
  >
    <slot />
  </div>
</template>
