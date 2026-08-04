<script setup lang="ts">
import { ref } from "vue";
import Button from "../ui/Button.vue";
import Input from "../ui/Input.vue";
import RadioGroup, { type RadioGroupOption } from "../ui/RadioGroup.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string; description?: string; accountHolder?: string; accountNumber?: string;
}>(), { title: "Payout preferences", description: "Choose how you receive funds.", accountHolder: "Synthetic Horizons Music LLC", accountNumber: "DE89 3704 0044 …" });
const emit = defineEmits<{ save: [method: string] }>();
const method = ref("bank");
const holder = ref(props.accountHolder);
const account = ref(props.accountNumber);
const methods: readonly RadioGroupOption[] = [
  { label: "Bank transfer", value: "bank", description: "SWIFT / IBAN" },
  { label: "PayPal", value: "paypal", description: "Instant payout" },
];
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="payout-method">
    <div class="grid gap-4">
      <Input id="payout-holder" v-model="holder" label="Account holder name" />
      <RadioGroup id="payout-method" v-model="method" label="Receiving method" :options="methods" layout="cards" />
      <Input id="payout-account" v-model="account" label="IBAN / account number" />
    </div>
    <template #footer><Button class="w-full" @click="emit('save', method)">Save payout settings</Button></template>
  </CompositionRoot>
</template>
