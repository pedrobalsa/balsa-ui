import { useState, type HTMLAttributes } from "react";
import { Accordion, type AccordionItem, type AccordionValue } from "../ui/Accordion";
import { Badge } from "../ui/Badge";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

const defaultSteps: readonly AccordionItem[] = [
  { id: "freeze", title: "1 · Freeze the pipeline", content: "Pause queued deploys so nothing lands on top of the rollback. Anything mid-build finishes but does not promote." },
  { id: "confirm", title: "2 · Confirm the last good build", content: "Check the deployment history for the newest build that passed two consecutive health checks in every region." },
  { id: "promote", title: "3 · Promote it", content: "Promote that build to production. The rollout holds at 10% until the health check passes twice, as it does for any deploy." },
  { id: "verify", title: "4 · Verify each region", content: "Watch p95 latency and error rate per region. São Paulo recovers last because it is furthest from the origin." },
  { id: "unfreeze", title: "5 · Unfreeze and write it up", content: "Resume the pipeline, then record what happened while it is still fresh." },
];

export interface RunbookStepsCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  steps?: readonly AccordionItem[];
}

export function RunbookStepsCard({
  title = "Rollback runbook",
  description = "Follow in order. Each step is safe to repeat.",
  steps = defaultSteps,
  headingLevel,
  shadow,
  theme,
  "data-balsa": _dataBalsa,
  ...domProps
}: RunbookStepsCardProps) {
  void _dataBalsa;
  const [openStep, setOpenStep] = useState<readonly string[]>(["confirm", "promote"]);

  function handleOpenStepChange(next: AccordionValue) {
    setOpenStep(Array.isArray(next) ? next : next === "" ? [] : [next]);
  }

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      action={<Badge variant="soft">5 steps</Badge>}
      data-composition="runbook-steps"
    >
      <div className="flex-1">
        <Accordion
          id="rollback-runbook"
          value={openStep}
          onValueChange={handleOpenStepChange}
          items={steps}
          type="multiple"
          label="Rollback steps"
        />
      </div>
    </CompositionRoot>
  );
}
