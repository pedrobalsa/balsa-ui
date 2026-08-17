import { GripHorizontal, GripVertical } from "lucide-react";
import {
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { mergeClasses } from "./classes";
import { surfaceRoundedClasses, type SurfaceRounded } from "./form";
import { Icon } from "./Icon";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";

export type ResizableOrientation = "horizontal" | "vertical";
export type ResizableVariant = "surface" | "outline" | "soft" | "glass";
export type ResizableSize = "sm" | "md" | "lg";

export interface ResizableProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "children"
> {
  id: string;
  label: string;
  orientation?: ResizableOrientation;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showGrip?: boolean;
  variant?: ResizableVariant;
  size?: ResizableSize;
  rounded?: SurfaceRounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  onResize?: (value: number) => void;
  first?: ReactNode;
  second?: ReactNode;
}

const variantClasses: Readonly<Record<ResizableVariant, string[]>> = {
  surface: ["border-balsa-border", "bg-balsa-surface"],
  outline: ["border-balsa-border-strong", "bg-transparent"],
  soft: ["border-transparent", "bg-balsa-muted"],
  glass: ["border-balsa-border/60", "bg-balsa-surface/55", "backdrop-balsa"],
};
const handleSizeClasses: Readonly<
  Record<ResizableOrientation, Record<ResizableSize, string>>
> = {
  horizontal: { sm: "w-1", md: "w-2", lg: "w-3" },
  vertical: { sm: "h-1", md: "h-2", lg: "h-3" },
};

export function Resizable(rawProps: ResizableProps) {
  const { props, theme } = useResolvedThemeProps("resizable", "surfaces", rawProps, {
    variant: "surface",
    size: "md",
    rounded: "auto",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    orientation = "horizontal",
    min = 10,
    max = 90,
    step = 5,
    disabled = false,
    showGrip = true,
    variant,
    size,
    rounded,
    shadow,
    theme: _themeInput,
    value,
    defaultValue = 50,
    onValueChange,
    onResize,
    first,
    second,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const [current, setValue] = useControllableState<number>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const root = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const minimum = Math.min(100, Math.max(0, min));
  const maximum = Math.max(minimum, Math.min(100, max));
  const panelValue = Math.min(maximum, Math.max(minimum, current));

  const classes = mergeClasses(
    "grid min-h-0 min-w-0 overflow-hidden text-balsa-foreground",
    variantClasses[variant],
    surfaceRoundedClasses[rounded],
    dragging && "select-none",
    className,
  );
  const layoutStyle: CSSProperties = orientation === "horizontal"
    ? { gridTemplateColumns: `minmax(0, ${panelValue}fr) auto minmax(0, ${100 - panelValue}fr)` }
    : { gridTemplateRows: `minmax(0, ${panelValue}fr) auto minmax(0, ${100 - panelValue}fr)` };
  const panelClasses = "min-h-0 min-w-0 overflow-auto";
  const handleClasses = mergeClasses(
    "group relative z-10 flex shrink-0 touch-none items-center justify-center bg-balsa-border-strong text-balsa-muted-foreground outline-none transition-colors hover:bg-balsa-primary focus-visible:bg-balsa-primary focus-visible:text-balsa-primary-foreground focus-visible:ring-2 focus-visible:ring-balsa-focus-ring disabled:cursor-not-allowed",
    orientation === "horizontal" ? "h-full cursor-col-resize" : "w-full cursor-row-resize",
    handleSizeClasses[orientation][size],
    disabled && "cursor-not-allowed opacity-50",
  );
  const gripIcon = orientation === "horizontal" ? GripVertical : GripHorizontal;

  function update(next: number): void {
    const clamped = Math.min(maximum, Math.max(minimum, next));
    if (clamped === panelValue) return;
    setValue(clamped);
    onResize?.(clamped);
  }

  function updateFromPointer(event: ReactPointerEvent<HTMLElement>): void {
    const element = root.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const position = orientation === "horizontal"
      ? event.clientX - rect.left
      : event.clientY - rect.top;
    const length = orientation === "horizontal" ? rect.width : rect.height;
    if (length > 0) update((position / length) * 100);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>): void {
    if (disabled) return;
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateFromPointer(event);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>): void {
    if (!dragging || disabled) return;
    event.preventDefault();
    updateFromPointer(event);
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLElement>): void {
    setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  }

  function handleKeydown(event: KeyboardEvent<HTMLElement>): void {
    if (disabled) return;
    const nextStep = Math.max(0.1, step);
    const decrease =
      (orientation === "horizontal" && event.key === "ArrowLeft") ||
      (orientation === "vertical" && event.key === "ArrowUp");
    const increase =
      (orientation === "horizontal" && event.key === "ArrowRight") ||
      (orientation === "vertical" && event.key === "ArrowDown");
    if (decrease) update(panelValue - nextStep);
    else if (increase) update(panelValue + nextStep);
    else if (event.key === "Home") update(minimum);
    else if (event.key === "End") update(maximum);
    else return;
    event.preventDefault();
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        id={id}
        ref={root}
        data-balsa="resizable"
        data-rounded={rounded}
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-orientation={orientation}
        data-variant={variant}
        data-size={size}
        data-dragging={String(dragging)}
        data-shadow={shadow}
        className={classes}
        style={
          {
            ...layoutStyle,
            ...style,
            ...theme.explicitPresentation?.style,
          } as CSSProperties
        }
      >
        <section data-balsa="resizable-panel" className={panelClasses}>
          {first}
        </section>
        <div
          data-balsa="resizable-handle"
          role="separator"
          aria-label={label}
          aria-orientation={orientation}
          aria-valuemin={minimum}
          aria-valuemax={maximum}
          aria-valuenow={Math.round(panelValue)}
          aria-disabled={disabled}
          tabIndex={disabled ? undefined : 0}
          className={handleClasses}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onKeyDown={handleKeydown}
        >
          {showGrip ? <Icon icon={gripIcon} size="sm" /> : null}
        </div>
        <section data-balsa="resizable-panel" className={panelClasses}>
          {second}
        </section>
      </div>
    </BalsaThemeContext.Provider>
  );
}
