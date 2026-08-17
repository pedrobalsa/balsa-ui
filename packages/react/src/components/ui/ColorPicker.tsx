import { X } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useBalsaPortalScope } from "./BalsaPortalScope";
import { Button } from "./Button";
import { mergeClasses } from "./classes";
import { roundedClasses, type FieldVariant, type Rounded } from "./form";
import { Input } from "./Input";
import {
  capturePortalPresentation,
  type PortalPresentationSnapshot,
} from "./portal-core";
import { Select, type SelectOption } from "./Select";
import type { Shadow, ThemeInput, ThemePresentation } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";

export type ColorPickerType = "field" | "palette";
export type ColorPickerLabelPosition = "inside" | "outside";
export type ColorPickerSize = "sm" | "md" | "lg";
export type ColorCodeFormat = "hex" | "rgb" | "hsl";

interface HsvColor {
  h: number;
  s: number;
  v: number;
}

export interface ColorPickerProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "onChange" | "children" | "title" | "id" | "value" | "defaultValue" | "type"
  > {
  id: string;
  label: string;
  "data-balsa"?: string;
  "data-palette"?: string;
  accessibleLabel?: string;
  description?: string;
  name?: string;
  type?: ColorPickerType;
  labelPosition?: ColorPickerLabelPosition;
  size?: ColorPickerSize;
  variant?: FieldVariant;
  rounded?: Rounded;
  shadow?: Shadow;
  contained?: boolean;
  theme?: ThemeInput;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /* The Vue `actions` slot, which is handed the same close the panel's own
   * dismiss button calls, so a consumer action can shut the popover after it. */
  actions?: (close: () => void) => ReactNode;
}

const colorCodeOptions: readonly SelectOption[] = [
  { label: "HEX", value: "hex" },
  { label: "RGB", value: "rgb" },
  { label: "HSL", value: "hsl" },
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function parseHex(value: string): string | undefined {
  const source = value.trim();
  const short = source.match(/^#?([\da-f]{3})$/i)?.[1];
  if (short) {
    return `#${short.split("").map((channel) => channel + channel).join("")}`.toLowerCase();
  }
  const full = source.match(/^#?([\da-f]{6})$/i)?.[1];
  return full ? `#${full.toLowerCase()}` : undefined;
}

function normalizeHex(value: string): string {
  return parseHex(value) ?? "#000000";
}

function channelsToHex(red: number, green: number, blue: number): string {
  const channel = (value: number) =>
    Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0");

  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

/* Each CSS parser captures exactly three numeric groups. Resolving them into a
 * tuple keeps that guarantee checkable under noUncheckedIndexedAccess. */
function numericTriple(
  values: readonly number[] | undefined,
): readonly [number, number, number] | undefined {
  const [first, second, third] = values ?? [];
  if (first === undefined || second === undefined || third === undefined) {
    return undefined;
  }
  return [first, second, third];
}

function parseRgb(value: string): string | undefined {
  const channels = numericTriple(
    value
      .trim()
      .match(
        /^rgb\(\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)\s*\)$/i,
      )
      ?.slice(1)
      .map(Number),
  );

  if (!channels || channels.some((channel) => channel < 0 || channel > 255)) {
    return undefined;
  }

  return channelsToHex(...channels);
}

function parseHsl(value: string): string | undefined {
  const channels = numericTriple(
    value
      .trim()
      .match(
        /^hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*\)$/i,
      )
      ?.slice(1)
      .map(Number),
  );

  if (!channels) return undefined;
  const [hueDegrees, saturationPercent, lightnessPercent] = channels;
  if (saturationPercent > 100 || lightnessPercent > 100) return undefined;

  const hue = ((hueDegrees % 360) + 360) % 360;
  const saturation = saturationPercent / 100;
  const lightness = lightnessPercent / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) [red, green] = [chroma, secondary];
  else if (segment < 2) [red, green] = [secondary, chroma];
  else if (segment < 3) [green, blue] = [chroma, secondary];
  else if (segment < 4) [green, blue] = [secondary, chroma];
  else if (segment < 5) [red, blue] = [chroma, secondary];
  else [red, blue] = [chroma, secondary];

  return channelsToHex(
    (red + match) * 255,
    (green + match) * 255,
    (blue + match) * 255,
  );
}

function formatNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function hexToHsl(value: string): { h: number; s: number; l: number } {
  const normalized = normalizeHex(value);
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  if (hue < 0) hue += 360;
  return {
    h: hue,
    s: delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1)),
    l: lightness,
  };
}

