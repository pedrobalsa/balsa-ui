<script setup lang="ts">
import { ref } from "vue";
import Avatar from "../ui/Avatar.vue";
import Button from "../ui/Button.vue";
import Input from "../ui/Input.vue";
import Select, { type SelectOption } from "../ui/Select.vue";
import Switch from "../ui/Switch.vue";
import Textarea from "../ui/Textarea.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

/**
 * The ordinary form, done properly: labelled fields, a hint where one is
 * genuinely needed, and a save that is the last thing on the card. It is here
 * because most of an application is this, not the interesting surfaces.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
}>(), {
  title: "Your profile",
  description: "How you appear to everyone in this workspace.",
});
const emit = defineEmits<{ save: [{ name: string; handle: string; timezone: string; bio: string }] }>();

const name = ref("Ada Lovelace");
const handle = ref("ada");
const timezone = ref("europe-london");
const bio = ref("Working on the deploy pipeline and whatever it breaks.");
const website = ref("https://example.com/ada");
const showLocalTime = ref(true);

const timezones: readonly SelectOption[] = [
  { label: "Europe / London", value: "europe-london" },
  { label: "America / New York", value: "america-new-york" },
  { label: "America / São Paulo", value: "america-sao-paulo" },
  { label: "Asia / Tokyo", value: "asia-tokyo" },
];
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="profile-form">
    <div class="flex flex-1 flex-col gap-balsa-lg">
      <div class="flex items-center gap-balsa-md">
        <Avatar label="Ada Lovelace" fallback="AL" size="lg" />
        <Button variant="soft" size="sm">Change picture</Button>
      </div>
      <Input id="profile-name" v-model="name" label="Display name" />
      <Input id="profile-handle" v-model="handle" label="Handle" hint="Used in mentions and commit trailers." />
      <Select id="profile-timezone" v-model="timezone" label="Time zone" :options="timezones" />
      <Textarea id="profile-bio" v-model="bio" label="About" :rows="3" class="flex-1" />
      <Input id="profile-website" v-model="website" label="Website" />
      <div class="rounded-balsa-control border border-balsa-border p-balsa-md">
        <Switch
          id="profile-local-time"
          v-model="showLocalTime"
          label="Show local time"
          hint="Others see the hour where you are."
        />
      </div>
    </div>
    <template #footer>
      <Button class="w-full" @click="emit('save', { name, handle, timezone, bio })">Save profile</Button>
    </template>
  </CompositionRoot>
</template>
