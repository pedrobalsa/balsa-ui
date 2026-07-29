<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
  watch,
} from "vue";
import NavbarExpandableItem from "./NavbarExpandableItem.vue";
import Dropdown from "./Dropdown.vue";
import type { BrandLogo, NavigationGroup, NavigationLink } from "./navigation";
import {
  type Shadow,
  type ThemeInput,
} from "./theme";
import type { ActionColor } from "./types";
import { useComponentTheme } from "./theme-context";

export type NavbarVariant = "surface" | "outline" | "soft" | "glass";
export type NavbarType = "bar" | "floating" | "minimal";
export type NavbarBehavior = "static" | "fixed" | "reveal";
export type NavbarFloatingLayout = "inset" | "container";
export type NavbarItemsAlignment = "left" | "center" | "right";

const props = defineProps<{
  logo: BrandLogo;
  items: readonly NavigationGroup[];
  variant?: NavbarVariant;
  color?: ActionColor;
  type?: NavbarType;
  behavior?: NavbarBehavior;
  floatingLayout?: NavbarFloatingLayout;
  floatingMaxWidth?: string;
  contentMaxWidth?: string;
  itemsAlignment?: NavbarItemsAlignment;
  /** @deprecated Use behavior=\"fixed\" instead. */
  fixed?: boolean;
  shadow?: Shadow;
  theme?: ThemeInput;
}>();

const emit = defineEmits<{
  navigate: [item: NavigationLink];
}>();
const slots = useSlots();

