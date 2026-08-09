<script setup lang="ts">
import { ArrowLeftRight, Bell, Boxes, ChartLine, Circle, Layers, LayoutDashboard, Receipt, Rocket, ScrollText, Shield, User } from "@lucide/vue";
import Icon, { type IconComponent } from "../ui/Icon.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface NavigationMenuItem { id: string; label: string; icon?: IconComponent }
export interface NavigationMenuGroup { label: string; items: readonly NavigationMenuItem[] }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; activeId?: string; groups?: readonly NavigationMenuGroup[] }>(), {
  // The default groups fill a 1x2 tile, which is the tile a sidebar navigation
  // is designed for: a nav that fits in one unit is a menu, not a sidebar.
  title: "Workspace sidebar", description: "Every destination in this workspace, grouped by the work it belongs to.", activeId: "dashboard", groups: () => [
    { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "analytics", label: "Analytics", icon: ChartLine }] },
    { label: "Build", items: [{ id: "projects", label: "Projects", icon: Boxes }, { id: "deployments", label: "Deployments", icon: Rocket }, { id: "environments", label: "Environments", icon: Layers }] },
    { label: "Operate", items: [{ id: "activity", label: "Activity", icon: ArrowLeftRight }, { id: "alerts", label: "Alerts", icon: Bell }, { id: "logs", label: "Logs", icon: ScrollText }] },
    { label: "Account", items: [{ id: "profile", label: "Profile", icon: User }, { id: "security", label: "Security", icon: Shield }, { id: "billing", label: "Billing", icon: Receipt }] },
  ],
});
const emit = defineEmits<{ navigate: [id: string] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="navigation-menu">
    <nav :aria-label="props.title" class="grid flex-1 content-start gap-balsa-lg">
      <section v-for="group in props.groups" :key="group.label">
        <small class="text-balsa-muted-foreground">{{ group.label }}</small>
        <ul class="mt-balsa-xs grid gap-balsa-3xs" role="list"><li v-for="item in group.items" :key="item.id"><button type="button" :aria-current="item.id === props.activeId ? 'page' : undefined" :class="['flex w-full items-center gap-balsa-md rounded-balsa-control px-balsa-md py-balsa-xs text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring', item.id === props.activeId ? 'bg-balsa-muted font-medium' : 'hover:bg-balsa-muted']" @click="emit('navigate', item.id)"><Icon :icon="item.icon || Circle" size="sm" />{{ item.label }}</button></li></ul>
      </section>
    </nav>
  </CompositionRoot>
</template>
