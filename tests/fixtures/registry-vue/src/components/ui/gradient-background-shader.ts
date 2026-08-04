import type { GradientBackgroundPattern } from "./gradient-background";

export const gradientBackgroundVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const shaderPreamble = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uSeed;
  uniform float uScale;
  uniform float uWarp;
  uniform float uWave;
  uniform float uSoftness;
  uniform float uGrain;
  /**
   * Grain cell size already scaled from CSS pixels into drawing-buffer pixels.
   * Authoring it in device pixels made grain half as coarse on a 2x display as
   * on a 1x one, which is both inconsistent and why it reads as barely there
   * on a high-density screen.
   */
  uniform float uGrainPixels;
  /**
   * 1 while this pass draws to the screen, 0 while it draws into a render
   * target an effect will read. Grain has to land in the last pass to survive
   * at full pixel resolution, and applying it in both would double it.
   */
  uniform float uSourceGrain;
  uniform float uContrast;
  uniform float uBrightness;
  uniform float uDirection;
  uniform float uFieldFrequency;
  uniform float uNoiseFrequency;
  uniform float uNoiseAmount;
  uniform float uWarpFrequency;
  uniform float uPatternDensity;
  uniform vec2 uPatternCenter;
  uniform int uPatternComplexity;
  uniform int uFieldOctaves;
  uniform int uNoiseOctaves;
  uniform int uColorCount;
  uniform vec3 uColors[6];

  const float TAU = 6.2831853;
`;

/**
 * Shared by every pattern. `hash21` folds `uSeed` in, so each generator's
 * placement decisions -- blob anchors, cell points -- reseed with the rest of
 * the background rather than needing a seed path of their own.
 */
const noiseLibrary = /* glsl */ `
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32 + uSeed * 0.00017);
    return fract(p.x * p.y);
  }

  /**
   * Grain gets its own hash. The field's one ends on fract(p.x * p.y), whose
   * output falls along hyperbolae -- invisible after being smoothed into fBM,
   * but plainly structured when read per pixel, and worse the further
   * gl_FragCoord gets from the origin. At screen scale that reads as a tiled
   * noise image laid over the art rather than as grain.
   */
  float grainHash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), u.x),
      u.y
    ) * 2.0 - 1.0;
  }

  float fieldFbm(vec2 p) {
    float total = 0.0;
    float amplitude = 0.54;
    mat2 rotation = mat2(0.80, -0.60, 0.60, 0.80);
    for (int octave = 0; octave < 4; octave++) {
      if (octave >= uFieldOctaves) break;
      total += amplitude * noise(p);
      p = rotation * p * 2.03 + vec2(13.1, 7.7);
      amplitude *= 0.51;
    }
    return total;
  }

  float surfaceNoiseFbm(vec2 p) {
    float total = 0.0;
    float amplitude = 0.54;
    mat2 rotation = mat2(0.80, -0.60, 0.60, 0.80);
    for (int octave = 0; octave < 6; octave++) {
      if (octave >= uNoiseOctaves) break;
      total += amplitude * noise(p);
      p = rotation * p * 2.03 + vec2(7.1, 11.7);
      amplitude *= 0.51;
    }
    return total;
  }

  vec3 colorRamp(float value) {
    float scaled = clamp(value, 0.0, 0.9999) * float(max(uColorCount - 1, 1));
    int index = int(floor(scaled));
    float amount = smoothstep(0.0, 1.0, fract(scaled));
    vec3 left = uColors[0];
    vec3 right = uColors[1];
    if (index == 1) { left = uColors[1]; right = uColors[2]; }
    if (index == 2) { left = uColors[2]; right = uColors[3]; }
    if (index == 3) { left = uColors[3]; right = uColors[4]; }
    if (index >= 4) { left = uColors[4]; right = uColors[5]; }
    return mix(left, right, amount);
  }

  /** Sharp crest from a repeating phase; \`uSoftness\` sets how tight the crest is. */
  float ridgeShape(float phase) {
    float ridge = 1.0 - abs(sin(phase));
    return pow(clamp(ridge, 0.0, 1.0), mix(4.8, 1.25, uSoftness));
  }

  /**
   * The shared tail every generator ends on: soft patterns keep their raw
   * range, crisp ones get pushed toward the ramp's ends.
   */
  float shapeField(float field) {
    return mix(smoothstep(-0.05, 1.05, field), field, uSoftness * 0.45);
  }

  vec2 patternCenter() {
    return uPatternCenter * uScale;
  }
