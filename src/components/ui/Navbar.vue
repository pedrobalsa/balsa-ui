<script setup lang="ts">
defineOptions({ name: "BalsaNavbar" });

import { ChevronDown, ChevronRight, ChevronUp, Menu, X } from "@lucide/vue";
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
import Icon from "./Icon.vue";

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
  /**
   * Optional CSS width for the desktop navigation region while the bar itself
   * stays full width, for a route whose page reserves the remainder. The
   * content centres inside the region and takes a taller row, reading as chrome
   * over a full-bleed page; below `lg` it always spans the bar.
   */
  contentRegion?: string;
  /** @deprecated Use behavior=\"fixed\" instead. */
  fixed?: boolean;
  shadow?: Shadow;
  theme?: ThemeInput;
}>();

const emit = defineEmits<{
  navigate: [item: NavigationLink, event: MouseEvent];
}>();
const slots = useSlots();

const activeItem = ref<NavigationGroup>();
const mobileOpen = ref(false);
const expandedMobileItem = ref<string>();
const isNavHidden = ref(false);
const hasReturnedFromScroll = ref(false);
const lastScrollY = ref(0);
// Declared and assigned through the same bare setTimeout, so the two agree
// whichever one is in scope. `window` is `Window & typeof globalThis`, so
// window.setTimeout resolves to Node's where @types/node is present and returns
// a Timeout the DOM annotation rejects.
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
    "left-1/2 mt-balsa-lg max-w-7xl -translate-x-1/2",
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
  surface: ["bg-balsa-background/90", "backdrop-balsa"],
  outline: ["bg-balsa-background/80", "backdrop-balsa"],
  soft: ["backdrop-balsa"],
  glass: ["backdrop-balsa", "shadow-balsa-control"],
};
const colorClasses: Readonly<Record<ActionColor, Record<NavbarVariant, string[]>>> = {
  neutral: {
    surface: [], outline: [], soft: [], glass: [],
  },
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
  surface: ["bg-balsa-background/90", "text-balsa-foreground", "backdrop-balsa"],
  outline: ["bg-balsa-background/80", "text-balsa-foreground", "backdrop-balsa"],
  soft: ["text-balsa-foreground", "backdrop-balsa"],
  glass: ["text-balsa-surface-elevated-foreground", "backdrop-balsa"],
};
const itemsAlignmentClasses: Readonly<Record<NavbarItemsAlignment, string>> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};
/** True when a route has reserved part of the page for its own content. */
const regionConfined = computed(() => Boolean(props.contentRegion));
const navigationLayoutClasses = computed(() =>
  resolvedType.value === "floating" && resolvedFloatingLayout.value === "inset"
    ? "relative flex h-14 items-center gap-balsa-lg px-balsa-xs sm:px-2 lg:px-6 xl:px-8"
    : resolvedType.value === "floating"
      ? "relative flex h-14 items-center gap-balsa-lg px-balsa-lg sm:px-6 lg:px-8"
      // A navbar confined to a region is chrome over a full-bleed page: the row
      // is tall enough to hold it clear of the top edge, and it takes that page
      // region rather than the page's centred container.
      : regionConfined.value
        ? "relative flex h-26 w-full items-center px-balsa-lg sm:px-6 lg:w-[var(--balsa-navbar-region,100%)] lg:px-8"
        /*
         * Spelled out rather than borrowing `.site-container`.
         *
         * That class is defined in this repository's own `index.css`, which no
         * consumer receives — they install the component and get the four Balsa
         * stylesheets. So every installed navbar resolved an undefined class and
         * silently lost centring, max width and padding: the bar sat flush left
         * while the page's own container stayed centred, in every new project.
         *
         * The paddings are the token equivalents of what the class applied
         * (16/24/32px at the default unit), so they now follow the spacing
         * dimension instead of being frozen at the sizes the website happened to
         * use.
         */
        : "relative mx-auto flex h-14 w-full max-w-7xl items-center gap-balsa-lg px-balsa-lg sm:px-balsa-2xl lg:px-balsa-3xl",
);
const materialClasses = computed(() => [
  ...variantClasses[resolvedVariant.value],
  ...colorClasses[resolvedColor.value][resolvedVariant.value],
]);
/**
 * The column the bar's content occupies inside its region. It matches the
 * column the page uses for its own content, and stays transparent to layout for
 * every ordinary navbar.
 */
