<script setup lang="ts" generic="Datum">
import { VisCrosshair } from "@unovis/vue";
import type { NumericAccessor } from "@unovis/ts";

defineProps<{
  x?: NumericAccessor<Datum>;
  y?: NumericAccessor<Datum> | NumericAccessor<Datum>[];
  yStacked?: NumericAccessor<Datum>[];
  template?: (datum: Datum, x: number | Date, data: Datum[], leftNearestDatumIndex?: number) => string | HTMLElement;
}>();
</script>

<template>
  <VisCrosshair v-bind="$props" :circle-radius="5" />
</template>
