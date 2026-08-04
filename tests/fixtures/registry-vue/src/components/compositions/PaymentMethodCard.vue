<script setup lang="ts">
import { Plus } from "@lucide/vue";
import { ref } from "vue";
import Button from "../ui/Button.vue";
import RadioGroup, { type RadioGroupOption } from "../ui/RadioGroup.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; methods?: readonly RadioGroupOption[] }>(), {
  title: "Payment method", description: "Choose how to pay for this order.", methods: () => [
    { label: "Visa ending in 4242", value: "visa", description: "Expires 04/29" },
    { label: "Business account", value: "bank", description: "ACH ···· 8402" },
  ],
});
const emit = defineEmits<{ continue: [method: string] }>();
const method = ref(props.methods[0]?.value || "");
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="payment-method">
    <RadioGroup id="payment-method" v-model="method" label="Saved methods" :options="props.methods" layout="cards" />
    <Button class="mt-4 w-full" variant="soft" :prefix-icon="Plus" @click="method = ''">Add payment method</Button>
    <template #footer><Button class="w-full" :disabled="!method" @click="emit('continue', method)">Continue</Button></template>
  </CompositionRoot>
</template>