const contentColumnClasses = computed(() =>
  regionConfined.value
    ? [
        "mx-auto flex w-full max-w-xl items-center gap-balsa-lg min-[1536px]:max-w-2xl min-[1920px]:max-w-3xl",
      ]
    : ["contents"]
);
const regionItemsAlignmentClasses: Readonly<Record<NavbarItemsAlignment, string>> = {
  left: "mr-auto",
  center: "mx-auto",
  right: "ml-auto",
};
const desktopItemsClasses = computed(() =>
  regionConfined.value
    ? [
        // The trailing item's own padding is pulled back out so its label lands
        // on the column edge, level with the page content below it.
        "hidden h-full w-fit items-stretch lg:-mr-4 lg:flex",
        regionItemsAlignmentClasses[resolvedItemsAlignment.value],
      ]
    : [
        "hidden h-full flex-1 items-stretch lg:flex",
        itemsAlignmentClasses[resolvedItemsAlignment.value],
      ]
);
const floatingStyle = computed<Record<string, string> | undefined>(() =>
  resolvedType.value === "floating" && props.floatingMaxWidth
    ? { maxWidth: props.floatingMaxWidth }
    : undefined,
);
const navigationStyle = computed<Record<string, string> | undefined>(() => {
  const style: Record<string, string> = {};
  if (props.contentMaxWidth) {
    style.maxWidth = props.contentMaxWidth;
    // Constraining a width without centring it just moves the right edge. A
    // caller passing `contentMaxWidth` is lining the bar up with their own
    // container, which is centred.
    style.marginInline = "auto";
  }
  if (props.contentRegion) style["--balsa-navbar-region"] = props.contentRegion;
  return Object.keys(style).length ? style : undefined;
});
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
const mobileMenuIcon = computed(() => mobileOpen.value ? X : Menu);
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
/**
 * A minimal navbar is chrome over the page rather than a band across it, and a
 * navbar whose items carry the material has already spent it, so in both cases
 * the bar keeps its geometry and drops its fill.
 */
const barMaterialVisible = computed(() => resolvedType.value !== "minimal");
/**
 * A minimal reveal header needs contrast only after it returns over a moving
 * page field, not at the page origin. This follows the documentation shell's
 * 6rem canvas edge fade and Tailwind's documented gradient-stop utilities:
 * https://tailwindcss.com/docs/background-image#setting-gradient-color-stops
 */
const minimalRevealFadeVisible = computed(() =>
  resolvedType.value === "minimal"
  && resolvedBehavior.value === "reveal"
  && hasReturnedFromScroll.value
  && !isNavHidden.value,
);
const surfaceClasses = computed(() => [
  "pointer-events-none absolute z-0",
  ...surfaceTypeClasses[resolvedType.value],
  ...(barMaterialVisible.value ? materialClasses.value : []),
]);

function hasLinks(item: NavigationGroup): boolean {
  return Boolean(item.links?.length);
}

function clearCloseTimeout(): void {
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = undefined;
  }
}

function openDesktopItem(item: NavigationGroup): void {
  clearCloseTimeout();
  activeItem.value = hasLinks(item) ? item : undefined;
}

