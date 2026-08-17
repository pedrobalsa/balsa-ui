import { Fragment, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { Shadow, ThemeInput } from "./theme";

export type KbdVariant = "raised" | "outline" | "soft";
export type KbdSize = "sm" | "md" | "lg";

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  keys?: readonly string[];
  separator?: string;
  variant?: KbdVariant;
  size?: KbdSize;
  rounded?: Rounded;
  shadow?: Shadow;
  accessibleLabel?: string;
  theme?: ThemeInput;
  children?: ReactNode;
}

const variantClasses: Readonly<Record<KbdVariant, string[]>> = {
  raised: [
    "border-balsa-border-strong",
    "bg-balsa-surface-elevated",
    "text-balsa-surface-elevated-foreground",
  ],
  outline: ["border-balsa-border-strong", "bg-transparent", "text-balsa-foreground"],
  soft: ["border-transparent", "bg-balsa-muted", "text-balsa-muted-foreground"],
};
const sizeClasses: Readonly<Record<KbdSize, string[]>> = {
  sm: ["min-h-5", "min-w-5", "px-balsa-2xs", "text-[0.6875rem]"],
  md: ["min-h-6", "min-w-6", "px-balsa-xs", "text-xs"],
  lg: ["min-h-8", "min-w-8", "px-balsa-sm", "text-sm"],
};
const groupGapClasses: Readonly<Record<KbdSize, string>> = {
  sm: "gap-balsa-3xs",
  md: "gap-balsa-2xs",
  lg: "gap-balsa-xs",
};

export function Kbd(rawProps: KbdProps) {
  const { props, theme } = useResolvedThemeProps("kbd", "controls", rawProps, {
    variant: "soft",
    size: "md",
    rounded: "md",
    shadow: "auto",
  } as const);
  const {
    keys = [],
    separator = "+",
    variant,
    size,
    rounded,
    shadow,
    accessibleLabel,
    theme: _themeInput,
    className,
    style,
    children,
    ...domProps
  } = props;
  void _themeInput;

  const hasKeys = keys.length > 0;
  const capClasses = mergeClasses(
    "inline-flex shrink-0 select-none items-center justify-center font-mono font-medium leading-none whitespace-nowrap",
    variantClasses[variant],
    sizeClasses[size],
    roundedClasses[rounded],
  );
  const classes = mergeClasses(
    "align-middle font-mono",
    hasKeys
      ? ["inline-flex items-center whitespace-nowrap", groupGapClasses[size]]
      : capClasses,
    className,
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <kbd
        {...domProps}
        data-balsa="kbd"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-variant={variant}
        data-size={size}
        data-rounded={rounded}
        data-shadow={shadow}
        data-group={hasKeys}
        aria-label={accessibleLabel}
        className={classes}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        {hasKeys
          ? keys.map((key, index) => (
            <Fragment key={`${key}-${index}`}>
              <span data-balsa="kbd-key" className={capClasses}>{key}</span>
              {index < keys.length - 1 ? (
                <span
                  data-balsa="kbd-separator"
                  className="text-balsa-muted-foreground"
                  aria-hidden="true"
                >
                  {separator}
                </span>
              ) : null}
            </Fragment>
          ))
          : children}
      </kbd>
    </BalsaThemeContext.Provider>
  );
}
