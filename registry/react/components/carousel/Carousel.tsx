import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Button } from "./Button";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";

export interface CarouselItem {
  id: string;
  label: string;
}
export type CarouselOrientation = "horizontal" | "vertical";
export type CarouselAlign = "start" | "center" | "end";
export type CarouselVariant = "surface" | "outline" | "soft" | "glass";
export type CarouselArrowsPosition = "inside" | "bottom-start" | "bottom-end";
export type CarouselIndicatorsPosition = "inside" | "bottom-start" | "bottom-center" | "bottom-end";

export interface CarouselItemSlot {
  item: CarouselItem;
  index: number;
}

export interface CarouselProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "onSelect" | "children"
> {
  items: readonly CarouselItem[];
  label: string;
  variant?: CarouselVariant;
  orientation?: CarouselOrientation;
  align?: CarouselAlign;
  loop?: boolean;
  slidesPerView?: number;
  gap?: number;
  controls?: boolean;
  arrowsPosition?: CarouselArrowsPosition;
  indicators?: boolean;
  indicatorsPosition?: CarouselIndicatorsPosition;
  autoplay?: number;
  rounded?: Rounded;
  shadow?: Shadow;
  emptyText?: string;
  theme?: ThemeInput;
  renderItem?: (slot: CarouselItemSlot) => ReactNode;
  emptyContent?: ReactNode;
  onSelect?: (index: number, item: CarouselItem) => void;
}

const variantClasses: Readonly<Record<CarouselVariant, string[]>> = {
  surface: ["border-balsa-border", "bg-balsa-surface"],
  outline: ["border-balsa-border-strong", "bg-transparent"],
  soft: ["border-balsa-border", "bg-balsa-muted"],
  glass: ["border-balsa-border", "bg-balsa-surface/70", "backdrop-balsa"],
};

function normalizeIndex(index: number, length: number, loop: boolean): number {
  if (length === 0) return 0;
  if (loop) return ((index % length) + length) % length;
  return Math.min(length - 1, Math.max(0, index));
}

