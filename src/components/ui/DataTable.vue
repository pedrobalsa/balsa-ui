<script setup lang="ts" generic="Row extends DataTableRow = DataTableRow">
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "@lucide/vue";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import Button from "./Button.vue";
import Input from "./Input.vue";
import Pagination from "./Pagination.vue";
import Select, { type SelectOption } from "./Select.vue";
import Table, {
  type TableColor,
  type TableDensity,
  type TableVariant,
} from "./Table.vue";
import type { Rounded } from "./form";
import type { ThemeInput } from "./theme";
import { useComponentTheme } from "./theme-context";
import Icon, { type IconComponent } from "./Icon.vue";

export type DataTableRow = Record<string, unknown>;
export interface DataTableColumn<Row extends DataTableRow = DataTableRow> {
  id: string;
  label: string;
  key?: keyof Row & string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  format?: (value: unknown, row: Row) => string;
}
export interface DataTableSort { column: string; direction: "asc" | "desc" }
export type DataTableSelection = "none" | "single" | "multiple";

const props = withDefaults(defineProps<{
  id: string;
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  data: readonly Row[];
  rowKey: keyof Row & string | ((row: Row, index: number) => string);
  selection?: DataTableSelection;
  pageSize?: number;
  variant?: TableVariant;
  density?: TableDensity;
  headerColor?: TableColor;
  rowColor?: TableColor;
  striped?: boolean;
  gridlines?: boolean;
  loading?: boolean;
  emptyText?: string;
  rounded?: Rounded;
  theme?: ThemeInput;
}>(), {
  selection: "none",
  pageSize: 10,
  headerColor: "neutral",
  rowColor: "neutral",
  striped: false,
  gridlines: false,
  loading: false,
  emptyText: "No matching rows.",
});
const theme = useComponentTheme(
  "data-table",
  "surfaces",
  () => props.theme,
);
const resolvedVariant = computed(() =>
  theme.resolve("variant", props.variant, "surface") as TableVariant
);
const resolvedRounded = computed(() =>
  theme.resolve("rounded", props.rounded, "lg") as Rounded
);
const resolvedDensity = computed(() =>
  theme.resolve("density", props.density, "default") as TableDensity
);
const sort = defineModel<DataTableSort | null>("sort", { default: null });
const filters = defineModel<Readonly<Record<string, string>>>("filters", { default: () => ({}) });
const page = defineModel<number>("page", { default: 1 });
const selected = defineModel<readonly string[]>("selected", { default: () => [] });
const visible = defineModel<readonly string[]>("visibleColumns", { default: () => [] });
const emit = defineEmits<{ rowSelect: [row: Row, key: string] }>();
const filterAction = ref<HTMLElement | null>(null);
const filterPanel = ref<HTMLElement | null>(null);
const filterOpen = ref(false);
const filterField = ref("");
const filterQuery = ref("");