function scheduleDesktopClose(): void {
  clearCloseTimeout();
  closeTimeout = setTimeout(() => {
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
  hasReturnedFromScroll.value = false;
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

function mobileIcon(item: NavigationGroup) {
  return expandedMobileItem.value === item.link ? ChevronUp : ChevronDown;
}

function navigate(item: NavigationLink, event: MouseEvent): void {
  emit("navigate", item, event);
  closeDesktopItem();
  mobileOpen.value = false;
  expandedMobileItem.value = undefined;
}

function updateRevealOnScroll(): void {
  const scrollY = window.scrollY;
  const scrollDelta = scrollY - lastScrollY.value;
  if (resolvedBehavior.value !== "reveal" || mobileOpen.value) {
    isNavHidden.value = false;
    hasReturnedFromScroll.value = false;
  } else if (scrollY <= 72 || scrollDelta < -8) {
    isNavHidden.value = false;
    hasReturnedFromScroll.value = scrollY > 72;
  } else if (scrollDelta > 8) {
    isNavHidden.value = true;
    hasReturnedFromScroll.value = false;
    closeDesktopItem();
  }
  lastScrollY.value = scrollY;
}

watch(resolvedBehavior, () => {
  isNavHidden.value = false;
  hasReturnedFromScroll.value = false;
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
    <!-- Omitted rather than emptied: the themed recipes fill this element by
         selector, so a materialless bar must not put one on the page at all. -->
    <div
      v-if="barMaterialVisible"
      aria-hidden="true"
      data-balsa="navbar-surface"
      :data-variant="resolvedVariant"
      :data-color="resolvedColor"
      :class="surfaceClasses"
    />
    <div
      v-if="minimalRevealFadeVisible"
      aria-hidden="true"
      data-balsa="navbar-reveal-fade"
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-24 bg-gradient-to-b from-balsa-background via-balsa-background/85 to-transparent"
    />
    <nav aria-label="Main navigation" :class="navigationLayoutClasses" :style="navigationStyle">
      <div :class="contentColumnClasses">
        <a
          :href="props.logo.href"
          :class="brandLinkClasses"
          :aria-label="props.logo.alt"
          @click="navigate({ title: props.logo.alt, link: props.logo.href }, $event)"
        >
          <span v-if="props.logo.title" :class="brandTitleClasses">{{ props.logo.title }}</span>
          <img v-else :src="props.logo.src" alt="" class="h-8 w-full object-contain object-left" />
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
                  class="group flex items-start gap-balsa-md rounded-lg px-balsa-md py-balsa-sm text-inherit no-underline transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
                  @click="navigate(link, $event)"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-medium">{{ link.title }}</span>
                    <span v-if="link.shortDescription" class="mt-balsa-4xs block text-sm text-balsa-muted-foreground">{{ link.shortDescription }}</span>
                  </span>
                  <Icon :icon="ChevronRight" size="md" class="mt-balsa-4xs text-balsa-primary transition-transform group-hover:translate-x-0.5" />
                </a>
              </li>
            </ul>
          </Dropdown>
          </NavbarExpandableItem>
        </ul>

      <div v-if="hasDesktopActions" class="hidden min-w-40 shrink-0 items-center justify-end gap-balsa-xs lg:flex">
        <slot name="actions" />
      </div>

      <button
        type="button"
        class="ml-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-balsa-foreground transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring lg:hidden"
        :aria-expanded="mobileOpen"
        aria-label="Open navigation menu"
        @click="toggleMobileMenu"
      >
        <Icon :icon="mobileMenuIcon" size="md" />
      </button>
      </div>
    </nav>

    <div :class="mobilePanelClasses" class="lg:hidden">
      <nav aria-label="Mobile navigation" class="min-h-0 overflow-hidden">
        <ul class="flex flex-col px-balsa-lg py-balsa-md sm:px-6">
          <li v-for="item in props.items" :key="item.link" class="border-b border-balsa-border last:border-b-0">
            <div class="flex items-center justify-between gap-balsa-md py-balsa-md">
              <a
                :href="item.link"
                class="font-balsa-title text-lg font-medium text-balsa-foreground no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
                @click="navigate(item, $event)"
              >
                {{ item.title }}
              </a>
              <button
                v-if="hasLinks(item)"
                type="button"
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-balsa-foreground hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
                :aria-expanded="expandedMobileItem === item.link"
                :aria-label="`Open ${item.title} items`"
                @click="toggleMobileItem(item)"
              >
                <Icon :icon="mobileIcon(item)" size="md" class="text-balsa-primary transition-transform duration-200" />
              </button>
            </div>
            <div v-if="hasLinks(item)" :class="mobileSubmenuClasses(item)">
              <ul class="min-h-0 space-y-balsa-md overflow-hidden pb-balsa-lg pl-balsa-xs">
                <li v-for="link in item.links" :key="link.link">
                  <a
                    :href="link.link"
                    class="text-sm font-medium text-balsa-muted-foreground no-underline hover:text-balsa-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
                    @click="navigate(link, $event)"
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