export function Carousel(rawProps: CarouselProps) {
  const { props, theme } = useResolvedThemeProps("carousel", "surfaces", rawProps, {
    variant: "surface",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    items,
    label,
    variant,
    orientation = "horizontal",
    align = "start",
    loop = false,
    slidesPerView = 1,
    gap = 16,
    controls = true,
    arrowsPosition = "bottom-start",
    indicators = true,
    indicatorsPosition = "bottom-end",
    autoplay = 0,
    rounded,
    shadow,
    emptyText = "No carousel items.",
    theme: _themeInput,
    renderItem,
    emptyContent,
    onSelect,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const viewport = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const drag = useRef({
    activePointerId: undefined as number | undefined,
    pointerStart: 0,
    pointerLast: 0,
    pointerLastTime: 0,
    pointerVelocity: 0,
    movedDuringDrag: false,
    suppressClick: false,
  });
  const [viewportSize, setViewportSize] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pointerPaused, setPointerPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragOffsetRef = useRef(0);

  function updateDragOffset(next: number): void {
    dragOffsetRef.current = next;
    setDragOffset(next);
  }

  const currentIndex = normalizeIndex(selectedIndex, items.length, loop);
  if (currentIndex !== selectedIndex) {
    setSelectedIndex(currentIndex);
  }

  const paused = pointerPaused || focusPaused;
  const canPrevious = items.length > 1 && (loop || currentIndex > 0);
  const canNext = items.length > 1 && (loop || currentIndex < items.length - 1);
  const normalizedSlidesPerView = Number.isFinite(slidesPerView) ? Math.max(1, slidesPerView) : 1;
  const normalizedGap = Number.isFinite(gap) ? Math.max(0, gap) : 0;
  const slideExtent = viewportSize <= 0
    ? 0
    : Math.max(0, (viewportSize - (normalizedSlidesPerView - 1) * normalizedGap) / normalizedSlidesPerView);
  const slideStep = slideExtent + normalizedGap;
  const available = Math.max(0, viewportSize - slideExtent);
  const alignmentOffset = align === "center" ? available / 2 : align === "end" ? available : 0;
  const trackOffset = alignmentOffset - currentIndex * slideStep + dragOffset;
  const hasInsideArrows = controls && arrowsPosition === "inside";
  const hasInsideIndicators = indicators && indicatorsPosition === "inside";
  const hasOutsideNavigation = (controls && arrowsPosition !== "inside")
    || (indicators && indicatorsPosition !== "inside");
  const previousIcon = orientation === "horizontal" ? ChevronLeft : ChevronUp;
  const nextIcon = orientation === "horizontal" ? ChevronRight : ChevronDown;

  function emitSelection(index: number): void {
    const item = items[index];
    if (item) onSelectRef.current?.(index, item);
  }

  function select(index: number): void {
    const nextIndex = normalizeIndex(index, items.length, loop);
    updateDragOffset(0);
    if (nextIndex === currentIndex) return;
    setSelectedIndex(nextIndex);
    emitSelection(nextIndex);
  }

  function measureViewport(): void {
    const element = viewport.current;
    if (!element) return;
    setViewportSize(orientation === "horizontal" ? element.clientWidth : element.clientHeight);
  }

  function pointerCoordinate(event: ReactPointerEvent<HTMLElement>): number {
    return orientation === "horizontal" ? event.clientX : event.clientY;
  }

  function beginDrag(event: ReactPointerEvent<HTMLElement>): void {
    if (items.length <= 1 || (event.pointerType === "mouse" && event.button !== 0)) return;
    drag.current.activePointerId = event.pointerId;
    drag.current.pointerStart = pointerCoordinate(event);
    drag.current.pointerLast = drag.current.pointerStart;
    drag.current.pointerLastTime = event.timeStamp;
    drag.current.pointerVelocity = 0;
    drag.current.movedDuringDrag = false;
    drag.current.suppressClick = false;
    updateDragOffset(0);
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function updateDrag(event: ReactPointerEvent<HTMLElement>): void {
    if (drag.current.activePointerId !== event.pointerId) return;
    const coordinate = pointerCoordinate(event);
    const elapsed = Math.max(1, event.timeStamp - drag.current.pointerLastTime);
    drag.current.pointerVelocity = (coordinate - drag.current.pointerLast) / elapsed;
    drag.current.pointerLast = coordinate;
    drag.current.pointerLastTime = event.timeStamp;
    let offset = coordinate - drag.current.pointerStart;
    if (!loop) {
      const beyondStart = currentIndex === 0 && offset > 0;
      const beyondEnd = currentIndex === items.length - 1 && offset < 0;
      if (beyondStart || beyondEnd) offset *= 0.25;
    }
    updateDragOffset(offset);
    drag.current.movedDuringDrag ||= Math.abs(offset) > 4;
    if (drag.current.movedDuringDrag && event.cancelable) event.preventDefault();
  }

  function finishDrag(event: ReactPointerEvent<HTMLElement>, cancelled = false): void {
    if (drag.current.activePointerId !== event.pointerId) return;
    const element = event.currentTarget;
    drag.current.activePointerId = undefined;
    if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId);
    setDragging(false);
    const projectedOffset = dragOffsetRef.current + drag.current.pointerVelocity * 140;
    const threshold = Math.min(48, Math.max(16, slideStep * 0.15));
    if (!cancelled && Math.abs(projectedOffset) >= threshold) {
      const distance = Math.max(1, slideStep);
      const steps = Math.max(1, Math.min(items.length - 1, Math.round(Math.abs(projectedOffset) / distance)));
      select(currentIndex + (projectedOffset < 0 ? steps : -steps));
    } else {
      updateDragOffset(0);
    }
    drag.current.suppressClick = drag.current.movedDuringDrag;
    if (drag.current.suppressClick) {
      window.setTimeout(() => {
        drag.current.suppressClick = false;
      }, 0);
    }
  }

  function preventDraggedClick(event: MouseEvent<HTMLElement>): void {
    if (!drag.current.suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    drag.current.suppressClick = false;
  }

  function handleFocusOut(event: FocusEvent<HTMLElement>): void {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    setFocusPaused(false);
  }

  useEffect(() => {
    updateDragOffset(0);
    measureViewport();
    const element = viewport.current;
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && element) {
      resizeObserver = new ResizeObserver(measureViewport);
      resizeObserver.observe(element);
    }
    window.addEventListener("resize", measureViewport);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureViewport);
    };
  }, [orientation, align, slidesPerView, gap, items.length]);

  useEffect(() => {
    emitSelection(currentIndex);
  }, []);

  useEffect(() => {
    let autoplayTimer: ReturnType<typeof setInterval> | undefined;
    function clearAutoplay(): void {
      if (autoplayTimer !== undefined) clearInterval(autoplayTimer);
      autoplayTimer = undefined;
    }
    function configureAutoplay(): void {
      clearAutoplay();
      if (
        autoplay <= 0
        || paused
        || dragging
        || items.length <= 1
        || (typeof document !== "undefined" && document.hidden)
      ) return;
      autoplayTimer = setInterval(() => {
        if (canNext) select(currentIndex + 1);
      }, Math.max(1000, autoplay));
    }
    configureAutoplay();
    document.addEventListener("visibilitychange", configureAutoplay);
    return () => {
      clearAutoplay();
      document.removeEventListener("visibilitychange", configureAutoplay);
    };
  }, [autoplay, paused, dragging, items.length, canNext, currentIndex, loop]);

  const basis = `calc((100% - ${(normalizedSlidesPerView - 1) * normalizedGap}px) / ${normalizedSlidesPerView})`;
  const slideStyle: CSSProperties = orientation === "horizontal"
    ? { flex: `0 0 ${basis}`, minWidth: "0" }
    : { flex: `0 0 ${basis}`, minHeight: "0" };
  const trackStyle: CSSProperties = orientation === "horizontal"
    ? { columnGap: `${normalizedGap}px`, transform: `translate3d(${trackOffset}px, 0, 0)` }
    : { rowGap: `${normalizedGap}px`, transform: `translate3d(0, ${trackOffset}px, 0)` };

  function indicatorClasses(index: number): string {
    return mergeClasses(
      "size-3 rounded-full border border-balsa-border-strong bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring",
      index === currentIndex && "bg-balsa-primary",
    );
  }

  function renderArrows(inside: boolean): ReactNode {
    if (items.length <= 1 || (inside ? !hasInsideArrows : !controls || arrowsPosition === "inside")) {
      return null;
    }
    return (
      <div
        data-balsa="carousel-arrows"
        className={inside
          ? "pointer-events-none absolute inset-x-3 top-1/2 z-10 flex -translate-y-1/2 justify-between"
          : mergeClasses("flex gap-balsa-xs", arrowsPosition === "bottom-end" ? "order-last ml-auto" : "order-first")}
        role="group"
        aria-label="Carousel controls"
      >
        <Button
          shape="fab"
          size="sm"
          variant={inside ? "glass" : "outline"}
          prefixIcon={previousIcon}
          aria-label="Previous slide"
          className={inside ? "pointer-events-auto" : undefined}
          disabled={!loop && !canPrevious}
          onClick={() => select(currentIndex - 1)}
        />
        <Button
          shape="fab"
          size="sm"
          variant={inside ? "glass" : "outline"}
          prefixIcon={nextIcon}
          aria-label="Next slide"
          className={inside ? "pointer-events-auto" : undefined}
          disabled={!loop && !canNext}
          onClick={() => select(currentIndex + 1)}
        />
      </div>
    );
  }

  function renderIndicators(inside: boolean): ReactNode {
    if (items.length <= 1 || (inside ? !hasInsideIndicators : !indicators || indicatorsPosition === "inside")) {
      return null;
    }
    const outsideClasses = indicatorsPosition === "bottom-start"
      ? "order-first"
      : indicatorsPosition === "bottom-center"
        ? "order-none mx-auto"
        : "order-last ml-auto";
    return (
      <div
        data-balsa="carousel-indicators"
        className={inside
          ? "absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-wrap justify-center gap-balsa-xs"
          : mergeClasses("flex flex-wrap gap-balsa-xs", outsideClasses)}
        role="group"
        aria-label="Choose slide"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={indicatorClasses(index)}
            aria-label={`Go to slide ${index + 1}: ${item.label}`}
            aria-current={index === currentIndex ? "true" : undefined}
            onClick={() => select(index)}
          />
        ))}
      </div>
    );
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <section
        {...domProps}
        data-balsa="carousel"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-variant={variant}
        data-orientation={orientation}
        data-shadow={shadow}
        aria-label={label}
        role="region"
        className={mergeClasses("relative min-w-0", className)}
        style={
          {
            ...style,
            ...theme.explicitPresentation?.style,
          } as CSSProperties
        }
        onMouseEnter={() => setPointerPaused(true)}
        onMouseLeave={() => setPointerPaused(false)}
        onFocus={() => setFocusPaused(true)}
        onBlur={handleFocusOut}
      >
        {items.length ? (
          <div className="relative">
            <div
              ref={viewport}
              data-balsa="carousel-viewport"
              className={mergeClasses(
                "overflow-hidden",
                roundedClasses[rounded],
                variantClasses[variant],
                orientation === "vertical" && "h-96",
              )}
              onPointerDown={beginDrag}
              onPointerMove={updateDrag}
              onPointerUp={(event) => finishDrag(event)}
              onPointerCancel={(event) => finishDrag(event, true)}
              onLostPointerCapture={(event) => finishDrag(event, true)}
              onClickCapture={preventDraggedClick}
              onDragStart={(event) => event.preventDefault()}
            >
              <div
                data-balsa="carousel-track"
                className={mergeClasses(
                  "transition-transform duration-balsa-slow ease-balsa motion-reduce:transition-none",
                  orientation === "horizontal" ? "flex touch-pan-y" : "flex h-full flex-col touch-pan-x",
                  dragging && "transition-none",
                )}
                style={trackStyle}
              >
                {items.map((item, index) => (
                  <article
                    key={item.id}
                    data-balsa="carousel-slide"
                    role="group"
                    aria-label={`${index + 1} of ${items.length}: ${item.label}`}
                    aria-roledescription="slide"
                    style={slideStyle}
                  >
                    {renderItem?.({ item, index }) ?? (
                      <div className="p-balsa-2xl">{item.label}</div>
                    )}
                  </article>
                ))}
              </div>
            </div>
            {renderArrows(true)}
            {renderIndicators(true)}
          </div>
        ) : (
          <div
            className={mergeClasses(
              "border border-dashed p-balsa-3xl text-center text-sm text-balsa-muted-foreground",
              roundedClasses[rounded],
              variantClasses[variant],
            )}
          >
            {emptyContent ?? emptyText}
          </div>
        )}
        {items.length > 1 && hasOutsideNavigation ? (
          <div className="mt-balsa-md flex min-h-9 flex-wrap items-center gap-balsa-md">
            {renderArrows(false)}
            {renderIndicators(false)}
          </div>
        ) : null}
        {items.length > 1 ? (
          <p className="sr-only" aria-live="polite">
            {`Slide ${currentIndex + 1} of ${items.length}`}
          </p>
        ) : null}
      </section>
    </BalsaThemeContext.Provider>
  );
}
