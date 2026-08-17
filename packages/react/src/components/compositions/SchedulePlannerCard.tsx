import { Mail, Video } from "lucide-react";
import { useState, type HTMLAttributes } from "react";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Calendar, type CalendarModelValue } from "../ui/Calendar";
import { Icon } from "../ui/Icon";
import { mergeClasses } from "../ui/classes";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface ScheduleSlot {
  id: string;
  time: string;
  label: string;
  taken?: boolean;
}

/**
 * Two columns that answer different halves of one question: the left says when
 * and with whom, the right says at what hour. The confirm sits under the hours
 * because that is the last choice made — put in a card footer it would read as
 * confirming the calendar too.
 */
const defaultSlots: readonly ScheduleSlot[] = [
  { id: "08", time: "08:00", label: "Early, before either inbox" },
  { id: "09", time: "09:00", label: "Before the standup" },
  { id: "10", time: "10:00", label: "Held for the release review", taken: true },
  { id: "11", time: "11:00", label: "Overlaps both time zones" },
  { id: "14", time: "14:00", label: "After lunch in Frankfurt" },
  { id: "15", time: "15:00", label: "Quiet hour on both calendars" },
  { id: "16", time: "16:00", label: "Held for on-call handover", taken: true },
  { id: "17", time: "17:00", label: "Last hour of the Frankfurt day" },
];

export interface SchedulePlannerCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  guestName?: string;
  guestRole?: string;
  guestInitials?: string;
  guestEmail?: string;
  slots?: readonly ScheduleSlot[];
  onSchedule?: (slot: string) => void;
}

export function SchedulePlannerCard({
  title = "Schedule meeting",
  description = "Pick a day and an hour that suits you both.",
  guestName = "Grace Hopper",
  guestRole = "Platform, Frankfurt",
  guestInitials = "GH",
  guestEmail = "grace@example.com",
  slots = defaultSlots,
  headingLevel,
  shadow,
  theme,
  onSchedule,
  "data-balsa": _dataBalsa,
  ...domProps
}: SchedulePlannerCardProps) {
  void _dataBalsa;
  const [day, setDay] = useState<Date | null>(new Date(2026, 8, 16));
  const [slot, setSlot] = useState("11");

  function handleDayChange(value: CalendarModelValue) {
    setDay(value instanceof Date ? value : null);
  }

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="schedule-planner"
    >
      <div className="grid flex-1 gap-balsa-xl sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-balsa-lg">
          <Calendar id="meeting-day" value={day} label="Meeting day" onValueChange={handleDayChange} />
          <div className="flex min-w-0 items-center gap-balsa-md rounded-balsa-control border border-balsa-border p-balsa-md">
            <Avatar label={guestName} fallback={guestInitials} size="md" />
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-medium">{guestName}</strong>
              <span className="block truncate text-xs text-balsa-muted-foreground">{guestRole}</span>
            </span>
          </div>
          <ul className="grid gap-balsa-xs text-xs text-balsa-muted-foreground" role="list">
            <li className="flex min-w-0 items-center gap-balsa-xs">
              <Icon icon={Video} size="sm" className="shrink-0" />
              <span className="truncate">30 minutes, video call</span>
            </li>
            <li className="flex min-w-0 items-center gap-balsa-xs">
              <Icon icon={Mail} size="sm" className="shrink-0" />
              <span className="truncate">{guestEmail}</span>
            </li>
          </ul>
        </div>

        <div className="flex min-w-0 flex-col">
          <p className="text-xs font-medium uppercase tracking-wider text-balsa-muted-foreground">
            Available hours
          </p>
          <ul className="mt-balsa-md grid flex-1 content-start gap-balsa-xs" role="list">
            {slots.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  disabled={option.taken}
                  aria-pressed={slot === option.id}
                  className={mergeClasses(
                    "flex w-full items-center justify-between gap-balsa-md rounded-balsa-control border px-balsa-md py-balsa-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring",
                    option.taken
                      ? "cursor-not-allowed border-balsa-border opacity-60"
                      : slot === option.id
                        ? "border-balsa-primary bg-balsa-muted"
                        : "border-balsa-border hover:bg-balsa-muted",
                  )}
                  onClick={() => setSlot(option.id)}
                >
                  <span className="min-w-0">
                    <strong className="block text-sm font-medium tabular-nums">{option.time}</strong>
                    <span className="block truncate text-xs text-balsa-muted-foreground">{option.label}</span>
                  </span>
                  {option.taken ? <Badge variant="soft">Taken</Badge> : null}
                </button>
              </li>
            ))}
          </ul>
          <Button className="mt-balsa-md w-full" onClick={() => onSchedule?.(slot)}>Confirm the meeting</Button>
        </div>
      </div>
    </CompositionRoot>
  );
}
