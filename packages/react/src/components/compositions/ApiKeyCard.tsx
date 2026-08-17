import { type HTMLAttributes } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { CodeBlock } from "../ui/CodeBlock";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

/**
 * A secret shown once, with the two facts that decide what to do about it: when
 * it was made, and when it stops working. Copying is the whole interaction, so
 * the block that holds it is the only thing that grows.
 */
export interface ApiKeyCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  token?: string;
  created?: string;
  expires?: string;
  onRevoke?: () => void;
}

export function ApiKeyCard({
  title = "Deploy key",
  description = "Shown once. Store it before leaving this page.",
  token = "blsa_live_9f4c21ae7d6b48f0a35c8e12",
  created = "Today, 09:14",
  expires = "Feb 3, 2027",
  headingLevel,
  shadow,
  theme,
  onRevoke,
  "data-balsa": _dataBalsa,
  ...domProps
}: ApiKeyCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="api-key"
      action={<Badge variant="soft">Write access</Badge>}
      footer={<Button className="w-full" variant="soft" onClick={onRevoke}>Revoke this key</Button>}
    >
      <div className="flex flex-1 flex-col justify-between gap-balsa-lg">
        <CodeBlock code={token} language="text" wrap />
        <dl className="divide-y divide-balsa-border text-sm">
          <div className="flex justify-between py-balsa-xs">
            <dt className="text-balsa-muted-foreground">Created</dt>
            <dd>{created}</dd>
          </div>
          <div className="flex justify-between py-balsa-xs">
            <dt className="text-balsa-muted-foreground">Expires</dt>
            <dd>{expires}</dd>
          </div>
        </dl>
      </div>
    </CompositionRoot>
  );
}
