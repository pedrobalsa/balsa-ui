<script setup lang="ts">
import { CreditCard } from "@lucide/vue";
import Button from "../ui/Button.vue";
import Icon, { type IconComponent } from "../ui/Icon.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; message?: string; actionLabel?: string; icon?: IconComponent }>(), {
  title: "Connect bank", description: "No payout method connected.", message: "Link a bank account to receive monthly royalty distributions automatically.", actionLabel: "Set up payouts", icon: () => CreditCard,
});
const emit = defineEmits<{ action: [] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="empty-state">
    <div class="flex min-h-56 flex-col items-center justify-center text-center">
      <span class="grid size-10 place-items-center rounded-balsa-control bg-balsa-muted"><Icon :icon="props.icon" size="md" /></span>
      <p class="mt-5 max-w-sm text-sm text-balsa-muted-foreground">{{ props.message }}</p>
      <Button class="mt-5" @click="emit('action')">{{ props.actionLabel }}</Button>
    </div>
  </CompositionRoot>
</template>
