import {
  type AnchorHTMLAttributes,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { Icon, type IconComponent } from "./Icon";
import { mergeClasses } from "./classes";
import type { NavigationLink } from "./navigation";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { Shadow, ThemeInput } from "./theme";
import { actionColorClasses, type ActionColor, type Rounded } from "./types";

export type LinkVariant = "text" | "solid" | "outline";
export type LinkSize = "sm" | "md" | "lg";

export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color" | "href"> {
  href: string;
  variant?: LinkVariant;
  color?: ActionColor;
  size?: LinkSize;
  prefixIcon?: IconComponent;
  suffixIcon?: IconComponent;
  external?: boolean;
  label?: string;
  rounded?: Rounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  onNavigate?: (item: NavigationLink, event: ReactMouseEvent<HTMLAnchorElement>) => void;
  children?: ReactNode;
}

const sizeClasses: Readonly<Record<LinkSize, string>> = {
  sm: "h-8 gap-balsa-2xs px-balsa-md text-sm",
  md: "h-9 gap-balsa-xs px-balsa-lg text-sm",
  lg: "h-10 gap-balsa-xs px-balsa-2xl text-sm",
};
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};

export function Link(rawProps: LinkProps) {
  const { props, theme } = useResolvedThemeProps("link", "controls", rawProps, {
    variant: "text",
    size: "md",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    href,
    variant,
    color = "accent",
    size,
    prefixIcon,
    suffixIcon,
    external = false,
    label,
    rounded,
    shadow,
    theme: _themeInput,
    onNavigate,
    onClick,
    className,
    style,
    children,
    ...domProps
  } = props;
  void _themeInput;

  const classes = mergeClasses(
    "inline-flex w-fit items-center justify-center font-balsa-body transition-colors duration-balsa-fast ease-balsa focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring",
    roundedClasses[rounded],
    actionColorClasses[color][variant],
    variant === "text"
      ? ["underline", "underline-offset-4", "hover:decoration-2"]
      : ["no-underline"],
    variant === "outline" ? ["border", "bg-transparent"] : [],
    sizeClasses[size],
    className,
  );

  function navigate(event: ReactMouseEvent<HTMLAnchorElement>): void {
    onClick?.(event);
    onNavigate?.({ title: label ?? href, link: href }, event);
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <a
        {...domProps}
        data-balsa="link"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-variant={variant}
        data-color={color}
        data-rounded={rounded}
        data-shadow={shadow}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        aria-label={label}
        className={classes}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
        onClick={navigate}
      >
        {prefixIcon ? <Icon icon={prefixIcon} size="md" /> : null}
        {children}
        {suffixIcon ? <Icon icon={suffixIcon} size="md" /> : null}
      </a>
    </BalsaThemeContext.Provider>
  );
}
