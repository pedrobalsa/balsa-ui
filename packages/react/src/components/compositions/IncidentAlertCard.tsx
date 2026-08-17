import { TriangleAlert } from "lucide-react";
import { type HTMLAttributes } from "react";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface IncidentAlertCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  alertTitle?: string;
  alertDescription?: string;
  onAcknowledge?: () => void;
  onOpen?: () => void;
}

export function IncidentAlertCard({
  title = "Active incident",
  alertTitle = "Elevated latency in São Paulo",
  alertDescription = "Serving from Washington while the region recovers. Deploys are paused.",
  headingLevel,
  shadow,
  theme,
  onAcknowledge,
  onOpen,
  "data-balsa": _dataBalsa,
  ...domProps
}: IncidentAlertCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="incident-alert"
    >
      <div className="flex flex-1 flex-col justify-center gap-balsa-md">
        <Alert
          id="incident-alert"
          title={alertTitle}
          description={alertDescription}
          icon={TriangleAlert}
          variant="soft"
          persistent
        />
        <dl className="grid grid-cols-3 gap-balsa-md text-sm">
          <div>
            <dt className="text-xs text-balsa-muted-foreground">Started</dt>
            <dd className="mt-balsa-4xs font-medium tabular-nums">14 minutes ago</dd>
          </div>
          <div>
            <dt className="text-xs text-balsa-muted-foreground">Affected</dt>
            <dd className="mt-balsa-4xs font-medium">Atlas, Relay</dd>
          </div>
          <div>
            <dt className="text-xs text-balsa-muted-foreground">Requests hit</dt>
            <dd className="mt-balsa-4xs font-medium tabular-nums">3.2%</dd>
          </div>
        </dl>
        <div className="flex gap-balsa-md">
          <Button variant="soft" className="flex-1" onClick={onAcknowledge}>Acknowledge</Button>
          <Button className="flex-1" onClick={onOpen}>Open the incident</Button>
        </div>
      </div>
    </CompositionRoot>
  );
}