const activeItem = ref<NavigationGroup>();
const mobileOpen = ref(false);
const expandedMobileItem = ref<string>();
const isNavHidden = ref(false);
const lastScrollY = ref(0);
let closeTimeout: ReturnType<typeof setTimeout> | undefined;
const theme = useComponentTheme("navbar", "navigation", () => props.theme);
const resolvedVariant = computed<NavbarVariant>(() =>
  theme.resolve(
    "variant",
    props.variant,
    theme.resolved.value.base === "glassmorphism" ? "glass" : "surface",
  ) as NavbarVariant,
);
const resolvedColor = computed<ActionColor>(() => props.color ?? "primary");
const resolvedType = computed<NavbarType>(() =>
  theme.resolve(
    "type",
    props.type,
    theme.resolved.value.base === "glassmorphism" ? "floating" : "bar",
  ) as NavbarType,
);
const resolvedShadow = computed(() =>
  theme.resolve("shadow", props.shadow, "auto") as Shadow
);
const resolvedBehavior = computed<NavbarBehavior>(() =>
  props.behavior ?? (props.fixed ? "fixed" : "reveal"),
);
const resolvedFloatingLayout = computed<NavbarFloatingLayout>(() =>
  props.floatingLayout ?? "inset",
);
const resolvedItemsAlignment = computed<NavbarItemsAlignment>(() =>
  props.itemsAlignment ?? "right",
);
const typeClasses: Readonly<Record<NavbarType, string[]>> = {
  bar: ["inset-x-0 w-full"],
  floating: [
    "left-1/2 mt-4 max-w-7xl -translate-x-1/2",
  ],
  minimal: ["inset-x-0 w-full"],
};
const surfaceTypeClasses: Readonly<Record<NavbarType, string[]>> = {
  bar: ["inset-0 border-b"],
  floating: ["inset-0 rounded-xl border"],
  minimal: ["inset-0 border-b border-transparent"],
};
const floatingLayoutClasses: Readonly<Record<NavbarFloatingLayout, string[]>> = {
  inset: ["w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)]"],
  container: ["w-full"],
};
const variantClasses: Readonly<Record<NavbarVariant, string[]>> = {
  surface: ["bg-balsa-background/90", "backdrop-blur-xl"],
  outline: ["bg-balsa-background/80", "backdrop-blur-xl"],
  soft: ["backdrop-blur-xl"],
  glass: ["backdrop-blur-md", "shadow-balsa-control"],
};
const colorClasses: Readonly<Record<ActionColor, Record<NavbarVariant, string[]>>> = {
  primary: {
    surface: ["border-balsa-primary/30"], outline: ["border-balsa-primary"], soft: ["border-balsa-primary/20", "bg-balsa-primary/10"], glass: ["border-balsa-primary/30"],
  },
  secondary: {
    surface: ["border-balsa-secondary/30"], outline: ["border-balsa-secondary"], soft: ["border-balsa-secondary/20", "bg-balsa-secondary/10"], glass: ["border-balsa-secondary/30"],
  },
  accent: {
    surface: ["border-balsa-accent/30"], outline: ["border-balsa-accent"], soft: ["border-balsa-accent/20", "bg-balsa-accent/10"], glass: ["border-balsa-accent/30"],
  },
  destructive: {
    surface: ["border-balsa-destructive/30"], outline: ["border-balsa-destructive"], soft: ["border-balsa-destructive/20", "bg-balsa-destructive/10"], glass: ["border-balsa-destructive/30"],
  },
};
const variantTextClasses: Readonly<Record<NavbarVariant, string>> = {
  surface: "text-balsa-foreground",
  outline: "text-balsa-foreground",
  soft: "text-balsa-foreground",
  glass: "text-balsa-surface-elevated-foreground",
};
const behaviorClasses: Readonly<Record<NavbarBehavior, string[]>> = {
  static: ["relative"],
  fixed: ["fixed top-0"],
  reveal: ["fixed top-0"],
};
const mobileVariantClasses: Readonly<Record<NavbarVariant, string[]>> = {
  surface: ["bg-balsa-background/90", "text-balsa-foreground", "backdrop-blur-xl"],
  outline: ["bg-balsa-background/80", "text-balsa-foreground", "backdrop-blur-xl"],
  soft: ["text-balsa-foreground", "backdrop-blur-xl"],
  glass: ["text-balsa-surface-elevated-foreground", "backdrop-blur-md"],
};
const itemsAlignmentClasses: Readonly<Record<NavbarItemsAlignment, string>> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};
const navigationLayoutClasses = computed(() =>
  resolvedType.value === "floating" && resolvedFloatingLayout.value === "inset"
    ? "relative flex h-[3.75rem] items-center gap-5 px-2 sm:px-2 lg:px-6 xl:px-12"
    : resolvedType.value === "floating"
      ? "relative flex h-[3.75rem] items-center gap-5 px-5 sm:px-8 lg:px-12"
      : "site-container relative flex h-16 items-center gap-5",
);
const desktopItemsClasses = computed(() => [
  "hidden h-full flex-1 items-stretch lg:flex",
  itemsAlignmentClasses[resolvedItemsAlignment.value],
]);
const floatingStyle = computed<Record<string, string> | undefined>(() =>
  resolvedType.value === "floating" && props.floatingMaxWidth
    ? { maxWidth: props.floatingMaxWidth }
    : undefined,
);
const navigationStyle = computed<Record<string, string> | undefined>(() =>
  props.contentMaxWidth ? { maxWidth: props.contentMaxWidth } : undefined,
);
const brandLinkClasses = computed(() =>
  props.logo.title
    ? "shrink-0 no-underline"
    : "w-40 shrink-0 no-underline",
);
const brandTitleClasses = computed(() =>
  "font-balsa-title text-lg font-medium tracking-[0.12em] text-inherit",
);
const hasDesktopActions = computed(() => Boolean(slots.actions?.().length));

