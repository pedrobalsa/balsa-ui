import { useState, type HTMLAttributes } from "react";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { Progress } from "../ui/Progress";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface OnboardingTask {
  id: string;
  label: string;
  description: string;
  complete: boolean;
}

const defaultTasks: readonly OnboardingTask[] = [
  { id: "profile", label: "Complete profile", description: "Add a name and workspace image.", complete: true },
  { id: "team", label: "Invite your team", description: "Bring collaborators into the workspace.", complete: true },
  { id: "project", label: "Create first project", description: "Start with a production or preview project.", complete: false },
  { id: "domain", label: "Connect a domain", description: "Publish with your own address.", complete: false },
  { id: "environment", label: "Add a preview environment", description: "Review changes before they reach production.", complete: false },
  { id: "alerts", label: "Choose where alerts go", description: "Send deploy failures to the right people.", complete: false },
];

export interface OnboardingChecklistCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  tasks?: readonly OnboardingTask[];
  onContinue?: () => void;
}

export function OnboardingChecklistCard({
  title = "Set up your workspace",
  description = "Complete these tasks to get ready for launch.",
  tasks = defaultTasks,
  headingLevel,
  shadow,
  theme,
  onContinue,
  "data-balsa": _dataBalsa,
  ...domProps
}: OnboardingChecklistCardProps) {
  void _dataBalsa;
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tasks.map((task) => [task.id, task.complete])),
  );
  const completed = Object.values(values).filter(Boolean).length;
  const percent = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="onboarding-checklist"
      footer={<Button className="w-full" onClick={onContinue}>Continue setup</Button>}
    >
      <Progress label="Setup progress" value={percent} color="primary" showValue />
      <div className="mt-balsa-xl flex flex-1 flex-col justify-between divide-y divide-balsa-border">
        {tasks.map((task) => (
          <div key={task.id} className="py-balsa-md">
            <Checkbox
              id={`onboarding-${task.id}`}
              checked={values[task.id] ?? task.complete}
              label={task.label}
              hint={task.description}
              onCheckedChange={(complete) => {
                setValues((current) => ({ ...current, [task.id]: complete }));
              }}
            />
          </div>
        ))}
      </div>
    </CompositionRoot>
  );
}
