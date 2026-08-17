import { useState, type HTMLAttributes } from "react";
import { Autocomplete } from "../ui/Autocomplete";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

const defaultEnvironments: readonly string[] = [
  "atlas-production",
  "atlas-preview",
  "atlas-staging",
  "relay-production",
  "relay-preview",
  "harbor-production",
  "harbor-development",
  "nova-development",
  "quill-preview",
];

export interface EnvironmentSwitcherCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  environments?: readonly string[];
  onSwitch?: (environment: string) => void;
}

export function EnvironmentSwitcherCard({
  title = "Switch environment",
  description = "Everything below applies to the one you pick.",
  environments = defaultEnvironments,
  headingLevel,
  shadow,
  theme,
  onSwitch,
  "data-balsa": _dataBalsa,
  ...domProps
}: EnvironmentSwitcherCardProps) {
  void _dataBalsa;
  const [target, setTarget] = useState("atlas-production");

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="environment-switcher"
      action={<Badge color="primary" variant="soft">Live</Badge>}
    >
      <div className="flex flex-1 flex-col justify-between gap-balsa-lg">
        <Autocomplete
          id="environment-target"
          value={target}
          onValueChange={(value) => {
            if (typeof value === "string") setTarget(value);
          }}
          label="Environment"
          suggestions={environments}
          placeholder="Start typing a project or environment"
          hint="Nine environments across five projects."
        />
        <Button className="w-full" onClick={() => onSwitch?.(target)}>
          Switch to this environment
        </Button>
      </div>
    </CompositionRoot>
  );
}
