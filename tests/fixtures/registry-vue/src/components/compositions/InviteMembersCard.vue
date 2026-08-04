<script setup lang="ts">
import { Plus } from "@lucide/vue";
import { reactive } from "vue";
import Button from "../ui/Button.vue";
import Input from "../ui/Input.vue";
import Select, { type SelectOption } from "../ui/Select.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface InviteMember { email: string; role: string }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string }>(), { title: "Invite team", description: "Add members to your workspace." });
const emit = defineEmits<{ invite: [members: readonly InviteMember[]] }>();
const members = reactive<InviteMember[]>([{ email: "alex@example.com", role: "editor" }, { email: "sam@example.com", role: "viewer" }]);
const roles: readonly SelectOption[] = [{ label: "Editor", value: "editor" }, { label: "Viewer", value: "viewer" }];
function addMember(): void { members.push({ email: "", role: "viewer" }); }
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="invite-members">
    <div class="grid gap-3">
      <div v-for="(member, index) in members" :key="index" class="grid grid-cols-[minmax(0,1fr)_8rem] gap-2">
        <Input :id="`invite-email-${index}`" v-model="member.email" :label="`Member ${index + 1} email`" type="email" />
        <Select :id="`invite-role-${index}`" v-model="member.role" :label="`Member ${index + 1} role`" :options="roles" />
      </div>
      <Button variant="soft" :prefix-icon="Plus" @click="addMember">Add another</Button>
    </div>
    <template #footer><Button class="w-full" @click="emit('invite', members)">Send invites</Button></template>
  </CompositionRoot>
</template>