const mobilePanelClasses = computed(() => [
  "relative z-10 grid overflow-hidden border-t transition-[grid-template-rows,opacity] duration-300",
  ...mobileVariantClasses[resolvedVariant.value],
  ...colorClasses[resolvedColor.value][resolvedVariant.value],
  mobileOpen.value
    ? "grid-rows-[1fr] opacity-100"
    : "grid-rows-[0fr] opacity-0",
]);
const mobileMenuIconClasses = computed(() => [
  "mdi text-2xl",
  mobileOpen.value ? "mdi-close" : "mdi-menu",
]);
const containerClasses = computed(() => [
  "z-50 transition-transform duration-300 ease-out",
  ...behaviorClasses[resolvedBehavior.value],
  ...typeClasses[resolvedType.value],
  ...(resolvedType.value === "floating"
    ? floatingLayoutClasses[resolvedFloatingLayout.value]
    : []),
  variantTextClasses[resolvedVariant.value],
  isNavHidden.value ? "pointer-events-none -translate-y-[calc(100%+1rem)]" : "translate-y-0",
]);
const surfaceClasses = computed(() => [
  "pointer-events-none absolute z-0",
  ...surfaceTypeClasses[resolvedType.value],
  ...variantClasses[resolvedVariant.value],
  ...colorClasses[resolvedColor.value][resolvedVariant.value],
]);

function hasLinks(item: NavigationGroup): boolean {
  return Boolean(item.links?.length);
}

function clearCloseTimeout(): void {
  if (closeTimeout) {
    window.clearTimeout(closeTimeout);
    closeTimeout = undefined;
  }
}

function openDesktopItem(item: NavigationGroup): void {
  clearCloseTimeout();
  activeItem.value = hasLinks(item) ? item : undefined;
}

function scheduleDesktopClose(): void {
  clearCloseTimeout();
  closeTimeout = window.setTimeout(() => {
    activeItem.value = undefined;
    closeTimeout = undefined;
  }, 160);
}

function closeDesktopItem(): void {
  clearCloseTimeout();
  activeItem.value = undefined;
}

function toggleMobileMenu(): void {
  mobileOpen.value = !mobileOpen.value;
  isNavHidden.value = false;
  if (!mobileOpen.value) expandedMobileItem.value = undefined;
}

function toggleMobileItem(item: NavigationGroup): void {
  if (!hasLinks(item)) return;
  expandedMobileItem.value = expandedMobileItem.value === item.link ? undefined : item.link;
}

function mobileSubmenuClasses(item: NavigationGroup): string[] {
  return [
    "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300",
    expandedMobileItem.value === item.link
      ? "grid-rows-[1fr] opacity-100"
      : "grid-rows-[0fr] opacity-0",
  ];
}

function mobileIconClasses(item: NavigationGroup): string[] {
  return [
    "mdi text-xl text-balsa-primary transition-transform duration-200",
    expandedMobileItem.value === item.link ? "mdi-chevron-up" : "mdi-chevron-down",
  ];
}

function navigate(item: NavigationLink): void {
  emit("navigate", item);
  closeDesktopItem();
  mobileOpen.value = false;
  expandedMobileItem.value = undefined;
}

function updateRevealOnScroll(): void {
  const scrollY = window.scrollY;
  const scrollDelta = scrollY - lastScrollY.value;
  if (resolvedBehavior.value !== "reveal" || mobileOpen.value) {
    isNavHidden.value = false;
  } else if (scrollY <= 72 || scrollDelta < -8) {
    isNavHidden.value = false;
  } else if (scrollDelta > 8) {
    isNavHidden.value = true;
    closeDesktopItem();
  }
  lastScrollY.value = scrollY;
}

watch(resolvedBehavior, () => {
  isNavHidden.value = false;
  lastScrollY.value = window.scrollY;
});

onMounted(() => {
  lastScrollY.value = window.scrollY;
  window.addEventListener("scroll", updateRevealOnScroll, { passive: true });
});

onBeforeUnmount(() => {
  clearCloseTimeout();
  window.removeEventListener("scroll", updateRevealOnScroll);
});
</script>

