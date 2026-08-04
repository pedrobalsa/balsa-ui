<script setup lang="ts">
import { ArrowRight, CircleAlert, Lock } from "@lucide/vue";
import { ref } from "vue";
import Button from "../ui/Button.vue";
import Icon from "../ui/Icon.vue";
import Input from "../ui/Input.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  email?: string;
  saveLabel?: string;
  dangerTitle?: string;
  dangerDescription?: string;
}>(), {
  title: "Account access",
  description: "Update your credentials or re-authenticate.",
  email: "artist@studio.inc",
  saveLabel: "Update security",
  dangerTitle: "Danger zone",
  dangerDescription: "Archive this account and remove its catalog.",
});
const emit = defineEmits<{ save: [email: string]; danger: [] }>();
const emailValue = ref(props.email);
const password = ref("••••••••••");
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="account-security">
    <div class="grid gap-4">
      <Input id="account-security-email" v-model="emailValue" label="Email address" type="email" />
      <Input id="account-security-password" v-model="password" label="Current password" type="password" autocomplete="current-password" />
    </div>
    <template #footer>
      <div class="grid gap-3">
        <Button class="w-full" :prefix-icon="Lock" @click="emit('save', emailValue)">{{ props.saveLabel }}</Button>
        <button type="button" class="flex w-full items-center gap-3 rounded-balsa-control bg-balsa-muted px-3 py-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring" @click="emit('danger')">
          <Icon :icon="CircleAlert" size="md" class="text-balsa-accent" />
          <span class="min-w-0 flex-1"><strong class="block text-sm font-medium text-balsa-surface-foreground">{{ props.dangerTitle }}</strong><span class="mt-0.5 block text-balsa-muted-foreground">{{ props.dangerDescription }}</span></span>
          <Icon :icon="ArrowRight" size="md" />
        </button>
      </div>
    </template>
  </CompositionRoot>
</template>
