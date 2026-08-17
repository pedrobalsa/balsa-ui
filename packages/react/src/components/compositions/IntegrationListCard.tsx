import { useState, type HTMLAttributes } from "react";
import { Avatar } from "../ui/Avatar";
import { Switch } from "../ui/Switch";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface Integration {
  id: string;
  name: string;
  detail: string;
  initials: string;
  enabled: boolean;
}

/**
 * Connected services, each with the one control that matters. A unit and a half
 * tall: five rows is more than a unit holds and less than two, and padding it
 * either way would be a layout decision pretending to be a design one.
 */
const defaultIntegrations: readonly Integration[] = [
  { id: "vcs", name: "Source control", detail: "Pushes trigger a preview build", initials: "SC", enabled: true },
  { id: "chat", name: "Team chat", detail: "Deploy results to #atlas-deploys", initials: "TC", enabled: true },
  { id: "pager", name: "On-call paging", detail: "Production failures only", initials: "OC", enabled: true },
  { id: "issues", name: "Issue tracker", detail: "Link deploys to the work they close", initials: "IT", enabled: false },
  { id: "warehouse", name: "Data warehouse", detail: "Nightly export of usage records", initials: "DW", enabled: false },
  { id: "status", name: "Status page", detail: "Publishes incidents automatically", initials: "SP", enabled: true },
];

export interface IntegrationListCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color" | "onToggle">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  integrations?: readonly Integration[];
  onToggle?: (id: string, enabled: boolean) => void;
}

export function IntegrationListCard({
  title = "Connected services",
  description = "What this workspace is allowed to talk to.",
  integrations = defaultIntegrations,
  headingLevel,
  shadow,
  theme,
  onToggle,
  "data-balsa": _dataBalsa,
  ...domProps
}: IntegrationListCardProps) {
  void _dataBalsa;
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(integrations.map((item) => [item.id, item.enabled])),
  );

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="integration-list"
    >
      <ul className="flex-1 divide-y divide-balsa-border" role="list">
        {integrations.map((integration) => (
          <li key={integration.id} className="flex items-center gap-balsa-md py-balsa-md first:pt-0 last:pb-0">
            <Avatar label={integration.name} fallback={integration.initials} size="sm" />
            <Switch
              id={`integration-${integration.id}`}
              checked={values[integration.id] ?? integration.enabled}
              label={integration.name}
              hint={integration.detail}
              className="min-w-0 flex-1"
              onCheckedChange={(enabled) => {
                setValues((current) => ({ ...current, [integration.id]: enabled }));
                onToggle?.(integration.id, enabled);
              }}
            />
          </li>
        ))}
      </ul>
    </CompositionRoot>
  );
}
