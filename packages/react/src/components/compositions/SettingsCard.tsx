import { useState, type HTMLAttributes } from "react";
import { Button } from "../ui/Button";
import { Select, type SelectOption } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface SettingsCardValue {
  locale: string;
  analytics: boolean;
}

export interface SettingsCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  onSave?: (value: SettingsCardValue) => void;
  onReset?: () => void;
}

const options: readonly SelectOption[] = [
  { label: "English (United States)", value: "en" },
  { label: "Português (Brasil)", value: "pt" },
];

export function SettingsCard({
  title = "Workspace settings",
  description = "Manage defaults and product behavior.",
  headingLevel,
  shadow,
  theme,
  onSave,
  onReset,
  "data-balsa": _dataBalsa,
  ...domProps
}: SettingsCardProps) {
  void _dataBalsa;
  const [locale, setLocale] = useState("en");
  const [analytics, setAnalytics] = useState(true);

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="settings"
      footer={
        <div className="flex justify-between gap-balsa-md">
          <Button variant="soft" onClick={onReset}>Reset</Button>
          <Button onClick={() => onSave?.({ locale, analytics })}>Save settings</Button>
        </div>
      }
    >
      <div className="grid flex-1 content-between gap-balsa-xl">
        <Select
          id="settings-locale"
          value={locale}
          label="Default language"
          options={options}
          onValueChange={(value) => {
            if (typeof value === "string") setLocale(value);
          }}
        />
        <div className="border-balsa-border pt-balsa-lg [border-top-width:var(--balsa-border-width)]">
          <Switch
            id="settings-analytics"
            checked={analytics}
            label="Usage analytics"
            hint="Share anonymous activity to improve workspace recommendations."
            onCheckedChange={setAnalytics}
          />
        </div>
      </div>
    </CompositionRoot>
  );
}
