<script setup lang="ts">
defineOptions({ name: "BalsaFooter" });

import type {
  BrandLogo,
  FooterContactGroup,
  FooterSection,
  FooterSocialLink,
  NavigationLink,
} from "./navigation";
import type { ThemeInput } from "./theme";
import { useComponentTheme } from "./theme-context";
import Icon from "./Icon.vue";

export type FooterVariant = "surface" | "inverse";

const props = withDefaults(
  defineProps<{
    legalLogo: BrandLogo;
    description: string;
    sections: readonly FooterSection[];
    copyright: string;
    contactGroups?: readonly FooterContactGroup[];
    socialLinks?: readonly FooterSocialLink[];
    leadTitle?: string;
    navigationLabel?: string;
    legalText?: string;
    variant?: FooterVariant;
    theme?: ThemeInput;
  }>(),
  {
    contactGroups: () => [],
    socialLinks: () => [],
    leadTitle: "Balsa UI",
    navigationLabel: "Footer navigation",
    legalText: "Open source. Open code. Built for Vue.",
    variant: "inverse",
  },
);
const emit = defineEmits<{
  navigate: [item: NavigationLink, event: MouseEvent];
}>();
const theme = useComponentTheme("footer", "navigation", () => props.theme);
const variantClasses: Readonly<Record<FooterVariant, string>> = {
  surface: "bg-balsa-surface text-balsa-surface-foreground",
  inverse: "bg-balsa-inverse text-balsa-inverse-foreground",
};

function navigate(title: string, link: string, event: MouseEvent): void {
  emit("navigate", { title, link }, event);
}
</script>

<template>
  <footer
    data-balsa="footer"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="props.variant"
    :style="theme.explicitPresentation.value?.style"
    class="relative z-10 w-full border-t border-balsa-border-strong"
    :class="variantClasses[props.variant]"
  >
    <div>
      <div
        class="mx-auto grid max-w-7xl gap-balsa-section-sm px-balsa-xl py-balsa-section-md sm:px-8 lg:grid-cols-[minmax(18rem,1.35fr)_minmax(0,2fr)] lg:gap-x-14 lg:px-12"
      >
        <div class="min-w-0">
          <a
            :href="props.legalLogo.href"
            :aria-label="props.legalLogo.alt"
            class="mb-balsa-2xl inline-flex rounded-balsa-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
            @click="navigate(props.legalLogo.alt, props.legalLogo.href, $event)"
          >
            <span
              v-if="props.legalLogo.title"
              class="font-balsa-title text-xl font-medium tracking-[0.12em] text-current"
            >
              {{ props.legalLogo.title }}
            </span>
            <img
              v-else
              :src="props.legalLogo.src"
              alt=""
              class="h-12 w-44 object-contain object-left"
            />
          </a>
          <h3 class="sr-only">{{ props.leadTitle }}</h3>
          <p class="max-w-sm text-sm text-current/75">{{ props.description }}</p>
          <div
            v-if="props.contactGroups.length"
            class="mt-balsa-3xl grid gap-x-balsa-3xl gap-y-balsa-2xl sm:grid-cols-2"
          >
            <div
              v-for="group in props.contactGroups"
              :key="group.title"
              class="min-w-0"
            >
              <p class="text-current/75">{{ group.title }}</p>
              <ul class="space-y-balsa-xs">
                <li v-for="item in group.items" :key="item.label">
                  <a
                    v-if="item.link"
                    :href="item.link"
                    :target="item.external ? '_blank' : undefined"
                    :rel="item.external ? 'noreferrer' : undefined"
                    class="block text-sm font-semibold text-current no-underline decoration-current decoration-2 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                    @click="navigate(item.label, item.link, $event)"
                  >
                    {{ item.label }}
                  </a>
                  <span v-else class="block text-sm font-semibold text-current">
                    {{ item.label }}
                  </span>
                  <span v-if="item.detail" class="block text-xs text-current/75">
                    {{ item.detail }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <ul v-if="props.socialLinks?.length" class="mt-balsa-2xl flex gap-balsa-xl">
            <li v-for="social in props.socialLinks" :key="social.link">
              <a
                :href="social.link"
                :aria-label="social.title"
                target="_blank"
                rel="noreferrer"
                class="flex cursor-pointer items-center justify-center text-current/75 no-underline transition-colors hover:text-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                @click="navigate(social.title, social.link, $event)"
              >
                <Icon :icon="social.icon" size="xl" />
              </a>
            </li>
          </ul>
        </div>
        <nav
          v-if="props.sections.length"
          :aria-label="props.navigationLabel"
          class="grid min-w-0 gap-balsa-3xl sm:grid-cols-2 xl:grid-cols-3"
        >
          <div
            v-for="section in props.sections"
            :key="section.title"
            class="min-w-0"
          >
            <h3 class="mb-balsa-xl text-base text-current">{{ section.title }}</h3>
            <ul class="space-y-balsa-lg">
              <li v-for="link in section.links" :key="link.link">
                <a
                  :href="link.link"
                  class="text-sm font-medium text-current/75 no-underline decoration-current decoration-2 underline-offset-4 hover:text-current hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                  @click="navigate(link.title, link.link, $event)"
                >
                  {{ link.title }}
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>
    <div class="border-t border-current/25">
      <div
        class="mx-auto flex max-w-7xl flex-col gap-balsa-md px-balsa-xl py-balsa-xl sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12"
      >
        <p class="text-xs text-current/75">{{ props.copyright }}</p>
        <p class="text-xs text-current/75">{{ props.legalText }}</p>
      </div>
    </div>
  </footer>
</template>
