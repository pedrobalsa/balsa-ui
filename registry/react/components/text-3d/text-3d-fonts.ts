import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import {
  normalizeText3DFontFamily,
  type Text3DFont,
  type Text3DFontWeight,
} from "./text-3d";
import {
  buildText3DTypefaceData,
  text3DTypefaceCharacters,
  type Text3DSourceFont,
} from "./text-3d-typeface";

export const TEXT_3D_FONT_LABELS: Record<Text3DFont, string> = {
  "space-grotesk": "Space Grotesk",
  inter: "Inter",
  "noto-sans": "Noto Sans",
  roboto: "Roboto",
  "open-sans": "Open Sans",
  "source-sans-3": "Source Sans 3",
  lato: "Lato",
  montserrat: "Montserrat",
  poppins: "Poppins",
  raleway: "Raleway",
  oswald: "Oswald",
  "playfair-display": "Playfair Display",
  "rubik-spray-paint": "Rubik Spray Paint",
};

/** Generated weights backed by real static WOFF files in each package. */
export const TEXT_3D_FONT_WEIGHT_AVAILABILITY = {
  "space-grotesk": [300, 400, 500, 600, 700],
  inter: [300, 400, 500, 600, 700, 800, 900],
  "noto-sans": [300, 400, 500, 600, 700, 800, 900],
  roboto: [300, 400, 500, 600, 700, 800, 900],
  "open-sans": [300, 400, 500, 600, 700, 800],
  "source-sans-3": [300, 400, 500, 600, 700, 800, 900],
  lato: [300, 400, 700, 900],
  montserrat: [300, 400, 500, 600, 700, 800, 900],
  poppins: [300, 400, 500, 600, 700, 800, 900],
  raleway: [300, 400, 500, 600, 700, 800, 900],
  oswald: [300, 400, 500, 600, 700],
  "playfair-display": [400, 500, 600, 700, 800, 900],
  // A display face with one drawn weight: every request resolves onto it, which
  // is the same contract Lato's missing 500 and 600 already run under.
  "rubik-spray-paint": [400],
} as const satisfies Record<Text3DFont, readonly Text3DFontWeight[]>;

const fontPromises = new Map<string, Promise<Font>>();

export function resolveText3DFontWeight(
  font: Text3DFont,
  requestedWeight: Text3DFontWeight,
): Text3DFontWeight {
  const available = TEXT_3D_FONT_WEIGHT_AVAILABILITY[font];
  let nearest: Text3DFontWeight = available[0];
  for (const weight of available) {
    if (
      Math.abs(weight - requestedWeight) < Math.abs(nearest - requestedWeight)
    ) nearest = weight;
  }
  return nearest;
}

export function buildText3DFontAssetPath(
  font: Text3DFont,
  weight: Text3DFontWeight,
): string {
  return `/fonts/typeface/${font}-${resolveText3DFontWeight(font, weight)}.json`;
}

export function loadText3DFont(
  font: Text3DFont,
  weight: Text3DFontWeight,
): Promise<Font> {
  const resolvedWeight = resolveText3DFontWeight(font, weight);
  const key = `${font}-${resolvedWeight}`;
  const cached = fontPromises.get(key);
  if (cached) return cached;

  const path = buildText3DFontAssetPath(font, resolvedWeight);
  // Browser fetch resolves root-relative URLs itself. Normalising against the
  // document also keeps the loader usable in jsdom, whose fetch is Node-backed.
  const url = typeof document === "undefined" ? path : new URL(path, document.baseURI).href;
  const promise = new FontLoader().loadAsync(url);
  fontPromises.set(key, promise);
  // A transient fetch failure must not poison the cache forever.
  void promise.catch(() => fontPromises.delete(key));
  return promise;
}

/**
 * The official, key-free Google Fonts stylesheet endpoint. It answers a family
 * name and a numeric weight with a `@font-face` rule whose `src` points at the
 * font binary, and `text=` narrows that binary to the characters actually asked
 * for -- which is what makes fetching an arbitrary display face for a six-letter
 * wordmark cost a few kilobytes rather than a whole Latin subset.
 *
 * https://developers.google.com/fonts/docs/css2
 */
export const TEXT_3D_GOOGLE_FONTS_ENDPOINT = "https://fonts.googleapis.com/css2";

export interface Text3DRemoteFontRequest {
  family: string;
  weight: Text3DFontWeight;
  /** The scene's own characters; the request is subset to these. */
  characters: string;
}

/**
 * What a remote family's load is doing, for a studio that has to tell the user
 * why the letters have not changed yet. The component itself needs none of
 * this -- it always has a legible fallback -- so it is a subscription rather
 * than a component event.
 */
export type Text3DFontStatus =
  | ({ state: "loading" } & Text3DRemoteFontRequest)
  | ({ state: "ready" } & Text3DRemoteFontRequest)
  | ({ state: "error"; message: string } & Text3DRemoteFontRequest);

const statusListeners = new Set<(status: Text3DFontStatus) => void>();

export function onText3DFontStatus(
  listener: (status: Text3DFontStatus) => void,
): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function publishStatus(status: Text3DFontStatus): void {
  for (const listener of statusListeners) listener(status);
}

/**
 * Google's family parameter separates words with `+`, and the weight axis is
 * only accepted for a family that publishes it -- so the caller retries without
 * the axis when it is refused, rather than treating a missing cut as a missing
 * family.
 */
