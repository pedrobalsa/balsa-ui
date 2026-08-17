import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useBalsaPortalScope } from "./BalsaPortalScope";
import { mergeClasses } from "./classes";
import type { Rounded } from "./form";
import type { IconComponent } from "./Icon";
import {
  capturePortalPresentation,
  type PortalPresentationSnapshot,
} from "./portal-core";
import type { ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";
import { Toast, type ToastSize, type ToastVariant } from "./Toast";
import type { SemanticColor } from "./types";

export type ToastPosition =
  | "top-start"
  | "top-center"
  | "top-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end";
export type ToastDismissReason = "close" | "escape" | "timeout" | "action";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  color?: SemanticColor;
  variant?: ToastVariant;
  size?: ToastSize;
  rounded?: Rounded;
  icon?: IconComponent;
  actionLabel?: string;
  actionDismiss?: boolean;
  dismissible?: boolean;
  closeLabel?: string;
  duration?: number;
  sticky?: boolean;
}

export interface ToastActionControls {
  dismiss: () => void;
  run: () => void;
}

export interface ToastViewportProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "value" | "defaultValue"
> {
  "data-balsa"?: string;
  "data-palette"?: string;
  label?: string;
  position?: ToastPosition;
  limit?: number;
  duration?: number;
  pauseOnHover?: boolean;
  pauseOnFocus?: boolean;
  contained?: boolean;
  theme?: ThemeInput;
  value?: readonly ToastItem[];
  defaultValue?: readonly ToastItem[];
  onValueChange?: (value: readonly ToastItem[]) => void;
  onAction?: (item: ToastItem) => void;
  onDismiss?: (item: ToastItem, reason: ToastDismissReason) => void;
  action?: (item: ToastItem, controls: ToastActionControls) => ReactNode;
}

interface TimerState {
  duration: number;
  remaining: number;
  startedAt: number;
  handle?: ReturnType<typeof setTimeout>;
}

const positionClasses: Readonly<Record<ToastPosition, string[]>> = {
  "top-start": ["left-4 top-4 items-start"],
  "top-center": ["left-1/2 top-4 -translate-x-1/2 items-center"],
  "top-end": ["right-4 top-4 items-end"],
  "bottom-start": ["bottom-4 left-4 flex-col-reverse items-start"],
  "bottom-center": ["bottom-4 left-1/2 -translate-x-1/2 flex-col-reverse items-center"],
  "bottom-end": ["bottom-4 right-4 flex-col-reverse items-end"],
};
const observedPresentationAttributes = [
  "style",
  "data-theme",
  "data-theme-base",
  "data-palette",
  "data-balsa-adapt",
];

function samePresentation(
  current: PortalPresentationSnapshot | null,
  next: PortalPresentationSnapshot,
): boolean {
  if (!current
    || current.themeId !== next.themeId
    || current.themeBase !== next.themeBase
    || current.paletteId !== next.paletteId
    || current.adapt !== next.adapt) {
    return false;
  }
  const currentEntries = Object.entries(current.style);
  const nextEntries = Object.entries(next.style);
  return currentEntries.length === nextEntries.length
    && nextEntries.every(([property, value]) => current.style[property as `--balsa-${string}`] === value);
}

