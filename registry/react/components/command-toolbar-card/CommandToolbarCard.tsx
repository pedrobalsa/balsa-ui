import { Download, KeyRound, Layers, Rocket, ScrollText, Search, Undo2, UserPlus } from "lucide-react";
import { type HTMLAttributes } from "react";
import { Button } from "../ui/Button";
import { Icon, type IconComponent } from "../ui/Icon";
import { Kbd } from "../ui/Kbd";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface ToolbarAction {
  id: string;
  label: string;
  description?: string;
  icon: IconComponent;
  shortcut?: readonly string[];
  disabled?: boolean;
}

const defaultActions: readonly ToolbarAction[] = [
  { id: "deploy", label: "Deploy Atlas", description: "Ship the current commit to production.", icon: Rocket, shortcut: ["Ctrl", "D"] },
  { id: "logs", label: "Open logs", description: "Stream the last hour of output.", icon: ScrollText, shortcut: ["L"] },
  { id: "rollback", label: "Roll back", description: "Return production to the previous build.", icon: Undo2, shortcut: ["Ctrl", "Z"] },
  { id: "environment", label: "New environment", description: "Branch a preview from production.", icon: Layers, shortcut: ["E"] },
  { id: "invite", label: "Invite collaborator", description: "Send an invitation by email.", icon: UserPlus, shortcut: ["I"] },
  { id: "key", label: "Rotate deploy key", description: "Replace the key every runner uses.", icon: KeyRound, shortcut: ["Ctrl", "R"] },
  { id: "search", label: "Search everything", description: "Projects, members, and settings.", icon: Search, shortcut: ["Ctrl", "K"] },
  { id: "export", label: "Export audit log", description: "Download the last 90 days as CSV.", icon: Download, shortcut: ["Ctrl", "E"] },
];

export interface CommandToolbarCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  actions?: readonly ToolbarAction[];
  onAction?: (id: string) => void;
}

export function CommandToolbarCard({
  title = "Workspace commands",
  description = "Everything you can trigger without leaving this view.",
  actions = defaultActions,
  headingLevel,
  shadow,
  theme,
  onAction,
  "data-balsa": _dataBalsa,
  ...domProps
}: CommandToolbarCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="command-toolbar"
    >
      <ul className="grid flex-1 content-between gap-balsa-xs" role="list">
        {actions.map((action) => (
          <li key={action.id} className="min-w-0">
            <Button
              variant="soft"
              color="secondary"
              className="h-auto w-full justify-start gap-balsa-md px-balsa-md py-balsa-md text-left"
              disabled={action.disabled}
              onClick={() => onAction?.(action.id)}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-balsa-control bg-balsa-muted text-balsa-foreground" aria-hidden="true">
                <Icon icon={action.icon} size="md" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-medium">{action.label}</strong>
                {action.description ? (
                  <span className="mt-balsa-4xs block truncate text-xs font-normal text-balsa-muted-foreground">{action.description}</span>
                ) : null}
              </span>
              {action.shortcut ? <Kbd keys={action.shortcut} size="sm" /> : null}
            </Button>
          </li>
        ))}
      </ul>
    </CompositionRoot>
  );
}
