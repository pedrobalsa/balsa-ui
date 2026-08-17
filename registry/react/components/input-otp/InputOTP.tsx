import { LoaderCircle } from "lucide-react";
import {
  Fragment,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { mergeClasses } from "./classes";
import {
  fieldHintClasses,
  fieldLabelClasses,
  fieldStatusMessages,
  getFieldStateColorClass,
  getFieldStatusIcon,
  roundedClasses,
  type FieldSize,
  type FieldStatus,
  type FieldVariant,
  type Rounded,
} from "./form";
import { Icon } from "./Icon";
import type { ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";
import type { SemanticColor } from "./types";

export type InputOTPMode = "numeric" | "alphanumeric";
export type InputOTPVariant = FieldVariant | "solid";

export interface InputOTPCellSlot {
  index: number;
  value: string;
  active: boolean;
}

export interface InputOTPProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "size" | "color" | "children"
> {
  id: string;
  label: string;
  length?: number;
  mode?: InputOTPMode;
  fluid?: boolean;
  mask?: boolean;
  grouped?: boolean;
  separatorEvery?: number;
  separator?: string;
  size?: FieldSize;
  variant?: InputOTPVariant;
  color?: SemanticColor;
  rounded?: Rounded;
  hint?: string;
  loading?: boolean;
  status?: FieldStatus;
  statusMessage?: string;
  theme?: ThemeInput;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  cell?: (slot: InputOTPCellSlot) => ReactNode;
}

const cellVariantClasses: Readonly<Record<InputOTPVariant, string>> = {
  outline: "bg-balsa-background",
  surface: "bg-balsa-input",
  soft: "",
  solid: "",
  glass: "backdrop-balsa",
};
const cellColorClasses: Readonly<Record<SemanticColor, Record<InputOTPVariant, string>>> = {
  primary: {
    outline: "border-balsa-primary text-balsa-primary",
    surface: "border-balsa-primary/30",
    soft: "border-transparent bg-balsa-primary/15 text-balsa-primary",
    solid: "border-balsa-primary bg-balsa-primary text-balsa-primary-foreground",
    glass: "border-balsa-primary/40 bg-balsa-primary/10 text-balsa-primary",
  },
  secondary: {
    outline: "border-balsa-secondary text-balsa-secondary",
    surface: "border-balsa-secondary/30",
    soft: "border-transparent bg-balsa-secondary/15 text-balsa-secondary",
    solid: "border-balsa-secondary bg-balsa-secondary text-balsa-secondary-foreground",
    glass: "border-balsa-secondary/40 bg-balsa-secondary/10 text-balsa-secondary",
  },
  accent: {
    outline: "border-balsa-accent text-balsa-accent",
    surface: "border-balsa-accent/30",
    soft: "border-transparent bg-balsa-accent/15 text-balsa-accent",
    solid: "border-balsa-accent bg-balsa-accent text-balsa-accent-foreground",
    glass: "border-balsa-accent/40 bg-balsa-accent/10 text-balsa-accent",
  },
  destructive: {
    outline: "border-balsa-destructive text-balsa-destructive",
    surface: "border-balsa-destructive/30",
    soft: "border-transparent bg-balsa-destructive/15 text-balsa-destructive",
    solid: "border-balsa-destructive bg-balsa-destructive text-balsa-destructive-foreground",
    glass: "border-balsa-destructive/40 bg-balsa-destructive/10 text-balsa-destructive",
  },
  success: {
    outline: "border-balsa-success text-balsa-success",
    surface: "border-balsa-success/30",
    soft: "border-transparent bg-balsa-success/15 text-balsa-success",
    solid: "border-balsa-success bg-balsa-success text-balsa-success-foreground",
    glass: "border-balsa-success/40 bg-balsa-success/10 text-balsa-success",
  },
  warning: {
    outline: "border-balsa-warning text-balsa-warning",
    surface: "border-balsa-warning/30",
    soft: "border-transparent bg-balsa-warning/15 text-balsa-warning",
    solid: "border-balsa-warning bg-balsa-warning text-balsa-warning-foreground",
    glass: "border-balsa-warning/40 bg-balsa-warning/10 text-balsa-warning",
  },
  info: {
    outline: "border-balsa-info text-balsa-info",
    surface: "border-balsa-info/30",
    soft: "border-transparent bg-balsa-info/15 text-balsa-info",
    solid: "border-balsa-info bg-balsa-info text-balsa-info-foreground",
    glass: "border-balsa-info/40 bg-balsa-info/10 text-balsa-info",
  },
};

export function InputOTP(rawProps: InputOTPProps) {
  const { props, theme } = useResolvedThemeProps("input-otp", "fields", rawProps, {
    size: "md",
    variant: "surface",
    rounded: "lg",
  } as const);
  const {
    id,
    label,
    length = 6,
    mode = "numeric",
    fluid = false,
    mask = false,
    grouped = false,
    separatorEvery = 0,
    separator = "–",
    size,
    variant,
    color = "primary",
    rounded,
    hint,
    disabled = false,
    loading = false,
    status = "default",
    statusMessage,
    required = false,
    name,
    autoComplete = "one-time-code",
    theme: _themeInput,
    value,
    defaultValue = "",
    onValueChange,
    onComplete,
    cell: renderCell,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const [current, setValue] = useControllableState<string>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const inputElement = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [caret, setCaret] = useState(0);

  const safeLength = Number.isFinite(length)
    ? Math.max(4, Math.min(10, Math.floor(length)))
    : 6;
  const safeSeparatorEvery = Number.isFinite(separatorEvery)
    ? Math.max(0, Math.floor(separatorEvery))
    : 0;
  const effectiveSeparatorEvery = safeSeparatorEvery > 0
    ? safeSeparatorEvery
    : grouped ? 3 : 0;

  function normalize(next: string): string {
    const filtered = mode === "numeric"
      ? next.replace(/\D/g, "")
      : next.replace(/[^a-z0-9]/gi, "");
    return filtered.slice(0, safeLength);
  }

  const displayed = normalize(current);
  const isDisabled = disabled || loading;
  const hintId = hint ? `${id}-hint` : undefined;
  const statusId = status === "unvalidated" ? `${id}-status` : undefined;
  const describedBy = [hintId, statusId].filter(Boolean).join(" ") || undefined;
  const effectiveStatusMessage = status === "unvalidated"
    ? statusMessage ?? fieldStatusMessages.unvalidated
    : undefined;
  const stateIcon = loading ? LoaderCircle : getFieldStatusIcon(status);
  const caretIndex = Math.min(caret, displayed.length);
  const activeIndex = Math.min(caretIndex, safeLength - 1);

  const groupClasses = mergeClasses(
    "relative flex max-w-full items-center gap-balsa-xs p-balsa-3xs",
    fluid ? "w-full" : "overflow-x-auto",
    isDisabled
      ? loading ? "cursor-progress" : "cursor-not-allowed"
      : "cursor-text",
    className,
  );
  const cellClasses = mergeClasses(
    "flex items-center justify-center font-balsa-body font-semibold tabular-nums transition-[border-color,box-shadow,opacity]",
    fluid ? "aspect-square min-w-0 flex-1" : "shrink-0",
    cellVariantClasses[variant],
    cellColorClasses[color][variant],
    fluid
      ? size === "sm" ? "text-base" : "text-lg"
      : size === "sm" ? "size-10 text-base" : "size-12 text-lg",
    roundedClasses[rounded],
    status === "validated"
      ? "border-balsa-success"
      : status === "unvalidated"
        ? "border-balsa-destructive"
        : "",
    isDisabled ? "bg-balsa-disabled text-balsa-disabled-foreground" : "",
  );
  const activeCellClasses = status === "unvalidated"
    ? "border-balsa-destructive ring-2 ring-balsa-destructive/30"
    : status === "validated"
      ? "border-balsa-success ring-2 ring-balsa-success/30"
      : "border-balsa-focus-ring ring-2 ring-balsa-focus-ring/30";
  const stateIconClasses = mergeClasses(
    "shrink-0",
    loading ? "animate-spin text-balsa-info" : getFieldStateColorClass(status),
  );

  const cells = Array.from({ length: safeLength }, (_, index) => ({
    index,
    value: displayed[index] ?? "",
    separatorAfter:
      effectiveSeparatorEvery > 0
      && (index + 1) % effectiveSeparatorEvery === 0
      && index < safeLength - 1,
  }));

  function handleInput(event: ChangeEvent<HTMLInputElement>): void {
    const next = normalize(event.currentTarget.value);
    setValue(next);
    setCaret(event.currentTarget.selectionStart ?? next.length);
    if (next.length === safeLength) onComplete?.(next);
  }

  function handleKeydown(event: KeyboardEvent<HTMLInputElement>): void {
    const input = inputElement.current;
    if (!input) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      const next = Math.max(0, Math.min(displayed.length, caretIndex + direction));
      input.setSelectionRange(next, next);
      setCaret(next);
    }
  }

  function updateCaret(): void {
    setCaret(inputElement.current?.selectionStart ?? displayed.length);
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        data-balsa="input-otp"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-size={size}
        data-variant={variant}
        data-color={color}
        data-grouped={effectiveSeparatorEvery > 0 ? "true" : undefined}
        data-rounded={rounded}
        data-status={status}
        style={theme.explicitPresentation?.style as CSSProperties | undefined}
      >
        <label htmlFor={id} className={fieldLabelClasses}>
          {label}
          {required ? <span className="text-balsa-primary" aria-hidden="true">*</span> : null}
        </label>
        <div className={groupClasses} onClick={() => inputElement.current?.focus()}>
          <input
            {...domProps}
            ref={inputElement}
            id={id}
            data-balsa-control=""
            className="absolute inset-0 z-10 size-full cursor-inherit opacity-0"
            name={name}
            value={displayed}
            maxLength={safeLength}
            inputMode={mode === "numeric" ? "numeric" : "text"}
            pattern={mode === "numeric" ? "[0-9]*" : undefined}
            autoComplete={autoComplete}
            disabled={isDisabled}
            required={required}
            aria-busy={loading || undefined}
            aria-invalid={status === "unvalidated" || undefined}
            aria-describedby={describedBy}
            style={style}
            onChange={handleInput}
            onKeyDown={handleKeydown}
            onSelect={updateCaret}
            onFocus={() => {
              setFocused(true);
              updateCaret();
            }}
            onBlur={() => {
              setFocused(false);
            }}
          />
          {cells.map((entry) => {
            const active = focused && entry.index === activeIndex;
            const content = renderCell
              ? renderCell({ index: entry.index, value: entry.value, active })
              : mask && entry.value ? "•" : entry.value;
            return (
              <Fragment key={entry.index}>
                <span
                  data-balsa="input-otp-cell"
                  data-active={String(active)}
                  className={mergeClasses(cellClasses, active ? activeCellClasses : "")}
                  aria-hidden="true"
                >
                  {content}
                </span>
                {entry.separatorAfter ? (
                  <span className="shrink-0 text-balsa-muted-foreground" aria-hidden="true">
                    {separator}
                  </span>
                ) : null}
              </Fragment>
            );
          })}
          {stateIcon ? <Icon icon={stateIcon} size="md" className={stateIconClasses} /> : null}
        </div>
        {hint ? <span id={hintId} className={fieldHintClasses}>{hint}</span> : null}
        {effectiveStatusMessage ? (
          <span
            id={statusId}
            role="alert"
            className="mt-balsa-xs block text-sm font-medium text-balsa-destructive"
          >
            {effectiveStatusMessage}
          </span>
        ) : null}
      </div>
    </BalsaThemeContext.Provider>
  );
}
