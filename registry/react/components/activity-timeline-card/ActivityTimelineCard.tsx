import { type HTMLAttributes } from "react";
import { Avatar } from "../ui/Avatar";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface ActivityEvent {
  id: string;
  actor: string;
  initials: string;
  action: string;
  target: string;
  time: string;
}

const defaultEvents: readonly ActivityEvent[] = [
  { id: "1", actor: "Ada Lovelace", initials: "AL", action: "deployed", target: "Atlas to production", time: "8 minutes ago" },
  { id: "2", actor: "Grace Hopper", initials: "GH", action: "updated", target: "environment variables", time: "42 minutes ago" },
  { id: "3", actor: "Barbara Liskov", initials: "BL", action: "promoted", target: "Relay to preview", time: "2 hours ago" },
  { id: "4", actor: "Margaret Hamilton", initials: "MH", action: "invited", target: "two collaborators", time: "Yesterday" },
  { id: "5", actor: "Katherine Johnson", initials: "KJ", action: "archived", target: "the Nova sandbox", time: "Yesterday" },
  { id: "6", actor: "Radia Perlman", initials: "RP", action: "rotated", target: "the deploy key", time: "2 days ago" },
  { id: "7", actor: "Jean Bartik", initials: "JB", action: "connected", target: "a preview domain", time: "3 days ago" },
];

export interface ActivityTimelineCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  events?: readonly ActivityEvent[];
}

export function ActivityTimelineCard({
  title = "Recent activity",
  description = "Changes across this workspace.",
  events = defaultEvents,
  headingLevel,
  shadow,
  theme,
  "data-balsa": _dataBalsa,
  ...domProps
}: ActivityTimelineCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="activity-timeline"
    >
      <ol className="relative grid flex-1 content-between gap-balsa-xl before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-balsa-border">
        {events.map((event) => (
          <li key={event.id} className="relative flex gap-balsa-md">
            <Avatar label={event.actor} fallback={event.initials} size="sm" className="z-10" />
            <p className="min-w-0 pt-balsa-3xs text-sm">
              <strong className="font-medium">{event.actor}</strong> {event.action}{" "}
              <span className="font-medium">{event.target}</span>
              <span className="mt-balsa-3xs block text-xs text-balsa-muted-foreground">{event.time}</span>
            </p>
          </li>
        ))}
      </ol>
    </CompositionRoot>
  );
}
