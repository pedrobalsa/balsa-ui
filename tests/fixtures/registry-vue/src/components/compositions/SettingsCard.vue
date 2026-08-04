<script setup lang="ts">
import { ref } from "vue";
import Button from "../ui/Button.vue";
import Select, { type SelectOption } from "../ui/Select.vue";
import Switch from "../ui/Switch.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string }>(), { title: "Workspace settings", description: "Manage defaults and product behavior." });
const emit = defineEmits<{ save: [{ locale: string; analytics: boolean }]; reset: [] }>();
const locale = ref("en");
const analytics = ref(true);
const options: readonly SelectOption[] = [{ label: "English (United States)", value: "en" }, { label: "Português (Brasil)", value: "pt" }];
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="settings">
    <div class="grid gap-5">
      <Select id="settings-locale" v-model="locale" label="Default language" :options="options" />
      <div class="border-t border-balsa-border pt-4"><Switch id="settings-analytics" v-model="analytics" label="Usage analytics" hint="Share anonymous activity to improve workspace recommendations." /></div>
    </div>
    <template #footer><div class="flex justify-between gap-3"><Button variant="soft" @click="emit('reset')">Reset</Button><Button @click="emit('save', { locale, analytics })">Save settings</Button></div></template>
  </CompositionRoot>
</template>
