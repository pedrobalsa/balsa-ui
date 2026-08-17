import type { GradientBackgroundEffect } from "./gradient-background";

export type GradientBackgroundAppliedEffect = Exclude<
  GradientBackgroundEffect,
  "none"
>;

export const gradientBackgroundEffectVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

/**
 * Shared by every effect. `uCellPixels` arrives already scaled from CSS pixels
 * into drawing-buffer pixels, which is what keeps a background's mark density
 * identical across device pixel ratios and in a PNG captured at another size.
 */
const effectPreamble = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uSource;
  uniform vec2 uResolution;
  uniform float uCellPixels;
  uniform float uEffectAngle;
  uniform float uEffectMix;
  uniform float uEffectInvert;
  uniform int uEffectColorMode;
  uniform int uEffectShape;
  uniform int uEffectLevels;
  uniform vec3 uInk;
  uniform vec3 uPaper;
  uniform float uSeed;
  uniform float uGrain;
  /** Grain cell size, already scaled from CSS pixels into buffer pixels. */
  uniform float uGrainPixels;

  const int COLOR_MODE_GRADIENT = 0;
  const int COLOR_MODE_DUOTONE = 1;
  const int COLOR_MODE_INK = 2;

  // Deliberately not named \`luminance\`: three injects its own luminance()
  // helper into every non-raw ShaderMaterial fragment shader, and redefining
  // it fails the whole program to compile. Nothing in here may reuse a name
  // from three's injected prefix.
  float fieldLuminance(vec3 rgb) {
    return dot(rgb, vec3(0.2126, 0.7152, 0.0722));
  }

  /**
   * Hash without sine. Distributes far better than a multiply-and-fract pair
   * ending on fract(x * y), whose output falls along hyperbolae and turns into
   * visible repeating structure once fragment coordinates get large -- which
   * is what makes weak grain read as a tiled overlay instead of film.
   */
  float grainHash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }

  // Not named \`degrees\`: that is a GLSL built-in function, and hiding one
  // behind a parameter name is rejected by the ES 3.00 translator three
  // compiles these through.
  mat2 rotation(float turn) {
    float angle = radians(turn);
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  }

  float cellPixels() {
    return max(1.0, uCellPixels);
  }

  /**
   * How much mark this luminance earns. Bright earns more, because these
   * backgrounds are usually light figures on a dark field; effectInvert is
   * for the print-like reading where dark earns more ink.
   */
  float tone(float value) {
    return clamp(mix(value, 1.0 - value, uEffectInvert), 0.0, 1.0);
  }

  /** The gradient color at the center of the cell a fragment belongs to. */
  vec3 cellColor(vec2 cell, vec2 size) {
    vec2 fragment = rotation(-uEffectAngle) * ((cell + 0.5) * size);
    return texture2D(uSource, clamp(fragment / uResolution, vec2(0.0), vec2(1.0))).rgb;
  }

  float shapeDistance(vec2 local) {
    if (uEffectShape == 1) return max(abs(local.x), abs(local.y));
    if (uEffectShape == 2) return min(abs(local.x), abs(local.y));
    return length(local);
  }

  /**
   * Turns a mark's coverage into color. The gradient mode keeps the field's
   * own hue and darkens between marks; duotone replaces it with the ink and
   * paper pair; ink lays the ink over the untouched field.
   */
  vec3 resolveColor(vec3 field, float coverage) {
    if (uEffectColorMode == COLOR_MODE_DUOTONE) return mix(uPaper, uInk, coverage);
    if (uEffectColorMode == COLOR_MODE_INK) return mix(field, uInk, coverage);
    return mix(field * BALSA_MARK_FLOOR, field, coverage);
  }
