import {
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { mergeClasses } from "./classes";
import { fieldHintClasses, roundedClasses, type Rounded } from "./form";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";
import type { ThemeInput } from "./theme";

export type SliderModelValue = number | [number, number];
export type SliderOrientation = "horizontal" | "vertical";
export type SliderSize = "sm" | "md" | "lg";

export interface SliderProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "value" | "defaultValue"> {
  id: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  minStepsBetweenThumbs?: number;
  orientation?: SliderOrientation;
  size?: SliderSize;
  rounded?: Rounded;
  disabled?: boolean;
  required?: boolean;
  showLabel?: boolean;
  showValue?: boolean;
  name?: string;
  hint?: string;
  formatValue?: (value: number) => string;
  theme?: ThemeInput;
  value?: SliderModelValue;
  defaultValue?: SliderModelValue;
  onValueChange?: (value: SliderModelValue) => void;
}

export function Slider(rawProps: SliderProps) {
  const { props, theme } = useResolvedThemeProps("slider", "fields", rawProps, {
    size: "md",
    rounded: "full",
  } as const);
  const {
    id,
    label,
    min = 0,
    max = 100,
    step = 1,
    minStepsBetweenThumbs = 0,
    orientation = "horizontal",
    size,
    rounded,
    disabled = false,
    required = false,
    showLabel = true,
    showValue = true,
    name,
    hint,
    formatValue,
    theme: _themeInput,
    value,
    defaultValue = 0,
    onValueChange,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const [current, setValue] = useControllableState<SliderModelValue>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const controlElement = useRef<HTMLDivElement | null>(null);
  const [draggingPointerId, setDraggingPointerId] = useState<number | null>(null);

  const isRange = Array.isArray(current);
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const safeStep = step > 0 ? step : 1;
  const minimumGap = Math.max(0, minStepsBetweenThumbs) * safeStep;

  function clamp(next: number): number {
    return Math.min(safeMax, Math.max(safeMin, next));
  }

  const values: [number, number] = (() => {
    if (Array.isArray(current)) {
      const lower = clamp(Math.min(current[0] ?? safeMin, current[1] ?? safeMax));
      const upper = clamp(Math.max(current[0] ?? safeMin, current[1] ?? safeMax));
      return [lower, upper];
    }
    return [safeMin, clamp(current)];
  })();

  function percentage(next: number): number {
    const span = safeMax - safeMin;
    return span === 0 ? 0 : ((next - safeMin) / span) * 100;
  }

  const percentages: [number, number] = [percentage(values[0]), percentage(values[1])];
  const hintId = hint ? `${id}-hint` : undefined;
  const start = isRange ? percentages[0] : 0;
  const end = percentages[1];
  const fillStyle = orientation === "vertical"
    ? { bottom: `${start}%`, height: `${Math.max(0, end - start)}%` }
    : { left: `${start}%`, width: `${Math.max(0, end - start)}%` };

  function thumbStyle(position: number): CSSProperties {
    return orientation === "vertical"
      ? { bottom: `${position}%`, left: "50%", transform: "translate(-50%, 50%)" }
      : { left: `${position}%`, top: "50%", transform: "translate(-50%, -50%)" };
  }

  function format(next: number): string {
    return formatValue ? formatValue(next) : String(next);
  }

  function updateModel(index: 0 | 1, nextValue: number): void {
    const next = clamp(nextValue);
    if (!isRange) {
      setValue(next);
      return;
    }
    const [lower, upper] = values;
    setValue(
      index === 0
        ? [Math.min(next, upper - minimumGap), upper]
        : [lower, Math.max(next, lower + minimumGap)],
    );
  }

  function valueFromPointer(event: ReactPointerEvent<HTMLElement>): number | undefined {
    const bounds = controlElement.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0 || bounds.height === 0) return undefined;
    const position = orientation === "vertical"
      ? (bounds.bottom - event.clientY) / bounds.height
      : (event.clientX - bounds.left) / bounds.width;
    const raw = safeMin + Math.max(0, Math.min(1, position)) * (safeMax - safeMin);
    return safeMin + Math.round((raw - safeMin) / safeStep) * safeStep;
  }

  function updateFromPointer(index: 0 | 1, event: ReactPointerEvent<HTMLElement>): void {
    const next = valueFromPointer(event);
    if (next !== undefined) updateModel(index, next);
  }

  function handleThumbPointerDown(index: 0 | 1, event: ReactPointerEvent<HTMLElement>): void {
    if (disabled) return;
    event.preventDefault();
    setDraggingPointerId(event.pointerId);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    controlElement.current
      ?.querySelectorAll<HTMLInputElement>('[data-balsa="slider-native"]')
      .item(index)
      ?.focus();
    updateFromPointer(index, event);
  }

  function handleThumbPointerMove(index: 0 | 1, event: ReactPointerEvent<HTMLElement>): void {
    if (draggingPointerId === event.pointerId) updateFromPointer(index, event);
  }

  function handleThumbPointerEnd(event: ReactPointerEvent<HTMLElement>): void {
    if (draggingPointerId === event.pointerId) setDraggingPointerId(null);
  }

  const trackSize = size === "sm"
    ? orientation === "vertical" ? "w-1" : "h-1"
    : size === "lg"
      ? orientation === "vertical" ? "w-2" : "h-2"
      : orientation === "vertical" ? "w-1.5" : "h-1.5";
  const thumbSize = size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5";
  const thumbClasses = mergeClasses(
    "absolute z-30 rounded-full border-2 border-balsa-primary bg-balsa-input shadow-balsa-detail transition-[box-shadow,opacity] group-focus-within:ring-2 group-focus-within:ring-balsa-focus-ring/30",
    disabled ? "pointer-events-none bg-balsa-disabled opacity-60" : "cursor-grab touch-none active:cursor-grabbing",
    thumbSize,
  );
  const nativeClasses = mergeClasses(
    "absolute inset-0 z-20 m-0 size-full appearance-none bg-transparent opacity-0 outline-none",
    orientation === "vertical" ? "[writing-mode:vertical-lr] [direction:rtl]" : "",
    disabled ? "cursor-not-allowed" : "cursor-pointer",
  );
  const displayValue = isRange
    ? `${format(values[0])} – ${format(values[1])}`
    : format(values[1]);
  const firstThumbIndex: 0 | 1 = isRange ? 0 : 1;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="slider"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-orientation={orientation}
        data-size={size}
        data-rounded={rounded}
        className={mergeClasses(
          orientation === "vertical" ? "inline-flex min-h-64 flex-col" : "w-full",
          className,
        )}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        {showValue ? (
          <div
            className={mergeClasses(
              "mb-balsa-xs flex items-center gap-balsa-lg",
              showLabel ? "justify-between" : "justify-end",
            )}
          >
            <label
              id={`${id}-label`}
              htmlFor={`${id}-0`}
              className={showLabel ? "text-sm font-medium text-balsa-foreground" : "sr-only"}
            >
              {label}
              {required ? <span className="text-balsa-primary" aria-hidden="true">*</span> : null}
            </label>
            <output className="text-sm tabular-nums text-balsa-muted-foreground">
              {displayValue}
            </output>
          </div>
        ) : (
          <label
            id={`${id}-label`}
            htmlFor={`${id}-0`}
            className={showLabel
              ? "mb-balsa-xs block text-sm font-medium text-balsa-foreground"
              : "sr-only"}
          >
            {label}
            {required ? <span className="text-balsa-primary" aria-hidden="true">*</span> : null}
          </label>
        )}

        <div
          ref={controlElement}
          className={mergeClasses(
            "group relative isolate focus-within:outline-none",
            orientation === "vertical" ? "min-h-48 w-10 flex-1 self-center" : "h-10 w-full",
          )}
        >
          <span
            aria-hidden="true"
            className={mergeClasses(
              "absolute bg-balsa-muted",
              roundedClasses[rounded],
              orientation === "vertical"
                ? "bottom-0 left-1/2 top-0 -translate-x-1/2"
                : "left-0 right-0 top-1/2 -translate-y-1/2",
              trackSize,
            )}
          />
          <span
            aria-hidden="true"
            className={mergeClasses(
              "absolute bg-balsa-primary",
              roundedClasses[rounded],
              orientation === "vertical"
                ? "bottom-0 left-1/2 -translate-x-1/2"
                : "top-1/2 -translate-y-1/2",
              trackSize,
            )}
            style={fillStyle}
          />
          <span
            data-balsa="slider-thumb"
            data-index={firstThumbIndex}
            className={thumbClasses}
            style={thumbStyle(isRange ? percentages[0] : percentages[1])}
            aria-hidden="true"
            onPointerDown={(event) => handleThumbPointerDown(firstThumbIndex, event)}
            onPointerMove={(event) => handleThumbPointerMove(firstThumbIndex, event)}
            onPointerUp={handleThumbPointerEnd}
            onPointerCancel={handleThumbPointerEnd}
          />
          {isRange ? (
            <span
              data-balsa="slider-thumb"
              data-index={1}
              className={thumbClasses}
              style={thumbStyle(percentages[1])}
              aria-hidden="true"
              onPointerDown={(event) => handleThumbPointerDown(1, event)}
              onPointerMove={(event) => handleThumbPointerMove(1, event)}
              onPointerUp={handleThumbPointerEnd}
              onPointerCancel={handleThumbPointerEnd}
            />
          ) : null}

          <input
            id={`${id}-0`}
            data-balsa="slider-native"
            type="range"
            min={safeMin}
            max={isRange ? values[1] - minimumGap : safeMax}
            step={safeStep}
            value={isRange ? values[0] : values[1]}
            name={isRange && name ? `${name}[]` : name}
            disabled={disabled}
            required={required}
            aria-labelledby={isRange ? undefined : `${id}-label`}
            aria-describedby={hintId}
            aria-label={isRange ? `${label} minimum` : undefined}
            aria-valuetext={format(isRange ? values[0] : values[1])}
            className={nativeClasses}
            onChange={(event) => updateModel(isRange ? 0 : 1, event.currentTarget.valueAsNumber)}
          />
          {isRange ? (
            <input
              id={`${id}-1`}
              data-balsa="slider-native"
              type="range"
              min={values[0] + minimumGap}
              max={safeMax}
              step={safeStep}
              value={values[1]}
              name={name ? `${name}[]` : undefined}
              disabled={disabled}
              required={required}
              aria-describedby={hintId}
              aria-label={`${label} maximum`}
              aria-valuetext={format(values[1])}
              className={nativeClasses}
              onChange={(event) => updateModel(1, event.currentTarget.valueAsNumber)}
            />
          ) : null}
        </div>

        {hint ? (
          <span id={hintId} className={fieldHintClasses}>{hint}</span>
        ) : null}
      </div>
    </BalsaThemeContext.Provider>
  );
}
