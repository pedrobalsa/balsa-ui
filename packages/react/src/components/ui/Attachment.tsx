import { File as FileIcon, Paperclip, X } from "lucide-react";
import {
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type HTMLAttributes,
} from "react";
import { Button } from "./Button";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import { Icon } from "./Icon";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";

export interface AttachmentRejection {
  file: File;
  reason: "type" | "size" | "count";
  message: string;
}
export type AttachmentStatus = "default" | "unvalidated";
export type AttachmentSize = "sm" | "md" | "lg";

export interface AttachmentProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  id: string;
  label: string;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  status?: AttachmentStatus;
  statusMessage?: string;
  hint?: string;
  size?: AttachmentSize;
  rounded?: Rounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  value?: readonly File[];
  defaultValue?: readonly File[];
  onValueChange?: (value: readonly File[]) => void;
  onReject?: (rejections: readonly AttachmentRejection[]) => void;
  onRemove?: (file: File) => void;
}

const sizeClasses: Readonly<Record<AttachmentSize, string>> = {
  sm: "min-h-20 p-balsa-md text-sm",
  md: "min-h-24 p-balsa-lg text-sm",
  lg: "min-h-32 p-balsa-xl text-sm",
};

export function Attachment(rawProps: AttachmentProps) {
  const { props, theme } = useResolvedThemeProps("attachment", "fields", rawProps, {
    size: "md",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    multiple = false,
    accept,
    maxSize = Number.POSITIVE_INFINITY,
    maxFiles = Number.POSITIVE_INFINITY,
    required = false,
    disabled = false,
    loading = false,
    status = "default",
    statusMessage = "Choose a valid file.",
    hint,
    size,
    rounded,
    shadow,
    theme: _themeInput,
    value,
    defaultValue = [],
    onValueChange,
    onReject,
    onRemove,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const [current, setFiles] = useControllableState<readonly File[]>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const input = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");

  const describedBy = [
    hint ? `${id}-hint` : "",
    status === "unvalidated" || localError ? `${id}-error` : "",
  ].filter(Boolean).join(" ") || undefined;

  const classes = mergeClasses("space-y-balsa-md", className);
  const dropClasses = mergeClasses(
    "flex cursor-pointer flex-col items-center justify-center border border-dashed border-balsa-input-border bg-balsa-input text-center text-balsa-input-foreground transition-colors hover:border-balsa-primary focus-within:ring-2 focus-within:ring-balsa-focus-ring",
    sizeClasses[size],
    roundedClasses[rounded],
    dragging && "border-balsa-primary bg-balsa-selected text-balsa-selected-foreground",
    (disabled || loading) && "cursor-not-allowed opacity-55",
    (status === "unvalidated" || localError) && "border-balsa-destructive",
  );

  function accepted(file: File): boolean {
    if (!accept) return true;
    return accept.split(",").map((rule) => rule.trim()).some((rule) =>
      rule.startsWith(".")
        ? file.name.toLowerCase().endsWith(rule.toLowerCase())
        : rule.endsWith("/*")
          ? file.type.startsWith(rule.slice(0, -1))
          : file.type === rule,
    );
  }

  function addFiles(files: readonly File[]): void {
    if (disabled || loading) return;
    const base = multiple ? [...current] : [];
    const rejections: AttachmentRejection[] = [];
    for (const file of files) {
      if (!accepted(file)) rejections.push({ file, reason: "type", message: `${file.name} has an unsupported type.` });
      else if (file.size > maxSize) rejections.push({ file, reason: "size", message: `${file.name} is too large.` });
      else if (base.length >= maxFiles || (!multiple && base.length >= 1)) rejections.push({ file, reason: "count", message: `${file.name} exceeds the file limit.` });
      else base.push(file);
    }
    setLocalError(rejections[0]?.message ?? "");
    if (rejections.length) onReject?.(rejections);
    setFiles(base);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>): void {
    addFiles([...(event.target.files ?? [])]);
    if (input.current) input.current.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    setDragging(false);
    addFiles([...(event.dataTransfer?.files ?? [])]);
  }

  function remove(file: File): void {
    setFiles(current.filter((candidate) => candidate !== file));
    onRemove?.(file);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="attachment"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-status={status}
        data-shadow={shadow}
        className={classes}
        style={
          {
            ...style,
            ...theme.explicitPresentation?.style,
          } as CSSProperties
        }
      >
        <label htmlFor={id} className="block font-balsa-body text-sm font-medium text-balsa-foreground">
          {label} {required ? <span className="text-balsa-destructive" aria-hidden="true">*</span> : null}
        </label>
        <label
          htmlFor={id}
          className={dropClasses}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            handleDrop(event);
          }}
        >
          <Icon icon={Paperclip} size="lg" className="mb-balsa-xs text-balsa-primary" />
          <span className="text-sm font-medium">Choose files or drop them here</span>
          {accept ? <span className="mt-balsa-3xs text-xs text-balsa-muted-foreground">{accept}</span> : null}
          <input
            id={id}
            ref={input}
            type="file"
            className="sr-only"
            multiple={multiple}
            accept={accept}
            required={required && current.length === 0}
            disabled={disabled || loading}
            aria-busy={loading}
            aria-invalid={status === "unvalidated" || Boolean(localError)}
            aria-describedby={describedBy}
            onChange={handleInput}
          />
        </label>
        {current.length ? (
          <ul className="space-y-balsa-xs" aria-label="Selected files">
            {current.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-balsa-md rounded-balsa-control border border-balsa-border bg-balsa-surface p-balsa-md"
              >
                <Icon icon={FileIcon} size="md" className="text-balsa-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-balsa-muted-foreground">{formatSize(file.size)}</span>
                </span>
                <Button
                  shape="fab"
                  size="sm"
                  variant="outline"
                  color="destructive"
                  prefixIcon={X}
                  aria-label={`Remove ${file.name}`}
                  disabled={disabled || loading}
                  onClick={() => remove(file)}
                />
              </li>
            ))}
          </ul>
        ) : null}
        {hint ? <p id={`${id}-hint`} className="text-xs text-balsa-muted-foreground">{hint}</p> : null}
        {status === "unvalidated" || localError ? (
          <p id={`${id}-error`} className="text-sm font-medium text-balsa-destructive" role="alert">
            {localError || statusMessage}
          </p>
        ) : null}
      </div>
    </BalsaThemeContext.Provider>
  );
}
