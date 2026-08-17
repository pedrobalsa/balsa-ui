import { useState, type HTMLAttributes } from "react";
import { Button } from "../ui/Button";
import { RadioGroup } from "../ui/RadioGroup";
import { Switch } from "../ui/Switch";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionOption, CompositionSurfaceProps } from "./composition";

export interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const defaultItems: readonly NotificationPreference[] = [
  { id: "failures", label: "Deploy failures", description: "Paged the moment a production build fails.", enabled: true },
  { id: "quota", label: "Quota warnings", description: "Sent once usage passes 80% of the plan.", enabled: true },
  { id: "mentions", label: "Mentions", description: "When someone names you in a review comment.", enabled: true },
  { id: "digest", label: "Weekly digest", description: "One summary of everything, Monday at 09:00.", enabled: false },
  { id: "budget", label: "Budget alerts", description: "When projected spend passes the monthly cap.", enabled: true },
];

const defaultChannels: readonly CompositionOption[] = [
  { label: "Email — ada@example.com", value: "email" },
  { label: "Slack — #atlas-deploys", value: "slack" },
  { label: "Webhook — hooks.example.com", value: "webhook" },
];

export interface NotificationPreferencesCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color" | "onChange">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  items?: readonly NotificationPreference[];
  onChange?: (id: string, enabled: boolean) => void;
  onSave?: (channel: string) => void;
}

export function NotificationPreferencesCard({
  title = "Delivery preferences",
  description = "Where workspace events reach you.",
  items = defaultItems,
  headingLevel,
  shadow,
  theme,
  onChange,
  onSave,
  "data-balsa": _dataBalsa,
  ...domProps
}: NotificationPreferencesCardProps) {
  void _dataBalsa;
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.enabled])),
  );
  const [channel, setChannel] = useState("email");

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="notification-preferences"
      footer={<Button className="w-full" onClick={() => onSave?.(channel)}>Save preferences</Button>}
    >
      <div className="flex-1 divide-y divide-balsa-border">
        {items.map((item) => (
          <div key={item.id} className="py-balsa-lg first:pt-0 last:pb-0">
            <Switch
              id={`notification-${item.id}`}
              checked={values[item.id] ?? item.enabled}
              label={item.label}
              hint={item.description}
              onCheckedChange={(enabled) => {
                setValues((current) => ({ ...current, [item.id]: enabled }));
                onChange?.(item.id, enabled);
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-balsa-xl border-balsa-border pt-balsa-xl [border-top-width:var(--balsa-border-width)]">
        <RadioGroup
          id="notification-channel"
          label="Send everything to"
          options={defaultChannels}
          value={channel}
          onValueChange={setChannel}
        />
      </div>
    </CompositionRoot>
  );
}
