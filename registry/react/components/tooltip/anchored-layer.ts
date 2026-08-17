export type AnchoredSide = "top" | "right" | "bottom" | "left";
export type AnchoredAlign = "start" | "center" | "end";
export type LayerVariant = "surface" | "outline" | "soft" | "glass";

export interface AnchoredLayerPosition {
  left: number;
  top: number;
  side: AnchoredSide;
  maxWidth: number;
  maxHeight: number;
}

interface PositionOptions {
  side: AnchoredSide;
  align: AnchoredAlign;
  sideOffset: number;
  alignOffset: number;
  viewportPadding?: number;
}

function opposite(side: AnchoredSide): AnchoredSide {
  if (side === "top") return "bottom";
  if (side === "bottom") return "top";
  if (side === "left") return "right";
  return "left";
}

function availableSpace(
  anchor: DOMRect,
  side: AnchoredSide,
  padding: number,
): number {
  if (side === "top") return anchor.top - padding;
  if (side === "bottom") return window.innerHeight - anchor.bottom - padding;
  if (side === "left") return anchor.left - padding;
  return window.innerWidth - anchor.right - padding;
}

export function getAnchoredLayerPosition(
  anchor: HTMLElement,
  layer: HTMLElement,
  options: PositionOptions,
): AnchoredLayerPosition {
  const padding = options.viewportPadding ?? 8;
  const anchorRect = anchor.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  const width = Math.min(
    layerRect.width || 320,
    Math.max(0, window.innerWidth - padding * 2),
  );
  const height = Math.min(
    layerRect.height || 240,
    Math.max(0, window.innerHeight - padding * 2),
  );
  const alternate = opposite(options.side);
  const required = (
    options.side === "top" || options.side === "bottom" ? height : width
  ) + options.sideOffset;
  const side = availableSpace(anchorRect, options.side, padding) >= required
    || availableSpace(anchorRect, options.side, padding)
      >= availableSpace(anchorRect, alternate, padding)
    ? options.side
    : alternate;

  let left = anchorRect.left;
  let top = anchorRect.bottom + options.sideOffset;

  if (side === "top") top = anchorRect.top - height - options.sideOffset;
  if (side === "left") left = anchorRect.left - width - options.sideOffset;
  if (side === "right") left = anchorRect.right + options.sideOffset;

  if (side === "top" || side === "bottom") {
    left = options.align === "start"
      ? anchorRect.left
      : options.align === "end"
        ? anchorRect.right - width
        : anchorRect.left + (anchorRect.width - width) / 2;
    left += options.alignOffset;
  } else {
    top = options.align === "start"
      ? anchorRect.top
      : options.align === "end"
        ? anchorRect.bottom - height
        : anchorRect.top + (anchorRect.height - height) / 2;
    top += options.alignOffset;
  }

  return {
    side,
    left: Math.min(
      Math.max(left, padding),
      Math.max(padding, window.innerWidth - width - padding),
    ),
    top: Math.min(
      Math.max(top, padding),
      Math.max(padding, window.innerHeight - height - padding),
    ),
    maxWidth: window.innerWidth - padding * 2,
    maxHeight: window.innerHeight - padding * 2,
  };
}
