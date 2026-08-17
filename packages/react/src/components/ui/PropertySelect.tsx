import {
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import type { AnchoredAlign, AnchoredSide } from "./anchored-layer";
import { mergeClasses } from "./classes";
import { DropdownMenu } from "./DropdownMenu";
import { roundedClasses, type Rounded } from "./form";
import { Icon, type IconComponent } from "./Icon";
import type { MenuItem, MenuSelection, MenuVariant } from "./menu";
import type { Shadow, ThemeInput } from "./theme";
import { BalsaThemeContext, useResolvedThemeProps } from "./theme-context";

export interface PropertySelectProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "id" | "onSelect"
> {
  id: string;
  label: string;
  value?: string;
  items?: readonly MenuItem[];
  icon?: IconComponent;
  /** Renders the value in its own family, for font pickers. */
  valueFontFamily?: string;
  side?: AnchoredSide;
  align?: AnchoredAlign;
  sideOffset?: number;
  disabled?: boolean;
  variant?: MenuVariant;
  rounded?: Rounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  trailing?: ReactNode;
  onSelect?: (selection: MenuSelection) => void;
  onActivate?: () => void;
  "data-balsa"?: string;
  "data-palette"?: string;
}

export function PropertySelect(rawProps: PropertySelectProps) {
  const { props, theme } = useResolvedThemeProps("dropdown-menu", "overlays", rawProps, {
    variant: "surface",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    value,
    items,
    icon,
    valueFontFamily,
    side = "bottom",
    align = "start",
    sideOffset = 8,
    disabled = false,
    variant,
    rounded,
    shadow,
    theme: _themeInput,
    trailing,
    onSelect,
    onActivate,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    className,
    style,
    onClick,
    ...domProps
  } = props;
  void _themeInput;
  void _dataBalsa;

  const trailingHostRef = useRef<HTMLSpanElement | null>(null);
  const hasMenu = Boolean(items?.length);
  const controlClasses = mergeClasses(
    "flex w-full min-w-0 cursor-pointer items-center justify-start gap-0 overflow-hidden border border-balsa-border bg-balsa-surface p-0 text-left text-sm font-semibold text-balsa-surface-foreground transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-balsa-focus-ring",
    rawProps.rounded === undefined ? "rounded-balsa-control" : roundedClasses[rounded],
    disabled ? "cursor-not-allowed bg-balsa-disabled text-balsa-disabled-foreground" : "",
    className,
  );
  const valueStyle = valueFontFamily ? { fontFamily: valueFontFamily } : undefined;
  const content = (
    <>
      <span className="min-w-0 flex-1 py-balsa-xs pl-balsa-md">
        <small className="block text-xs font-normal text-balsa-muted-foreground">{label}</small>
        <strong className="block truncate" style={valueStyle}>{value}</strong>
      </span>
      {trailing ?? (icon
        ? <Icon icon={icon} size="md" className="mr-balsa-md shrink-0 self-center" />
        : null)}
    </>
  );

  function forwardToTrailing(event: MouseEvent<HTMLDivElement>): void {
    onClick?.(event);
    if (event.defaultPrevented || disabled) return;
    const target = event.target as Node | null;
    if (target && trailingHostRef.current?.contains(target)) return;
    onActivate?.();
    trailingHostRef.current
      ?.querySelector<HTMLElement>("button, [role='button'], input")
      ?.click();
  }

  if (hasMenu) {
    return (
      <DropdownMenu
        id={id}
        label={label}
        items={items ?? []}
        side={side}
        align={align}
        sideOffset={sideOffset}
        variant={variant}
        rounded={rawProps.rounded}
        shadow={shadow}
        disabled={disabled}
        theme={rawProps.theme}
        data-palette={dataPalette}
        className={controlClasses}
        style={style}
        trigger={content}
        onSelect={onSelect}
      />
    );
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        id={id}
        data-balsa="property-select"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-rounded={rounded}
        className={controlClasses}
        style={{
          ...theme.explicitPresentation?.style,
          ...style,
        } as CSSProperties}
        onClick={forwardToTrailing}
      >
        <span className="min-w-0 flex-1 py-balsa-xs pl-balsa-md" aria-hidden="true">
          <small className="block text-xs font-normal text-balsa-muted-foreground">{label}</small>
          <strong className="block truncate" style={valueStyle}>{value}</strong>
        </span>
        <span ref={trailingHostRef} className="contents">
          {trailing ?? (icon
            ? <Icon icon={icon} size="md" className="mr-balsa-md shrink-0 self-center" />
            : null)}
        </span>
      </div>
    </BalsaThemeContext.Provider>
  );
}