`;

const effectBodies: Record<GradientBackgroundAppliedEffect, string> = {
  /** Size-modulated dots on a rotatable grid -- the classic print screen. */
  halftone: /* glsl */ `
    vec3 applyEffect(vec3 source) {
      vec2 size = vec2(cellPixels());
      vec2 lattice = rotation(uEffectAngle) * gl_FragCoord.xy / size;
      vec3 field = cellColor(floor(lattice), size);
      vec2 local = fract(lattice) - 0.5;
      float radius = tone(fieldLuminance(field)) * 0.72;
      float edge = 1.5 / size.x;
      float coverage = 1.0 - smoothstep(radius - edge, radius + edge, shapeDistance(local));
      return resolveColor(field, coverage);
    }
  `,
  /** Fixed-size marks whose brightness, not size, follows the field. */
  dots: /* glsl */ `
    vec3 applyEffect(vec3 source) {
      vec2 size = vec2(cellPixels());
      vec2 lattice = rotation(uEffectAngle) * gl_FragCoord.xy / size;
      vec3 field = cellColor(floor(lattice), size);
      vec2 local = fract(lattice) - 0.5;
      float edge = 1.5 / size.x;
      float mark = 1.0 - smoothstep(0.32 - edge, 0.32 + edge, shapeDistance(local));
      return resolveColor(field, mark * tone(fieldLuminance(field)));
    }
  `,
  /**
   * Scanlines displaced and thickened by the field underneath. Sampled per
   * fragment rather than per cell so the lines flow continuously instead of
   * stepping between cells.
   */
  lines: /* glsl */ `
    vec3 applyEffect(vec3 source) {
      float size = cellPixels();
      vec2 rotated = rotation(uEffectAngle) * gl_FragCoord.xy;
      float amount = tone(fieldLuminance(source));
      float local = fract(rotated.y / size) - 0.5;
      float wobble = sin(rotated.x / size * 1.7) * amount * 0.35;
      float thickness = 0.06 + amount * 0.34;
      float edge = 1.5 / size;
      float coverage = 1.0
        - smoothstep(thickness - edge, thickness + edge, abs(local - wobble));
      return resolveColor(source, coverage);
    }
  `,
  /**
   * Ordered dithering. The Bayer threshold is built by recursion rather than a
   * lookup array because GLSL ES 1.0 cannot index a const array dynamically.
   */
  dither: /* glsl */ `
    float bayer2(vec2 position) {
      position = floor(position);
      return fract(position.x / 2.0 + position.y * position.y * 0.75);
    }

    float bayer4(vec2 position) {
      return bayer2(position * 0.5) * 0.25 + bayer2(position);
    }

    float bayer8(vec2 position) {
      return bayer4(position * 0.5) * 0.25 + bayer2(position);
    }

    vec3 applyEffect(vec3 source) {
      // The dither grid is finer than a mark grid at the same setting -- a
      // 10px dither block reads as mush, a 2.5px one reads as texture.
      vec2 position = gl_FragCoord.xy / max(1.0, cellPixels() * 0.25);
      float threshold = bayer8(position);
      float steps = float(max(2, uEffectLevels)) - 1.0;
      if (uEffectColorMode == COLOR_MODE_GRADIENT) {
        return floor(source * steps + threshold) / steps;
      }
      float shade = floor(tone(fieldLuminance(source)) * steps + threshold) / steps;
      return resolveColor(source, clamp(shade, 0.0, 1.0));
    }
  `,
  /** Engraving hatch: each luminance step switches on another line set. */
  crosshatch: /* glsl */ `
    float hatch(float turn, float size, float edge) {
      vec2 rotated = rotation(turn) * gl_FragCoord.xy;
      float local = abs(fract(rotated.y / size) - 0.5);
      return 1.0 - smoothstep(0.09 - edge, 0.09 + edge, local);
    }

    vec3 applyEffect(vec3 source) {
      float size = cellPixels();
      float edge = 1.5 / size;
      float amount = tone(fieldLuminance(source));
      float levels = float(max(2, uEffectLevels));
      float coverage = 0.0;
      for (int index = 0; index < 8; index++) {
        if (index >= uEffectLevels) break;
        float threshold = (float(index) + 1.0) / (levels + 1.0);
        if (amount >= threshold) {
          coverage = max(coverage, hatch(uEffectAngle + float(index) * 37.0, size, edge));
        }
      }
      return resolveColor(source, coverage);
    }
  `,
  /**
   * Glyphs from a runtime-built atlas, one column per character, ordered from
   * lightest to heaviest by measured ink. Cells are taller than wide because
   * monospace glyphs are, so square cells would stretch every character.
   *
   * `uGlyphAvailable` covers the case where the atlas could not be built at all
   * (no document, no 2D context): the effect degrades to a plain dot rather
   * than sampling an empty texture and painting the screen black.
   */
  ascii: /* glsl */ `
    uniform sampler2D uGlyphs;
    uniform float uGlyphColumns;
    uniform float uGlyphAspect;
    uniform float uGlyphAvailable;

    vec3 applyEffect(vec3 source) {
      vec2 size = vec2(cellPixels(), cellPixels() * uGlyphAspect);
      vec2 lattice = rotation(uEffectAngle) * gl_FragCoord.xy / size;
      vec3 field = cellColor(floor(lattice), size);
      vec2 local = fract(lattice);
      float amount = tone(fieldLuminance(field));

      if (uGlyphAvailable < 0.5) {
        float edge = 1.5 / size.x;
        float mark = 1.0 - smoothstep(0.32 - edge, 0.32 + edge, length(local - 0.5));
        return resolveColor(field, mark * amount);
      }

      float column = floor(clamp(amount, 0.0, 0.9999) * uGlyphColumns);
      // The atlas is uploaded unflipped, so the row runs top-down while
      // gl_FragCoord runs bottom-up.
      vec2 atlas = vec2((column + local.x) / uGlyphColumns, 1.0 - local.y);
      float coverage = texture2D(uGlyphs, atlas).r;
      return resolveColor(field, coverage);
    }
  `,
};

/**
 * `uEffectMix` blends against the untouched source, so a mix of zero is an
 * exact passthrough -- which is also the cheapest way to prove the render
 * target round-trip is not shifting color.
 */
const effectMain = /* glsl */ `
  void main() {
    vec3 source = texture2D(uSource, vUv).rgb;
    vec3 color = mix(source, applyEffect(source), clamp(uEffectMix, 0.0, 1.0));

    // Grain belongs to whichever pass runs last. A cell effect reads the field
    // once per cell, so grain applied upstream is sampled at one point and
    // spread flat across the whole cell -- the texture disappears and the
    // result looks plastic. Re-applying it here restores it per pixel.
    float grainCell = max(0.35, uGrainPixels);
    vec2 grainCoord = floor(gl_FragCoord.xy / grainCell);
    float grain = grainHash(grainCoord + vec2(uSeed * 0.013, uSeed * 0.029)) - 0.5;
    color += grain * uGrain;

    color += (grainHash(gl_FragCoord.xy + 17.0) - 0.5) / 255.0;
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

/**
 * How much of the field survives between marks, in the gradient color mode.
 * Glyphs carry their own tone through which character is chosen, so ASCII
 * wants a clean ground -- lifting it turns the effect into a grid of tinted
 * boxes with type sitting on top, which is the field showing through rather
 * than the field being drawn. The mark-based effects do want the wash, since
 * a dot only carries tone through its size.
 */
const markFloors: Record<GradientBackgroundAppliedEffect, string> = {
  ascii: "0.0",
  halftone: "0.18",
  dots: "0.18",
  lines: "0.18",
  dither: "0.18",
  crosshatch: "0.18",
};

export function buildGradientBackgroundEffectFragmentShader(
  effect: GradientBackgroundAppliedEffect,
): string {
  return [
    `#define BALSA_MARK_FLOOR ${markFloors[effect]}`,
    effectPreamble,
    effectBodies[effect],
    effectMain,
  ].join("\n");
}