export function buildText3DGoogleFontsUrl(
  request: Text3DRemoteFontRequest,
  options: { weighted?: boolean } = {},
): string {
  const family = encodeURIComponent(request.family).replace(/%20/g, "+");
  const axis = options.weighted === false ? "" : `:wght@${request.weight}`;
  return `${TEXT_3D_GOOGLE_FONTS_ENDPOINT}?family=${family}${axis}`
    + `&text=${encodeURIComponent(request.characters)}`;
}

/**
 * Every `src: url(...)` the returned stylesheet offers, in the order it lists
 * them -- which is the order of preference the endpoint itself chose for the
 * requesting browser.
 */
export function parseText3DFontFaceUrls(css: string): readonly string[] {
  const urls: string[] = [];
  for (const match of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
    const url = match[2]?.trim();
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}

async function fetchGoogleFontFaceCss(
  request: Text3DRemoteFontRequest,
): Promise<string> {
  const attempt = async (weighted: boolean): Promise<Response> =>
    fetch(buildText3DGoogleFontsUrl(request, { weighted }), {
      // Google answers the stylesheet with `access-control-allow-origin: *`,
      // so a plain cross-origin request is enough; no credentials are wanted.
      credentials: "omit",
    });

  let response = await attempt(true);
  // 400 is how the endpoint reports an axis the family does not publish. The
  // same family without the axis is its single drawn cut, which is exactly the
  // nearest-weight contract the shipped single-face families already run under.
  if (response.status === 400) response = await attempt(false);
  if (!response.ok) {
    throw new Error(
      response.status === 400 || response.status === 404
        ? `Google Fonts does not publish a family named ${request.family}.`
        : `Google Fonts returned ${response.status} for ${request.family}.`,
    );
  }
  return response.text();
}

interface FontkitModule {
  create: (buffer: Uint8Array) => unknown;
}

/**
 * Parsing happens behind a dynamic import so a project that never types a
 * family name never pays for the parser, and so the shipped families keep
 * loading from plain JSON with no parser involved at all.
 */
async function parseFontBinary(buffer: ArrayBuffer): Promise<Text3DSourceFont> {
  const fontkit = (await import("fontkit")) as unknown as FontkitModule;
  const parsed = fontkit.create(new Uint8Array(buffer)) as
    Text3DSourceFont & { fonts?: readonly Text3DSourceFont[] };
  // A collection answers with its members rather than with glyphs of its own.
  const font = parsed.fonts?.[0] ?? parsed;
  if (typeof font.glyphForCodePoint !== "function") {
    throw new Error("The downloaded font could not be read as outlines.");
  }
  return font;
}

async function requestRemoteFont(
  request: Text3DRemoteFontRequest,
): Promise<Font> {
  const css = await fetchGoogleFontFaceCss(request);
  const [url] = parseText3DFontFaceUrls(css);
  if (!url) {
    throw new Error(`Google Fonts returned no font file for ${request.family}.`);
  }
  const response = await fetch(url, { credentials: "omit" });
  if (!response.ok) {
    throw new Error(`The ${request.family} font file could not be downloaded.`);
  }
  const font = await parseFontBinary(await response.arrayBuffer());
  const data = buildText3DTypefaceData(font, request.characters, {
    source: `Google Fonts: ${request.family}`,
    weight: request.weight,
  });
  if (Object.keys(data.glyphs).length === 0) {
    throw new Error(`${request.family} draws none of this text's characters.`);
  }
  return new FontLoader().parse(data as unknown as Parameters<FontLoader["parse"]>[0]);
}

interface RemoteFontEntry extends Text3DRemoteFontRequest {
  font: Promise<Font>;
}

const remoteFonts: RemoteFontEntry[] = [];

/**
 * Draws an arbitrary Google Fonts family, subset to the characters the scene
 * actually sets.
 *
 * The cache is keyed by family, weight and coverage rather than by the text
 * itself: editing a wordmark from `Balsa` to `Bals` needs no second request,
 * because the outlines already downloaded cover it. A failed load is never
 * retained, so a family typed during a network outage is retried rather than
 * remembered as broken.
 */
export function loadText3DRemoteFont(
  family: string,
  weight: Text3DFontWeight,
  text: string,
): Promise<Font> {
  const normalized = normalizeText3DFontFamily(family);
  if (!normalized) {
    return Promise.reject(new Error(`${family} is not a usable font family name.`));
  }
  const characters = text3DTypefaceCharacters(text);
  const covers = (entry: RemoteFontEntry): boolean =>
    entry.family === normalized
    && entry.weight === weight
    && [...characters].every((character) => entry.characters.includes(character));

  const cached = remoteFonts.find(covers);
  if (cached) return cached.font;

  const request: Text3DRemoteFontRequest = { family: normalized, weight, characters };
  publishStatus({ state: "loading", ...request });
  const entry: RemoteFontEntry = { ...request, font: requestRemoteFont(request) };
  remoteFonts.push(entry);
  void entry.font.then(
    () => publishStatus({ state: "ready", ...request }),
    (error: unknown) => {
      // A transient failure must not be remembered as this family's answer.
      const index = remoteFonts.indexOf(entry);
      if (index >= 0) remoteFonts.splice(index, 1);
      publishStatus({
        state: "error",
        ...request,
        message: error instanceof Error
          ? error.message
          : `${normalized} could not be loaded from Google Fonts.`,
      });
    },
  );
  return entry.font;
}

/** Drops every cached remote family. Exported for tests and for hard reloads. */
export function clearText3DRemoteFonts(): void {
  remoteFonts.length = 0;
}
