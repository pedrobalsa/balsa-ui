import {
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useRef,
} from "react";
import { mergeClasses } from "./classes";
import {
  Collapsible,
  type CollapsibleHeadingLevel,
  type CollapsibleSize,
  type CollapsibleVariant,
} from "./Collapsible";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";

export interface AccordionItem {
  id: string;
  title: string;
  content?: string;
  disabled?: boolean;
}

export type AccordionType = "single" | "multiple";
export type AccordionValue = string | readonly string[];

export interface AccordionProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  id: string;
  items: readonly AccordionItem[];
  type?: AccordionType;
  collapsible?: boolean;
  label?: string;
  variant?: CollapsibleVariant;
  size?: CollapsibleSize;
  rounded?: Rounded;
  shadow?: Shadow;
  headingLevel?: CollapsibleHeadingLevel;
  disabled?: boolean;
  theme?: ThemeInput;
  value: AccordionValue;
  onValueChange: (value: AccordionValue) => void;
  panels?: Readonly<Record<string, ReactNode>>;
}

const variantClasses: Readonly<Record<CollapsibleVariant, string[]>> = {
  underline: ["border-0", "bg-transparent", "text-balsa-foreground"],
  surface: ["border-balsa-border", "bg-balsa-surface", "text-balsa-surface-foreground"],
  outline: ["border-balsa-border-strong", "bg-transparent", "text-balsa-foreground"],
  soft: ["border-balsa-primary/20", "bg-balsa-primary/5", "text-balsa-foreground"],
  glass: [
    "border-balsa-border/70",
    "bg-balsa-surface/60",
    "text-balsa-foreground",
    "backdrop-balsa",
  ],
};

export function Accordion(rawProps: AccordionProps) {
  const { props, theme } = useResolvedThemeProps("accordion", "surfaces", rawProps, {
    variant: "surface",
    size: "md",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    items,
    type = "single",
    collapsible = true,
    label = "Accordion",
    variant,
    size,
    rounded,
    shadow,
    headingLevel = 3,
    disabled = false,
    theme: _themeInput,
    value,
    onValueChange,
    panels,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const rootElement = useRef<HTMLDivElement | null>(null);

  function itemIsDisabled(item: AccordionItem): boolean {
    return disabled || item.disabled === true;
  }

  function isOpen(itemId: string): boolean {
    return Array.isArray(value) ? value.includes(itemId) : value === itemId;
  }

  function updateItem(itemId: string, open: boolean): void {
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item || itemIsDisabled(item)) return;

    if (type === "multiple") {
      const current = Array.isArray(value) ? [...value] : [];
      onValueChange(
        open
          ? [...new Set([...current, itemId])]
          : current.filter((entry) => entry !== itemId),
      );
      return;
    }

    if (open) {
      onValueChange(itemId);
    } else if (collapsible) {
      onValueChange("");
    }
  }

  function itemClasses(index: number): string {
    return mergeClasses(
      "rounded-none border-0 bg-transparent",
      variant === "underline" || index === 0
        ? ""
        : "border-t-(length:--balsa-border-width) border-balsa-border/80",
    );
  }

  function enabledTriggers(): HTMLButtonElement[] {
    return Array.from(
      rootElement.current?.querySelectorAll<HTMLButtonElement>(
        '[data-balsa="collapsible-trigger"]:not(:disabled)',
      ) ?? [],
    );
  }

  function moveFocus(
    current: HTMLButtonElement,
    target: "next" | "previous" | "first" | "last",
  ): void {
    const triggers = enabledTriggers();
    if (triggers.length === 0) return;
    const currentIndex = triggers.indexOf(current);
    const targetIndex =
      target === "first"
        ? 0
        : target === "last"
          ? triggers.length - 1
          : target === "next"
            ? (Math.max(currentIndex, 0) + 1) % triggers.length
            : (Math.max(currentIndex, 0) - 1 + triggers.length) % triggers.length;
    triggers[targetIndex]?.focus();
  }

  function handleKeydown(event: KeyboardEvent<HTMLDivElement>): void {
    const target = event.target;
    if (
      !(target instanceof HTMLButtonElement)
      || target.dataset.balsa !== "collapsible-trigger"
    ) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(target, event.key === "ArrowDown" ? "next" : "previous");
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      moveFocus(target, event.key === "Home" ? "first" : "last");
    }
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        id={id}
        ref={rootElement}
        data-balsa="accordion"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-type={type}
        data-variant={variant}
        data-size={size}
        data-rounded={rounded}
        data-disabled={disabled || undefined}
        data-shadow={shadow}
        role="group"
        aria-label={label}
        className={mergeClasses(
          variant === "underline"
            ? "min-w-0 font-balsa-body"
            : ["min-w-0 overflow-hidden font-balsa-body", roundedClasses[rounded]],
          variantClasses[variant],
          className,
        )}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
        onKeyDown={handleKeydown}
      >
        {items.map((item, index) => (
          <Collapsible
            key={item.id}
            id={`${id}-${item.id}`}
            open={isOpen(item.id)}
            title={item.title}
            variant={variant}
            size={size}
            rounded="none"
            shadow="none"
            headingLevel={headingLevel}
            disabled={itemIsDisabled(item)}
            className={itemClasses(index)}
            onOpenChange={(open) => updateItem(item.id, open)}
          >
            {panels?.[item.id] ?? item.content}
          </Collapsible>
        ))}
      </div>
    </BalsaThemeContext.Provider>
  );
}
