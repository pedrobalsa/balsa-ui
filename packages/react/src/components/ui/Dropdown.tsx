import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { ActionColor } from "./types";

export type DropdownVariant = "surface" | "outline" | "soft" | "glass";
export type DropdownAlign = "auto" | "start" | "end" | "center";
export type DropdownWidth = "sm" | "md" | "lg" | "xl";
type ResolvedDropdownAlign = Exclude<DropdownAlign, "auto">;

export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  variant?: DropdownVariant;
  color?: ActionColor;
  align?: DropdownAlign;
  width?: DropdownWidth;
  rounded?: Rounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  children?: ReactNode;
}

const variantClasses: Readonly<Record<DropdownVariant, string[]>> = {
  surface: ["bg-balsa-background/90", "text-balsa-foreground", "backdrop-balsa"],
  outline: ["bg-balsa-background/80", "text-balsa-foreground", "backdrop-balsa"],
  soft: ["text-balsa-foreground", "backdrop-balsa"],
  glass: ["text-balsa-surface-elevated-foreground", "backdrop-balsa"],
};
const colorClasses: Readonly<Record<ActionColor, Record<DropdownVariant, string[]>>> = {
  neutral: {
    surface: [], outline: [], soft: [], glass: [],
  },
  primary: {
    surface: ["border-balsa-primary/30"], outline: ["border-balsa-primary"], soft: ["border-balsa-primary/20", "bg-balsa-primary/10"], glass: ["border-balsa-primary/30"],
  },
  secondary: {
    surface: ["border-balsa-secondary/30"], outline: ["border-balsa-secondary"], soft: ["border-balsa-secondary/20", "bg-balsa-secondary/10"], glass: ["border-balsa-secondary/30"],
  },
  accent: {
    surface: ["border-balsa-accent/30"], outline: ["border-balsa-accent"], soft: ["border-balsa-accent/20", "bg-balsa-accent/10"], glass: ["border-balsa-accent/30"],
  },
  destructive: {
    surface: ["border-balsa-destructive/30"], outline: ["border-balsa-destructive"], soft: ["border-balsa-destructive/20", "bg-balsa-destructive/10"], glass: ["border-balsa-destructive/30"],
  },
};
const alignClasses: Readonly<Record<ResolvedDropdownAlign, string[]>> = {
  start: ["left-0"],
  end: ["right-0"],
  center: ["left-1/2", "-translate-x-1/2"],
};
const widthClasses: Readonly<Record<DropdownWidth, string>> = {
  sm: "w-[min(16rem,calc(100vw-2rem))]",
  md: "w-[min(22rem,calc(100vw-2rem))]",
  lg: "w-[min(28rem,calc(100vw-2rem))]",
  xl: "w-[min(36rem,calc(100vw-2rem))]",
};

export function Dropdown(rawProps: DropdownProps) {
  const { props, theme } = useResolvedThemeProps("dropdown", "overlays", rawProps, {
    variant: "surface",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    open,
    variant,
    color = "primary",
    align = "start",
    width = "md",
    rounded,
    shadow,
    theme: _themeInput,
    className,
    style,
    children,
    ...domProps
  } = props;
  void _themeInput;

  const rootElement = useRef<HTMLDivElement | null>(null);
  const [autoAlign, setAutoAlign] = useState<ResolvedDropdownAlign>("start");
  const resolvedAlign: ResolvedDropdownAlign = align === "auto" ? autoAlign : align;

  useLayoutEffect(() => {
    function resolveAutoAlignment(): void {
      if (align !== "auto") return;

      const bounds = rootElement.current?.getBoundingClientRect();
      if (!bounds) return;

      const viewportInset = 16;
      if (bounds.right > window.innerWidth - viewportInset) {
        setAutoAlign("end");
      } else if (bounds.left < viewportInset) {
        setAutoAlign("start");
      }
    }

    resolveAutoAlignment();
    window.addEventListener("resize", resolveAutoAlignment, { passive: true });
    return () => {
      window.removeEventListener("resize", resolveAutoAlignment);
    };
  }, [align, open]);

  const classes = mergeClasses(
    "absolute top-full z-50 mt-balsa-xs border p-balsa-xs transition-[opacity,transform,visibility] duration-150 ease-out",
    widthClasses[width],
    roundedClasses[rounded],
    alignClasses[resolvedAlign],
    variantClasses[variant],
    colorClasses[color][variant],
    open
      ? ["visible", "translate-y-0", "opacity-100"]
      : ["invisible", "pointer-events-none", "-translate-y-1", "opacity-0"],
    className,
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        ref={rootElement}
        data-balsa="dropdown"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-variant={variant}
        data-color={color}
        data-align={resolvedAlign}
        data-width={width}
        data-rounded={rounded}
        data-state={open ? "open" : "closed"}
        data-shadow={shadow}
        aria-hidden={!open}
        className={classes}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </BalsaThemeContext.Provider>
  );
}
