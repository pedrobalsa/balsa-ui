<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight, Menu } from "@lucide/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import Button from "./Button.vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import Drawer from "./Drawer.vue";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import Icon, { type IconComponent } from "./Icon.vue";

export interface SidebarItem {
  id: string;
  label: string;
  href?: string;
  icon?: IconComponent;
  badge?: string;
  disabled?: boolean;
  children?: readonly SidebarItem[];
}
export interface SidebarGroup {
  id: string;
  label?: string;
  items: readonly SidebarItem[];
}
export type SidebarVariant = "surface" | "outline" | "soft" | "glass";
export type SidebarSide = "left" | "right";
export type SidebarCollapse = "rail" | "offcanvas" | "none";

defineOptions({ name: "BalsaSidebar", inheritAttrs: false });
const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    groups: readonly SidebarGroup[];
    side?: SidebarSide;
    variant?: SidebarVariant;
    collapsible?: SidebarCollapse;
    width?: string;
    railWidth?: string;
    mobileBreakpointLabel?: string;
    shortcut?: string;
    rounded?: Rounded;
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    side: "left",
    collapsible: "rail",
    width: "18rem",
    railWidth: "4.5rem",
    mobileBreakpointLabel: "Open navigation",
    shortcut: "b",
  },
);
const { props, theme } = useResolvedThemeProps(
  "sidebar",
  "navigation",
  rawProps,
  { variant: "surface", rounded: "lg", shadow: "auto" } as const,
);
const emit = defineEmits<{ select: [item: SidebarItem] }>();
const active = defineModel<string>({ default: "" });
const collapsed = defineModel<boolean>("collapsed", { default: false });
const mobileOpen = defineModel<boolean>("mobileOpen", { default: false });
const attrs = useAttrs();
const expanded = ref(new Set<string>());

const variantClasses: Readonly<Record<SidebarVariant, string[]>> = {
  surface: ["border-balsa-border", "bg-balsa-surface", "text-balsa-foreground"],
  outline: ["border-balsa-border-strong", "bg-transparent", "text-balsa-foreground"],
  soft: ["border-transparent", "bg-balsa-muted", "text-balsa-foreground"],
  glass: ["border-balsa-border/60", "bg-balsa-surface/60", "text-balsa-foreground", "backdrop-blur-md"],
};
const rootAttrs = computed(() => withoutClassAttribute(attrs));
const classes = computed(() =>
  mergeClasses(
    "hidden h-full shrink-0 flex-col border transition-[width,transform] duration-200 lg:flex",
    variantClasses[props.variant],
    roundedClasses[props.rounded],
    props.collapsible === "offcanvas" && collapsed.value && "-translate-x-full",
    attrs.class,
  ),
);
const sidebarStyle = computed(() => ({
  width: collapsed.value && props.collapsible === "rail" ? props.railWidth : props.width,
}));
const itemClasses = (item: SidebarItem): string =>
  mergeClasses(
    "flex min-h-9 w-full items-center gap-2.5 rounded-balsa-control px-3 py-1.5 text-left text-sm font-semibold no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring",
    active.value === item.id
      ? "bg-balsa-selected text-balsa-selected-foreground"
      : "text-balsa-foreground hover:bg-balsa-muted",
    item.disabled && "cursor-not-allowed opacity-45",
    collapsed.value && props.collapsible === "rail" && "justify-center px-2",
  );
const labelClasses = computed(() =>
  collapsed.value && props.collapsible === "rail" ? "sr-only" : "min-w-0 flex-1 truncate",
);

function toggleCollapsed(): void {
  if (props.collapsible !== "none") collapsed.value = !collapsed.value;
}
function select(item: SidebarItem): void {
  if (item.disabled) return;
  if (item.children?.length) {
    const next = new Set(expanded.value);
    if (next.has(item.id)) next.delete(item.id);
    else next.add(item.id);
    expanded.value = next;
    return;
  }
  active.value = item.id;
  mobileOpen.value = false;
  emit("select", item);
}
function handleShortcut(event: KeyboardEvent): void {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== props.shortcut.toLowerCase()) return;
  event.preventDefault();
  toggleCollapsed();
}
onMounted(() => document.addEventListener("keydown", handleShortcut));
onBeforeUnmount(() => document.removeEventListener("keydown", handleShortcut));
</script>

