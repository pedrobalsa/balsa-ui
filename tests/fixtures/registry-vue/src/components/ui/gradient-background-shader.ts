export const gradientBackgroundVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const gradientBackgroundFragmentShader = /* glsl */ `
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
  uniform float uGrainSize;
  uniform float uContrast;
  uniform float uBrightness;
  uniform float uDirection;
  uniform float uFieldFrequency;
  uniform float uNoiseFrequency;
  uniform float uNoiseAmount;
  uniform float uWarpFrequency;
  uniform float uRibbonDensity;
  uniform int uFieldOctaves;
  uniform int uNoiseOctaves;
  uniform int uColorCount;
  uniform vec3 uColors[6];

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32 + uSeed * 0.00017);
    return fract(p.x * p.y);
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
    float ridgePhase = warped.y * uRibbonDensity
      + r.x * 2.8
      + terrain * 1.55
      + sin(warped.x * 1.4 + q.y * 2.0) * 0.36;
    float ridge = 1.0 - abs(sin(ridgePhase));
    ridge = pow(clamp(ridge, 0.0, 1.0), mix(4.8, 1.25, uSoftness));

    float broad = terrain * 0.34 + r.y * 0.24 + q.x * 0.13;
    float field = 0.5 + broad + (ridge - 0.28) * uWave * 0.34;
    field = mix(smoothstep(-0.05, 1.05, field), field, uSoftness * 0.45);
    field = (field - 0.5) * uContrast + 0.5 + uBrightness;

    vec3 color = colorRamp(field);
    vec2 surfaceNoisePosition = flowRotation * uv * uNoiseFrequency * 6.0;
    surfaceNoisePosition += vec2(uSeed * 0.0013, -uSeed * 0.0009);
    float surfaceNoise = surfaceNoiseFbm(surfaceNoisePosition);
    color += surfaceNoise * uNoiseAmount;

    float grainCell = max(0.35, uGrainSize);
    float grain = hash21(floor(gl_FragCoord.xy / grainCell) + uSeed * 0.013) - 0.5;
    color += grain * uGrain;

    float dither = (hash21(gl_FragCoord.xy + 17.0) - 0.5) / 255.0;
    color += dither;
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;
