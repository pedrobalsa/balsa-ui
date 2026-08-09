<script setup lang="ts">
import { ref } from "vue";
import Avatar from "../ui/Avatar.vue";
import Button from "../ui/Button.vue";
import Textarea from "../ui/Textarea.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface ThreadMessage { id: string; author: string; initials: string; time: string; body: string; own?: boolean }

/**
 * A conversation and the box to answer it. The thread takes the height because
 * a single message is a notification, not a thread — the reply field sits at
 * the bottom where the reader ends up.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  messages?: readonly ThreadMessage[];
}>(), {
  title: "Rollback discussion",
  description: "Atlas 4.12.0 · three people watching.",
  messages: () => [
    { id: "1", author: "Grace Hopper", initials: "GH", time: "11:02", body: "The São Paulo edge is failing the second health check, so the rollout is holding at 10%." },
    { id: "2", author: "Ada Lovelace", initials: "AL", time: "11:06", body: "That matches the latency spike. I would rather roll back than push through it." },
    { id: "3", author: "Barbara Liskov", initials: "BL", time: "11:09", body: "Agreed. 4.11.6 is still warm in every region." },
  ],
});
const emit = defineEmits<{ send: [body: string] }>();

const reply = ref("");
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="inbox-thread">
    <ol class="grid flex-1 content-start gap-balsa-lg" role="list">
      <li v-for="message in props.messages" :key="message.id" class="flex gap-balsa-md">
        <Avatar :label="message.author" :fallback="message.initials" size="sm" class="mt-balsa-4xs shrink-0" />
        <div class="min-w-0">
          <p class="flex items-baseline gap-balsa-xs">
            <strong class="truncate text-sm font-medium">{{ message.author }}</strong>
            <span class="shrink-0 text-xs tabular-nums text-balsa-muted-foreground">{{ message.time }}</span>
          </p>
          <p class="mt-balsa-3xs text-sm text-balsa-muted-foreground">{{ message.body }}</p>
        </div>
      </li>
    </ol>
    <div class="mt-balsa-lg">
      <Textarea id="thread-reply" v-model="reply" label="Reply" :rows="2" placeholder="Write a reply" />
    </div>
    <template #footer>
      <Button class="w-full" :disabled="!reply" @click="emit('send', reply)">Post reply</Button>
    </template>
  </CompositionRoot>
</template>
