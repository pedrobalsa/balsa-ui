import { type HTMLAttributes, type ReactNode } from "react";
import { mergeClasses } from "../ui/classes";
import { ApplicationCard } from "./ApplicationCard";
import type { CompositionSurfaceProps } from "./composition";

export interface CompositionRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export function CompositionRoot({
  title,
  description,
  headingLevel = 2,
  shadow = "auto",
  theme,
  action,
  footer,
  children,
  className,
  "data-balsa": _dataBalsa,
  ...domProps
}: CompositionRootProps) {
  void _dataBalsa;

  return (
    <ApplicationCard
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow ?? "auto"}
      theme={theme}
      action={action}
      footer={footer}
      className={mergeClasses("min-w-0", className)}
    >
      {children}
    </ApplicationCard>
  );
}
