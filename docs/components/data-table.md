# DataTable

DataTable composes semantic Table and Pagination with typed columns/rows, slots, sorting, a bottom quick filter action, pagination, selection, visibility, density, independently configurable header and row colors, loading, and empty states. The filter menu uses a field Select and search input, then keeps multiple active conditions together as advanced filters. Column definitions own stable ids, accessors, alignment, filtering and sorting policy, while `cell-{columnId}` slots receive the row, value, and column.

Use DataTable for interactive result sets and selectable records. Use Table for static authored markup; consumers own fetching and stable row keys, while virtualization, editing, grouping, and column resizing remain outside the focused beta contract.

Install with `npx balsa-ui@latest add data-table`. Canonical source: `src/components/ui/DataTable.vue`; interactive documentation: `/docs/components/data-table`; contract: `specs/components/data-table.json`.
