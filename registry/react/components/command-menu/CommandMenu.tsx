import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import type { LayerVariant } from "./anchored-layer";
import { mergeClasses } from "./classes";
import { CommandList } from "./CommandList";
import type { CommandGroup, CommandItem } from "./command";
import type { Rounded } from "./form";
import { Modal } from "./Modal";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";

export type CommandMenuMode = "inline" | "dialog";
export type CommandMenuSize = "sm" | "md" | "lg";

export interface CommandMenuProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "id" | "title" | "onSelect"> {
  id: string;
  label: string;
  groups: readonly CommandGroup[];
  "data-balsa"?: string;
  "data-palette"?: string;
  mode?: CommandMenuMode;
  title?: string;
  description?: string;
  placeholder?: string;
  loading?: boolean;
  variant?: LayerVariant;
  size?: CommandMenuSize;
  rounded?: Rounded;
  shadow?: Shadow;
  hotkey?: string;
  contained?: boolean;
  theme?: ThemeInput;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSelect?: (item: CommandItem) => void;
  emptyContent?: ReactNode;
  loadingContent?: ReactNode;
}

const inlineSizeClasses: Readonly<Record<CommandMenuSize, string>> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
};

export function CommandMenu(rawProps: CommandMenuProps) {
  const { props, theme } = useResolvedThemeProps("command-menu", "overlays", rawProps, {
    variant: "surface",
    size: "lg",
    rounded: "xl",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    groups,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    mode = "inline",
    title = "Command menu",
    description,
    placeholder = "Search commands",
    loading = false,
    variant,
    size,
    rounded,
    shadow,
    hotkey = "k",
    contained = false,
    theme: themeInput,
    open,
    defaultOpen = false,
    onOpenChange,
    value,
    defaultValue = "",
    onValueChange,
    onSelect,
    emptyContent,
    loadingContent,
    className,
    style,
    ...domProps
  } = props;
  void _dataBalsa;
  const [currentOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [query, setQuery] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const openRef = useRef(currentOpen);
  openRef.current = currentOpen;

  function select(item: CommandItem): void {
    onSelect?.(item);
    setOpen(false);
  }

  useLayoutEffect(() => {
    function handleGlobalKeydown(event: KeyboardEvent): void {
      if (
        mode !== "dialog"
        || event.key.toLocaleLowerCase() !== hotkey.toLocaleLowerCase()
        || !(event.metaKey || event.ctrlKey)
      ) return;
      event.preventDefault();
      setOpen(!openRef.current);
    }

    document.addEventListener("keydown", handleGlobalKeydown);
    return () => document.removeEventListener("keydown", handleGlobalKeydown);
  }, [mode, hotkey]);

  const list = (
    <CommandList
      id={`${id}-commands`}
      label={label}
      groups={groups}
      data-palette={dataPalette}
      placeholder={placeholder}
      loading={loading}
      variant={variant}
      rounded={rounded}
      shadow={mode === "dialog" ? "none" : shadow}
      value={query}
      onValueChange={setQuery}
      open={mode === "dialog" ? true : currentOpen}
      dropdown={mode === "inline"}
      contained={contained}
      onOpenChange={mode === "inline" ? setOpen : undefined}
      onSelect={select}
      onEscape={() => setOpen(false)}
      emptyContent={emptyContent}
      loadingContent={loadingContent}
    />
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="command-menu"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-mode={mode}
        data-size={size}
        style={theme.explicitPresentation?.style as CSSProperties | undefined}
      >
        {mode === "dialog" ? (
          <Modal
            id={id}
            title={title}
            description={description}
            variant={variant}
            rounded={rounded}
            shadow={shadow}
            contained={contained}
            theme={themeInput}
            size={size}
            open={currentOpen}
            onOpenChange={setOpen}
            data-palette={dataPalette}
          >
            {list}
          </Modal>
        ) : (
          <div
            className={mergeClasses("w-full", inlineSizeClasses[size], className)}
            data-shadow={shadow}
            style={style}
          >
            {list}
          </div>
        )}
      </div>
    </BalsaThemeContext.Provider>
  );
}
