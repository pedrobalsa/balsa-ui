import { CanvasTexture, ClampToEdgeWrapping, LinearFilter, type Texture } from "three";

/**
 * Fallback cell aspect for when no atlas could be built and the effect falls
 * back to a dot. Real atlases derive their own from the font's metrics.
 */
export const GRADIENT_BACKGROUND_GLYPH_ASPECT = 1.3;

/** Atlas cell width in texels. 48 keeps a 64-character set inside 3072px. */
const GLYPH_CELL_WIDTH = 48;

/** Size the metrics are measured at before being scaled into the cell. */
const GLYPH_PROBE_SIZE = 100;

/**
 * How much of the cell the heaviest glyph's ink fills. Just short of 1 so
 * antialiased edges are not clipped by the cell boundary, which would leave a
 * hard seam between neighbouring glyphs.
 */
const GLYPH_FILL = 0.96;

const GLYPH_FONT_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export interface GradientBackgroundGlyphAtlas {
  texture: Texture;
  /** One column per character, in the order the shader indexes them. */
  columns: number;
  /** Cell height over cell width, derived from the drawn glyphs' own ink. */
  aspect: number;
  /** The characters as drawn: the requested set, reordered by ink weight. */
  characters: string;
  dispose: () => void;
}

/**
 * Reading pixels back is the slow part of building an atlas, and the studio's
 * character field rebuilds on every edit, so orderings are remembered. Only the
 * ordering is cached -- textures stay owned by whoever created them, which
 * keeps one component's teardown from blanking another's glyphs.
 */
const orderingCache = new Map<string, string>();

interface GlyphBlock {
  /** Widest ink across the set, at the probe size. */
  width: number;
  ascent: number;
  descent: number;
}

/**
 * The bounding box of the heaviest glyph in the set, which is what gets fitted
 * to the cell. Measuring each glyph and normalizing it individually would blow
 * a period up to the size of an at-sign and destroy the tonal ramp -- one
 * shared box keeps every glyph's weight relative to the others.
 */
function measureGlyphBlock(
  context: CanvasRenderingContext2D,
  characters: readonly string[],
): GlyphBlock {
  context.font = `${GLYPH_PROBE_SIZE}px ${GLYPH_FONT_STACK}`;
  let width = 0;
  let ascent = 0;
  let descent = 0;
  for (const character of characters) {
    const metrics = context.measureText(character);
    // Older engines omit the ink box; the advance width and a nominal cap
    // height keep the atlas usable rather than collapsing it to zero.
    const inkWidth = metrics.actualBoundingBoxLeft === undefined
      ? metrics.width
      : metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    width = Math.max(width, inkWidth);
    ascent = Math.max(ascent, metrics.actualBoundingBoxAscent ?? GLYPH_PROBE_SIZE * 0.72);
    descent = Math.max(descent, metrics.actualBoundingBoxDescent ?? GLYPH_PROBE_SIZE * 0.08);
  }
  if (width <= 0) width = GLYPH_PROBE_SIZE * 0.6;
  if (ascent + descent <= 0) ascent = GLYPH_PROBE_SIZE * 0.72;
  return { width, ascent, descent };
}

interface GlyphLayout {
  cellWidth: number;
  cellHeight: number;
  aspect: number;
  fontSize: number;
  baseline: number;
}

/**
 * Scales the shared ink box to fill the cell, and lets the cell's aspect follow
 * from the box rather than being imposed. A fixed aspect leaves the glyphs
 * floating in their cells with the field showing through the gaps, which turns
 * the effect into a grid of tinted boxes instead of a picture made of type.
 */
function layoutGlyphs(block: GlyphBlock): GlyphLayout {
  const cellWidth = GLYPH_CELL_WIDTH;
  const blockHeight = block.ascent + block.descent;
  const scale = (cellWidth * GLYPH_FILL) / block.width;
  const cellHeight = Math.max(1, Math.round((blockHeight * scale) / GLYPH_FILL));
  return {
    cellWidth,
    cellHeight,
    aspect: cellHeight / cellWidth,
    fontSize: GLYPH_PROBE_SIZE * scale,
    baseline: (cellHeight - blockHeight * scale) / 2 + block.ascent * scale,
  };
}

function drawGlyphs(
  context: CanvasRenderingContext2D,
  characters: readonly string[],
  layout: GlyphLayout,
): void {
  context.fillStyle = "#000000";
  context.fillRect(0, 0, layout.cellWidth * characters.length, layout.cellHeight);
  context.fillStyle = "#FFFFFF";
  context.font = `${layout.fontSize}px ${GLYPH_FONT_STACK}`;
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  characters.forEach((character, index) => {
    context.fillText(
      character,
      (index + 0.5) * layout.cellWidth,
      layout.baseline,
    );
  });
}

/**
 * Sorts by how much ink each glyph actually puts on the cell, so the
 * luminance-to-glyph mapping rises monotonically no matter what order the
 * characters were typed in. Without this a set like "@ .#" produces noise
 * rather than shading.
 */
function orderByInk(
  context: CanvasRenderingContext2D,
  characters: readonly string[],
  layout: GlyphLayout,
): string[] {
  const width = layout.cellWidth * characters.length;
  let pixels: Uint8ClampedArray;
  try {
    pixels = context.getImageData(0, 0, width, layout.cellHeight).data;
  } catch {
    // A tainted or unreadable canvas still renders; it just keeps the
    // author's ordering instead of the measured one.
    return [...characters];
  }

  const coverage = characters.map(() => 0);
  for (let y = 0; y < layout.cellHeight; y += 1) {
    for (let x = 0; x < width; x += 1) {
      coverage[Math.floor(x / layout.cellWidth)] += pixels[(y * width + x) * 4];
    }
  }
  return characters
    .map((character, index) => ({ character, ink: coverage[index] }))
    .sort((first, second) => first.ink - second.ink)
    .map((entry) => entry.character);
}

/**
 * Returns `undefined` where a canvas is unavailable -- server rendering, or a
 * test environment without a 2D context. Callers treat that as "no atlas" and
 * fall back to a dot mark rather than sampling an empty texture.
 */
export function createGradientBackgroundGlyphAtlas(
  characters: string,
): GradientBackgroundGlyphAtlas | undefined {
  if (typeof document === "undefined") return undefined;

  const requested = Array.from(characters);
  if (requested.length < 2) return undefined;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return undefined;

  const layout = layoutGlyphs(measureGlyphBlock(context, requested));
  canvas.width = layout.cellWidth * requested.length;
  canvas.height = layout.cellHeight;

  const cacheKey = requested.join("");
  let ordered = orderingCache.get(cacheKey);
  if (!ordered) {
    drawGlyphs(context, requested, layout);
    ordered = orderByInk(context, requested, layout).join("");
    orderingCache.set(cacheKey, ordered);
  }
  drawGlyphs(context, Array.from(ordered), layout);

  const texture = new CanvasTexture(canvas);
  // The shader flips the row itself, because gl_FragCoord counts up from the
  // bottom while the canvas was drawn from the top.
  texture.flipY = false;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return {
    texture,
    columns: requested.length,
    aspect: layout.aspect,
    characters: ordered,
    dispose: () => texture.dispose(),
  };
}
