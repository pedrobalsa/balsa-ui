import { useState, type HTMLAttributes } from "react";
import { Accordion, type AccordionItem, type AccordionValue } from "../ui/Accordion";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { Slider, type SliderModelValue } from "../ui/Slider";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

/**
 * Filters as a rail: every group open to its own depth, with the reset and
 * apply pair pinned to the bottom. It is tall because a filter panel that fits
 * in one unit is a toolbar, and toolbars do not need sections.
 */
const sections: readonly AccordionItem[] = [
  { id: "environment", title: "Environment" },
  { id: "outcome", title: "Outcome" },
  { id: "duration", title: "Duration" },
  { id: "actor", title: "Triggered by" },
];

export interface FilterPanelCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  onApply?: () => void;
  onReset?: () => void;
}

export function FilterPanelCard({
  title = "Filter deployments",
  description = "Narrow the deployment history.",
  headingLevel,
  shadow,
  theme,
  onApply,
  onReset,
  "data-balsa": _dataBalsa,
  ...domProps
}: FilterPanelCardProps) {
  void _dataBalsa;
  const [environments, setEnvironments] = useState({
    production: true,
    preview: true,
    development: false,
  });
  const [outcomes, setOutcomes] = useState({
    succeeded: true,
    failed: true,
    rolledBack: false,
  });
  const [actors, setActors] = useState({
    people: true,
    schedule: true,
    api: false,
  });
  const [maxDuration, setMaxDuration] = useState(180);
  // Every group open at rest: a filter panel that hides its own state makes the
  // reader click three times to learn what is already filtered.
  const [openSections, setOpenSections] = useState<readonly string[]>([
    "environment",
    "outcome",
    "duration",
    "actor",
  ]);

  function handleOpenChange(next: AccordionValue) {
    setOpenSections(Array.isArray(next) ? next : next === "" ? [] : [next]);
  }

  function handleDurationChange(value: SliderModelValue) {
    if (typeof value === "number") setMaxDuration(value);
  }

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="filter-panel"
      footer={
        <div className="flex justify-between gap-balsa-md">
          <Button variant="soft" onClick={onReset}>Reset</Button>
          <Button onClick={onApply}>Apply filters</Button>
        </div>
      }
    >
      <div className="flex-1">
        <Accordion
          id="deployment-filters"
          value={openSections}
          onValueChange={handleOpenChange}
          items={sections}
          type="multiple"
          label="Filter groups"
          panels={{
            environment: (
              <div className="grid gap-balsa-md">
                <Checkbox
                  id="filter-production"
                  checked={environments.production}
                  label="Production"
                  onCheckedChange={(production) => setEnvironments((current) => ({ ...current, production }))}
                />
                <Checkbox
                  id="filter-preview"
                  checked={environments.preview}
                  label="Preview"
                  onCheckedChange={(preview) => setEnvironments((current) => ({ ...current, preview }))}
                />
                <Checkbox
                  id="filter-development"
                  checked={environments.development}
                  label="Development"
                  onCheckedChange={(development) => setEnvironments((current) => ({ ...current, development }))}
                />
              </div>
            ),
            outcome: (
              <div className="grid gap-balsa-md">
                <Checkbox
                  id="filter-succeeded"
                  checked={outcomes.succeeded}
                  label="Succeeded"
                  onCheckedChange={(succeeded) => setOutcomes((current) => ({ ...current, succeeded }))}
                />
                <Checkbox
                  id="filter-failed"
                  checked={outcomes.failed}
                  label="Failed"
                  onCheckedChange={(failed) => setOutcomes((current) => ({ ...current, failed }))}
                />
                <Checkbox
                  id="filter-rolled-back"
                  checked={outcomes.rolledBack}
                  label="Rolled back"
                  onCheckedChange={(rolledBack) => setOutcomes((current) => ({ ...current, rolledBack }))}
                />
              </div>
            ),
            duration: (
              <Slider
                id="filter-duration"
                value={maxDuration}
                label="At most"
                min={30}
                max={600}
                step={30}
                showValue
                formatValue={(value) => `${Math.round(value / 60)} min`}
                onValueChange={handleDurationChange}
              />
            ),
            actor: (
              <div className="grid gap-balsa-md">
                <Checkbox
                  id="filter-people"
                  checked={actors.people}
                  label="A person"
                  onCheckedChange={(people) => setActors((current) => ({ ...current, people }))}
                />
                <Checkbox
                  id="filter-schedule"
                  checked={actors.schedule}
                  label="A schedule"
                  onCheckedChange={(schedule) => setActors((current) => ({ ...current, schedule }))}
                />
                <Checkbox
                  id="filter-api"
                  checked={actors.api}
                  label="The API"
                  onCheckedChange={(api) => setActors((current) => ({ ...current, api }))}
                />
              </div>
            ),
          }}
        />
        <p className="mt-balsa-lg text-xs text-balsa-muted-foreground">
          42 of 318 deployments match.
        </p>
      </div>
    </CompositionRoot>
  );
}
