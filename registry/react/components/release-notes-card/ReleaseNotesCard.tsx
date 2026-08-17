import { type HTMLAttributes } from "react";
import { Badge } from "../ui/Badge";
import { ScrollArea } from "../ui/ScrollArea";
import { Separator } from "../ui/Separator";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface ReleaseEntry {
  id: string;
  version: string;
  date: string;
  kind: string;
  notes: readonly string[];
}

const defaultReleases: readonly ReleaseEntry[] = [
  { id: "4.12.0", version: "4.12.0", date: "Aug 6, 2026", kind: "Minor", notes: ["Rolling deploys hold at 10% until the health check passes twice.", "Environment variables are diffed before a promotion."] },
  { id: "4.11.6", version: "4.11.6", date: "Jul 29, 2026", kind: "Patch", notes: ["Fixed a rollback that skipped the São Paulo edge."] },
  { id: "4.11.0", version: "4.11.0", date: "Jul 14, 2026", kind: "Minor", notes: ["Preview branches inherit production secrets by default.", "Build logs stream from the first line rather than on completion.", "Deploy keys can be scoped to one environment."] },
  { id: "4.10.2", version: "4.10.2", date: "Jun 30, 2026", kind: "Patch", notes: ["Reduced cold start on the Frankfurt edge by 40 ms."] },
  { id: "4.10.0", version: "4.10.0", date: "Jun 11, 2026", kind: "Minor", notes: ["Added the deployment history table.", "Members can be invited straight into a role."] },
];

export interface ReleaseNotesCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  releases?: readonly ReleaseEntry[];
}

export function ReleaseNotesCard({
  title = "Release notes",
  description = "Everything shipped to Atlas this quarter.",
  releases = defaultReleases,
  headingLevel,
  shadow,
  theme,
  "data-balsa": _dataBalsa,
  ...domProps
}: ReleaseNotesCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="release-notes"
    >
      <ScrollArea label="Release history" edgeFade rounded="none" className="min-h-0 flex-1 border-0 bg-transparent">
        <ol className="grid gap-balsa-lg pr-balsa-xs" role="list">
          {releases.map((release, index) => (
            <li key={release.id}>
              <div className="flex items-baseline justify-between gap-balsa-md">
                <strong className="text-sm font-medium tabular-nums">{release.version}</strong>
                <Badge variant="soft">{release.kind}</Badge>
              </div>
              <p className="mt-balsa-4xs text-xs text-balsa-muted-foreground">{release.date}</p>
              <ul className="mt-balsa-xs grid gap-balsa-2xs" role="list">
                {release.notes.map((note) => (
                  <li key={note} className="text-sm text-balsa-muted-foreground">{note}</li>
                ))}
              </ul>
              {index < releases.length - 1 ? <Separator className="mt-balsa-lg" /> : null}
            </li>
          ))}
        </ol>
      </ScrollArea>
    </CompositionRoot>
  );
}