export function formatColorCode(value: string, format: ColorCodeFormat): string {
  const normalized = normalizeHex(value);
  if (format === "hex") return normalized.toUpperCase();

  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  if (format === "rgb") return `rgb(${red}, ${green}, ${blue})`;

  const hsl = hexToHsl(normalized);
  return `hsl(${formatNumber(hsl.h)}, ${formatNumber(hsl.s * 100)}%, ${formatNumber(hsl.l * 100)}%)`;
}

export function parseColorCode(
  value: string,
  format: ColorCodeFormat,
): string | undefined {
  if (format === "hex") return parseHex(value);
  if (format === "rgb") return parseRgb(value);
  return parseHsl(value);
}

function linearChannel(hex: string, index: number): number {
  const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(value: string): number {
  const hex = normalizeHex(value);
  return (
    0.2126 * linearChannel(hex, 1)
    + 0.7152 * linearChannel(hex, 3)
    + 0.0722 * linearChannel(hex, 5)
  );
}

function hexToHsv(value: string): HsvColor {
  const normalized = normalizeHex(value);
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let nextHue = 0;

  if (delta !== 0) {
    if (max === red) nextHue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) nextHue = 60 * ((blue - red) / delta + 2);
    else nextHue = 60 * ((red - green) / delta + 4);
  }

  if (nextHue < 0) nextHue += 360;

  return {
    h: nextHue,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  };
}

function hsvToHex(color: HsvColor): string {
  const normalizedHue = ((color.h % 360) + 360) % 360;
  const normalizedSaturation = clamp(color.s) / 100;
  const normalizedBrightness = clamp(color.v) / 100;
  const chroma = normalizedBrightness * normalizedSaturation;
  const segment = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = normalizedBrightness - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) [red, green] = [chroma, secondary];
  else if (segment < 2) [red, green] = [secondary, chroma];
  else if (segment < 3) [green, blue] = [chroma, secondary];
  else if (segment < 4) [green, blue] = [secondary, chroma];
  else if (segment < 5) [red, blue] = [secondary, chroma];
  else [red, blue] = [chroma, secondary];

  const channel = (value: number) =>
    Math.round((value + match) * 255).toString(16).padStart(2, "0");

  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

/* `:popover-open` is a selector an engine can fail to parse rather than simply
 * not match, and `matches` throws when it does. */
function isPopoverOpen(element: HTMLElement | null): boolean {
  try {
    return element?.matches(":popover-open") ?? false;
  } catch {
    return false;
  }
}

const fieldSizeClasses: Readonly<Record<ColorPickerSize, string>> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-14",
};

const fieldLabelSizeClasses: Readonly<Record<ColorPickerSize, string>> = {
  sm: "text-xs",
  md: "text-xs",
  lg: "text-sm",
};

const fieldTagSizeClasses: Readonly<Record<ColorPickerSize, string>> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
};

const triggerVariantClasses: Readonly<Record<FieldVariant, string>> = {
  outline: "border-balsa-border-strong",
  surface: "border-balsa-input-border ring-1 ring-balsa-input",
  soft: "border-transparent ring-2 ring-balsa-muted",
  glass: "border-balsa-border/70 ring-1 ring-balsa-border/50 backdrop-balsa",
};

/* Everything the editor shows is a function of the committed colour, so it is
 * kept as one block that can be resynced in a single pass when that colour
 * moves under it -- rather than as effects racing each other back into it. */
interface EditorState {
  hex: string;
  format: ColorCodeFormat;
  hsv: HsvColor;
  draft: string;
  touched: boolean;
}

function editorFor(hex: string, format: ColorCodeFormat): EditorState {
  return {
    hex,
    format,
    hsv: hexToHsv(hex),
    draft: formatColorCode(hex, format),
    touched: false,
  };
}

