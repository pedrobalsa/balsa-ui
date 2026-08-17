import { createContext, useContext } from "react";

export type AnalyticsProperties = Readonly<Record<string, unknown>>;
export type AnalyticsEventSource = "automatic" | "custom";

export interface BalsaAnalyticsEvent {
  name: string;
  properties: AnalyticsProperties;
  source: AnalyticsEventSource;
}

export interface AnalyticsAdapter {
  name: string;
  track: (event: BalsaAnalyticsEvent) => void | Promise<void>;
}

export interface AnalyticsErrorContext {
  adapter?: string;
  event?: BalsaAnalyticsEvent;
}

export type AnalyticsTransform = (
  event: BalsaAnalyticsEvent,
) => BalsaAnalyticsEvent | null;

type MaybeGetter<T> = T | (() => T);
type AnalyticsRoot = Document | HTMLElement;

export interface BalsaAnalyticsOptions {
  adapters?: MaybeGetter<readonly AnalyticsAdapter[]>;
  enabled?: MaybeGetter<boolean>;
  automatic?: MaybeGetter<boolean>;
  context?: MaybeGetter<AnalyticsProperties>;
  root?: AnalyticsRoot;
  transform?: AnalyticsTransform;
  onError?: (error: unknown, context: AnalyticsErrorContext) => void;
}

export interface BalsaAnalytics {
  start: () => void;
  stop: () => void;
  track: (name: string, properties?: AnalyticsProperties) => void;
}

export type GoogleTag = (
  command: "event",
  eventName: string,
  properties?: Record<string, unknown>,
) => void;

export type MetaPixel = (
  command: "track" | "trackCustom",
  eventName: string,
  properties?: Record<string, unknown>,
) => void;

export type LinkedInInsightTag = (
  command: "track",
  properties: { conversion_id: number | string },
) => void;

export interface GoogleAnalyticsAdapterOptions {
  gtag?: GoogleTag;
  sendTo?: string;
}

export interface MetaPixelAdapterOptions {
  fbq?: MetaPixel;
  standardEvents?: readonly string[];
}

export interface LinkedInInsightTagAdapterOptions {
  lintrk?: LinkedInInsightTag;
  conversions: Readonly<Record<string, number | string>>;
}

const automaticEventName = "balsa_interaction";
const automaticEventTypes = ["click", "change", "submit"] as const;
const interactiveSelector = [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[role='menuitem']",
  "[role='option']",
  "[role='switch']",
  "[role='checkbox']",
  "[role='radio']",
].join(",");

export const BalsaAnalyticsContext = createContext<BalsaAnalytics | undefined>(undefined);

function resolveMaybeGetter<T>(value: MaybeGetter<T>): T {
  return typeof value === "function"
    ? (value as () => T)()
    : value;
}

function elementFrom(value: unknown): Element | undefined {
  if (!value || typeof value !== "object" || !("closest" in value)) return undefined;
  return value as Element;
}

function eventElement(event: Event): Element | undefined {
  if (event.type === "submit" && "submitter" in event) {
    const submitter = elementFrom(event.submitter);
    if (submitter) return submitter;
  }

  const target = elementFrom(event.target);
  if (target) return target;

  return event.composedPath().map(elementFrom).find(Boolean);
}

function interactiveElement(event: Event): Element | undefined {
  const target = eventElement(event);
  if (!target) return undefined;
  if (event.type === "submit") return target;
  return target.closest(interactiveSelector) ?? undefined;
}

function isValueControl(element: Element): boolean {
  return element.matches("input, select, textarea, [role='switch'], [role='checkbox'], [role='radio']");
}

function isSubmitControl(element: Element): boolean {
  if (element.matches("input[type='submit'], input[type='image']")) return true;
  if (!element.matches("button")) return false;
  const button = element as HTMLButtonElement;
  return button.type === "submit" && button.form !== null;
}

function normalizeComponentName(name: string): string {
  return name.endsWith("-control") ? name.slice(0, -"-control".length) : name;
}

function componentPath(element: Element): readonly string[] {
  const names: string[] = [];
  let current: Element | null = element;

  while (current && names.length < 8) {
    const rawName = current.getAttribute("data-balsa");
    if (rawName) {
      const name = normalizeComponentName(rawName);
      if (names.at(-1) !== name) names.push(name);
    }
    current = current.parentElement;
  }

  return names;
}

function customEventName(element: Element): string | undefined {
  return element.closest("[data-balsa-track]")
    ?.getAttribute("data-balsa-track")
    ?.trim() || undefined;
}

function globalFunction<T>(name: "gtag" | "fbq" | "lintrk"): T | undefined {
  const value = (globalThis as Record<string, unknown>)[name];
  return typeof value === "function" ? value as T : undefined;
}