export function ToastViewport(rawProps: ToastViewportProps) {
  const { props, theme } = useResolvedThemeProps("toast", "overlays", rawProps, {});
  const {
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    label = "Notifications",
    position = "bottom-end",
    limit = 5,
    duration = 5000,
    pauseOnHover = true,
    pauseOnFocus = true,
    contained = false,
    theme: _themeInput,
    value,
    defaultValue = [],
    onValueChange,
    onAction,
    onDismiss,
    action,
    className,
    style,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...domProps
  } = props;
  void _dataBalsa;
  void _themeInput;

  const [current, setItems] = useControllableState<readonly ToastItem[]>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const scope = useBalsaPortalScope();
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const timersRef = useRef(new Map<string, TimerState>());
  const pauseReasonsRef = useRef(new Set<string>());
  const itemsRef = useRef(current);
  const limitRef = useRef(limit);
  const durationRef = useRef(duration);
  const callbacksRef = useRef({ onAction, onDismiss });
  const themeRef = useRef(theme);
  const [mounted, setMounted] = useState(false);
  const [portalPresentation, setPortalPresentation] = useState<PortalPresentationSnapshot | null>(null);
  itemsRef.current = current;
  limitRef.current = limit;
  durationRef.current = duration;
  callbacksRef.current = { onAction, onDismiss };
  themeRef.current = theme;

  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(10, Math.floor(limit)))
    : 5;
  const visibleItems = current.slice(-safeLimit).reverse();
  const portalHost = contained ? null : (scope?.host ?? (mounted ? document.body : null));

  function itemDuration(item: ToastItem): number {
    const candidate = item.duration ?? durationRef.current;
    return Number.isFinite(candidate) && candidate > 0 ? candidate : 5000;
  }

  function clearTimer(timer: TimerState): void {
    if (timer.handle !== undefined) clearTimeout(timer.handle);
    timer.handle = undefined;
  }

  function dismiss(id: string, reason: ToastDismissReason): void {
    const item = itemsRef.current.find((candidate) => candidate.id === id);
    if (!item) return;
    const timer = timersRef.current.get(id);
    if (timer) clearTimer(timer);
    timersRef.current.delete(id);
    const next = itemsRef.current.filter((candidate) => candidate.id !== id);
    itemsRef.current = next;
    setItems(next);
    callbacksRef.current.onDismiss?.(item, reason);
  }

  function scheduleTimer(item: ToastItem, timer: TimerState): void {
    clearTimer(timer);
    if (item.sticky || pauseReasonsRef.current.size > 0) return;
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => dismiss(item.id, "timeout"), timer.remaining);
  }

  function syncTimers(): void {
    const ids = new Set(itemsRef.current.map(({ id }) => id));
    for (const [id, timer] of timersRef.current) {
      if (!ids.has(id)) {
        clearTimer(timer);
        timersRef.current.delete(id);
      }
    }
    for (const item of itemsRef.current) {
      if (item.sticky) {
        const timer = timersRef.current.get(item.id);
        if (timer) clearTimer(timer);
        timersRef.current.delete(item.id);
        continue;
      }
      const nextDuration = itemDuration(item);
      const existing = timersRef.current.get(item.id);
      if (existing?.duration === nextDuration) continue;
      if (existing) clearTimer(existing);
      const timer: TimerState = {
        duration: nextDuration,
        remaining: nextDuration,
        startedAt: 0,
      };
      timersRef.current.set(item.id, timer);
      scheduleTimer(item, timer);
    }
  }

  function pause(reason: string): void {
    if (pauseReasonsRef.current.has(reason)) return;
    pauseReasonsRef.current.add(reason);
    const now = Date.now();
    for (const timer of timersRef.current.values()) {
      if (timer.handle === undefined) continue;
      timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
      clearTimer(timer);
    }
  }

  function resume(reason: string): void {
    pauseReasonsRef.current.delete(reason);
    if (pauseReasonsRef.current.size > 0) return;
    for (const item of itemsRef.current) {
      const timer = timersRef.current.get(item.id);
      if (timer) scheduleTimer(item, timer);
    }
  }

  function runAction(item: ToastItem): void {
    callbacksRef.current.onAction?.(item);
    if (item.actionDismiss !== false) dismiss(item.id, "action");
  }

  function capturePresentation(): void {
    const anchor = anchorRef.current;
    if (!anchor?.isConnected) return;
    const next = capturePortalPresentation(anchor, themeRef.current.presentation);
    setPortalPresentation((currentPresentation) => (
      samePresentation(currentPresentation, next) ? currentPresentation : next
    ));
  }

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    capturePresentation();
    const observer = new MutationObserver(capturePresentation);
    for (let element: HTMLElement | null = anchor; element; element = element.parentElement) {
      observer.observe(element, {
        attributes: true,
        attributeFilter: observedPresentationAttributes,
      });
    }
    return () => observer.disconnect();
  }, [mounted, contained, scope?.host]);

  useEffect(() => {
    syncTimers();
  }, [current, duration]);

  useEffect(() => {
    if (!mounted) return;

    function handleKeydown(event: KeyboardEvent): void {
      if (event.defaultPrevented || event.key !== "Escape" || itemsRef.current.length === 0) return;
      const currentLimit = Number.isFinite(limitRef.current)
        ? Math.max(1, Math.min(10, Math.floor(limitRef.current)))
        : 5;
      const item = itemsRef.current
        .slice(-currentLimit)
        .reverse()
        .find((candidate) => candidate.dismissible !== false);
      if (!item) return;
      event.preventDefault();
      dismiss(item.id, "escape");
    }

    function handleVisibility(): void {
      if (document.hidden) pause("document-hidden");
      else resume("document-hidden");
    }

    function handleBlur(): void {
      pause("window-blur");
    }

    function handleFocus(): void {
      resume("window-blur");
    }

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      for (const timer of timersRef.current.values()) clearTimer(timer);
      timersRef.current.clear();
      pauseReasonsRef.current.clear();
    };
  }, [mounted]);

  const presentation = portalPresentation ?? {
    themeId: theme.presentation.id,
    themeBase: theme.presentation.base,
    paletteId: dataPalette,
    style: Object.fromEntries(
      Object.entries(theme.presentation.style).filter(([property]) => property.startsWith("--balsa-")),
    ) as PortalPresentationSnapshot["style"],
  };
  const viewport = mounted ? (
    <section
      {...domProps}
      data-balsa="toast-viewport"
      data-theme={presentation.themeId}
      data-theme-base={presentation.themeBase}
      data-palette={presentation.paletteId}
      data-balsa-adapt={presentation.adapt}
      data-position={position}
      aria-label={label}
      className={mergeClasses(
        "pointer-events-none z-[70] flex max-h-[calc(100dvh-2rem)] max-w-sm gap-balsa-md overflow-y-auto overscroll-contain",
        contained
          ? "absolute w-[calc(100%-2rem)]"
          : "fixed w-[calc(100vw-2rem)]",
        positionClasses[position],
        className,
      )}
      style={
        {
          ...presentation.style,
          ...style,
        } as CSSProperties
      }
      onMouseEnter={(event: MouseEvent<HTMLElement>) => {
        onMouseEnter?.(event);
        if (pauseOnHover) pause("hover");
      }}
      onMouseLeave={(event: MouseEvent<HTMLElement>) => {
        onMouseLeave?.(event);
        if (pauseOnHover) resume("hover");
      }}
      onFocus={(event: FocusEvent<HTMLElement>) => {
        onFocus?.(event);
        if (pauseOnFocus) pause("focus");
      }}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        onBlur?.(event);
        if (!pauseOnFocus) return;
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        resume("focus");
      }}
    >
      {visibleItems.map((item) => {
        const controls: ToastActionControls = {
          dismiss: () => dismiss(item.id, "close"),
          run: () => runAction(item),
        };
        return (
          <Toast
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description}
            color={item.color}
            variant={item.variant}
            size={item.size}
            rounded={item.rounded}
            icon={item.icon}
            actionLabel={item.actionLabel}
            dismissible={item.dismissible}
            closeLabel={item.closeLabel}
            theme={theme.input}
            action={action?.(item, controls)}
            onAction={controls.run}
            onDismiss={controls.dismiss}
          />
        );
      })}
    </section>
  ) : null;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <span
        ref={anchorRef}
        data-balsa="toast-anchor"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        className="contents"
        style={theme.explicitPresentation?.style as CSSProperties | undefined}
      >
        {contained ? viewport : (portalHost && viewport ? createPortal(viewport, portalHost) : null)}
      </span>
    </BalsaThemeContext.Provider>
  );
}
