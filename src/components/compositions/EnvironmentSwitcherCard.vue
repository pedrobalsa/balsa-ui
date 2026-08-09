<script setup lang="ts">
import { ref } from "vue";
import Autocomplete from "../ui/Autocomplete.vue";
import Badge from "../ui/Badge.vue";
import Button from "../ui/Button.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

/**
 * Search across more environments than a menu should hold, with the current one
 * stated rather than implied. One unit: choosing where you are working is a
 * small decision that should not take a screen.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  environments?: readonly string[];
}>(), {
  title: "Switch environment",
  description: "Everything below applies to the one you pick.",
  environments: () => [
    "atlas-production", "atlas-preview", "atlas-staging",
    "relay-production", "relay-preview",
    "harbor-production", "harbor-development",
    "nova-development", "quill-preview",
  ],
});
const emit = defineEmits<{ switch: [environment: string] }>();

const target = ref("atlas-production");
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="environment-switcher">
    <template #action><Badge color="primary" variant="soft">Live</Badge></template>
    <div class="flex flex-1 flex-col justify-between gap-balsa-lg">
      <Autocomplete
        id="environment-target"
        v-model="target"
        label="Environment"
        :suggestions="props.environments"
        placeholder="Start typing a project or environment"
        hint="Nine environments across five projects."
      />
      <Button class="w-full" @click="emit('switch', target)">Switch to this environment</Button>
    </div>
  </CompositionRoot>
</template>
