import { Check, LoaderCircle, Search, X } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useBalsaPortalScope } from "./BalsaPortalScope";
import { Button } from "./Button";
import { mergeClasses } from "./classes";
import {
  fieldHintClasses,
  fieldLabelClasses,
  fieldStatusMessages,
  getAnchoredPopupPosition,
  getFieldStateColorClass,
  getFieldStatusIcon,
  getTextControlClasses,
  getTextControlPopupClasses,
  textControlOptionClasses,
  type FieldSize,
  type FieldStatus,
  type FieldVariant,
  type Rounded,
} from "./form";
import { Icon } from "./Icon";
import {
  capturePortalPresentation,
  type PortalPresentationSnapshot,
} from "./portal-core";
import type { Shadow, ThemeInput, ThemePresentation } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";

export type AutocompleteModelValue = string | readonly string[];

export interface AutocompleteProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "children" | "title" | "id" | "value" | "defaultValue" | "size"
  > {
  id: string;
  label: string;
  suggestions: readonly string[];
  "data-balsa"?: string;
  "data-palette"?: string;
  size?: FieldSize;
  variant?: FieldVariant;
  hint?: string;
  loading?: boolean;
  status?: FieldStatus;
  statusMessage?: string;
  multiple?: boolean;
  defaultOpen?: boolean;
  rounded?: Rounded;
  shadow?: Shadow;
  contained?: boolean;
  theme?: ThemeInput;
  value?: AutocompleteModelValue;
  defaultValue?: AutocompleteModelValue;
  onValueChange?: (value: AutocompleteModelValue) => void;
}

/* `:popover-open` is a selector an engine can fail to parse rather than simply
 * not match, and `matches` throws when it does. A list that cannot answer the
 * question is treated as not in the top layer. */
function isPopoverOpen(element: HTMLElement | null): boolean {
  try {
    return element?.matches(":popover-open") ?? false;
  } catch {
    return false;
  }
}

