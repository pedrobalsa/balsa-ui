<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "../ui/Button.vue";
import InputOTP from "../ui/InputOTP.vue";
import Link from "../ui/Link.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

/**
 * One task, one control, one confirmation. A verification step is a whole
 * screen in production and still only a single unit here, because padding it
 * out with detail would misrepresent how little should be on it.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  length?: number;
}>(), {
  title: "Confirm this device",
  description: "Enter the six digits sent to ada@example.com.",
  length: 6,
});
const emit = defineEmits<{ verify: [code: string]; resend: [] }>();

const code = ref("");
const complete = computed(() => code.value.length === props.length);
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="device-verification">
    <InputOTP
      id="device-code"
      v-model="code"
      label="Verification code"
      :length="props.length"
      grouped
      fluid
      :separator-every="3"
    />
    <p class="mt-balsa-lg text-xs text-balsa-muted-foreground">
      The code expires in 10 minutes.
      <Link href="#" @click.prevent="emit('resend')">Send it again</Link>
    </p>
    <template #footer>
      <Button class="w-full" :disabled="!complete" @click="emit('verify', code)">Verify device</Button>
    </template>
  </CompositionRoot>
</template>
