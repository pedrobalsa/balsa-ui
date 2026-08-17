import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Button } from "./Button";
import { mergeClasses } from "./classes";
import { type Rounded } from "./form";
import { Icon } from "./Icon";
import { Input } from "./Input";
import { Pagination } from "./Pagination";
import { Select, type SelectOption, type SelectModelValue } from "./Select";
import {
  Table,
  type TableColor,
  type TableDensity,
  type TableVariant,
} from "./Table";
import type { ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";

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

export interface DataTableSort {
  column: string;
  direction: "asc" | "desc";
}

export type DataTableSelection = "none" | "single" | "multiple";

export interface DataTableCellContext<Row extends DataTableRow = DataTableRow> {
  row: Row;
  rowKey: string;
  rowIndex: number;
  value: unknown;
  column: DataTableColumn<Row>;
}

export interface DataTableProps<Row extends DataTableRow = DataTableRow>
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "children" | "title"> {
  id: string;
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  data: readonly Row[];
  rowKey: keyof Row & string | ((row: Row, index: number) => string);
  "data-balsa"?: string;
  "data-palette"?: string;
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
  sort?: DataTableSort | null;
  defaultSort?: DataTableSort | null;
  onSortChange?: (value: DataTableSort | null) => void;
  filters?: Readonly<Record<string, string>>;
  defaultFilters?: Readonly<Record<string, string>>;
  onFiltersChange?: (value: Readonly<Record<string, string>>) => void;
  page?: number;
  defaultPage?: number;
  onPageChange?: (value: number) => void;
  selected?: readonly string[];
  defaultSelected?: readonly string[];
  onSelectedChange?: (value: readonly string[]) => void;
  visibleColumns?: readonly string[];
  defaultVisibleColumns?: readonly string[];
  onVisibleColumnsChange?: (value: readonly string[]) => void;
  onRowSelect?: (row: Row, key: string) => void;
  renderCell?: (context: DataTableCellContext<Row>) => ReactNode;
}

export function DataTable<Row extends DataTableRow = DataTableRow>(
  rawProps: DataTableProps<Row>,
) {
  const { props, theme } = useResolvedThemeProps("data-table", "surfaces", rawProps, {
    variant: "surface",
    density: "default",
    rounded: "lg",
  } as const);
  const {
    id,
    caption,
    columns,
    data,
    rowKey,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    selection = "none",
    pageSize = 10,
    variant,
    density,
    headerColor = "neutral",
    rowColor = "neutral",
    striped = false,
    gridlines = false,
    loading = false,
    emptyText = "No matching rows.",
    rounded,
    theme: themeInput,
    sort: sortProp,
    defaultSort = null,
    onSortChange,
    filters: filtersProp,
    defaultFilters = {},
    onFiltersChange,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    selected: selectedProp,
    defaultSelected = [],
    onSelectedChange,
    visibleColumns: visibleColumnsProp,
    defaultVisibleColumns = [],
    onVisibleColumnsChange,
    onRowSelect,
    renderCell,
    className,
    style,
    ...domProps
  } = props;
  void _dataBalsa;
  void onVisibleColumnsChange;

  const [sort, setSort] = useControllableState<DataTableSort | null>({
    value: sortProp,
    defaultValue: defaultSort,
    onChange: onSortChange,
  });
  const [filters, setFilters] = useControllableState<Readonly<Record<string, string>>>({
    value: filtersProp,
    defaultValue: defaultFilters,
    onChange: onFiltersChange,
  });
  const [page, setPage] = useControllableState({
    value: pageProp,
    defaultValue: defaultPage,
    onChange: onPageChange,
  });
  const [selected, setSelected] = useControllableState<readonly string[]>({
    value: selectedProp,
    defaultValue: defaultSelected,
    onChange: onSelectedChange,
  });
  const [visibleColumnIds] = useControllableState<readonly string[]>({
    value: visibleColumnsProp,
    defaultValue: defaultVisibleColumns,
    onChange: onVisibleColumnsChange,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterField, setFilterField] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const filterActionRef = useRef<HTMLDivElement | null>(null);
  const filterPanelRef = useRef<HTMLElement | null>(null);

  const visibleColumns = columns.filter((column) =>
    !column.hidden && (!visibleColumnIds.length || visibleColumnIds.includes(column.id)),
  );
  const filterFieldOptions: readonly SelectOption[] = visibleColumns
    .filter((column) => column.filterable)
    .map((column) => ({ label: column.label, value: column.id }));
  const filterableColumns = filterFieldOptions.length > 0;
  const activeFilters = Object.entries(filters)
    .map(([filterId, query]) => ({
      column: columns.find((column) => column.id === filterId),
      id: filterId,
      query: query.trim(),
    }))
    .filter((filter) => filter.column?.filterable && filter.query);

  function keyFor(row: Row, index: number): string {
    const sourceIndex = data.indexOf(row);
    const stableIndex = sourceIndex >= 0 ? sourceIndex : index;
    return typeof rowKey === "function"
      ? rowKey(row, stableIndex)
      : String(row[rowKey] ?? stableIndex);
  }

  function valueFor(row: Row, column: DataTableColumn<Row>): unknown {
    return row[column.key ?? column.id];
  }

  const filteredRows = data.filter((row) =>
    visibleColumns.every((column) => {
      const query = filters[column.id]?.trim().toLocaleLowerCase();
      return !query
        || String(valueFor(row, column) ?? "").toLocaleLowerCase().includes(query);
    }),
  );
  const sortedRows = [...filteredRows];
  if (sort) {
    const sortColumn = columns.find((column) => column.id === sort.column);
    if (sortColumn) {
      sortedRows.sort((leftRow, rightRow) => {
        const left = valueFor(leftRow, sortColumn);
        const right = valueFor(rightRow, sortColumn);
        const order = typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left ?? "").localeCompare(String(right ?? ""), undefined, {
              numeric: true,
              sensitivity: "base",
            });
        return sort.direction === "asc" ? order : -order;
      });
    }
  }
  const safePageSize = Math.max(1, pageSize);
  const pageStart = (Math.max(1, page) - 1) * safePageSize;
  const pagedRows = sortedRows.slice(pageStart, pageStart + safePageSize);
  const hasPagination = sortedRows.length > safePageSize;
  const hasFooterActions = filterableColumns || hasPagination;
  const columnCount = visibleColumns.length + (selection === "none" ? 0 : 1);

  function alignmentClass(column: DataTableColumn<Row>): string {
    if (column.align === "right") return "text-right";
    if (column.align === "center") return "text-center";
    return "text-left";
  }

  function toggleSort(column: DataTableColumn<Row>): void {
    if (!column.sortable) return;
    setSort(
      sort?.column === column.id
        ? { column: column.id, direction: sort.direction === "asc" ? "desc" : "asc" }
        : { column: column.id, direction: "asc" },
    );
    setPage(1);
  }

  function ariaSort(column: DataTableColumn<Row>): "ascending" | "descending" | "none" | undefined {
    if (!column.sortable) return undefined;
    if (sort?.column !== column.id) return "none";
    return sort.direction === "asc" ? "ascending" : "descending";
  }

  function updateFilter(field: string, query: string): void {
    const nextFilters = { ...filters };
    const normalizedQuery = query.trim();
    if (normalizedQuery) nextFilters[field] = normalizedQuery;
    else delete nextFilters[field];
    setFilters(nextFilters);
    setPage(1);
  }

  function openFilters(): void {
    const field = filterFieldOptions.some((option) => option.value === filterField)
      ? filterField
      : filterFieldOptions[0]?.value ?? "";
    if (!field) return;
    setFilterField(field);
    setFilterQuery(filters[field] ?? "");
    setFilterOpen(true);
  }

  function closeFilters(restoreFocus = true): void {
    setFilterOpen(false);
    if (restoreFocus) {
      queueMicrotask(() => filterActionRef.current?.querySelector<HTMLButtonElement>("button")?.focus());
    }
  }

  function applyQuickFilter(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (filterField) updateFilter(filterField, filterQuery);
  }

  function toggleRow(row: Row, index: number): void {
    if (selection === "none") return;
    const key = keyFor(row, index);
    const next = selection === "single"
      ? selected.includes(key) ? [] : [key]
      : selected.includes(key)
        ? selected.filter((item) => item !== key)
        : [...selected, key];
    setSelected(next);
    onRowSelect?.(row, key);
  }

  function formatted(row: Row, column: DataTableColumn<Row>): string {
    const value = valueFor(row, column);
    return column.format?.(value, row) ?? String(value ?? "—");
  }

  useEffect(() => {
    if (filterFieldOptions.some((option) => option.value === filterField)) return;
    setFilterField(filterFieldOptions[0]?.value ?? "");
  }, [filterField, filterFieldOptions]);

  useEffect(() => {
    if (!filterOpen) return;
    filterPanelRef.current?.querySelector<HTMLElement>("[data-balsa-control]")?.focus();
  }, [filterOpen]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent): void {
      if (!filterOpen) return;
      const target = event.target as Node;
      if (filterActionRef.current?.contains(target) || filterPanelRef.current?.contains(target)) return;
      closeFilters(false);
    }

    function handleKeydown(event: KeyboardEvent): void {
      if (event.key !== "Escape" || !filterOpen) return;
      if (event.target instanceof Element && event.target.closest('[data-balsa="select"]')) return;
      event.preventDefault();
      closeFilters();
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [filterOpen]);

  const header = (
    <tr>
      {selection !== "none" ? <th scope="col"><span className="sr-only">Select row</span></th> : null}
      {visibleColumns.map((column) => (
        <th
          key={column.id}
          scope="col"
          aria-sort={ariaSort(column)}
          className={alignmentClass(column)}
        >
          {column.sortable ? (
            <button
              type="button"
              className="inline-flex items-center gap-balsa-3xs hover:text-balsa-primary focus-visible:outline-2 focus-visible:outline-balsa-focus-ring"
              onClick={() => toggleSort(column)}
            >
              {column.label}
              <Icon
                icon={
                  sort?.column !== column.id
                    ? ArrowUpDown
                    : sort.direction === "asc" ? ArrowUp : ArrowDown
                }
                size="md"
              />
            </button>
          ) : <span>{column.label}</span>}
        </th>
      ))}
    </tr>
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="data-table"
        data-palette={dataPalette}
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-header-color={headerColor}
        data-row-color={rowColor}
        className={mergeClasses("min-w-0 space-y-balsa-md", className)}
        style={{ ...theme.explicitPresentation?.style, ...style } as CSSProperties}
      >
        <Table
          caption={caption}
          variant={variant}
          density={density}
          headerColor={headerColor}
          rowColor={rowColor}
          striped={striped}
          gridlines={gridlines}
          loading={loading}
          empty={!loading && pagedRows.length === 0}
          emptyText={emptyText}
          columnCount={columnCount}
          rounded={rounded}
          theme={themeInput}
          header={header}
        >
          {pagedRows.map((row, rowIndex) => {
            const key = keyFor(row, rowIndex);
            return (
              <tr
                key={key}
                data-selected={selected.includes(key)}
                className="data-[selected=true]:bg-balsa-selected data-[selected=true]:text-balsa-selected-foreground"
              >
                {selection !== "none" ? (
                  <td>
                    <input
                      type={selection === "single" ? "radio" : "checkbox"}
                      name={selection === "single" ? `${id}-selection` : undefined}
                      checked={selected.includes(key)}
                      aria-label={`Select row ${key}`}
                      onChange={() => toggleRow(row, rowIndex)}
                    />
                  </td>
                ) : null}
                {visibleColumns.map((column) => {
                  const value = valueFor(row, column);
                  const rendered = renderCell?.({ row, rowKey: key, rowIndex, value, column });
                  return (
                    <td key={column.id} className={alignmentClass(column)}>
                      {rendered === undefined ? formatted(row, column) : rendered}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </Table>

        {hasFooterActions ? (
          <div className="flex flex-wrap items-center justify-between gap-balsa-md">
            {filterableColumns ? (
              <div ref={filterActionRef} className="relative">
                <Button
                  data-balsa-data-table-filter-action=""
                  size={null}
                  shape="rounded"
                  variant="outline"
                  color="secondary"
                  prefixIcon={Search}
                  aria-label={filterOpen ? "Close filters" : "Filter rows"}
                  aria-expanded={filterOpen}
                  aria-controls={`${id}-filter-menu`}
                  className="min-h-8 min-w-8 border-balsa-border bg-balsa-surface px-balsa-xs text-balsa-foreground hover:bg-balsa-muted active:bg-balsa-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-balsa-focus-ring [&_svg]:text-lg"
                  onClick={() => filterOpen ? closeFilters() : openFilters()}
                />
                {filterOpen ? (
                  <section
                    id={`${id}-filter-menu`}
                    ref={filterPanelRef}
                    data-balsa="data-table-filter-menu"
                    role="dialog"
                    aria-label="Filter rows"
                    className="absolute bottom-full left-0 z-40 mb-balsa-xs w-80 rounded-balsa-surface border border-balsa-border-strong bg-balsa-surface-elevated p-balsa-lg text-balsa-surface-elevated-foreground shadow-balsa-panel"
                  >
                    <div className="flex items-center justify-between gap-balsa-md">
                      <h3 className="m-0 text-sm font-semibold">Filters</h3>
                      <Button
                        shape="fab"
                        size="sm"
                        variant="outline"
                        color="secondary"
                        prefixIcon={X}
                        aria-label="Close filters"
                        onClick={() => closeFilters()}
                      />
                    </div>
                    <form className="mt-balsa-lg space-y-balsa-md" onSubmit={applyQuickFilter}>
                      <Select
                        id={`${id}-filter-field`}
                        value={filterField}
                        label="Field"
                        options={filterFieldOptions}
                        size="sm"
                        theme={themeInput}
                        onValueChange={(value: SelectModelValue) => {
                          if (typeof value !== "string") return;
                          setFilterField(value);
                          setFilterQuery(filters[value] ?? "");
                        }}
                      />
                      <Input
                        id={`${id}-filter-query`}
                        value={filterQuery}
                        label="Search value"
                        type="text"
                        size="sm"
                        theme={themeInput}
                        onValueChange={(value) => setFilterQuery(String(value))}
                      />
                      <Button type="submit" size="sm" variant="outline" color="primary" className="w-full">
                        Apply filter
                      </Button>
                    </form>
                    {activeFilters.length ? (
                      <div className="mt-balsa-lg border-t border-balsa-border pt-balsa-lg">
                        <div className="flex items-center justify-between gap-balsa-md">
                          <h4 className="m-0 text-sm font-semibold">Advanced filters</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            color="secondary"
                            onClick={() => {
                              setFilters({});
                              setFilterQuery("");
                              setPage(1);
                            }}
                          >
                            Clear all
                          </Button>
                        </div>
                        <ul className="mt-balsa-md space-y-balsa-xs">
                          {activeFilters.map((filter) => (
                            <li
                              key={filter.id}
                              className="flex items-center justify-between gap-balsa-xs rounded-balsa-control bg-balsa-muted px-balsa-md py-balsa-xs text-sm"
                            >
                              <span className="min-w-0 truncate">
                                <strong>{filter.column?.label}:</strong> {filter.query}
                              </span>
                              <Button
                                shape="fab"
                                size="sm"
                                variant="outline"
                                color="secondary"
                                prefixIcon={X}
                                aria-label={`Remove ${filter.column?.label} filter`}
                                onClick={() => {
                                  updateFilter(filter.id, "");
                                  if (filterField === filter.id) setFilterQuery("");
                                }}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </div>
            ) : <div />}
            {hasPagination ? (
              <Pagination
                value={page}
                onValueChange={setPage}
                total={sortedRows.length}
                pageSize={safePageSize}
                label="Table pages"
                size="sm"
                theme={themeInput}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </BalsaThemeContext.Provider>
  );
}
