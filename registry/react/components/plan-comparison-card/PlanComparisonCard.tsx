import { useState, type HTMLAttributes } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Table } from "../ui/Table";
import { Tabs, type TabItem } from "../ui/Tabs";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface PlanRow {
  id: string;
  capability: string;
  starter: string;
  pro: string;
  scale: string;
}

/**
 * Three plans across, one capability per row. Wide because the comparison is
 * horizontal — stacked, it stops being a comparison — and one and a half units
 * tall because the table needs its rows and nothing more.
 */
const defaultRows: readonly PlanRow[] = [
  { id: "members", capability: "Members", starter: "3", pro: "25", scale: "Unlimited" },
  { id: "environments", capability: "Environments", starter: "1", pro: "5", scale: "Unlimited" },
  { id: "regions", capability: "Edge regions", starter: "1", pro: "6", scale: "All 14" },
  { id: "retention", capability: "Log retention", starter: "3 days", pro: "30 days", scale: "1 year" },
  { id: "support", capability: "Support", starter: "Community", pro: "4 hour response", scale: "Dedicated" },
  { id: "builds", capability: "Concurrent builds", starter: "1", pro: "8", scale: "40" },
  { id: "sso", capability: "Single sign-on", starter: "—", pro: "Google, Okta", scale: "Any SAML provider" },
];

const billing: readonly TabItem[] = [
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual, save 10%" },
];

export interface PlanComparisonCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  rows?: readonly PlanRow[];
  onChoose?: (plan: string) => void;
}

export function PlanComparisonCard({
  title = "Compare plans",
  description = "What changes as a workspace grows.",
  rows = defaultRows,
  headingLevel,
  shadow,
  theme,
  onChoose,
  "data-balsa": _dataBalsa,
  ...domProps
}: PlanComparisonCardProps) {
  void _dataBalsa;
  const [period, setPeriod] = useState("monthly");

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="plan-comparison"
      action={<Badge variant="soft">Current: Pro</Badge>}
      footer={
        <div className="flex gap-balsa-md">
          <Button variant="soft" className="flex-1" onClick={() => onChoose?.("starter")}>Downgrade to Starter</Button>
          <Button className="flex-1" onClick={() => onChoose?.("scale")}>Move to Scale</Button>
        </div>
      }
    >
      <div className="flex flex-1 flex-col gap-balsa-lg">
        <Tabs
          id="billing-period"
          value={period}
          items={billing}
          label="Billing period"
          panelSurface={false}
          onValueChange={setPeriod}
          panels={{
            monthly: <span className="sr-only">Prices shown per member, per month.</span>,
            annual: <span className="sr-only">Prices shown per member, billed once a year.</span>,
          }}
        />
        <Table
          caption="Plan comparison"
          rounded="none"
          className="w-full flex-1"
          header={
            <thead>
              <tr>
                <th scope="col">Capability</th>
                <th scope="col">Starter</th>
                <th scope="col">Pro</th>
                <th scope="col">Scale</th>
              </tr>
            </thead>
          }
        >
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.capability}</th>
                <td className="text-balsa-muted-foreground">{row.starter}</td>
                <td className="font-medium">{row.pro}</td>
                <td className="text-balsa-muted-foreground">{row.scale}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </CompositionRoot>
  );
}