export function Autocomplete(rawProps: AutocompleteProps) {
  const { props, theme } = useResolvedThemeProps("autocomplete", "fields", rawProps, {
    size: "md",
    variant: "surface",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    suggestions,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    size,
    variant,
    placeholder,
    hint,
    disabled = false,
    loading = false,
    status = "default",
    statusMessage,
    required = false,
    multiple = false,
    defaultOpen = false,
    rounded,
    shadow,
    contained = false,
    theme: themeInput,
    value,
    defaultValue,
    onValueChange,
    className,
    style,
    ...domProps
  } = props;
  void _dataBalsa;

  const [model, setModel] = useControllableState<AutocompleteModelValue>({
    value,
    defaultValue: defaultValue ?? (multiple ? [] : ""),
    onChange: onValueChange,
  });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [supportsPopover, setSupportsPopover] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [query, setQuery] = useState("");
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0, width: 0 });
  const [portalSnapshot, setPortalSnapshot] = useState<PortalPresentationSnapshot | null>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const menuId = `${id}-suggestions`;
  const hintId = hint ? `${id}-hint` : undefined;
  const statusId = status === "unvalidated" ? `${id}-status` : undefined;
  const describedBy = [hintId, statusId].filter(Boolean).join(" ") || undefined;
  const isDisabled = disabled || loading;
  const selectedValues: readonly string[] = multiple && Array.isArray(model) ? model : [];
  const inputValue = multiple ? query : typeof model === "string" ? model : "";
  const normalizedQuery = inputValue.trim().toLocaleLowerCase();
  const filteredSuggestions = normalizedQuery
    ? suggestions.filter((suggestion) =>
        suggestion.toLocaleLowerCase().includes(normalizedQuery))
    : suggestions;

  /* Vue clamps the active index through a watcher on the filtered list. Deriving
   * it during render instead keeps a narrowing filter from writing state in a
   * layout effect, which is the loop this component would otherwise invite. */
  const activeIndex = isOpen
    ? filteredSuggestions.length === 0
      ? -1
      : activeSuggestionIndex < 0 || activeSuggestionIndex >= filteredSuggestions.length
        ? 0
        : activeSuggestionIndex
    : activeSuggestionIndex;
  const hasVisibleSuggestions = isOpen && filteredSuggestions.length > 0;
  const activeDescendant =
    activeIndex >= 0 && activeIndex < filteredSuggestions.length
      ? `${id}-suggestion-${activeIndex}`
      : undefined;
  const effectiveStatusMessage = status === "unvalidated"
    ? statusMessage ?? fieldStatusMessages[status]
    : undefined;
  const stateIcon = (loading ? LoaderCircle : getFieldStatusIcon(status)) ?? Search;

  const scope = useBalsaPortalScope();
  const floating = mounted && supportsPopover && !contained;
  const portalHost = contained || !mounted ? null : (scope?.host ?? document.body);
  const visibleRef = useRef(hasVisibleSuggestions);
  visibleRef.current = hasVisibleSuggestions;
  const openRef = useRef(isOpen);
  openRef.current = isOpen;

  function isSuggestionSelected(suggestion: string): boolean {
    return multiple ? selectedValues.includes(suggestion) : suggestion === model;
  }

  function positionMenu(): void {
    const inputElement = inputRef.current;
    const menuElement = menuRef.current;
    if (!visibleRef.current || !inputElement || !menuElement) return;

    const next = getAnchoredPopupPosition(inputElement, menuElement);
    setMenuPosition((current) => (
      current.left === next.left && current.top === next.top && current.width === next.width
        ? current
        : next
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

  function openMenu(): void {
    if (isDisabled) return;
    setIsOpen(true);
  }

  function closeMenu(): void {
    setIsOpen(false);
  }

  function selectSuggestion(suggestion: string): void {
    if (multiple) {
      setModel(
        isSuggestionSelected(suggestion)
          ? selectedValues.filter((entry) => entry !== suggestion)
          : [...selectedValues, suggestion],
      );
      setQuery("");
      setActiveSuggestionIndex(0);
      openMenu();
      queueMicrotask(() => inputRef.current?.focus());
      return;
    }

    setModel(suggestion);
    closeMenu();
    queueMicrotask(() => inputRef.current?.focus());
  }

  function removeSuggestion(suggestion: string): void {
    if (!multiple) return;
    setModel(selectedValues.filter((entry) => entry !== suggestion));
    queueMicrotask(() => inputRef.current?.focus());
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>): void {
    const nextValue = event.currentTarget.value;
    if (multiple) setQuery(nextValue);
    else setModel(nextValue);
    setActiveSuggestionIndex(0);
    openMenu();
  }

  function handleKeydown(event: KeyboardEvent<HTMLInputElement>): void {
    if (multiple && event.key === "Backspace" && !query && selectedValues.length) {
      event.preventDefault();
      removeSuggestion(selectedValues.at(-1) ?? "");
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (!filteredSuggestions.length) return;

      if (!isOpen) {
        openMenu();
        return;
      }

      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveSuggestionIndex(
        (activeIndex + step + filteredSuggestions.length) % filteredSuggestions.length,
      );
    }

    if (event.key === "Enter" && isOpen) {
      const suggestion = filteredSuggestions[activeIndex];

      if (suggestion) {
        event.preventDefault();
        selectSuggestion(suggestion);
      }
    }

    if (event.key === "Escape" || event.key === "Tab") {
      closeMenu();
    }
  }

  useLayoutEffect(() => {
    setMounted(true);
    setSupportsPopover(
      typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype,
    );
    if (defaultOpen) setIsOpen(true);
  }, []);

  useLayoutEffect(() => {
    if (isDisabled && isOpen) closeMenu();
  }, [isDisabled, isOpen]);

  useLayoutEffect(() => {
    if (!hasVisibleSuggestions) return;
    capturePresentation();
    positionMenu();
  }, [hasVisibleSuggestions, floating, contained, filteredSuggestions.length]);

  /* The top layer is not something React renders into, so the popover has to be
   * opened imperatively once the element for this state is in the DOM. */
  useLayoutEffect(() => {
    const menuElement = menuRef.current;
    if (!floating || !menuElement) return;

    try {
      if (hasVisibleSuggestions && !isPopoverOpen(menuElement)) {
        menuElement.showPopover();
      } else if (!hasVisibleSuggestions && isPopoverOpen(menuElement)) {
        menuElement.hidePopover();
      }
    } catch {
      /* A browser that reports support but refuses the call keeps the inline
       * fallback positioning rather than losing the list entirely. */
    }
  }, [hasVisibleSuggestions, floating]);

  useLayoutEffect(() => {
    if (!mounted) return;

    function handleDocumentPointerDown(event: PointerEvent): void {
      if (!openRef.current) return;
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      closeMenu();
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    window.addEventListener("resize", positionMenu, { passive: true });
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
    };
  }, [mounted, contained]);

  const listPresentation = portalSnapshot ?? {
    themeId: theme.presentation.id,
    themeBase: theme.presentation.base,
    paletteId: dataPalette,
    style: Object.fromEntries(
      Object.entries(theme.presentation.style).filter(([property]) => property.startsWith("--balsa-")),
    ) as PortalPresentationSnapshot["style"],
  };
  const menuClasses = mergeClasses(
    getTextControlPopupClasses(rounded, variant),
    floating ? "fixed z-[70] m-0" : "absolute left-0 right-0 z-30 mt-balsa-xs",
    hasVisibleSuggestions
      ? ["visible", "translate-y-0", "opacity-100"]
      : ["pointer-events-none", "invisible", "-translate-y-1", "opacity-0"],
  );
  const menuStyle = {
    ...(floating
      ? {
          left: `${menuPosition.left}px`,
          top: `${menuPosition.top}px`,
          width: `${menuPosition.width}px`,
        }
      : undefined),
    ...listPresentation.style,
  } as CSSProperties;

  const list = (
    <div
      id={menuId}
      ref={menuRef}
      data-balsa="autocomplete-popover"
      data-theme={listPresentation.themeId}
      data-theme-base={listPresentation.themeBase}
      data-palette={dataPalette ?? listPresentation.paletteId}
      data-shadow={shadow}
      data-state={hasVisibleSuggestions ? "open" : "closed"}
      popover={floating ? "manual" : undefined}
      role="listbox"
      aria-multiselectable={multiple || undefined}
      className={menuClasses}
      style={menuStyle}
      onToggle={() => {
        if (!isPopoverOpen(menuRef.current)) closeMenu();
      }}
    >
      {filteredSuggestions.map((suggestion, index) => {
        const selected = isSuggestionSelected(suggestion);
        const active = index === activeIndex;

        return (
          <button
            key={`${suggestion}-${index}`}
            id={`${id}-suggestion-${index}`}
            type="button"
            role="option"
            aria-selected={selected}
            className={mergeClasses(
              textControlOptionClasses,
              selected
                ? "cursor-pointer bg-balsa-selected text-balsa-selected-foreground"
                : [
                    "cursor-pointer text-balsa-surface-elevated-foreground",
                    active ? "bg-balsa-muted" : "",
                  ],
            )}
            onPointerEnter={() => setActiveSuggestionIndex(index)}
            onClick={() => selectSuggestion(suggestion)}
          >
            <span>{suggestion}</span>
            {selected ? <Icon icon={Check} size="md" /> : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        ref={rootRef}
        data-balsa="autocomplete"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-rounded={rounded}
        data-variant={variant}
        style={theme.explicitPresentation?.style as CSSProperties | undefined}
      >
        <label htmlFor={id} className={fieldLabelClasses}>
          {label}
          {required ? <span className="text-balsa-primary" aria-hidden="true">*</span> : null}
        </label>
        <div className="relative">
          <input
            {...domProps}
            id={id}
            ref={inputRef}
            value={inputValue}
            placeholder={placeholder}
            disabled={isDisabled}
            required={required}
            aria-busy={loading ? true : undefined}
            aria-invalid={status === "unvalidated" ? true : undefined}
            aria-describedby={describedBy}
            aria-expanded={hasVisibleSuggestions}
            aria-controls={menuId}
            aria-activedescendant={activeDescendant}
            aria-autocomplete="list"
            autoComplete="off"
            role="combobox"
            data-balsa-control=""
            className={mergeClasses(
              getTextControlClasses(status, true, disabled, loading, size, rounded, variant),
              className,
            )}
            style={style}
            onChange={handleInput}
            onFocus={openMenu}
            onKeyDown={handleKeydown}
          />
          {portalHost ? createPortal(list, portalHost) : list}
          <Icon
            icon={stateIcon}
            size="md"
            className={mergeClasses(
              "pointer-events-none absolute top-1/2 -translate-y-1/2",
              size === "sm" ? "right-3 text-base" : "right-4 text-lg",
              loading ? "text-balsa-info" : getFieldStateColorClass(status),
              loading ? "animate-spin" : "",
            )}
          />
        </div>
        {multiple && selectedValues.length ? (
          <div
            className="mt-balsa-xs flex flex-wrap gap-balsa-3xs"
            aria-label="Selected suggestions"
          >
            {selectedValues.map((suggestion) => (
              <Button
                key={suggestion}
                size={null}
                theme={themeInput}
                variant="outline"
                suffixIcon={X}
                className="h-7 max-w-full gap-balsa-3xs px-balsa-xs text-xs"
                aria-label={`Remove ${suggestion}`}
                onClick={() => removeSuggestion(suggestion)}
              >
                <span className="truncate">{suggestion}</span>
              </Button>
            ))}
          </div>
        ) : null}
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
