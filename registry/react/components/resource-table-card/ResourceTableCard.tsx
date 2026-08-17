import { type HTMLAttributes } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Table } from "../ui/Table";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

export interface ResourceRow {
  id: string;
  name: string;
  status: string;
  statusColor?: CompositionPaletteColor;
  detail: string;
  updated: string;
}

const defaultRows: readonly ResourceRow[] = [
  { id: "atlas", name: "Atlas", status: "Ready", statusColor: "primary", detail: "Production", updated: "2m ago" },
  { id: "relay", name: "Relay", status: "Review", statusColor: "secondary", detail: "Preview", updated: "1h ago" },
  { id: "nova", name: "Nova", status: "Paused", detail: "Development", updated: "Yesterday" },
  { id: "quill", name: "Quill", status: "Ready", statusColor: "primary", detail: "Production", updated: "Yesterday" },
  { id: "harbor", name: "Harbor", status: "Review", statusColor: "secondary", detail: "Preview", updated: "3 days ago" },
  { id: "beacon", name: "Beacon", status: "Ready", statusColor: "primary", detail: "Production", updated: "3 days ago" },
  { id: "ferry", name: "Ferry", status: "Paused", detail: "Development", updated: "Last week" },
  { id: "kite", name: "Kite", status: "Review", statusColor: "secondary", detail: "Preview", updated: "Last week" },
];

export interface ResourceTableCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color" | "onSelect">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  rows?: readonly ResourceRow[];
  onCreate?: () => void;
  onSelect?: (id: string) => void;
}

export function ResourceTableCard({
  title = "Projects",
  description = "Search, review, and manage shared resources.",
  rows = defaultRows,
  headingLevel,
  shadow,
  theme,
  onCreate,
  onSelect,
  "data-balsa": _dataBalsa,
  ...domProps
}: ResourceTableCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="resource-table"
      action={<Button size="sm" onClick={onCreate}>New project</Button>}
    >
      <Table caption="Projects" hover rounded="none" className="w-full flex-1 [&_table]:h-full" header={
        <thead>
          <tr>
            <th scope="col">Project</th>
            <th scope="col">Status</th>
            <th scope="col">Environment</th>
            <th scope="col">Updated</th>
          </tr>
        </thead>
      }>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="cursor-pointer" onClick={() => onSelect?.(row.id)}>
              <th scope="row">{row.name}</th>
              <td><Badge color={row.statusColor} variant="soft">{row.status}</Badge></td>
              <td>{row.detail}</td>
              <td className="text-balsa-muted-foreground">{row.updated}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </CompositionRoot>
  );
}
