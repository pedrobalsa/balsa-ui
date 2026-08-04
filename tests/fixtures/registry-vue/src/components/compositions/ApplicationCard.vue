<script setup lang="ts">
import { computed, getCurrentInstance, useSlots } from "vue";
import type {
  CardSize,
  CardVariant,
  Rounded,
} from "../ui/types";
import { type Shadow, type ThemeInput } from "../ui/theme";
import Card from "../ui/Card.vue";

type HeadingLevel = 2 | 3 | 4 | 5 | 6;
export type ApplicationCardColor = "neutral" | "primary" | "secondary" | "accent";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    headingLevel?: HeadingLevel;
    variant?: CardVariant;
    color?: ApplicationCardColor;
    size?: CardSize;
    rounded?: Rounded;
    shadow?: Shadow | boolean;
    theme?: ThemeInput;
  }>(),
  {
    headingLevel: 2,
    shadow: undefined,
  },
);

const slots = useSlots();
const instance = getCurrentInstance();
const resolvedShadow = computed(() =>
  Object.prototype.hasOwnProperty.call(instance?.vnode.props ?? {}, "shadow")
    ? props.shadow
    : "auto",
);
</script>

<template>
  <Card
    v-bind="$attrs"
    data-application-card
    :variant="props.variant"
    :color="props.color"
    padding="none"
    :size="props.size"
    :rounded="props.rounded"
    :shadow="resolvedShadow"
    :theme="props.theme"
    class="group/application-card flex min-h-0 flex-col overflow-hidden"
  >
    <header
      v-if="title || slots.header || slots.action"
      class="flex items-start justify-between gap-4 px-5 pb-0 pt-5 group-data-[size=sm]/application-card:px-4 group-data-[size=sm]/application-card:pt-4 group-data-[size=lg]/application-card:px-6 group-data-[size=lg]/application-card:pt-6"
    >
      <slot name="header">
        <div class="min-w-0">
          <component
            :is="`h${props.headingLevel}`"
            class="font-balsa-title text-base font-semibold leading-snug tracking-tight text-balsa-surface-foreground"
          >
            {{ title }}
          </component>
          <p v-if="description" class="mt-1 text-sm leading-snug text-balsa-muted-foreground">
            {{ description }}
          </p>
        </div>
      </slot>
      <div v-if="slots.action" class="shrink-0">
        <slot name="action" />
      </div>
    </header>

    <div
      data-application-card-body
      class="flex-1 p-5 pt-4 group-data-[size=sm]/application-card:p-4 group-data-[size=sm]/application-card:pt-3 group-data-[size=lg]/application-card:p-6 group-data-[size=lg]/application-card:pt-5"
    >
      <slot />
    </div>

    <footer
      v-if="slots.footer"
      data-application-card-footer
      class="border-balsa-border [border-top-style:var(--balsa-border-style)] [border-top-width:var(--balsa-border-width)] px-5 py-3 text-xs text-balsa-muted-foreground group-data-[size=sm]/application-card:px-4 group-data-[size=sm]/application-card:py-2.5 group-data-[size=lg]/application-card:px-6 group-data-[size=lg]/application-card:py-4"
    >
      <slot name="footer" />
    </footer>
  </Card>
</template>
