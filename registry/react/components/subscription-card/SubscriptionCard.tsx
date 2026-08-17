import { Sparkles } from "lucide-react";
import { type HTMLAttributes } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Progress } from "../ui/Progress";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface SubscriptionCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  plan?: string;
  price?: string;
  renewal?: string;
  usage?: number;
  onManage?: () => void;
}

export function SubscriptionCard({
  title = "Subscription",
  description = "Workspace plan and included usage.",
  plan = "Pro",
  price = "$20 / member",
  renewal = "Renews Aug 31, 2026",
  usage = 64,
  headingLevel,
  shadow,
  theme,
  onManage,
  "data-balsa": _dataBalsa,
  ...domProps
}: SubscriptionCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="subscription"
      footer={
        <Button className="w-full" variant="soft" onClick={onManage}>
          Manage subscription
        </Button>
      }
    >
      <div className="flex items-start justify-between gap-balsa-lg">
        <div>
          <Badge variant="soft">{plan}</Badge>
          <strong className="mt-balsa-md block text-2xl tabular-nums">{price}</strong>
          <p className="mt-balsa-3xs text-sm text-balsa-muted-foreground">{renewal}</p>
        </div>
        <Icon icon={Sparkles} size="lg" className="text-balsa-muted-foreground" />
      </div>
      <Progress className="mt-balsa-2xl" label="Included usage" value={usage} color="primary" showValue />
    </CompositionRoot>
  );
}
