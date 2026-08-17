import { type HTMLAttributes, type ReactNode } from "react";
import type { CardSize, CardVariant, Rounded } from "../ui/types";
import { type Shadow, type ThemeInput } from "../ui/theme";
import { mergeClasses } from "../ui/classes";
import { Card } from "../ui/Card";

type HeadingLevel = 2 | 3 | 4 | 5 | 6;
export type ApplicationCardColor = "neutral" | "primary" | "secondary" | "accent";

const headingTags = {
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const;

export interface ApplicationCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color"> {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  headingLevel?: HeadingLevel;
  variant?: CardVariant;
  color?: ApplicationCardColor;
  size?: CardSize;
  rounded?: Rounded;
  shadow?: Shadow | boolean;
  theme?: ThemeInput;
  header?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export function ApplicationCard({
  title,
  description,
  headingLevel = 2,
  variant,
  color,
  size,
  rounded,
  shadow = "auto",
  theme,
  header,
  action,
  footer,
  children,
  className,
  "data-balsa": _dataBalsa,
  ...domProps
}: ApplicationCardProps) {
  void _dataBalsa;
  const Heading = headingTags[headingLevel];

  return (
    <Card
      {...domProps}
      data-application-card=""
      variant={variant}
      color={color}
      padding="none"
      size={size}
      rounded={rounded}
      shadow={shadow}
      theme={theme}
      className={mergeClasses(
        "group/application-card flex min-h-0 flex-col overflow-hidden",
        className,
      )}
    >
      {title || header || action ? (
        <header className="flex items-start justify-between gap-balsa-lg px-balsa-xl pb-0 pt-balsa-xl group-data-[size=sm]/application-card:px-4 group-data-[size=sm]/application-card:pt-4 group-data-[size=lg]/application-card:px-6 group-data-[size=lg]/application-card:pt-6">
          {header ?? (
            <div className="min-w-0">
              <Heading className="font-balsa-title text-base font-semibold leading-snug tracking-tight text-balsa-surface-foreground">
                {title}
              </Heading>
              {description ? (
                <p className="mt-balsa-3xs text-sm leading-snug text-balsa-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          )}
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}

      <div
        data-application-card-body=""
        className="flex min-h-0 flex-1 flex-col p-balsa-xl pt-balsa-lg group-data-[size=sm]/application-card:p-4 group-data-[size=sm]/application-card:pt-3 group-data-[size=lg]/application-card:p-6 group-data-[size=lg]/application-card:pt-5"
      >
        {children}
      </div>

      {footer ? (
        <footer
          data-application-card-footer=""
          className="border-balsa-border [border-top-style:var(--balsa-border-style)] [border-top-width:var(--balsa-border-width)] px-balsa-xl py-balsa-md text-xs text-balsa-muted-foreground group-data-[size=sm]/application-card:px-4 group-data-[size=sm]/application-card:py-2.5 group-data-[size=lg]/application-card:px-6 group-data-[size=lg]/application-card:py-4"
        >
          {footer}
        </footer>
      ) : null}
    </Card>
  );
}
