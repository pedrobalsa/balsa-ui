/**
 * Converts a parsed font's glyph outlines into the typeface shape Three.js's
 * `FontLoader` understands.
 *
 * This is the same conversion `scripts/build-typeface-fonts.mjs` performs
 * ahead of time for the shipped families, extracted so a family fetched at
 * runtime produces geometry built the same way a generated one is. It is
 * deliberately free of any font-parsing dependency: it reads a structural
 * shape that `fontkit` satisfies, so the parser can be imported lazily by the
 * one caller that needs it, and so this conversion stays testable without a
 * font binary.
 */

/** The units every generated Balsa typeface is expressed in. */
export const TEXT_3D_TYPEFACE_RESOLUTION = 1000;

/**
 * Always converted alongside the scene's own characters. The space carries the
 * advance width the layout needs, and the renderer substitutes `?` for any
 * character the typeface turned out not to draw.
 */
export const TEXT_3D_TYPEFACE_BASE_CHARACTERS = " ?";

export interface Text3DPathCommand {
  command: string;
  args: readonly number[];
}

export interface Text3DSourceGlyph {
  id: number;
  advanceWidth: number;
  bbox: { minX: number; maxX: number };
  path: { commands: readonly Text3DPathCommand[] };
}

/**
 * What the conversion needs from a parsed font. `fontkit`'s `Font` satisfies
 * this structurally, and so does a hand-built stub, which is what keeps the
 * conversion independently testable.
 */
export interface Text3DSourceFont {
  unitsPerEm: number;
  ascent: number;
  descent: number;
  underlinePosition?: number;
  underlineThickness?: number;
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
  familyName?: string;
  fullName?: string;
  postscriptName?: string;
  glyphForCodePoint: (codePoint: number) => Text3DSourceGlyph | undefined;
}

export interface Text3DTypefaceGlyph {
  ha: number;
  x_min: number;
  x_max: number;
  o: string;
}

export interface Text3DTypefaceData {
  glyphs: Record<string, Text3DTypefaceGlyph>;
  familyName: string;
  ascender: number;
  descender: number;
  underlinePosition: number;
  underlineThickness: number;
  boundingBox: { xMin: number; xMax: number; yMin: number; yMax: number };
  resolution: number;
  original_font_information: Record<string, string>;
  cssFontWeight: string;
  cssFontStyle: string;
}

function number(value: number, scale: number): number {
  const scaled = (Number.isFinite(value) ? value : 0) * scale;
  return Math.round(scaled * 1000) / 1000;
}

/**
 * The typeface outline grammar Three.js parses: `m`ove, `l`ine, `q`uadratic
 * and cubic `b`ezier, with the end point ahead of the control points on both
 * curve commands.
 */
export function buildText3DTypefaceOutline(
  commands: readonly Text3DPathCommand[],
  scale: number,
): string {
  const outline: (string | number)[] = [];
  for (const { command, args } of commands) {
    const values = args.map((value) => number(value, scale));
    if (command === "moveTo") outline.push("m", ...values);
    else if (command === "lineTo") outline.push("l", ...values);
    else if (command === "quadraticCurveTo") {
      const [controlX, controlY, endX, endY] = values;
      outline.push("q", endX ?? 0, endY ?? 0, controlX ?? 0, controlY ?? 0);
    } else if (command === "bezierCurveTo") {
      const [control1X, control1Y, control2X, control2Y, endX, endY] = values;
      outline.push(
        "b",
        endX ?? 0,
        endY ?? 0,
        control1X ?? 0,
        control1Y ?? 0,
        control2X ?? 0,
        control2Y ?? 0,
      );
    }
  }
  return outline.join(" ");
}

/**
 * The unique characters a scene needs drawn, in a stable order. Line breaks and
 * other control characters never reach the geometry, so they are dropped here
 * rather than sent to a subsetting endpoint that would reject them.
 */
export function text3DTypefaceCharacters(text: string): string {
  const characters = new Set<string>();
  for (const character of `${TEXT_3D_TYPEFACE_BASE_CHARACTERS}${text}`) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint < 0x20 || codePoint === 0x7f) continue;
    characters.add(character);
  }
  return [...characters].sort().join("");
}

export function buildText3DTypefaceData(
  font: Text3DSourceFont,
  characters: string,
  information: { source: string; weight: number; format?: string },
): Text3DTypefaceData {
  const unitsPerEm = font.unitsPerEm > 0 ? font.unitsPerEm : TEXT_3D_TYPEFACE_RESOLUTION;
  const scale = TEXT_3D_TYPEFACE_RESOLUTION / unitsPerEm;
  const glyphs: Record<string, Text3DTypefaceGlyph> = {};

  for (const character of new Set(characters)) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) continue;
    const glyph = font.glyphForCodePoint(codePoint);
    // Glyph 0 is `.notdef`: the box a font draws for a character it has no
    // outline for, which reads as a rendering bug rather than as a missing
    // letter. Leaving it out lets the renderer substitute `?` instead.
    if (!glyph || glyph.id === 0) continue;
    glyphs[character] = {
      ha: number(glyph.advanceWidth, scale),
      x_min: number(glyph.bbox.minX, scale),
      x_max: number(glyph.bbox.maxX, scale),
      o: buildText3DTypefaceOutline(glyph.path.commands, scale),
    };
  }

  return {
    glyphs,
    familyName: font.familyName ?? information.source,
    ascender: number(font.ascent, scale),
    descender: number(font.descent, scale),
    underlinePosition: number(font.underlinePosition ?? 0, scale),
    underlineThickness: number(font.underlineThickness ?? 0, scale),
    boundingBox: {
      xMin: number(font.bbox.minX, scale),
      xMax: number(font.bbox.maxX, scale),
      yMin: number(font.bbox.minY, scale),
      yMax: number(font.bbox.maxY, scale),
    },
    resolution: TEXT_3D_TYPEFACE_RESOLUTION,
    original_font_information: {
      format: information.format ?? "WOFF2",
      source: information.source,
      postscriptName: font.postscriptName ?? "",
      fullName: font.fullName ?? font.familyName ?? information.source,
    },
    cssFontWeight: String(information.weight),
    cssFontStyle: "normal",
  };
}