export function ColorPicker(rawProps: ColorPickerProps) {
  const { props, theme } = useResolvedThemeProps("color-picker", "fields", rawProps, {
    size: "md",
    variant: "surface",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    accessibleLabel,
    description,
    name,
    disabled = false,
    type = "field",
    labelPosition = "outside",
    size,
    variant,
    rounded,
    shadow,
    contained = false,
    theme: themeInput,
    value,
    defaultValue,
    onValueChange,
    actions,
    className,
    style,
    ...domProps
  } = props;
  void _dataBalsa;

  const [model, setModel] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? "#000000",
    onChange: onValueChange,
  });
  const colorValue = normalizeHex(model);
  const displayValue = colorValue.toUpperCase();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const saturationRef = useRef<HTMLDivElement | null>(null);
  const draggingPointerId = useRef<number | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [supportsPopover, setSupportsPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ left: 0, top: 0 });
  const [portalSnapshot, setPortalSnapshot] = useState<PortalPresentationSnapshot | null>(null);
  const [editor, setEditor] = useState<EditorState>(() => editorFor(colorValue, "hex"));
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const openRef = useRef(isOpen);
  openRef.current = isOpen;

  /* The committed colour changed from outside this editor -- a controlled
   * parent, a form reset. Rebuilding here rather than in an effect keeps the
   * panel from painting one frame against the colour it no longer holds. */
  if (editor.hex !== colorValue) {
    setEditor(editorFor(colorValue, editor.format));
  }

  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const descriptionId = description ? `${id}-description` : undefined;
  const popoverId = `${id}-popover`;
  const colorCodeInputId = `${id}-color-code`;
  const colorCodeFormatId = `${id}-color-code-format`;
  const hueInputId = `${id}-hue`;

  const { hsv, format, draft, touched } = editor;
  const validDraft = Boolean(parseColorCode(draft, format));
  const colorCodeStatus = touched && !validDraft ? "unvalidated" : "default";
  const colorCodePlaceholder = format === "rgb"
    ? "rgb(15, 118, 110)"
    : format === "hsl"
      ? "hsl(175, 77%, 46%)"
      : "#0F766E";
  const colorCodeStatusMessage = format === "rgb"
    ? "Use rgb(red, green, blue) with channels from 0 to 255."
    : format === "hsl"
      ? "Use hsl(hue, saturation%, lightness%)."
      : "Use a three- or six-digit hex value.";

  const scope = useBalsaPortalScope();
  const floating = mounted && supportsPopover && !contained;
  const portalHost = contained || !mounted ? null : (scope?.host ?? document.body);

  function applyHsv(next: HsvColor): void {
    const normalized: HsvColor = {
      h: ((next.h % 360) + 360) % 360,
      s: clamp(next.s),
      v: clamp(next.v),
    };
    const nextHex = hsvToHex(normalized);
    setEditor({
      hex: nextHex,
      format,
      hsv: normalized,
      draft: formatColorCode(nextHex, format),
      touched: false,
    });
    setModel(nextHex);
  }

  function updateColorCode(next: string): void {
    const parsed = parseColorCode(next, format);
    if (!parsed) {
      setEditor((current) => ({ ...current, draft: next, touched: true }));
      return;
    }

    setEditor({
      hex: parsed,
      format,
      hsv: hexToHsv(parsed),
      draft: formatColorCode(parsed, format),
      touched: false,
    });
    setModel(parsed);
  }

  function restoreColorCode(): void {
    setEditor((current) => ({
      ...current,
      draft: parseColorCode(current.draft, current.format)
        ? current.draft
        : formatColorCode(current.hex, current.format),
      touched: false,
    }));
  }

  function changeFormat(nextFormat: ColorCodeFormat): void {
    setEditor((current) => ({
      ...current,
      format: nextFormat,
      draft: formatColorCode(current.hex, nextFormat),
      touched: false,
    }));
  }

  function positionPopover(): void {
    const triggerElement = triggerRef.current;
    const popoverElement = popoverRef.current;
    if (!openRef.current || !triggerElement || !popoverElement) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const popoverRect = popoverElement.getBoundingClientRect();
    const width = popoverRect.width || 288;
    const height = popoverRect.height || 360;
    const viewportPadding = 12;
    const gap = 8;
    const centeredLeft = triggerRect.left + triggerRect.width / 2 - width / 2;
    const next = {
      left: clamp(
        centeredLeft,
        viewportPadding,
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
      ),
      top:
        triggerRect.bottom + gap + height <= window.innerHeight - viewportPadding
          ? triggerRect.bottom + gap
          : Math.max(viewportPadding, triggerRect.top - height - gap),
    };

    setPopoverPosition((current) => (
      current.left === next.left && current.top === next.top ? current : next
    ));
  }

  function capturePresentation(): void {
    const root = rootRef.current;
    if (!root?.isConnected) return;
    const currentTheme = themeRef.current;
    const presentation: ThemePresentation | undefined =
      currentTheme.inherited || currentTheme.explicitPresentation
        ? currentTheme.presentation
        : undefined;
    try {
      const snapshot = capturePortalPresentation(root, presentation);
      setPortalSnapshot((current) => (
        current
          && current.themeId === snapshot.themeId
          && current.themeBase === snapshot.themeBase
          && current.paletteId === snapshot.paletteId
          && current.adapt === snapshot.adapt
          ? current
          : snapshot
      ));
    } catch {
      setPortalSnapshot((current) => current);
    }
  }

  function openPicker(): void {
    if (disabled || openRef.current) return;
    setIsOpen(true);
  }

  function closePicker(restoreFocus = false): void {
    if (!openRef.current) return;
    draggingPointerId.current = undefined;
    restoreColorCode();
    setIsOpen(false);
    if (restoreFocus) queueMicrotask(() => triggerRef.current?.focus());
  }

  function updateSaturationFromPointer(clientX: number, clientY: number): void {
    const field = saturationRef.current;
    if (!field) return;
    const rect = field.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    applyHsv({
      h: hsv.h,
      s: ((clientX - rect.left) / rect.width) * 100,
      v: (1 - (clientY - rect.top) / rect.height) * 100,
    });
  }

  function startSaturationDrag(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    draggingPointerId.current = event.pointerId;
    saturationRef.current?.setPointerCapture?.(event.pointerId);
    updateSaturationFromPointer(event.clientX, event.clientY);
  }

  function continueSaturationDrag(event: ReactPointerEvent<HTMLDivElement>): void {
    if (draggingPointerId.current !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    updateSaturationFromPointer(event.clientX, event.clientY);
  }

  function stopSaturationDrag(event: ReactPointerEvent<HTMLDivElement>): void {
    if (draggingPointerId.current !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    draggingPointerId.current = undefined;
    saturationRef.current?.releasePointerCapture?.(event.pointerId);
  }

  function handleSaturationKeydown(event: KeyboardEvent<HTMLDivElement>): void {
    const step = event.shiftKey ? 10 : 1;
    let nextSaturation = hsv.s;
    let nextBrightness = hsv.v;

    if (event.key === "ArrowLeft") nextSaturation -= step;
    else if (event.key === "ArrowRight") nextSaturation += step;
    else if (event.key === "ArrowUp") nextBrightness += step;
    else if (event.key === "ArrowDown") nextBrightness -= step;
    else return;

    event.preventDefault();
    applyHsv({ h: hsv.h, s: nextSaturation, v: nextBrightness });
  }

  useLayoutEffect(() => {
    setMounted(true);
    setSupportsPopover(
      typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype,
    );
  }, []);

  useLayoutEffect(() => {
    if (disabled && isOpen) closePicker();
  }, [disabled, isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    capturePresentation();
    positionPopover();
    document.getElementById(colorCodeInputId)?.focus();
  }, [isOpen, floating, contained]);

  /* The top layer is not something React renders into, so the popover has to be
   * opened imperatively once the element for this open state is in the DOM. */
  useLayoutEffect(() => {
    const popoverElement = popoverRef.current;
    if (!floating || !popoverElement) return;

    try {
      if (isOpen && !isPopoverOpen(popoverElement)) {
        popoverElement.showPopover();
      } else if (!isOpen && isPopoverOpen(popoverElement)) {
        popoverElement.hidePopover();
      }
    } catch {
      /* A browser that reports support but refuses the call keeps the inline
       * fallback positioning rather than losing the panel entirely. */
    }
  }, [isOpen, floating]);

  useLayoutEffect(() => {
    if (!mounted) return;

    function handleDocumentPointerDown(event: PointerEvent): void {
      if (!openRef.current) return;
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      closePicker();
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    window.addEventListener("resize", positionPopover, { passive: true });
    window.addEventListener("scroll", positionPopover, true);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      window.removeEventListener("resize", positionPopover);
      window.removeEventListener("scroll", positionPopover, true);
    };
  }, [mounted, contained]);

  const isFieldLabelInside = type === "field" && labelPosition === "inside";
  const luminance = relativeLuminance(colorValue);
  const tagColor = 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05
    ? "#FFFFFF"
    : "#000000";
  const panelPresentation = portalSnapshot ?? {
    themeId: theme.presentation.id,
    themeBase: theme.presentation.base,
    paletteId: dataPalette,
    style: Object.fromEntries(
      Object.entries(theme.presentation.style).filter(([property]) => property.startsWith("--balsa-")),
    ) as PortalPresentationSnapshot["style"],
  };

  const panel = (
    <div
      id={popoverId}
      ref={popoverRef}
      data-balsa="color-picker-popover"
      data-theme={panelPresentation.themeId}
      data-theme-base={panelPresentation.themeBase}
      data-palette={dataPalette ?? panelPresentation.paletteId}
      data-shadow={shadow}
      data-state={isOpen ? "open" : "closed"}
      popover={floating ? "auto" : undefined}
      role="dialog"
      aria-label={`Choose ${label} color`}
      aria-hidden={!isOpen}
      className={mergeClasses(
        "m-0 w-72 rounded-balsa-surface border border-balsa-border-strong bg-balsa-surface-elevated p-balsa-lg text-balsa-surface-elevated-foreground shadow-balsa-panel",
        "origin-top transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none",
        floating ? "fixed z-[70]" : "absolute left-0 top-full z-30 mt-balsa-xs",
        isOpen
          ? ["visible", "translate-y-0", "opacity-100"]
          : ["pointer-events-none", "invisible", "-translate-y-1", "opacity-0"],
      )}
      style={{
        ...(floating
          ? { left: `${popoverPosition.left}px`, top: `${popoverPosition.top}px` }
          : undefined),
        ...panelPresentation.style,
      } as CSSProperties}
      onToggle={() => {
        if (floating && !isPopoverOpen(popoverRef.current)) closePicker();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        closePicker(true);
      }}
    >
      <div className="mb-balsa-md flex items-center justify-between gap-balsa-md">
        <div className="min-w-0">
          <small className="block truncate text-balsa-muted-foreground">{label}</small>
          <p className="mt-balsa-3xs text-sm font-semibold">Choose a color</p>
        </div>
        <div className="flex shrink-0 items-center gap-balsa-xs">
          {actions?.(() => closePicker(true))}
          <Button
            size={null}
            theme={themeInput}
            variant="outline"
            prefixIcon={X}
            className="h-9 w-9 shrink-0 p-0"
            aria-label="Close color picker"
            onClick={() => closePicker(true)}
          >
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      <div
        ref={saturationRef}
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s)}
        aria-valuetext={`${displayValue}, ${Math.round(hsv.s)}% saturation, ${Math.round(hsv.v)}% brightness`}
        className="relative h-40 touch-none cursor-crosshair overflow-hidden rounded-balsa-control border border-balsa-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
        style={{
          backgroundColor: `hsl(${hsv.h} 100% 50%)`,
          backgroundImage:
            "linear-gradient(to top, rgb(0 0 0), transparent), linear-gradient(to right, rgb(255 255 255), transparent)",
        }}
        onPointerDown={startSaturationDrag}
        onPointerMove={continueSaturationDrag}
        onPointerUp={stopSaturationDrag}
        onPointerCancel={stopSaturationDrag}
        onKeyDown={handleSaturationKeydown}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-balsa-background shadow-balsa-surface ring-1 ring-balsa-foreground"
          style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
        />
      </div>

      <label htmlFor={hueInputId} className="mt-balsa-lg block text-sm font-medium">
        Hue
      </label>
      <input
        id={hueInputId}
        type="range"
        min={0}
        max={360}
        step={1}
        value={Math.round(hsv.h)}
        aria-label="Hue"
        className="mt-balsa-xs h-3 w-full cursor-pointer appearance-none rounded-full border border-balsa-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-balsa-background [&::-moz-range-thumb]:bg-balsa-foreground [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-balsa-background [&::-webkit-slider-thumb]:bg-balsa-foreground"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(255 0 0), rgb(255 255 0), rgb(0 255 0), rgb(0 255 255), rgb(0 0 255), rgb(255 0 255), rgb(255 0 0))",
        }}
        onChange={(event) => {
          applyHsv({ h: Number(event.currentTarget.value), s: hsv.s, v: hsv.v });
        }}
      />

      <div className="mt-balsa-xl grid grid-cols-[5.5rem_minmax(0,1fr)] items-end gap-balsa-xs">
        <Select
          id={colorCodeFormatId}
          label=""
          aria-label="Color code format"
          options={colorCodeOptions}
          value={format}
          size="sm"
          variant={variant}
          theme={themeInput}
          contained={contained}
          className="h-10 px-balsa-xs pr-7 text-xs"
          onValueChange={(next) => changeFormat(next as ColorCodeFormat)}
        />
        {/* Input owns the blur on its own control, so the restore listens for
          * the bubbled focusout on the wrapper instead of being overwritten. */}
        <div onBlur={restoreColorCode}>
          <Input
            id={colorCodeInputId}
            label="Color code"
            value={draft}
            placeholder={colorCodePlaceholder}
            autoComplete="off"
            spellCheck={false}
            size="sm"
            variant={variant}
            status={colorCodeStatus}
            statusMessage={colorCodeStatusMessage}
            theme={themeInput}
            onValueChange={(next) => updateColorCode(String(next))}
          />
        </div>
      </div>
    </div>
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        ref={rootRef}
        data-balsa="color-picker"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-rounded={rounded}
        data-variant={variant}
        className={mergeClasses(
          "relative",
          type === "palette"
            ? "flex h-full min-w-0 flex-1"
            : isFieldLabelInside
              ? "inline-flex shrink-0"
              : "inline-flex shrink-0 flex-col items-start gap-balsa-3xs",
        )}
        style={theme.explicitPresentation?.style as CSSProperties | undefined}
      >
        {isFieldLabelInside ? null : (
          <span
            id={labelId}
            className={mergeClasses(
              type === "palette"
                ? "sr-only"
                : [
                    "block whitespace-nowrap text-left text-balsa-muted-foreground",
                    fieldLabelSizeClasses[size],
                  ],
            )}
          >
            {label}
          </span>
        )}
        <button
          {...domProps}
          id={id}
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-label={accessibleLabel ? `${accessibleLabel}: ${displayValue}` : undefined}
          aria-labelledby={accessibleLabel ? undefined : `${labelId} ${valueId}`}
          aria-describedby={descriptionId}
          aria-haspopup="dialog"
          aria-controls={popoverId}
          aria-expanded={isOpen}
          title={displayValue}
          data-balsa-color-picker-trigger=""
          className={mergeClasses(
            "shrink-0 transition-[border-color,box-shadow,opacity] focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring",
            type === "palette"
              ? ["h-full w-full rounded-none border", triggerVariantClasses[variant]]
              : [
                  "relative border",
                  roundedClasses[rounded],
                  fieldSizeClasses[size],
                  triggerVariantClasses[variant],
                ],
            disabled
              ? "cursor-not-allowed border-balsa-disabled opacity-70"
              : "cursor-pointer border-balsa-border-strong hover:border-balsa-focus-ring",
            className,
          )}
          style={{ backgroundColor: colorValue, ...style }}
          onClick={() => {
            if (isOpen) {
              closePicker();
              return;
            }
            openPicker();
          }}
        >
          {isFieldLabelInside ? (
            <span
              id={labelId}
              className={mergeClasses(
                "pointer-events-none absolute inset-1 flex items-center justify-center overflow-hidden px-balsa-3xs text-center font-medium leading-tight",
                fieldTagSizeClasses[size],
              )}
              style={{ color: tagColor }}
            >
              {label}
            </span>
          ) : null}
          <span className="sr-only">Choose {label} color</span>
        </button>
        <output id={valueId} className="sr-only">{displayValue}</output>
        {name ? <input type="hidden" name={name} value={colorValue} /> : null}
        {description ? (
          <span id={descriptionId} className="sr-only">{description}</span>
        ) : null}
        {portalHost ? createPortal(panel, portalHost) : panel}
      </div>
    </BalsaThemeContext.Provider>
  );
}
