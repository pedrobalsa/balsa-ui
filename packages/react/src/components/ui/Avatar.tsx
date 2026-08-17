import {
  useEffect,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { mergeClasses } from "./classes";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { ThemeInput } from "./theme";

export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "rounded" | "square";
export type AvatarLoadState = "idle" | "loading" | "loaded" | "error";

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  src?: string;
  label: string;
  fallback?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  loading?: "eager" | "lazy";
  fallbackDelay?: number;
  badge?: ReactNode;
  theme?: ThemeInput;
  onLoadState?: (state: AvatarLoadState) => void;
  children?: ReactNode;
}

const sizeClasses: Readonly<Record<AvatarSize, string[]>> = {
  sm: ["size-8", "text-xs"],
  md: ["size-10", "text-sm"],
  lg: ["size-14", "text-base"],
  xl: ["size-20", "text-xl"],
};
const shapeClasses: Readonly<Record<AvatarShape, string>> = {
  circle: "rounded-full",
  rounded: "rounded-balsa-control",
  square: "rounded-none",
};

function initials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join("") || "?";
}

export function Avatar(rawProps: AvatarProps) {
  const { props, theme } = useResolvedThemeProps("avatar", "controls", rawProps, {
    size: "md",
    shape: "circle",
  } as const);
  const {
    src,
    label,
    fallback,
    size,
    shape,
    loading = "lazy",
    fallbackDelay = 0,
    badge,
    theme: _themeInput,
    onLoadState,
    className,
    style,
    children,
    ...domProps
  } = props;
  void _themeInput;

  const [loadState, setLoadState] = useState<AvatarLoadState>("idle");
  const [fallbackReady, setFallbackReady] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!src) {
      setFallbackReady(true);
      setLoadState("idle");
      onLoadState?.("idle");
      return;
    }
    setLoadState("loading");
    onLoadState?.("loading");
    const delay = Math.max(0, fallbackDelay);
    setFallbackReady(delay === 0);
    if (delay > 0) {
      timer = setTimeout(() => {
        setFallbackReady(true);
      }, delay);
    }
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
    // Image lifecycle follows `src`, matching Vue's watch on the same field.
  }, [src]);

  function setLoadStateAndNotify(state: AvatarLoadState): void {
    setLoadState(state);
    onLoadState?.(state);
  }

  function handleLoad(): void {
    setLoadStateAndNotify("loaded");
  }

  function handleError(): void {
    setFallbackReady(true);
    setLoadStateAndNotify("error");
  }

  const fallbackText = fallback?.trim() || initials(label);
  const showFallback = loadState !== "loaded" && fallbackReady;
  const classes = mergeClasses(
    "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden border-balsa-border bg-balsa-muted font-balsa-body font-medium text-balsa-muted-foreground",
    sizeClasses[size],
    shapeClasses[shape],
    className,
  );
  const imageClasses = mergeClasses(
    "absolute inset-0 size-full object-cover",
    shapeClasses[shape],
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <span
        {...domProps}
        data-balsa="avatar"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-size={size}
        data-shape={shape}
        data-load-state={loadState}
        aria-label={label}
        role="img"
        className={classes}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        {showFallback ? (
          <span data-balsa="avatar-fallback" aria-hidden="true">
            {children ?? fallbackText}
          </span>
        ) : null}
        {src ? (
          <img
            data-balsa="avatar-image"
            src={src}
            alt=""
            loading={loading}
            className={imageClasses}
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : null}
        {badge ? (
          <span
            data-balsa="avatar-badge"
            className="absolute bottom-0 right-0"
            aria-hidden="true"
          >
            {badge}
          </span>
        ) : null}
      </span>
    </BalsaThemeContext.Provider>
  );
}
