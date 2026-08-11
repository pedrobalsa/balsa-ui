<script setup lang="ts">
import {
  Comment,
  Fragment,
  Text,
  computed,
  defineComponent,
  h,
  isVNode,
  useAttrs,
  type PropType,
  type VNodeArrayChildren,
} from "vue";
import Spinner from "./Spinner.vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { surfaceRoundedClasses, type SurfaceRounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import type { SemanticColor } from "./types";
import { useResolvedThemeProps } from "./theme-context";

export type TableVariant = "surface" | "outline" | "soft" | "glass";
type TableSectionTag = "thead" | "tbody" | "tfoot";
const tableSectionTags: readonly string[] = ["thead", "tbody", "tfoot"];
interface SlotShape { rendered: boolean; sectioned: boolean }
function inspectSlotNodes(nodes: VNodeArrayChildren, shape: SlotShape = { rendered: false, sectioned: false }): SlotShape {
  for (const node of nodes) {
    if (node === null || node === undefined || typeof node === "boolean") continue;
    if (Array.isArray(node)) {
      inspectSlotNodes(node, shape);
      continue;
    }
    if (!isVNode(node)) {
      if (String(node).trim()) shape.rendered = true;
      continue;
    }
    if (node.type === Comment) continue;
    if (node.type === Text) {
      if (String(node.children ?? "").trim()) shape.rendered = true;
      continue;
    }
    // v-for and nested <slot /> arrive as fragments, so the real rows sit one level down.
    if (node.type === Fragment) {
      if (Array.isArray(node.children)) inspectSlotNodes(node.children, shape);
      continue;
    }
    shape.rendered = true;
    if (typeof node.type === "string" && tableSectionTags.includes(node.type)) shape.sectioned = true;
  }
  return shape;
}
const TableSection = defineComponent({
  name: "BalsaTableSection",
  props: { tag: { type: String as PropType<TableSectionTag>, required: true } },
  setup(sectionProps, { slots }) {
    return () => {
      const nodes = slots.default?.() ?? [];
      const shape = inspectSlotNodes(nodes);
      // An empty slot must not leave a hollow section behind, and consumers who still hand us
      // their own <thead>/<tbody> would end up with sections nested inside sections.
      if (!shape.rendered || shape.sectioned) return nodes;
      return h(sectionProps.tag, nodes);
    };
  },
});
export type TableDensity = "compact" | "default" | "comfortable";
export type TableColor = "neutral" | SemanticColor;
defineOptions({ name: "BalsaTable", inheritAttrs: false });
const rawProps = withDefaults(defineProps<{
  caption: string;
  variant?: TableVariant;
  density?: TableDensity;
  headerColor?: TableColor;
  rowColor?: TableColor;
  striped?: boolean;
  hover?: boolean;
  gridlines?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  columnCount?: number;
  rounded?: SurfaceRounded;
  shadow?: Shadow;
  theme?: ThemeInput;
}>(), {
  headerColor: "neutral",
  rowColor: "neutral",
  striped: false,
  hover: true,
  gridlines: false,
  stickyHeader: false,
  loading: false,
  empty: false,
  emptyText: "No rows to display.",
  columnCount: 1,
});
const { props, theme } = useResolvedThemeProps(
  "table",
  "surfaces",
  rawProps,
  {
    variant: "surface",
    density: "default",
    rounded: "auto",
    shadow: "auto",
  } as const,
);
const attrs = useAttrs();
const rootAttrs = computed(() => withoutClassAttribute(attrs));
const variantClasses: Readonly<Record<TableVariant, string[]>> = {
  surface: ["border-balsa-border", "bg-balsa-surface"],
  outline: ["border-balsa-border-strong", "bg-transparent"],
  soft: ["border-transparent", "bg-balsa-muted"],
  glass: ["border-balsa-border/60", "bg-balsa-surface/60", "backdrop-balsa"],
};
const densityClasses: Readonly<Record<TableDensity, string>> = {
  compact: "text-xs",
  default: "text-sm",
  comfortable: "text-base",
};
const stickyHeaderClasses: Readonly<Record<TableVariant, string[]>> = {
  surface: ["[&_thead]:bg-balsa-surface"],
  outline: ["[&_thead]:bg-balsa-background"],
  soft: ["[&_thead]:bg-balsa-muted"],
  glass: ["[&_thead]:bg-balsa-surface/80", "[&_thead]:backdrop-balsa"],
};
const headerColorClasses: Readonly<Record<TableColor, string[]>> = {
  neutral: [],
  primary: ["[&_thead_th]:bg-balsa-primary/15", "[&_thead_th]:text-balsa-primary"],
  secondary: ["[&_thead_th]:bg-balsa-secondary/15", "[&_thead_th]:text-balsa-secondary"],
  accent: ["[&_thead_th]:bg-balsa-accent/15", "[&_thead_th]:text-balsa-accent"],
  info: ["[&_thead_th]:bg-balsa-info/15", "[&_thead_th]:text-balsa-info"],
  success: ["[&_thead_th]:bg-balsa-success/15", "[&_thead_th]:text-balsa-success"],
  warning: ["[&_thead_th]:bg-balsa-warning/15", "[&_thead_th]:text-balsa-warning"],
  destructive: ["[&_thead_th]:bg-balsa-destructive/15", "[&_thead_th]:text-balsa-destructive"],
};
const rowColorClasses: Readonly<Record<TableColor, string[]>> = {
  neutral: [],
  primary: ["[&_tbody_tr]:bg-balsa-primary/10", "[&_tbody_th]:text-balsa-primary", "[&_tbody_td]:text-balsa-primary"],
  secondary: ["[&_tbody_tr]:bg-balsa-secondary/10", "[&_tbody_th]:text-balsa-secondary", "[&_tbody_td]:text-balsa-secondary"],
  accent: ["[&_tbody_tr]:bg-balsa-accent/10", "[&_tbody_th]:text-balsa-accent", "[&_tbody_td]:text-balsa-accent"],
  info: ["[&_tbody_tr]:bg-balsa-info/10", "[&_tbody_th]:text-balsa-info", "[&_tbody_td]:text-balsa-info"],
  success: ["[&_tbody_tr]:bg-balsa-success/10", "[&_tbody_th]:text-balsa-success", "[&_tbody_td]:text-balsa-success"],
  warning: ["[&_tbody_tr]:bg-balsa-warning/10", "[&_tbody_th]:text-balsa-warning", "[&_tbody_td]:text-balsa-warning"],
  destructive: ["[&_tbody_tr]:bg-balsa-destructive/10", "[&_tbody_th]:text-balsa-destructive", "[&_tbody_td]:text-balsa-destructive"],
};
const stripedRowClasses: Readonly<Record<TableColor, string>> = {
  neutral: "[&_tbody_tr:nth-child(even)]:bg-balsa-muted/60",
  primary: "[&_tbody_tr:nth-child(even)]:bg-balsa-primary/15",
  secondary: "[&_tbody_tr:nth-child(even)]:bg-balsa-secondary/15",
  accent: "[&_tbody_tr:nth-child(even)]:bg-balsa-accent/15",
  info: "[&_tbody_tr:nth-child(even)]:bg-balsa-info/15",
  success: "[&_tbody_tr:nth-child(even)]:bg-balsa-success/15",
  warning: "[&_tbody_tr:nth-child(even)]:bg-balsa-warning/15",
  destructive: "[&_tbody_tr:nth-child(even)]:bg-balsa-destructive/15",
};
const hoverRowClasses: Readonly<Record<TableColor, string>> = {
  neutral: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-selected/60",
  primary: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-primary/20",
  secondary: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-secondary/20",
  accent: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-accent/20",
  info: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-info/20",
  success: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-success/20",
  warning: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-warning/20",
  destructive: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-destructive/20",
};
const selectedRowClasses = [
  "[&_tbody_tr[data-selected=true]]:bg-balsa-selected",
  "[&_tbody_tr[data-selected=true]_th]:text-balsa-selected-foreground",
  "[&_tbody_tr[data-selected=true]_td]:text-balsa-selected-foreground",
];
const classes = computed(() => mergeClasses(
  "max-w-full overflow-x-auto text-balsa-foreground",
  variantClasses[props.variant],
  surfaceRoundedClasses[props.rounded],
  attrs.class,
));
const tableClasses = computed(() => mergeClasses(
  "w-full min-w-max border-collapse text-left",
  densityClasses[props.density],
  "[&_th]:font-medium [&_th]:text-balsa-muted-foreground [&_tr]:border-b [&_tr]:border-balsa-border [&_tbody_tr:last-child]:border-b-0",
  headerColorClasses[props.headerColor],
  rowColorClasses[props.rowColor],
  props.striped && stripedRowClasses[props.rowColor],
  props.hover && hoverRowClasses[props.rowColor],
  selectedRowClasses,
  props.gridlines && "[&_th]:border-r [&_th]:border-balsa-border [&_td]:border-r [&_td]:border-balsa-border",
  props.stickyHeader && [
    "[&_thead]:sticky",
    "[&_thead]:top-0",
    "[&_thead]:z-10",
    stickyHeaderClasses[props.variant],
  ],
));
</script>

<template>
  <div
    v-bind="rootAttrs"
    data-balsa="table"
    :data-rounded="props.rounded"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="props.variant"
    :data-density="props.density"
    :data-header-color="props.headerColor"
    :data-row-color="props.rowColor"
    :data-shadow="props.shadow"
    :class="classes"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
  >
    <table :class="tableClasses">
      <caption class="sr-only">{{ props.caption }}</caption>
      <TableSection tag="thead"><slot name="header" /></TableSection>
      <tbody v-if="props.loading">
        <tr><td :colspan="props.columnCount" class="text-center"><Spinner label="Loading rows" /></td></tr>
      </tbody>
      <tbody v-else-if="props.empty">
        <tr><td :colspan="props.columnCount" class="text-center text-balsa-muted-foreground"><slot name="empty">{{ props.emptyText }}</slot></td></tr>
      </tbody>
      <TableSection v-else tag="tbody"><slot /></TableSection>
      <TableSection tag="tfoot"><slot name="footer" /></TableSection>
    </table>
  </div>
</template>
