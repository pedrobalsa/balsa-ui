import { Maximize, X } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { mergeClasses } from "./classes";
import type { ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";

export type PreviewViewport =
  | "responsive"
  | "fixed"
  | "desktop"
  | "tablet"
  | "mobile";

export interface PreviewProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "title"> {
  title: string;
  "data-balsa"?: string;
  "data-palette"?: string;
  viewport?: PreviewViewport;
  width?: number;
  height?: number;
  aspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
  autoHeight?: boolean;
  fit?: boolean;
  edgeToEdge?: boolean;
  fullscreen?: boolean;
  fullscreenLabel?: string;
  closeLabel?: string;
  theme?: ThemeInput;
  onPreviewScroll?: (deltaY: number) => void;
  fullscreenContent?: ReactNode;
  children?: ReactNode;
}

const presetViewportWidths: Readonly<
  Record<"desktop" | "tablet" | "mobile", number>
> = {
  desktop: 1600,
  tablet: 768,
  mobile: 390,
};

export function Preview(rawProps: PreviewProps) {
  const { props, theme } = useResolvedThemeProps(
    "preview",
    "surfaces",
    rawProps,
    {} as const,
  );
  const {
    title,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    viewport = "responsive",
    width = 1366,
    height = 768,
    aspectRatio,
    maxWidth,
    maxHeight = 480,
    autoHeight = false,
    fit: _fit = true,
    edgeToEdge = false,
    fullscreen = true,
    fullscreenLabel = "Open fullscreen preview",
    closeLabel = "Close fullscreen preview",
    theme: _themeInput,
    onPreviewScroll,
    fullscreenContent,
    className,
    style,
    children,
    ...domProps
  } = props;
  void _dataBalsa;
  void _fit;
  void _themeInput;

  const [mounted, setMounted] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [frameTarget, setFrameTarget] = useState<HTMLElement>();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const observedDocumentRef = useRef<Document | undefined>(undefined);
  const frameWheelHandlerRef = useRef<
    ((event: WheelEvent) => void) | undefined
  >(undefined);
  useLayoutEffect(() => {
    setMounted(true);
    return () => {
      const observedDocument = observedDocumentRef.current;
      const wheelHandler = frameWheelHandlerRef.current;
      if (observedDocument && wheelHandler) {
        observedDocument.removeEventListener("wheel", wheelHandler);
      }
    };
  }, []);

  function prepareFrame(): void {
    const targetDocument = frameRef.current?.contentDocument;
    if (!targetDocument) return;

    const observedDocument = observedDocumentRef.current;
    const previousWheelHandler = frameWheelHandlerRef.current;
    if (observedDocument && previousWheelHandler) {
      observedDocument.removeEventListener("wheel", previousWheelHandler);
    }

    targetDocument.head.replaceChildren();
    targetDocument.body.replaceChildren();

    const base = targetDocument.createElement("base");
    base.href = window.document.baseURI;
    targetDocument.head.append(base);
    window.document.head
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((node) => targetDocument.head.append(node.cloneNode(true)));

    const sourceElement = window.document.documentElement;
    const targetElement = targetDocument.documentElement;
    targetElement.className = sourceElement.className;
    targetElement.style.cssText = sourceElement.style.cssText;
    for (const key of Object.keys(targetElement.dataset)) {
      delete targetElement.dataset[key];
    }
    for (const [key, value] of Object.entries(sourceElement.dataset)) {
      if (value !== undefined) targetElement.dataset[key] = value;
    }

    targetDocument.body.style.margin = "0";
    targetDocument.body.style.height = autoHeight ? "auto" : "100%";
    targetDocument.body.style.overflow = autoHeight ? "hidden" : "";
    targetDocument.body.style.background = "var(--balsa-color-background)";
    targetDocument.body.style.color = "var(--balsa-color-foreground)";
    const target = targetDocument.createElement("div");
    target.id = "balsa-preview-root";
    target.style.width = "100%";
    target.style.height = autoHeight ? "auto" : "100%";
    targetDocument.body.append(target);
    const handleFrameWheel = (event: WheelEvent): void => {
      if (!autoHeight) return;
      event.preventDefault();
      const scrollOwner = frameRef.current?.closest<HTMLElement>(
        "[data-balsa-preview-scroll-owner]",
      );
      if (scrollOwner) scrollOwner.scrollTop += event.deltaY;
      onPreviewScroll?.(event.deltaY);
    };
    observedDocumentRef.current = targetDocument;
    frameWheelHandlerRef.current = handleFrameWheel;
    targetDocument.addEventListener("wheel", handleFrameWheel, {
      passive: false,
    });
    setFrameTarget(target);
  }

  const presetWidth =
    viewport === "desktop" || viewport === "tablet" || viewport === "mobile"
      ? presetViewportWidths[viewport]
      : undefined;
  const maximumWidth = maxWidth ?? presetWidth;
  const rootStyle = {
    ...theme.explicitPresentation?.style,
    ...(maximumWidth ? { maxWidth: `${Math.max(1, maximumWidth)}px` } : {}),
    ...style,
  } as CSSProperties;
  const workbenchStyle = autoHeight
    ? { height: `${Math.max(1, height)}px` }
    : aspectRatio !== undefined && Number.isFinite(aspectRatio) && aspectRatio > 0
      ? { aspectRatio: String(aspectRatio), height: "auto" }
      : { height: `${Math.min(Math.max(1, height), maxHeight)}px` };
  const fixedViewport = viewport === "fixed";
  const iframeStyle = {
    width: fixedViewport ? `${Math.max(1, width)}px` : "100%",
    height: `${Math.max(1, height)}px`,
    transform: fixedViewport ? "scale(1)" : undefined,
    transformOrigin: fixedViewport ? "top left" : undefined,
  } as CSSProperties;

  const fullscreenDialog = fullscreenOpen ? (
    <dialog
      open
      data-balsa="preview-fullscreen"
      data-theme={theme.presentation.id}
      data-theme-base={theme.presentation.base}
      data-palette={dataPalette}
      aria-label={title}
      style={theme.presentation.style as CSSProperties}
      className="fixed inset-0 z-[100] m-0 size-full max-h-none max-w-none border-0 bg-balsa-background p-0 text-balsa-foreground"
      onCancel={(event) => {
        event.preventDefault();
        setFullscreenOpen(false);
      }}
    >
      <div className="flex size-full items-center justify-center overflow-auto">
        {fullscreenContent ?? children}
      </div>
      <Button
        shape="fab"
        size="sm"
        variant="glass"
        prefixIcon={X}
        aria-label={closeLabel}
        className="fixed right-4 top-4"
        onClick={() => setFullscreenOpen(false)}
      />
    </dialog>
  ) : null;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <section
        {...domProps}
        data-balsa="preview"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-viewport={viewport}
        data-auto-height={autoHeight || undefined}
        aria-label={title}
        style={rootStyle}
        className={mergeClasses("relative mx-auto w-full min-w-0", className)}
      >
        <div
          data-balsa="preview-workbench"
          className="flex w-full items-center justify-center overflow-hidden rounded-balsa-surface border border-balsa-border bg-balsa-background"
          style={workbenchStyle}
        >
          <div className="shrink-0">
            <iframe
              ref={frameRef}
              srcDoc="<!doctype html><html><head></head><body></body></html>"
              title={title}
              style={iframeStyle}
              scrolling={autoHeight ? "no" : "auto"}
              className="block border-0 bg-balsa-background"
              onLoad={prepareFrame}
            />
          </div>
        </div>
        {fullscreen ? (
          <Button
            shape="fab"
            size="sm"
            variant="solid"
            color="primary"
            shadow="lg"
            prefixIcon={Maximize}
            aria-label={fullscreenLabel}
            className="absolute bottom-3 right-3 border border-balsa-border bg-balsa-background/90 text-balsa-foreground shadow-balsa-lg backdrop-balsa hover:bg-balsa-background active:bg-balsa-muted"
            onClick={() => setFullscreenOpen(true)}
          />
        ) : null}
        {frameTarget
          ? createPortal(
              <div
                className={
                  autoHeight
                    ? edgeToEdge
                      ? "w-full bg-balsa-background"
                      : "w-full bg-balsa-background p-balsa-2xl"
                    : edgeToEdge
                      ? "h-full w-full bg-balsa-background"
                      : "flex h-full w-full items-center justify-center bg-balsa-background p-balsa-2xl"
                }
              >
                {children}
              </div>,
              frameTarget,
            )
          : null}
      </section>
      {mounted && fullscreenDialog
        ? createPortal(fullscreenDialog, document.body)
        : null}
    </BalsaThemeContext.Provider>
  );
}
