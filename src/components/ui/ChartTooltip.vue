<script setup lang="ts">
import { VisTooltip } from "@unovis/vue";
import type { TooltipConfigInterface } from "@unovis/ts";

defineProps<Pick<TooltipConfigInterface, "triggers" | "followCursor" | "allowHover" | "showDelay" | "hideDelay">>();
</script>

<template>
  <VisTooltip v-bind="$props" class-name="balsa-chart-tooltip" />
</template>
