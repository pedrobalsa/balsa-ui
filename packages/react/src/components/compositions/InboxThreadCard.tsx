import { useState, type HTMLAttributes } from "react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface ThreadMessage {
  id: string;
  author: string;
  initials: string;
  time: string;
  body: string;
  own?: boolean;
}

/**
 * A conversation and the box to answer it. The thread takes the height because
 * a single message is a notification, not a thread — the reply field sits at
 * the bottom where the reader ends up.
 */
const defaultMessages: readonly ThreadMessage[] = [
  { id: "1", author: "Grace Hopper", initials: "GH", time: "11:02", body: "The São Paulo edge is failing the second health check, so the rollout is holding at 10%." },
  { id: "2", author: "Ada Lovelace", initials: "AL", time: "11:06", body: "That matches the latency spike. I would rather roll back than push through it." },
  { id: "3", author: "Barbara Liskov", initials: "BL", time: "11:09", body: "Agreed. 4.11.6 is still warm in every region." },
];

export interface InboxThreadCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  messages?: readonly ThreadMessage[];
  onSend?: (body: string) => void;
}

export function InboxThreadCard({
  title = "Rollback discussion",
  description = "Atlas 4.12.0 · three people watching.",
  messages = defaultMessages,
  headingLevel,
  shadow,
  theme,
  onSend,
  "data-balsa": _dataBalsa,
  ...domProps
}: InboxThreadCardProps) {
  void _dataBalsa;
  const [reply, setReply] = useState("");

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="inbox-thread"
      footer={
        <Button className="w-full" disabled={!reply} onClick={() => onSend?.(reply)}>
          Post reply
        </Button>
      }
    >
      <ol className="grid flex-1 content-start gap-balsa-lg" role="list">
        {messages.map((message) => (
          <li key={message.id} className="flex gap-balsa-md">
            <Avatar label={message.author} fallback={message.initials} size="sm" className="mt-balsa-4xs shrink-0" />
            <div className="min-w-0">
              <p className="flex items-baseline gap-balsa-xs">
                <strong className="truncate text-sm font-medium">{message.author}</strong>
                <span className="shrink-0 text-xs tabular-nums text-balsa-muted-foreground">{message.time}</span>
              </p>
              <p className="mt-balsa-3xs text-sm text-balsa-muted-foreground">{message.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-balsa-lg">
        <Textarea
          id="thread-reply"
          value={reply}
          label="Reply"
          rows={2}
          placeholder="Write a reply"
          onValueChange={setReply}
        />
      </div>
    </CompositionRoot>
  );
}