<template>
  <div
    data-balsa="sidebar-shell"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :style="theme.explicitPresentation.value?.style"
    class="contents"
  >
    <aside
      :id="props.id"
      v-bind="rootAttrs"
      data-balsa="sidebar"
      :data-theme="theme.explicitPresentation.value?.id"
      :data-theme-base="theme.explicitPresentation.value?.base"
      :data-variant="props.variant"
      :data-shadow="props.shadow"
      :data-side="props.side"
      :data-collapsed="collapsed"
      :aria-label="props.label"
      :class="classes"
      :style="[sidebarStyle, attrs.style]"
    >
      <header class="flex min-h-14 items-center gap-2.5 border-b border-balsa-border p-3">
        <slot name="header" :collapsed="collapsed">
          <span :class="labelClasses">{{ props.label }}</span>
        </slot>
        <Button v-if="props.collapsible !== 'none'" shape="fab" size="sm" variant="glass" :prefix-icon="collapsed ? ChevronRight : ChevronLeft" :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'" @click="toggleCollapsed" />
      </header>
      <nav class="min-h-0 flex-1 overflow-y-auto p-3" :aria-label="props.label">
        <section v-for="group in props.groups" :key="group.id" class="mb-5 last:mb-0">
          <small v-if="group.label && !(collapsed && props.collapsible === 'rail')" class="mb-2 block px-3 text-balsa-muted-foreground">{{ group.label }}</small>
          <ul class="space-y-1">
            <li v-for="item in group.items" :key="item.id">
              <component :is="item.href && !item.children?.length ? 'a' : 'button'" :href="item.href" :disabled="item.disabled" :class="itemClasses(item)" :title="collapsed ? item.label : undefined" @click="select(item)">
                <Icon v-if="item.icon" :icon="item.icon" size="md" class="shrink-0" />
                <span :class="labelClasses">{{ item.label }}</span>
                <span v-if="item.badge && !(collapsed && props.collapsible === 'rail')" class="text-xs text-balsa-muted-foreground">{{ item.badge }}</span>
                <Icon v-if="item.children?.length && !(collapsed && props.collapsible === 'rail')" :icon="ChevronDown" size="md" />
              </component>
              <ul v-if="item.children?.length && expanded.has(item.id) && !(collapsed && props.collapsible === 'rail')" class="ml-5 mt-1 space-y-1 border-l border-balsa-border pl-2">
                <li v-for="child in item.children" :key="child.id">
                  <component :is="child.href ? 'a' : 'button'" :href="child.href" :disabled="child.disabled" :class="itemClasses(child)" @click="select(child)">
                    <span :class="labelClasses">{{ child.label }}</span>
                  </component>
                </li>
              </ul>
            </li>
          </ul>
        </section>
      </nav>
      <footer v-if="$slots.footer" class="border-t border-balsa-border p-3"><slot name="footer" :collapsed="collapsed" /></footer>
    </aside>
    <Button class="lg:hidden" :prefix-icon="Menu" :aria-label="props.mobileBreakpointLabel" @click="mobileOpen = true">{{ props.mobileBreakpointLabel }}</Button>
    <Drawer :id="`${props.id}-mobile`" v-model="mobileOpen" :title="props.label" :side="props.side" size="lg" :theme="props.theme">
      <nav :aria-label="props.label">
        <section v-for="group in props.groups" :key="group.id" class="mb-5">
          <small v-if="group.label" class="mb-2 block text-balsa-muted-foreground">{{ group.label }}</small>
          <button v-for="item in group.items" :key="item.id" type="button" :disabled="item.disabled" :class="itemClasses(item)" @click="select(item)">
            <Icon v-if="item.icon" :icon="item.icon" size="md" />
            <span class="min-w-0 flex-1 text-left">{{ item.label }}</span>
            <span v-if="item.badge" class="text-xs text-balsa-muted-foreground">{{ item.badge }}</span>
          </button>
        </section>
      </nav>
      <template v-if="$slots.footer" #footer><slot name="footer" :collapsed="false" /></template>
    </Drawer>
  </div>
</template>
