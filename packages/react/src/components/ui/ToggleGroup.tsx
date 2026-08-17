import {
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  useRef,
  useState,
} from "react";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import { Toggle, type ToggleSize, type ToggleVariant } from "./Toggle";
import { type Shadow, type ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { ActionColor } from "./types";
import type { IconComponent } from "./Icon";

export interface ToggleGroupOption {
  id: string;
  label: string;
  icon?: IconComponent;
  disabled?: boolean;
}

export type ToggleGroupType = "single" | "multiple";
export type ToggleGroupOrientation = "horizontal" | "vertical";
export type ToggleGroupValue = string | readonly string[];

export interface ToggleGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "value" | "defaultValue"> {
  options: readonly ToggleGroupOption[];
  label: string;
  type?: ToggleGroupType;
  orientation?: ToggleGroupOrientation;
  allowEmpty?: boolean;
  disabled?: boolean;
  variant?: ToggleVariant;
  color?: ActionColor;
  size?: ToggleSize;
  rounded?: Rounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  value: ToggleGroupValue;
  onValueChange: (value: ToggleGroupValue) => void;
}

export function ToggleGroup(rawProps: ToggleGroupProps) {
  const { props, theme } = useResolvedThemeProps("toggle-group", "controls", rawProps, {
    variant: "surface",
    size: "md",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    options,
    label,
    type = "single",
    orientation = "horizontal",
    allowEmpty = true,
    disabled = false,
    variant,
    color = "primary",
    size,
    rounded,
    shadow,
    theme: _themeInput,
    value,
    onValueChange,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const rootElement = useRef<HTMLDivElement | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  function isPressed(id: string): boolean {
    return Array.isArray(value) ? value.includes(id) : value === id;
  }

  function isOptionDisabled(option: ToggleGroupOption): boolean {
    return disabled || option.disabled === true;
  }

  const enabledIndexes = options
    .map((option, index) => (!isOptionDisabled(option) ? index : -1))
    .filter((index) => index >= 0);
  const selectedIndex = options.findIndex(
    (option) => isPressed(option.id) && !isOptionDisabled(option),
  );
  const rovingIndex = focusedIndex !== null && enabledIndexes.includes(focusedIndex)
    ? focusedIndex
    : selectedIndex >= 0
      ? selectedIndex
      : enabledIndexes[0] ?? -1;

  function setPressed(id: string, pressed: boolean): void {
    if (type === "multiple") {
      const current = Array.isArray(value) ? [...value] : [];
      onValueChange(
        pressed
          ? [...new Set([...current, id])]
          : current.filter((entry) => entry !== id),
      );
      return;
    }

    if (pressed) {
      onValueChange(id);
    } else if (allowEmpty) {
      onValueChange("");
    }
  }

  function focusIndex(index: number): void {
    setFocusedIndex(index);
    rootElement.current
      ?.querySelectorAll<HTMLButtonElement>('[data-balsa="toggle"]')
      .item(index)
      ?.focus();
  }

  function moveFocus(currentIndex: number, direction: 1 | -1): void {
    if (enabledIndexes.length === 0) return;
    const position = enabledIndexes.indexOf(currentIndex);
    const nextPosition = position < 0
      ? 0
      : (position + direction + enabledIndexes.length) % enabledIndexes.length;
    focusIndex(enabledIndexes[nextPosition] ?? enabledIndexes[0] ?? 0);
  }

  function onKeydown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    const forward =
      (orientation === "horizontal" && event.key === "ArrowRight") ||
      (orientation === "vertical" && event.key === "ArrowDown");
    const backward =
      (orientation === "horizontal" && event.key === "ArrowLeft") ||
      (orientation === "vertical" && event.key === "ArrowUp");

    if (forward || backward) {
      event.preventDefault();
      moveFocus(index, forward ? 1 : -1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const target = event.key === "Home" ? enabledIndexes[0] : enabledIndexes.at(-1);
      if (target !== undefined) focusIndex(target);
    }
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        ref={rootElement}
        data-balsa="toggle-group"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-type={type}
        data-orientation={orientation}
        data-disabled={disabled || undefined}
        data-shadow={shadow}
        role="group"
        aria-label={label}
        className={mergeClasses(
          "inline-flex w-fit max-w-full cursor-pointer overflow-auto border border-balsa-border-strong bg-balsa-surface",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          roundedClasses[rounded],
          className,
        )}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        {options.map((option, index) => (
          <Toggle
            key={option.id}
            value={isPressed(option.id)}
            variant={variant}
            color={color}
            size={size}
            rounded="none"
            prefixIcon={option.icon}
            disabled={isOptionDisabled(option)}
            aria-label={option.label}
            tabIndex={rovingIndex === index && !isOptionDisabled(option) ? 0 : -1}
            className={mergeClasses(
              "relative shrink-0 rounded-none border-0 shadow-none focus-visible:z-10",
              orientation === "horizontal"
                ? index === 0 ? "" : "border-l border-balsa-border-strong"
                : index === 0 ? "" : "border-t border-balsa-border-strong",
            )}
            onValueChange={(pressed) => setPressed(option.id, pressed)}
            onFocus={() => setFocusedIndex(index)}
            onKeyDown={(event) => onKeydown(event, index)}
          >
            {option.label}
          </Toggle>
        ))}
      </div>
    </BalsaThemeContext.Provider>
  );
}
