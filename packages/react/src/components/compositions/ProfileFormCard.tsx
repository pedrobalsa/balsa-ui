import { useState, type HTMLAttributes } from "react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select, type SelectOption } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { Textarea } from "../ui/Textarea";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface ProfileFormValues {
  name: string;
  handle: string;
  timezone: string;
  bio: string;
}

const timezones: readonly SelectOption[] = [
  { label: "Europe / London", value: "europe-london" },
  { label: "America / New York", value: "america-new-york" },
  { label: "America / São Paulo", value: "america-sao-paulo" },
  { label: "Asia / Tokyo", value: "asia-tokyo" },
];

export interface ProfileFormCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  onSave?: (values: ProfileFormValues) => void;
}

/**
 * The ordinary form, done properly: labelled fields, a hint where one is
 * genuinely needed, and a save that is the last thing on the card. It is here
 * because most of an application is this, not the interesting surfaces.
 */
export function ProfileFormCard({
  title = "Your profile",
  description = "How you appear to everyone in this workspace.",
  headingLevel,
  shadow,
  theme,
  onSave,
  "data-balsa": _dataBalsa,
  ...domProps
}: ProfileFormCardProps) {
  void _dataBalsa;

  const [name, setName] = useState("Ada Lovelace");
  const [handle, setHandle] = useState("ada");
  const [timezone, setTimezone] = useState("europe-london");
  const [bio, setBio] = useState("Working on the deploy pipeline and whatever it breaks.");
  const [website, setWebsite] = useState("https://example.com/ada");
  const [showLocalTime, setShowLocalTime] = useState(true);

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="profile-form"
      footer={
        <Button
          className="w-full"
          onClick={() => onSave?.({ name, handle, timezone, bio })}
        >
          Save profile
        </Button>
      }
    >
      <div className="flex flex-1 flex-col gap-balsa-lg">
        <div className="flex items-center gap-balsa-md">
          <Avatar label="Ada Lovelace" fallback="AL" size="lg" />
          <Button variant="soft" size="sm">Change picture</Button>
        </div>
        <Input
          id="profile-name"
          label="Display name"
          value={name}
          onValueChange={(value) => setName(String(value))}
        />
        <Input
          id="profile-handle"
          label="Handle"
          hint="Used in mentions and commit trailers."
          value={handle}
          onValueChange={(value) => setHandle(String(value))}
        />
        <Select
          id="profile-timezone"
          label="Time zone"
          options={timezones}
          value={timezone}
          onValueChange={(value) => setTimezone(String(value))}
        />
        <Textarea
          id="profile-bio"
          label="About"
          rows={3}
          className="flex-1"
          value={bio}
          onValueChange={setBio}
        />
        <Input
          id="profile-website"
          label="Website"
          value={website}
          onValueChange={(value) => setWebsite(String(value))}
        />
        <div className="rounded-balsa-control border border-balsa-border p-balsa-md">
          <Switch
            id="profile-local-time"
            label="Show local time"
            hint="Others see the hour where you are."
            checked={showLocalTime}
            onCheckedChange={setShowLocalTime}
          />
        </div>
      </div>
    </CompositionRoot>
  );
}
