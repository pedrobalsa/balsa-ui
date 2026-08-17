import { Boxes, GitBranch, Rocket, ScrollText } from "lucide-react";
import type { HTMLAttributes } from "react";
import { CommandList } from "../ui/CommandList";
import type { CommandGroup } from "../ui/command";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface CommandPaletteRecent {
  id: string;
  label: string;
  detail: string;
}

const defaultGroups: readonly CommandGroup[] = [
  {
    id: "projects",
    label: "Projects",
    items: [
      { id: "atlas", label: "Atlas", icon: Boxes, shortcut: "1" },
      { id: "relay", label: "Relay", icon: Boxes, shortcut: "2" },
      { id: "harbor", label: "Harbor", icon: Boxes, shortcut: "3" },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    items: [
      { id: "deploy", label: "Deploy the current commit", icon: Rocket },
      { id: "branch", label: "Open a preview branch", icon: GitBranch },
      { id: "logs", label: "Stream production logs", icon: ScrollText },
    ],
  },
];

const defaultRecents: readonly CommandPaletteRecent[] = [
  { id: "atlas-logs", label: "Atlas production logs", detail: "8 minutes ago" },
  { id: "relay-preview", label: "Relay preview branch", detail: "1 hour ago" },
  { id: "members", label: "Members and roles", detail: "Yesterday" },
];

export interface CommandPaletteCardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "color" | "onSelect"
>, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  groups?: readonly CommandGroup[];
  recents?: readonly CommandPaletteRecent[];
  onSelect?: (id: string) => void;
}

export function CommandPaletteCard({
  title = "Jump to anything",
  description = "One search across projects, people and settings.",
  groups = defaultGroups,
  recents = defaultRecents,
  headingLevel,
  shadow,
  theme,
  onSelect,
  "data-balsa": _dataBalsa,
  ...domProps
}: CommandPaletteCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="command-palette"
    >
      <CommandList
        id="workspace-palette"
        label="Search the workspace"
        placeholder="Search projects, actions and people"
        groups={groups}
        onSelect={(item) => onSelect?.(item.id)}
      />
      <section className="mt-balsa-lg flex flex-1 flex-col justify-end">
        <p className="text-xs font-medium uppercase tracking-wider text-balsa-muted-foreground">
          Recent
        </p>
        <ul className="mt-balsa-xs divide-y divide-balsa-border" role="list">
          {recents.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-balsa-md py-balsa-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring"
                onClick={() => onSelect?.(entry.id)}
              >
                <span className="min-w-0 truncate text-sm">{entry.label}</span>
                <span className="shrink-0 text-xs text-balsa-muted-foreground">
                  {entry.detail}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </CompositionRoot>
  );
}