const visibleColumns = computed(() => props.columns.filter((column) =>
  !column.hidden && (!visible.value.length || visible.value.includes(column.id)),
));
const filterableColumns = computed(() =>
  visibleColumns.value.some((column) => column.filterable),
);
const filterFieldOptions = computed<readonly SelectOption[]>(() =>
  visibleColumns.value
    .filter((column) => column.filterable)
    .map((column) => ({ label: column.label, value: column.id })),
);
const activeFilters = computed(() =>
  Object.entries(filters.value)
    .map(([id, query]) => ({
      column: props.columns.find((candidate) => candidate.id === id),
      id,
      query: query.trim(),
    }))
    .filter((filter) => filter.column?.filterable && filter.query),
);
const hasPagination = computed(() => sortedRows.value.length > props.pageSize);
const hasFooterActions = computed(() => filterableColumns.value || hasPagination.value);
function keyFor(row: Row, index: number): string {
  const sourceIndex = props.data.indexOf(row);
  const stableIndex = sourceIndex >= 0 ? sourceIndex : index;
  return typeof props.rowKey === "function"
    ? props.rowKey(row, stableIndex)
    : String(row[props.rowKey] ?? stableIndex);
}
function valueFor(row: Row, column: DataTableColumn<Row>): unknown {
  return row[column.key ?? column.id];
}
const filteredRows = computed(() => props.data.filter((row) =>
  visibleColumns.value.every((column) => {
    const query = filters.value[column.id]?.trim().toLocaleLowerCase();
    return !query || String(valueFor(row, column) ?? "").toLocaleLowerCase().includes(query);
  }),
));
const sortedRows = computed(() => {
  const state = sort.value;
  if (!state) return [...filteredRows.value];
  const column = props.columns.find((candidate) => candidate.id === state.column);
  if (!column) return [...filteredRows.value];
  return [...filteredRows.value].sort((a, b) => {
    const left = valueFor(a, column);
    const right = valueFor(b, column);
    const order = typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true, sensitivity: "base" });
    return state.direction === "asc" ? order : -order;
  });
});
const pagedRows = computed(() => {
  const start = (Math.max(1, page.value) - 1) * Math.max(1, props.pageSize);
  return sortedRows.value.slice(start, start + Math.max(1, props.pageSize));
});
const columnCount = computed(() => visibleColumns.value.length + (props.selection === "none" ? 0 : 1));
function alignmentClass(column: DataTableColumn<Row>): string {
  return column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left";
}
function toggleSort(column: DataTableColumn<Row>): void {
  if (!column.sortable) return;
  sort.value = sort.value?.column === column.id
    ? { column: column.id, direction: sort.value.direction === "asc" ? "desc" : "asc" }
    : { column: column.id, direction: "asc" };
  page.value = 1;
}
function sortState(column: DataTableColumn<Row>): "ascending" | "descending" | "none" | undefined {
  if (!column.sortable) return undefined;
  if (sort.value?.column !== column.id) return "none";
  return sort.value.direction === "asc" ? "ascending" : "descending";
}
function sortIcon(column: DataTableColumn<Row>): IconComponent {
  if (sort.value?.column !== column.id) return ArrowUpDown;
  return sort.value.direction === "asc"
    ? ArrowUp
    : ArrowDown;
}
function updateFilter(field: string, query: string): void {
  const nextFilters = { ...filters.value };
  const normalizedQuery = query.trim();
  if (normalizedQuery) nextFilters[field] = normalizedQuery;
  else delete nextFilters[field];
  filters.value = nextFilters;
  page.value = 1;
}
function synchronizeFilterQuery(): void {
  filterQuery.value = filterField.value ? filters.value[filterField.value] ?? "" : "";
}
function openFilters(): void {
  if (!filterFieldOptions.value.length) return;
  if (!filterField.value) filterField.value = filterFieldOptions.value[0]?.value ?? "";
  synchronizeFilterQuery();
  filterOpen.value = true;
  void nextTick(() => filterPanel.value?.querySelector<HTMLElement>("[data-balsa-control]")?.focus());
}
function closeFilters(restoreFocus = true): void {
  filterOpen.value = false;
  if (restoreFocus) void nextTick(() => filterAction.value?.focus());
}
function toggleFilters(): void {
  if (filterOpen.value) closeFilters();
  else openFilters();
}
function applyQuickFilter(): void {
  if (!filterField.value) return;
  updateFilter(filterField.value, filterQuery.value);
}
function removeFilter(field: string): void {
  updateFilter(field, "");
  if (filterField.value === field) synchronizeFilterQuery();
}
function clearFilters(): void {
  if (!activeFilters.value.length) return;
  filters.value = {};
  filterQuery.value = "";
  page.value = 1;
}
function handleDocumentPointerDown(event: PointerEvent): void {
  if (!filterOpen.value) return;
  const target = event.target as Node;
  if (filterAction.value?.contains(target) || filterPanel.value?.contains(target)) return;
  closeFilters(false);
}
function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key !== "Escape" || !filterOpen.value) return;
  if (event.target instanceof Element && event.target.closest('[data-balsa="select"]')) return;
  event.preventDefault();
  closeFilters();
}
function toggleRow(row: Row, index: number): void {
  if (props.selection === "none") return;
  const key = keyFor(row, index);
  if (props.selection === "single") selected.value = selected.value.includes(key) ? [] : [key];
  else selected.value = selected.value.includes(key) ? selected.value.filter((item) => item !== key) : [...selected.value, key];
  emit("rowSelect", row, key);
}
function formatted(row: Row, column: DataTableColumn<Row>): string {
  const value = valueFor(row, column);
  return column.format?.(value, row) ?? String(value ?? "—");
}

watch(filterField, synchronizeFilterQuery);
watch(filterFieldOptions, (options) => {
  if (!options.some((option) => option.value === filterField.value)) {
    filterField.value = options[0]?.value ?? "";
  }
}, { immediate: true });
onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown, true);
  document.addEventListener("keydown", handleDocumentKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
  document.removeEventListener("keydown", handleDocumentKeydown);
});
</script>

