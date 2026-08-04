# Charts

Charts is the finite facade over Balsa's composable Unovis foundation. It covers line, area, grouped or stacked bar, donut, and the retained `doughnut` alias. `ChartContainer`, tooltip, crosshair, and legend primitives remain available when advanced consumers need to compose native Unovis components.

Use charts for trends, category comparisons, and part-to-whole summaries. Every meaningful value remains available in the semantic table; the visual plot is supplementary.

## Installation

```sh
npx balsa-ui@latest add charts

# Only for a manual source download
npm install @unovis/vue @unovis/ts
```

## Composition

`ChartConfig` is keyed by series id and supplies a label, optional semantic palette role, and optional `IconComponent`. Default series draw only from primary, secondary, accent, and neutral. Feedback roles are opt-in. The container resolves each rendered series against its owning surface and adjusts graphical boundaries toward the surface foreground until they reach 3:1 contrast; chart text targets 4.5:1.

```vue
<Charts
  title="Revenue"
  type="bar"
  bar-mode="grouped"
  :labels="labels"
  :series="series"
  :config="config"
/>
```

Line charts use a 2px curve with active-point emphasis. Area charts add a subtle vertical fill beneath a contrast-safe boundary. Bars use balanced group spacing and theme-derived corners. Donuts use restrained gaps and expose a center-content slot. Quiet axes, a horizontal grid, elevated tooltip, compact legend, tabular values, positive-size rendering guard, theme motion, and reduced-motion behavior are shared defaults.

`showGrid`, `showXAxis`, `showYAxis`, `showTooltip`, `showLegend`, `showCaption`, and `showTable` are finite visibility controls. `labelFormatter` and `valueFormatter` are shared by chart chrome and the semantic fallback.

Canonical sources begin at `src/components/ui/ChartContainer.vue` and `src/components/ui/Charts.vue`; interactive documentation: `/docs/components/charts`; contract: `specs/components/charts.json`.
