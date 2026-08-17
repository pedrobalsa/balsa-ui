import { type HTMLAttributes } from "react";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface DeploymentRow {
  [column: string]: string;
  id: string;
  service: string;
  environment: string;
  version: string;
  duration: string;
  started: string;
}

const defaultRows: readonly DeploymentRow[] = [
  { id: "d-108", service: "Atlas", environment: "Production", version: "4.12.0", duration: "1m 48s", started: "2 minutes ago" },
  { id: "d-107", service: "Relay", environment: "Preview", version: "2.7.3", duration: "52s", started: "18 minutes ago" },
  { id: "d-106", service: "Atlas", environment: "Preview", version: "4.12.0-rc.2", duration: "1m 31s", started: "1 hour ago" },
  { id: "d-105", service: "Harbor", environment: "Production", version: "1.9.8", duration: "3m 04s", started: "3 hours ago" },
  { id: "d-104", service: "Nova", environment: "Development", version: "0.4.1", duration: "41s", started: "5 hours ago" },
  { id: "d-103", service: "Relay", environment: "Production", version: "2.7.2", duration: "58s", started: "Yesterday" },
  { id: "d-102", service: "Quill", environment: "Preview", version: "3.0.0-beta.4", duration: "2m 12s", started: "Yesterday" },
  { id: "d-101", service: "Atlas", environment: "Production", version: "4.11.6", duration: "1m 44s", started: "2 days ago" },
  { id: "d-100", service: "Harbor", environment: "Development", version: "1.9.7", duration: "37s", started: "2 days ago" },
];

const columns: readonly DataTableColumn<DeploymentRow>[] = [
  { id: "service", label: "Service", key: "service", sortable: true },
  { id: "environment", label: "Environment", key: "environment", sortable: true, filterable: true },
  { id: "version", label: "Version", key: "version" },
  { id: "duration", label: "Duration", key: "duration", align: "right", sortable: true },
  { id: "started", label: "Started", key: "started", align: "right" },
];

export interface DataGridCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  rows?: readonly DeploymentRow[];
  onInspect?: (id: string) => void;
}

export function DataGridCard({
  title = "Deployment history",
  description = "Every build that reached an environment, newest first.",
  rows = defaultRows,
  headingLevel,
  shadow,
  theme,
  onInspect,
  "data-balsa": _dataBalsa,
  ...domProps
}: DataGridCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="data-grid"
    >
      <DataTable
        id="deployment-history"
        caption="Deployment history"
        columns={columns}
        data={rows}
        rowKey="id"
        selection="multiple"
        pageSize={4}
        striped
        className="flex min-h-0 flex-1 flex-col [&>[data-balsa=table]]:min-h-0 [&>[data-balsa=table]]:flex-1 [&_table]:h-full"
        onRowSelect={(row) => onInspect?.(row.id)}
      />
    </CompositionRoot>
  );
}
