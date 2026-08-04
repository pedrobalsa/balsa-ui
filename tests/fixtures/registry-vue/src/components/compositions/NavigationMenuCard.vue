<script setup lang="ts">
import { ArrowLeftRight, ChartLine, Circle, LayoutDashboard, Shield, User } from "@lucide/vue";
import Icon, { type IconComponent } from "../ui/Icon.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface NavigationMenuItem { id: string; label: string; icon?: IconComponent }
export interface NavigationMenuGroup { label: string; items: readonly NavigationMenuItem[] }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; activeId?: string; groups?: readonly NavigationMenuGroup[] }>(), {
  title: "Workspace navigation", description: "Related destinations grouped by task.", activeId: "dashboard", groups: () => [
    { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "transactions", label: "Transactions", icon: ArrowLeftRight }, { id: "analytics", label: "Analytics", icon: ChartLine }] },
    { label: "Account", items: [{ id: "profile", label: "Profile", icon: User }, { id: "security", label: "Security", icon: Shield }] },
  ],
});
const emit = defineEmits<{ navigate: [id: string] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="navigation-menu">
    <nav :aria-label="props.title" class="grid gap-4">
      <section v-for="group in props.groups" :key="group.label">
        <small class="text-balsa-muted-foreground">{{ group.label }}</small>
        <ul class="mt-2 grid gap-1" role="list"><li v-for="item in group.items" :key="item.id"><button type="button" :aria-current="item.id === props.activeId ? 'page' : undefined" :class="['flex w-full items-center gap-3 rounded-balsa-control px-3 py-2 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring', item.id === props.activeId ? 'bg-balsa-muted font-medium' : 'hover:bg-balsa-muted']" @click="emit('navigate', item.id)"><Icon :icon="item.icon || Circle" size="sm" />{{ item.label }}</button></li></ul>
      </section>
    </nav>
  </CompositionRoot>
</template>
