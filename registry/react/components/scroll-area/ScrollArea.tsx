import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type UIEvent,
} from "react";
import { mergeClasses } from "./classes";
import { surfaceRoundedClasses, type SurfaceRounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";

export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";
export type ScrollAreaVisibility = "auto" | "always" | "hover";
export type ScrollAreaSize = "thin" | "regular";
export interface ScrollAreaScrollOptions {
  top?: number;
  left?: number;
  behavior?: "auto" | "smooth";
}

export interface ScrollAreaHandle {
  viewport: HTMLDivElement | null;
  scrollTo: (options: ScrollAreaScrollOptions) => void;
  scrollBy: (options: ScrollAreaScrollOptions) => void;
}

export interface ScrollAreaProps extends Omit<HTMLAttributes<HTMLDivElement>, "onScroll"> {
  label: string;
  orientation?: ScrollAreaOrientation;
  visibility?: ScrollAreaVisibility;
  size?: ScrollAreaSize;
  edgeFade?: boolean;
  rounded?: SurfaceRounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
  children?: ReactNode;
}

const overflowClasses: Readonly<Record<ScrollAreaOrientation, string[]>> = {
  vertical: ["overflow-x-hidden", "overflow-y-auto"],
  horizontal: ["overflow-x-auto", "overflow-y-hidden"],
  both: ["overflow-auto"],
};

export const ScrollArea = forwardRef<ScrollAreaHandle, ScrollAreaProps>(function ScrollArea(
  rawProps,
  ref,
) {
  const { props, theme } = useResolvedThemeProps("scroll-area", "surfaces", rawProps, {
    size: "regular",
    rounded: "auto",
    shadow: "auto",
  } as const);
  const {
    label,
    orientation = "vertical",
    visibility = "auto",
    size,
    edgeFade = false,
    rounded,
    shadow,
    theme: _themeInput,
    onScroll,
    className,
    style,
    children,
    ...domProps
  } = props;
  void _themeInput;

  const viewport = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    get viewport() {
      return viewport.current;
    },
    scrollTo(options: ScrollAreaScrollOptions) {
      viewport.current?.scrollTo(options);
    },
    scrollBy(options: ScrollAreaScrollOptions) {
      viewport.current?.scrollBy(options);
    },
  }));

  const classes = mergeClasses(
    "relative min-h-0 min-w-0 overflow-hidden border-balsa-border bg-balsa-surface",
    surfaceRoundedClasses[rounded],
    className,
  );
  const viewportClasses = mergeClasses(
    "size-full min-h-0 min-w-0 overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-balsa-focus-ring",
    overflowClasses[orientation],
    surfaceRoundedClasses[rounded],
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="scroll-area"
        data-rounded={rounded}
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-orientation={orientation}
        data-visibility={visibility}
        data-size={size}
        data-edge-fade={String(edgeFade)}
        data-shadow={shadow}
        className={classes}
        style={
          {
            ...style,
            ...theme.explicitPresentation?.style,
          } as CSSProperties
        }
      >
        <div
          ref={viewport}
          data-balsa="scroll-area-viewport"
          role="region"
          aria-label={label}
          tabIndex={0}
          className={viewportClasses}
          onScroll={onScroll}
        >
          {children}
        </div>
      </div>
    </BalsaThemeContext.Provider>
  );
});
