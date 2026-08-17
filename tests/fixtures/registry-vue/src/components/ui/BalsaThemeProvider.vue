<script setup lang="ts">
import { computed } from "vue";
import { provideBalsaTheme } from "./theme-context";
import { createThemeScope, type ThemeDefaults, type ThemeInput } from "./theme";

const props = defineProps<{
  theme: ThemeInput;
  defaults?: ThemeDefaults;
}>();

const scope = computed(() => createThemeScope(props.theme, props.defaults));

provideBalsaTheme(() => scope.value.input);
</script>

<template>
  <div
    data-balsa="theme-provider"
    :data-theme="scope.presentation.id"
    :data-theme-base="scope.presentation.base"
    :style="scope.presentation.style"
    class="contents"
  >
    <slot />
  </div>
</template>