<template>
  <div
    data-balsa="data-table"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-header-color="props.headerColor"
    :data-row-color="props.rowColor"
    class="min-w-0 space-y-3"
    :style="theme.explicitPresentation.value?.style"
  >
    <Table
      :caption="props.caption"
      :variant="resolvedVariant"
      :density="resolvedDensity"
      :header-color="props.headerColor"
      :row-color="props.rowColor"
      :striped="props.striped"
      :gridlines="props.gridlines"
      :loading="props.loading"
      :empty="!props.loading && pagedRows.length === 0"
      :empty-text="props.emptyText"
      :column-count="columnCount"
      :rounded="resolvedRounded"
      :theme="props.theme"
    >
      <template #header>
        <thead>
          <tr>
            <th v-if="props.selection !== 'none'" scope="col"><span class="sr-only">Select row</span></th>
            <th v-for="column in visibleColumns" :key="column.id" scope="col" :aria-sort="sortState(column)" :class="alignmentClass(column)">
              <button v-if="column.sortable" type="button" class="inline-flex items-center gap-1 hover:text-balsa-primary focus-visible:outline-2 focus-visible:outline-balsa-focus-ring" @click="toggleSort(column)">
                {{ column.label }}
                <Icon :icon="sortIcon(column)" size="md" />
              </button>
              <span v-else>{{ column.label }}</span>
            </th>
          </tr>
        </thead>
      </template>
      <tbody>
        <tr
          v-for="(row, index) in pagedRows"
          :key="keyFor(row, index)"
          :data-selected="selected.includes(keyFor(row, index))"
          class="data-[selected=true]:bg-balsa-selected data-[selected=true]:text-balsa-selected-foreground"
        >
          <td v-if="props.selection !== 'none'">
            <input
              :type="props.selection === 'single' ? 'radio' : 'checkbox'"
              :name="props.selection === 'single' ? `${props.id}-selection` : undefined"
              :checked="selected.includes(keyFor(row, index))"
              :aria-label="`Select row ${keyFor(row, index)}`"
              @change="toggleRow(row, index)"
            />
          </td>
          <td v-for="column in visibleColumns" :key="column.id" :class="alignmentClass(column)">
            <slot :name="`cell-${column.id}`" :row="row" :value="valueFor(row, column)" :column="column">{{ formatted(row, column) }}</slot>
          </td>
        </tr>
      </tbody>
    </Table>
    <div v-if="hasFooterActions" class="flex flex-wrap items-center justify-between gap-3">
      <div v-if="filterableColumns" ref="filterAction" class="relative">
        <Button
          data-balsa-data-table-filter-action
          :size="null"
          shape="rounded"
          variant="outline"
          color="secondary"
          :prefix-icon="Search"
          :aria-label="filterOpen ? 'Close filters' : 'Filter rows'"
          :aria-expanded="filterOpen"
          :aria-controls="`${props.id}-filter-menu`"
          class="min-h-8 min-w-8 border-balsa-border bg-balsa-surface px-2 text-balsa-foreground hover:bg-balsa-muted active:bg-balsa-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-balsa-focus-ring [&_i]:text-lg"
          @click="toggleFilters"
        />
        <section
          v-if="filterOpen"
          :id="`${props.id}-filter-menu`"
          ref="filterPanel"
          data-balsa="data-table-filter-menu"
          role="dialog"
          aria-label="Filter rows"
          class="absolute bottom-full left-0 z-40 mb-2 w-80 rounded-balsa-surface border border-balsa-border-strong bg-balsa-surface-elevated p-4 text-balsa-surface-elevated-foreground shadow-balsa-panel"
        >
          <div class="flex items-center justify-between gap-3">
            <h3 class="m-0 text-sm font-semibold">Filters</h3>
            <Button shape="fab" size="sm" variant="outline" color="secondary" :prefix-icon="X" aria-label="Close filters" @click="closeFilters" />
          </div>
          <form class="mt-4 space-y-3" @submit.prevent="applyQuickFilter">
            <Select
              :id="`${props.id}-filter-field`"
              v-model="filterField"
              label="Field"
              :options="filterFieldOptions"
              size="sm"
              :theme="props.theme"
            />
            <Input
              :id="`${props.id}-filter-query`"
              v-model="filterQuery"
              label="Search value"
              type="text"
              size="sm"
              :theme="props.theme"
            />
            <Button type="submit" size="sm" variant="outline" color="primary" class="w-full">Apply filter</Button>
          </form>
          <div v-if="activeFilters.length" class="mt-4 border-t border-balsa-border pt-4">
            <div class="flex items-center justify-between gap-3">
              <h4 class="m-0 text-sm font-semibold">Advanced filters</h4>
              <Button size="sm" variant="outline" color="secondary" @click="clearFilters">Clear all</Button>
            </div>
            <ul class="mt-3 space-y-2">
              <li v-for="filter in activeFilters" :key="filter.id" class="flex items-center justify-between gap-2 rounded-balsa-control bg-balsa-muted px-3 py-2 text-sm">
                <span class="min-w-0 truncate"><strong>{{ filter.column?.label }}:</strong> {{ filter.query }}</span>
                <Button shape="fab" size="sm" variant="outline" color="secondary" :prefix-icon="X" :aria-label="`Remove ${filter.column?.label} filter`" @click="removeFilter(filter.id)" />
              </li>
            </ul>
          </div>
        </section>
      </div>
      <Pagination
        v-if="hasPagination"
        v-model="page"
        :total="sortedRows.length"
        :page-size="props.pageSize"
        label="Table pages"
        size="sm"
        :theme="props.theme"
      />
    </div>
  </div>
</template>
