<script setup lang="ts">
defineOptions({ name: "BalsaFooter" });

import type {
  BrandLogo,
  FooterContactGroup,
  FooterSection,
  FooterSocialLink,
} from "./navigation";
import type { ThemeInput } from "./theme";
import { useComponentTheme } from "./theme-context";
import Icon from "./Icon.vue";

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
    theme?: ThemeInput;
  }>(),
  {
    contactGroups: () => [],
    socialLinks: () => [],
    leadTitle: "Balsa UI",
    navigationLabel: "Footer navigation",
    legalText: "Open source. Open code. Built for Vue.",
  },
);
const theme = useComponentTheme("footer", "navigation", () => props.theme);
</script>

<template>
  <footer
    data-balsa="footer"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :style="theme.explicitPresentation.value?.style"
    class="relative z-10 w-full border-t border-balsa-border-strong bg-balsa-inverse text-balsa-inverse-foreground"
  >
    <div>
      <div
        class="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(18rem,1.35fr)_minmax(0,2fr)] lg:gap-x-14 lg:px-12"
      >
        <div class="min-w-0">
          <a
            :href="props.legalLogo.href"
            :aria-label="props.legalLogo.alt"
            class="mb-6 inline-flex rounded-balsa-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-balsa-inverse-foreground"
          >
            <span
              v-if="props.legalLogo.title"
              class="font-balsa-title text-xl font-medium tracking-[0.12em] text-balsa-inverse-foreground"
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
          <p class="max-w-sm text-sm text-balsa-inverse-foreground/75">{{ props.description }}</p>
          <div
            v-if="props.contactGroups.length"
            class="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2"
          >
            <div
              v-for="group in props.contactGroups"
              :key="group.title"
              class="min-w-0"
            >
              <p class="text-balsa-inverse-foreground/75">{{ group.title }}</p>
              <ul class="space-y-2">
                <li v-for="item in group.items" :key="item.label">
                  <a
                    v-if="item.link"
                    :href="item.link"
                    :target="item.external ? '_blank' : undefined"
                    :rel="item.external ? 'noreferrer' : undefined"
                    class="block text-sm font-semibold text-balsa-inverse-foreground no-underline decoration-balsa-inverse-foreground decoration-2 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-inverse-foreground"
                  >
                    {{ item.label }}
                  </a>
                  <span v-else class="block text-sm font-semibold text-balsa-inverse-foreground">
                    {{ item.label }}
                  </span>
                  <span v-if="item.detail" class="block text-xs text-balsa-inverse-foreground/75">
                    {{ item.detail }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <ul v-if="props.socialLinks?.length" class="mt-7 flex gap-5">
            <li v-for="social in props.socialLinks" :key="social.link">
              <a
                :href="social.link"
                :aria-label="social.title"
                target="_blank"
                rel="noreferrer"
                class="flex cursor-pointer items-center justify-center text-balsa-inverse-foreground/75 no-underline transition-colors hover:text-balsa-inverse-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-inverse-foreground"
              >
                <Icon :icon="social.icon" size="xl" />
              </a>
            </li>
          </ul>
        </div>
        <nav
          v-if="props.sections.length"
          :aria-label="props.navigationLabel"
          class="grid min-w-0 gap-10 sm:grid-cols-2 xl:grid-cols-3"
        >
          <div
            v-for="section in props.sections"
            :key="section.title"
            class="min-w-0"
          >
            <h3 class="mb-5 text-base text-balsa-inverse-foreground">{{ section.title }}</h3>
            <ul class="space-y-4">
              <li v-for="link in section.links" :key="link.link">
                <a
                  :href="link.link"
                  class="text-sm font-medium text-balsa-inverse-foreground/75 no-underline decoration-balsa-inverse-foreground decoration-2 underline-offset-4 hover:text-balsa-inverse-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-inverse-foreground"
                >
                  {{ link.title }}
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>
    <div class="border-t border-balsa-inverse-foreground/25">
      <div
        class="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12"
      >
        <p class="text-xs text-balsa-inverse-foreground/75">{{ props.copyright }}</p>
        <p class="text-xs text-balsa-inverse-foreground/75">{{ props.legalText }}</p>
      </div>
    </div>
  </footer>
</template>
