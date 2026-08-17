import { Check } from "lucide-react";
import { type HTMLAttributes } from "react";
import { mergeClasses } from "../ui/classes";
import { Icon } from "../ui/Icon";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface FormStep {
  id: string;
  label: string;
  description?: string;
}

type StepTone = "complete" | "current" | "upcoming";

const defaultSteps: readonly FormStep[] = [
  { id: "profile", label: "Profile", description: "Complete" },
  { id: "details", label: "Details", description: "Current step" },
  { id: "review", label: "Review", description: "Not started" },
  { id: "submit", label: "Submit", description: "Not started" },
];

const stepMarkerToneClasses: Readonly<Record<StepTone, string>> = {
  complete: "border-balsa-primary bg-balsa-primary text-balsa-primary-foreground",
  current: "border-balsa-primary text-balsa-primary",
  upcoming: "border-balsa-border text-balsa-muted-foreground",
};

function stepTone(index: number, current: number): StepTone {
  if (index + 1 < current) return "complete";
  if (index + 1 === current) return "current";
  return "upcoming";
}

export interface FormProgressCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  steps?: readonly FormStep[];
  current?: number;
}

export function FormProgressCard({
  title = "Application progress",
  description = "Your information is saved after every step.",
  steps = defaultSteps,
  current = 2,
  headingLevel,
  shadow,
  theme,
  "data-balsa": _dataBalsa,
  ...domProps
}: FormProgressCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="form-progress"
    >
      <ol className="grid flex-1 content-between gap-0" aria-label="Application steps">
        {steps.map((step, index) => {
          const tone = stepTone(index, current);
          return (
            <li
              key={step.id}
              aria-current={tone === "current" ? "step" : undefined}
              className="grid grid-cols-[2rem_minmax(0,1fr)] gap-balsa-md"
            >
              <div className="flex flex-col items-center">
                <span
                  className={mergeClasses(
                    "grid size-7 place-items-center rounded-full border text-xs font-medium",
                    stepMarkerToneClasses[tone],
                  )}
                >
                  {tone === "complete" ? <Icon icon={Check} size="sm" /> : index + 1}
                </span>
                {index < steps.length - 1 ? (
                  <span className="min-h-6 w-px flex-1 bg-balsa-border" />
                ) : null}
              </div>
              <div className="pb-balsa-lg">
                <strong className="block text-sm font-medium">{step.label}</strong>
                <span className="text-xs text-balsa-muted-foreground">{step.description}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </CompositionRoot>
  );
}
