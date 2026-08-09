<script setup lang="ts">
import Badge from "../ui/Badge.vue";
import Button from "../ui/Button.vue";
import CodeBlock from "../ui/CodeBlock.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

/**
 * A secret shown once, with the two facts that decide what to do about it: when
 * it was made, and when it stops working. Copying is the whole interaction, so
 * the block that holds it is the only thing that grows.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  token?: string;
  created?: string;
  expires?: string;
}>(), {
  title: "Deploy key",
  description: "Shown once. Store it before leaving this page.",
  token: "blsa_live_9f4c21ae7d6b48f0a35c8e12",
  created: "Today, 09:14",
  expires: "Feb 3, 2027",
});
const emit = defineEmits<{ revoke: [] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="api-key">
    <template #action><Badge variant="soft">Write access</Badge></template>
    <div class="flex flex-1 flex-col justify-between gap-balsa-lg">
      <CodeBlock :code="props.token" language="text" wrap />
      <dl class="divide-y divide-balsa-border text-sm">
        <div class="flex justify-between py-balsa-xs"><dt class="text-balsa-muted-foreground">Created</dt><dd>{{ props.created }}</dd></div>
        <div class="flex justify-between py-balsa-xs"><dt class="text-balsa-muted-foreground">Expires</dt><dd>{{ props.expires }}</dd></div>
      </dl>
    </div>
    <template #footer>
      <Button class="w-full" variant="soft" @click="emit('revoke')">Revoke this key</Button>
    </template>
  </CompositionRoot>
</template>
