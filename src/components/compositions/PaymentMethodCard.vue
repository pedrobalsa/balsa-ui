<script setup lang="ts">
import { Plus } from "@lucide/vue";
import { ref } from "vue";
import Button from "../ui/Button.vue";
import RadioGroup, { type RadioGroupOption } from "../ui/RadioGroup.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; methods?: readonly RadioGroupOption[] }>(), {
  title: "Billing method", description: "How this workspace is invoiced.", methods: () => [
    { label: "Card on file", value: "card", description: "Charged on the first of each month" },
    { label: "Invoice", value: "invoice", description: "Net 30, sent to billing@example.com" },
    { label: "Prepaid credits", value: "credits", description: "4,200 credits remaining" },
  ],
});
const emit = defineEmits<{ continue: [method: string] }>();
const method = ref(props.methods[0]?.value || "");
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="payment-method">
    <RadioGroup id="payment-method" v-model="method" label="Saved methods" :options="props.methods" layout="cards" class="w-full" />
    <Button class="mt-balsa-lg w-full" variant="soft" :prefix-icon="Plus" @click="method = ''">Add another method</Button>
    <dl class="mt-balsa-xl divide-y divide-balsa-border rounded-balsa-control bg-balsa-muted px-balsa-md text-sm">
      <div class="flex justify-between py-balsa-md"><dt>Next invoice</dt><dd class="tabular-nums">Sep 1, 2026</dd></div>
      <div class="flex justify-between py-balsa-md"><dt>Estimated</dt><dd class="tabular-nums">$297.00</dd></div>
      <div class="flex justify-between py-balsa-md"><dt>Billing contact</dt><dd class="truncate">billing@example.com</dd></div>
    </dl>
    <template #footer><Button class="w-full" :disabled="!method" @click="emit('continue', method)">Save billing method</Button></template>
  </CompositionRoot>
</template>
