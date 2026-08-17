import { ChevronDown } from "lucide-react";
import {
  createElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";
import { Icon } from "./Icon";

export type CollapsibleVariant = "underline" | "surface" | "outline" | "soft" | "glass";
export type CollapsibleSize = "sm" | "md" | "lg";
export type CollapsibleHeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface CollapsibleProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  id: string;
  title: string;
  variant?: CollapsibleVariant;
  size?: CollapsibleSize;
  rounded?: Rounded;
  shadow?: Shadow;
  headingLevel?: CollapsibleHeadingLevel;
  disabled?: boolean;
  theme?: ThemeInput;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode | ((open: boolean) => ReactNode);
  children?: ReactNode;
}

const variantClasses: Readonly<Record<CollapsibleVariant, string[]>> = {
  underline: ["border-0", "bg-transparent", "text-balsa-foreground"],
  surface: ["border-balsa-border", "bg-balsa-surface", "text-balsa-surface-foreground"],
  outline: ["border-balsa-border-strong", "bg-transparent", "text-balsa-foreground"],
  soft: ["border-balsa-primary/20", "bg-balsa-primary/5", "text-balsa-foreground"],
  glass: [
    "border-balsa-border/70",
    "bg-balsa-surface/60",
    "text-balsa-foreground",
    "backdrop-balsa",
  ],
};
const sizeClasses: Readonly<
  Record<CollapsibleSize, { trigger: string[]; content: string[]; icon: string }>
> = {
  sm: {
    trigger: ["min-h-8", "gap-balsa-xs", "px-balsa-md", "py-balsa-2xs", "text-sm"],
    content: ["px-balsa-md", "py-balsa-sm", "text-sm"],
    icon: "text-base",
  },
  md: {
    trigger: ["min-h-9", "gap-balsa-sm", "px-balsa-lg", "py-balsa-xs", "text-sm"],
    content: ["px-balsa-lg", "py-balsa-md", "text-sm"],
    icon: "text-lg",
  },
  lg: {
    trigger: ["min-h-10", "gap-balsa-md", "px-balsa-xl", "py-balsa-sm", "text-sm"],
    content: ["px-balsa-xl", "py-balsa-lg", "text-sm"],
    icon: "text-lg",
  },
};

export function Collapsible(rawProps: CollapsibleProps) {
  const { props, theme } = useResolvedThemeProps("collapsible", "surfaces", rawProps, {
    variant: "underline",
    size: "md",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
  id,
  title,
  variant,
  size,
  rounded,
  shadow,
  headingLevel = 3,
  disabled = false,
  theme: _themeInput,
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  className,
  style,
  children,
  ...domProps
  } = props;
  void _themeInput;
  const [current, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const state = current ? "open" : "closed";
  const triggerId = `${id}-trigger`;
  const contentId = `${id}-content`;
  const HeadingTag = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";

  const rootClasses = mergeClasses(
    variant === "underline"
      ? "min-w-0 font-balsa-body"
      : ["min-w-0 overflow-hidden font-balsa-body", roundedClasses[rounded]],
    variantClasses[variant],
    className,
  );
  const triggerClasses = mergeClasses(
    "flex w-full cursor-pointer items-center justify-between text-left transition-colors duration-balsa-fast ease-balsa hover:bg-balsa-muted/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-balsa-focus-ring disabled:cursor-not-allowed disabled:bg-balsa-disabled disabled:text-balsa-disabled-foreground",
    variant === "underline" ? "border-b-(length:--balsa-border-width) border-balsa-border hover:border-balsa-border-strong" : "",
    sizeClasses[size].trigger,
  );
  const iconClasses = mergeClasses(
    "shrink-0",
    "transition-transform",
    "duration-balsa-fast ease-balsa",
    "motion-reduce:transition-none",
    sizeClasses[size].icon,
    current ? "rotate-180" : "rotate-0",
  );
  const panelClasses = mergeClasses(
    "grid transition-[grid-template-rows,visibility] duration-balsa-normal ease-balsa motion-reduce:transition-none",
    current ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]",
  );
  const contentClasses = mergeClasses(
    "min-h-0 min-w-0 overflow-hidden text-balsa-muted-foreground",
    current
      ? [
          variant === "underline" ? "" : "border-t-(length:--balsa-border-width) border-balsa-border/80",
          sizeClasses[size].content,
        ]
      : "",
  );

  function toggle(): void {
    if (disabled) return;
    setOpen(!current);
  }

  const triggerContent = typeof trigger === "function" ? trigger(current) : (trigger ?? title);

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="collapsible"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-state={state}
        data-shadow={shadow}
        data-variant={variant}
        data-size={size}
        data-rounded={rounded}
        data-disabled={disabled || undefined}
        className={rootClasses}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        {createElement(
          HeadingTag,
          { className: "m-0" },
          <button
            id={triggerId}
            data-balsa="collapsible-trigger"
            type="button"
            disabled={disabled}
            aria-expanded={current}
            aria-controls={contentId}
            className={triggerClasses}
            onClick={toggle}
          >
            <span className="min-w-0">{triggerContent}</span>
            <Icon icon={ChevronDown} size="md" className={iconClasses} />
          </button>,
        )}

        <div
          data-balsa="collapsible-presence"
          data-state={state}
          aria-hidden={!current}
          inert={current ? undefined : true}
          className={panelClasses}
        >
          <div
            id={contentId}
            data-balsa="collapsible-content"
            role="region"
            aria-labelledby={triggerId}
            className={contentClasses}
          >
            {children}
          </div>
        </div>
      </div>
    </BalsaThemeContext.Provider>
  );
}
