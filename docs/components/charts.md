# Charts

Charts uses maintained Chart.js through vue-chartjs for line, bar, and doughnut rendering while Balsa owns typed series, semantic palette colors, responsive layout, loading/empty/error states, reduced motion, figure labelling, and the complete semantic table alternative. Chart.js supplies the mature canvas, scale, plugin, interaction, and responsive lifecycle; Balsa deliberately keeps its public configuration finite instead of exposing raw engine options.

Use Charts for trends, category comparisons, and part-to-whole summaries. Avoid canvas-only data, arbitrary brand colors, or unsupported engine configuration; every meaningful value remains available in the semantic table.

## Installation

Install Charts and its Balsa, Chart.js, and vue-chartjs dependencies with:

```sh
npx balsa-ui@latest add charts
```

If you download `Charts.vue` manually instead, also install its renderer packages:

```sh
npm install chart.js vue-chartjs
```

## Colors and sizing

Use the typed `colors` palette to select semantic colors in series order; an individual `ChartSeries.color` overrides that palette entry. The default sequence is `primary`, `secondary`, `accent`, `success`, `warning`, `info`, and `destructive`.

Charts is responsive by default. `width` and `height` are optional pixel dimensions. `rounded` applies to bars and doughnut segments where Chart.js supports corner radius; line charts are unchanged. Charts intentionally renders without a card surface, so consumers can place it in a Card only when their layout calls for one.

Canonical source: `src/components/ui/Charts.vue`; interactive documentation: `/docs/components/charts`; contract: `specs/components/charts.json`.
