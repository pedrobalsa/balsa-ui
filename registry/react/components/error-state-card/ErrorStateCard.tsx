import { CloudAlert, RefreshCw } from "lucide-react";
import { type HTMLAttributes } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface ErrorStateCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  message?: string;
  requestId?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorStateCard({
  title = "Unable to load projects",
  description = "The workspace did not respond.",
  message = "Check your connection and try again. Your changes have not been lost.",
  requestId = "req_01J8A2",
  retryLabel = "Try again",
  headingLevel,
  shadow,
  theme,
  onRetry,
  "data-balsa": _dataBalsa,
  ...domProps
}: ErrorStateCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="error-state"
      role="status"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-balsa-lg px-balsa-lg text-center">
        <Icon icon={CloudAlert} size="xl" className="text-balsa-accent" />
        <p className="max-w-sm text-sm text-balsa-muted-foreground">{message}</p>
        <code className="rounded-balsa-control bg-balsa-muted px-balsa-xs py-balsa-3xs text-xs">{requestId}</code>
        <Button className="mt-balsa-3xs" prefixIcon={RefreshCw} onClick={onRetry}>{retryLabel}</Button>
      </div>
    </CompositionRoot>
  );
}