`;

/**
 * Each generator turns the shared warped domain into one scalar. They all
 * receive the same inputs so warp, scale, direction and the octave counts keep
 * working identically across patterns.
 */
const patternBodies: Record<GradientBackgroundPattern, string> = {
  /**
   * The original wave field, unchanged. Anything that alters its output changes
   * how every pre-existing preset and saved background renders.
   */
  ribbon: /* glsl */ `
    float patternField(vec2 p, vec2 warped, vec2 q, vec2 r, float terrain, float phase) {
      float ridgePhase = warped.y * uPatternDensity
        + r.x * 2.8
        + terrain * 1.55
        + sin(warped.x * 1.4 + q.y * 2.0) * 0.36;
      float ridge = ridgeShape(ridgePhase);

      float broad = terrain * 0.34 + r.y * 0.24 + q.x * 0.13;
      float field = 0.5 + broad + (ridge - 0.28) * uWave * 0.34;
      return shapeField(field);
    }
  `,
  /**
   * Distance from the center drives the ramp, so `wave` at zero leaves a clean
   * bloom and raising it rings the bloom with concentric crests.
   */
  radial: /* glsl */ `
    float patternField(vec2 p, vec2 warped, vec2 q, vec2 r, float terrain, float phase) {
      // Not named \`distance\`: that is a GLSL built-in function, and hiding one
      // behind a local is rejected by the ES 3.00 translator three compiles
      // these through.
      float radius = length(warped - patternCenter());
      float ridge = ridgeShape(
        radius * uPatternDensity * 3.14159265 + terrain * 1.2 + r.x * 1.6
      );
      float bloom = 1.0 - smoothstep(0.0, 1.7, radius);
      float broad = terrain * 0.24 + r.y * 0.18 + q.x * 0.1;
      float field = 0.5 + broad + (bloom - 0.35) * 0.46 + (ridge - 0.28) * uWave * 0.3;
      return shapeField(field);
    }
  `,
  /**
   * Angle drives the ramp with a radius-dependent twist, which reads as a
   * chrome sweep rather than a flat pinwheel. The arm count is rounded to an
   * integer because a fractional one leaves a hard seam where atan wraps.
   */
  conic: /* glsl */ `
    float patternField(vec2 p, vec2 warped, vec2 q, vec2 r, float terrain, float phase) {
      vec2 offset = warped - patternCenter();
      float angle = atan(offset.y, offset.x);
      float twist = length(offset) * uWarp * 1.6;
      float arms = max(1.0, floor(uPatternDensity + 0.5));
      float sweep = 0.5 + 0.5 * sin(angle * arms + twist + terrain * 0.9);
      float ridge = ridgeShape(angle * arms + twist * 1.4 + r.x * 1.5);
      float broad = terrain * 0.22 + q.x * 0.12;
      float field = 0.5 + broad + (sweep - 0.5) * 0.55 + (ridge - 0.28) * uWave * 0.26;
      return shapeField(field);
    }
  `,
  /**
   * Overlapping gaussians drifting on slow lissajous paths -- the soft mesh
   * gradient look. Anchors come from the seed, so a background stays the same
   * background across reloads.
   */
  blobs: /* glsl */ `
    float patternField(vec2 p, vec2 warped, vec2 q, vec2 r, float terrain, float phase) {
      vec2 center = patternCenter();
      float accumulated = 0.0;
      for (int index = 0; index < 8; index++) {
        if (index >= uPatternComplexity) break;
        float slot = float(index);
        vec2 anchor = vec2(
          hash21(vec2(slot, 3.7)),
          hash21(vec2(slot, 9.1))
        ) * 2.0 - 1.0;
        vec2 drift = vec2(
          sin(phase * (0.7 + slot * 0.13) + slot),
          cos(phase * (0.55 + slot * 0.17) + slot * 1.7)
        );
        vec2 position = center + (anchor + drift * 0.35) * 1.15;
        float radius = 0.55 + hash21(vec2(slot, 5.3)) * 0.5;
        float reach = length(warped - position) / radius;
        accumulated += exp(-reach * reach * 1.6);
      }
      float merged = accumulated / (0.6 + float(uPatternComplexity) * 0.45);
      float broad = terrain * 0.22 + q.x * 0.12;
      float field = 0.5 + broad + (merged - 0.3) * uWave * 0.95;
      return shapeField(field);
    }
  `,
  /**
   * Topographic banding: the elevation is sliced at even intervals and each
   * slice edge is drawn as a line whose width follows `softness`.
   */
  contour: /* glsl */ `
    float patternField(vec2 p, vec2 warped, vec2 q, vec2 r, float terrain, float phase) {
      float elevation = terrain * 1.35 + r.y * 0.55 + q.x * 0.35;
      float band = abs(fract(elevation * uPatternDensity) - 0.5) * 2.0;
      float line = 1.0 - smoothstep(0.0, mix(0.12, 0.85, uSoftness), band);
      float broad = terrain * 0.3 + r.y * 0.2;
      float field = 0.5 + broad * 0.6 + (line - 0.3) * uWave * 0.5;
      return shapeField(field);
    }
  `,
  /**
   * Worley cells: `second - first` picks out the facet edges, `first` shades
   * the interiors. The two together read as cracked glass over the warped
   * field. The heaviest pattern -- nine hashed cell points per pixel.
   */
  cellular: /* glsl */ `
    vec2 cellPoint(vec2 cell, float phase) {
      vec2 point = vec2(hash21(cell + 0.13), hash21(cell + 7.31));
      return 0.5 + 0.5 * sin(phase * 0.9 + TAU * point);
    }

    float patternField(vec2 p, vec2 warped, vec2 q, vec2 r, float terrain, float phase) {
      vec2 position = (warped - patternCenter()) * (1.0 + float(uPatternComplexity) * 0.55);
      vec2 base = floor(position);
      vec2 local = fract(position);
      float first = 8.0;
      float second = 8.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 offset = vec2(float(x), float(y));
          float reach = length(offset + cellPoint(base + offset, phase) - local);
          if (reach < first) {
            second = first;
            first = reach;
          } else if (reach < second) {
            second = reach;
          }
        }
      }
      float edge = 1.0 - smoothstep(0.0, mix(0.08, 0.6, uSoftness), second - first);
      float broad = terrain * 0.28 + r.y * 0.18;
      float field = 0.5 + broad + (first - 0.45) * 0.5 + (edge - 0.3) * uWave * 0.45;
      return shapeField(field);
    }
  `,
};

/**
 * Everything outside the pattern stage: the domain warp that feeds it, then the
 * color ramp, surface noise, grain and dither that dress its output.
 */
const shaderMain = /* glsl */ `
  void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= uResolution.x / max(uResolution.y, 1.0);

    float angle = radians(uDirection);
    mat2 flowRotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 p = flowRotation * uv * uScale;
    float phase = uTime * 0.12;

    vec2 q = vec2(
      fieldFbm(p * uWarpFrequency + vec2(phase, -phase * 0.41)),
      fieldFbm(p * uWarpFrequency + vec2(5.2, 1.3) + vec2(-phase * 0.34, phase * 0.63))
    );
    vec2 warped = p + q * uWarp * 0.72;
    vec2 r = vec2(
      fieldFbm(warped * uFieldFrequency + q * 0.85 + vec2(1.7, 9.2)),
      fieldFbm(warped * uFieldFrequency - q * 0.65 + vec2(8.3, 2.8))
    );

    float terrain = fieldFbm(warped * uFieldFrequency + r * 0.76);
    float field = patternField(p, warped, q, r, terrain, phase);
    field = (field - 0.5) * uContrast + 0.5 + uBrightness;

    vec3 color = colorRamp(field);
    vec2 surfaceNoisePosition = flowRotation * uv * uNoiseFrequency * 6.0;
    surfaceNoisePosition += vec2(uSeed * 0.0013, -uSeed * 0.0009);
    float surfaceNoise = surfaceNoiseFbm(surfaceNoisePosition);
    color += surfaceNoise * uNoiseAmount;

    float grainCell = max(0.35, uGrainPixels);
    vec2 grainCoord = floor(gl_FragCoord.xy / grainCell);
    float grain = grainHash(grainCoord + vec2(uSeed * 0.013, uSeed * 0.029)) - 0.5;
    color += grain * uGrain * uSourceGrain;

    float dither = (grainHash(gl_FragCoord.xy + 17.0) - 0.5) / 255.0;
    color += dither;
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

/**
 * One program per pattern rather than one program branching on a uniform: the
 * dead generators never reach the compiler, which keeps register pressure off
 * the low-power GPUs this component targets. Programs are cached by the
 * renderer, so the compile happens once per pattern the user visits.
 */
export function buildGradientBackgroundFragmentShader(
  pattern: GradientBackgroundPattern,
): string {
  return [shaderPreamble, noiseLibrary, patternBodies[pattern], shaderMain].join(
    "\n",
  );
}