function ga4EventName(name: string): string {
  let normalized = name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!/^[a-z]/.test(normalized)) normalized = `event_${normalized}`;
  if (/^(firebase_|google_|ga_)/.test(normalized)) normalized = `event_${normalized}`;
  return (normalized || "balsa_event").slice(0, 40);
}

export function createGoogleAnalyticsAdapter(
  options: GoogleAnalyticsAdapterOptions = {},
): AnalyticsAdapter {
  return {
    name: "ga4",
    track(event) {
      const gtag = options.gtag ?? globalFunction<GoogleTag>("gtag");
      if (!gtag) return;
      gtag("event", ga4EventName(event.name), {
        ...event.properties,
        ...(options.sendTo ? { send_to: options.sendTo } : {}),
      });
    },
  };
}

export function createMetaPixelAdapter(
  options: MetaPixelAdapterOptions = {},
): AnalyticsAdapter {
  const standardEvents = new Set(options.standardEvents ?? []);
  return {
    name: "meta-pixel",
    track(event) {
      const fbq = options.fbq ?? globalFunction<MetaPixel>("fbq");
      if (!fbq) return;
      fbq(
        standardEvents.has(event.name) ? "track" : "trackCustom",
        event.name,
        { ...event.properties },
      );
    },
  };
}

export function createLinkedInInsightTagAdapter(
  options: LinkedInInsightTagAdapterOptions,
): AnalyticsAdapter {
  return {
    name: "linkedin-insight-tag",
    track(event) {
      const conversionId = options.conversions[event.name];
      if (conversionId === undefined) return;
      const lintrk = options.lintrk ?? globalFunction<LinkedInInsightTag>("lintrk");
      lintrk?.("track", { conversion_id: conversionId });
    },
  };
}

export function createAnalyticsAdapter(
  name: string,
  track: AnalyticsAdapter["track"],
): AnalyticsAdapter {
  return { name, track };
}

export function createBalsaAnalytics(
  options: BalsaAnalyticsOptions = {},
): BalsaAnalytics {
  let listeningRoot: AnalyticsRoot | undefined;
  const enabled = options.enabled ?? true;
  const automatic = options.automatic ?? true;
  const adapters = options.adapters ?? [];
  const context = options.context ?? {};

  function reportError(error: unknown, errorContext: AnalyticsErrorContext): void {
    options.onError?.(error, errorContext);
  }

  function dispatch(
    name: string,
    properties: AnalyticsProperties,
    source: AnalyticsEventSource,
  ): void {
    if (!resolveMaybeGetter(enabled)) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    let event: BalsaAnalyticsEvent = {
      name: trimmedName,
      properties: { ...resolveMaybeGetter(context), ...properties },
      source,
    };

    if (options.transform) {
      try {
        const transformed = options.transform(event);
        if (!transformed) return;
        event = transformed;
      } catch (error) {
        reportError(error, { event });
        return;
      }
    }

    for (const adapter of resolveMaybeGetter(adapters)) {
      try {
        const result = adapter.track(event);
        if (result) {
          void Promise.resolve(result).catch((error: unknown) => {
            reportError(error, { adapter: adapter.name, event });
          });
        }
      } catch (error) {
        reportError(error, { adapter: adapter.name, event });
      }
    }
  }

  function handleAutomaticEvent(event: Event): void {
    if (!resolveMaybeGetter(automatic) || !resolveMaybeGetter(enabled)) return;
    const interactive = interactiveElement(event);
    if (!interactive) return;

    if (event.type === "click" && (isValueControl(interactive) || isSubmitControl(interactive))) {
      return;
    }

    const path = componentPath(interactive);
    if (!path.length) return;

    const properties = {
      balsa_component: path[0],
      balsa_component_path: path.join(">"),
      balsa_action: event.type,
    } as const;

    dispatch(automaticEventName, properties, "automatic");

    const customName = customEventName(interactive);
    if (customName) dispatch(customName, properties, "custom");
  }

  function start(): void {
    if (listeningRoot) return;
    const root = options.root
      ?? (typeof document === "undefined" ? undefined : document);
    if (!root) return;
    listeningRoot = root;
    for (const type of automaticEventTypes) {
      root.addEventListener(type, handleAutomaticEvent);
    }
  }

  function stop(): void {
    if (!listeningRoot) return;
    for (const type of automaticEventTypes) {
      listeningRoot.removeEventListener(type, handleAutomaticEvent);
    }
    listeningRoot = undefined;
  }

  return {
    start,
    stop,
    track(name, properties = {}): void {
      dispatch(name, properties, "custom");
    },
  };
}

export function useBalsaAnalytics(): BalsaAnalytics {
  const analytics = useContext(BalsaAnalyticsContext);
  if (!analytics) {
    throw new Error("Balsa analytics is not installed. Use createBalsaAnalytics() or BalsaAnalyticsProvider.");
  }
  return analytics;
}
