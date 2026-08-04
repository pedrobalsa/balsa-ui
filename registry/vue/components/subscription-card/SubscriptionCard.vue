<script setup lang="ts">
import { Sparkles } from "@lucide/vue";
import Badge from "../ui/Badge.vue";
import Button from "../ui/Button.vue";
import Progress from "../ui/Progress.vue";
import Icon from "../ui/Icon.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; plan?: string; price?: string; renewal?: string; usage?: number }>(), {
  title: "Subscription", description: "Workspace plan and included usage.", plan: "Pro", price: "$20 / member", renewal: "Renews Aug 31, 2026", usage: 64,
});
const emit = defineEmits<{ manage: [] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="subscription">
    <div class="flex items-start justify-between gap-4"><div><Badge variant="soft">{{ props.plan }}</Badge><strong class="mt-3 block text-2xl tabular-nums">{{ props.price }}</strong><p class="mt-1 text-sm text-balsa-muted-foreground">{{ props.renewal }}</p></div><Icon :icon="Sparkles" size="lg" class="text-balsa-muted-foreground" /></div>
    <Progress class="mt-6" label="Included usage" :value="props.usage" color="primary" show-value />
    <template #footer><Button class="w-full" variant="soft" @click="emit('manage')">Manage subscription</Button></template>
  </CompositionRoot>
</template>