<template>
  <header
    data-balsa="navbar"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="resolvedVariant"
    :data-color="resolvedColor"
    :data-type="resolvedType"
    :data-behavior="resolvedBehavior"
    :data-floating-layout="resolvedType === 'floating' ? resolvedFloatingLayout : undefined"
    :data-items-alignment="resolvedItemsAlignment"
    :data-scroll-hidden="isNavHidden"
    :data-shadow="resolvedShadow"
    :inert="isNavHidden ? true : undefined"
    :style="[floatingStyle, theme.explicitPresentation.value?.style]"
    :class="containerClasses"
  >
    <div
      aria-hidden="true"
      data-balsa="navbar-surface"
      :data-variant="resolvedVariant"
      :data-color="resolvedColor"
      :class="surfaceClasses"
    />
    <nav aria-label="Main navigation" :class="navigationLayoutClasses" :style="navigationStyle">
      <a
        :href="props.logo.href"
        :class="brandLinkClasses"
        :aria-label="props.logo.alt"
        @click="navigate({ title: props.logo.alt, link: props.logo.href })"
      >
        <span v-if="props.logo.title" :class="brandTitleClasses">{{ props.logo.title }}</span>
        <img v-else :src="props.logo.src" alt="" class="h-9 w-full object-contain object-left" />
      </a>

      <ul :class="desktopItemsClasses">
        <NavbarExpandableItem
          v-for="(item, index) in props.items"
          :key="item.link"
          :item="item"
          :expanded="activeItem?.link === item.link"
          :menu-id="`navbar-dropdown-${index}`"
          @open="openDesktopItem"
          @close="scheduleDesktopClose"
          @navigate="navigate"
        >
          <Dropdown
            v-if="hasLinks(item)"
            :id="`navbar-dropdown-${index}`"
            :open="activeItem?.link === item.link"
            :variant="resolvedVariant"
            :color="resolvedColor"
            align="auto"
            :theme="props.theme"
          >
            <ul class="flex flex-col" :aria-label="`${item.title} navigation`">
              <li v-for="link in item.links" :key="link.link">
                <a
                  :href="link.link"
                  class="group flex items-start gap-3 rounded-lg px-3 py-2.5 text-inherit no-underline transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
                  @click="navigate(link)"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block font-bold">{{ link.title }}</span>
                    <span v-if="link.shortDescription" class="mt-0.5 block text-sm text-balsa-muted-foreground">{{ link.shortDescription }}</span>
                  </span>
                  <i class="mdi mdi-chevron-right mt-0.5 text-lg text-balsa-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </Dropdown>
        </NavbarExpandableItem>
      </ul>

      <div v-if="hasDesktopActions" class="hidden min-w-40 shrink-0 items-center justify-end gap-3 lg:flex">
        <slot name="actions" />
      </div>

      <button
        type="button"
        class="ml-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-balsa-foreground transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring lg:hidden"
        :aria-expanded="mobileOpen"
        aria-label="Open navigation menu"
        @click="toggleMobileMenu"
      >
        <i :class="mobileMenuIconClasses" aria-hidden="true" />
      </button>

    </nav>

    <div :class="mobilePanelClasses" class="lg:hidden">
      <nav aria-label="Mobile navigation" class="min-h-0 overflow-hidden">
        <ul class="flex flex-col px-5 py-5 sm:px-8">
          <li v-for="item in props.items" :key="item.link" class="border-b border-balsa-border last:border-b-0">
            <div class="flex items-center justify-between gap-3 py-4">
              <a
                :href="item.link"
                class="font-balsa-title text-xl font-medium text-balsa-foreground no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
                @click="navigate(item)"
              >
                {{ item.title }}
              </a>
              <button
                v-if="hasLinks(item)"
                type="button"
                class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-balsa-foreground hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
                :aria-expanded="expandedMobileItem === item.link"
                :aria-label="`Open ${item.title} items`"
                @click="toggleMobileItem(item)"
              >
                <i :class="mobileIconClasses(item)" aria-hidden="true" />
              </button>
            </div>
            <div v-if="hasLinks(item)" :class="mobileSubmenuClasses(item)">
              <ul class="min-h-0 space-y-4 overflow-hidden pb-5 pl-2">
                <li v-for="link in item.links" :key="link.link">
                  <a
                    :href="link.link"
                    class="text-sm font-bold text-balsa-muted-foreground no-underline hover:text-balsa-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
                    @click="navigate(link)"
                  >
                    {{ link.title }}
                  </a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>
