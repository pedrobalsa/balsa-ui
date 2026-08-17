/**
 * Framework-neutral portal target validation and dedicated host lifecycle.
 * Vue and React adapters own mount timing, context, and Teleport/createPortal;
 * they do not reimplement selector resolution or presentation capture.
 * Contract: the 2026-08-14 theme/portal design pass
 * (`~/.agents/runs/20260814-164053-review-codex-personal`).
 */

export type PortalParent = string | HTMLElement;

/**
 * Structural snapshot compatible with theme-core `ThemePresentation`.
 * portal-core stays install-path independent of theme-core source layout.
 */
export interface ThemePresentation {
  readonly id: string;
  readonly base?: string;
  readonly style: Readonly<Record<string, string>>;
}

export interface PortalPresentationSnapshot {
  readonly themeId?: string;
  readonly themeBase?: string;
  readonly paletteId?: string;
  readonly adapt?: string;
  readonly style: Readonly<Record<`--balsa-${string}`, string>>;
}

export interface PortalHostController {
  readonly host: HTMLElement;
  update(snapshot: PortalPresentationSnapshot): void;
  destroy(): void;
}

export class BalsaPortalTargetError extends Error {
  readonly code = "BALSA_PORTAL_TARGET" as const;

  constructor(message: string) {
    super(message);
    this.name = "BalsaPortalTargetError";
  }
}

export class BalsaPortalSourceError extends Error {
  readonly code = "BALSA_PORTAL_SOURCE" as const;

  constructor(message: string) {
    super(message);
    this.name = "BalsaPortalSourceError";
  }
}

const stackingContextProperties = [
  "position",
  "z-index",
  "transform",
  "filter",
  "isolation",
  "opacity",
  "contain",
  "containment",
] as const;

const presentationAttributes = [
  "data-theme",
  "data-theme-base",
  "data-palette",
  "data-balsa-adapt",
] as const;

function isBalsaCustomProperty(property: string): property is `--balsa-${string}` {
  return property.startsWith("--balsa-");
}

function closestAttribute(source: HTMLElement, name: string): string | undefined {
  const node = source.closest(`[${name}]`);
  if (!(node instanceof HTMLElement) || !node.hasAttribute(name)) return undefined;
  return node.getAttribute(name) ?? "";
}

function collectAmbientBalsaVariables(
  source: HTMLElement,
): Record<`--balsa-${string}`, string> {
  const properties = new Map<`--balsa-${string}`, string>();
  for (
    let element: HTMLElement | null = source;
    element;
    element = element.parentElement
  ) {
    for (let index = 0; index < element.style.length; index += 1) {
      const property = element.style.item(index);
      if (!isBalsaCustomProperty(property) || properties.has(property)) continue;
      properties.set(property, element.style.getPropertyValue(property));
    }
  }
  return Object.fromEntries(properties) as Record<`--balsa-${string}`, string>;
}

function assertUsableParent(ownerDocument: Document, element: HTMLElement): HTMLElement {
  if (element.ownerDocument !== ownerDocument) {
    throw new BalsaPortalTargetError(
      "Portal target belongs to a different document.",
    );
  }
  if (!element.isConnected) {
    throw new BalsaPortalTargetError("Portal target is disconnected from the document.");
  }
  if (element.getRootNode() instanceof ShadowRoot) {
    throw new BalsaPortalTargetError("Portal target inside ShadowRoot is not supported.");
  }
  return element;
}

export function resolvePortalParent(
  ownerDocument: Document,
  parent: PortalParent,
): HTMLElement {
  if (parent instanceof HTMLElement) {
    return assertUsableParent(ownerDocument, parent);
  }

  let matches: NodeListOf<Element>;
  try {
    matches = ownerDocument.querySelectorAll(parent);
  } catch {
    throw new BalsaPortalTargetError(`Invalid portal selector: ${parent}`);
  }

  if (matches.length === 0) {
    throw new BalsaPortalTargetError(`Portal selector matched no elements: ${parent}`);
  }
  if (matches.length > 1) {
    throw new BalsaPortalTargetError(
      `Portal selector matched ${String(matches.length)} elements: ${parent}`,
    );
  }

  const element = matches.item(0);
  if (!(element instanceof HTMLElement)) {
    throw new BalsaPortalTargetError(`Portal selector did not match an HTMLElement: ${parent}`);
  }
  return assertUsableParent(ownerDocument, element);
}

export function capturePortalPresentation(
  source: HTMLElement,
  theme?: ThemePresentation,
): PortalPresentationSnapshot {
  if (!(source instanceof HTMLElement)) {
    throw new BalsaPortalSourceError("Portal presentation source must be an HTMLElement.");
  }
  if (!source.isConnected) {
    throw new BalsaPortalSourceError("Portal presentation source is disconnected.");
  }
  if (source.getRootNode() instanceof ShadowRoot) {
    throw new BalsaPortalSourceError("Portal presentation source inside ShadowRoot is not supported.");
  }

  const ambient = collectAmbientBalsaVariables(source);
  const style: Record<`--balsa-${string}`, string> = { ...ambient };
  if (theme?.style) {
    for (const [property, value] of Object.entries(theme.style)) {
      if (isBalsaCustomProperty(property)) style[property] = value;
    }
  }

  return {
    themeId: theme?.id ?? closestAttribute(source, "data-theme"),
    themeBase: theme?.base ?? closestAttribute(source, "data-theme-base"),
    paletteId: closestAttribute(source, "data-palette"),
    adapt: closestAttribute(source, "data-balsa-adapt"),
    style,
  };
}

function applyPresentation(host: HTMLElement, snapshot: PortalPresentationSnapshot): string[] {
  const applied: string[] = [];

  function setAttribute(name: (typeof presentationAttributes)[number], value: string | undefined): void {
    if (value === undefined) {
      host.removeAttribute(name);
      return;
    }
    host.setAttribute(name, value);
    applied.push(name);
  }

  setAttribute("data-theme", snapshot.themeId);
  setAttribute("data-theme-base", snapshot.themeBase);
  setAttribute("data-palette", snapshot.paletteId);
  setAttribute("data-balsa-adapt", snapshot.adapt);

  const nextProperties = new Set<`--balsa-${string}`>();
  for (const [property, value] of Object.entries(snapshot.style)) {
    if (!isBalsaCustomProperty(property)) continue;
    host.style.setProperty(property, value);
    nextProperties.add(property);
    applied.push(property);
  }

  for (let index = host.style.length - 1; index >= 0; index -= 1) {
    const property = host.style.item(index);
    if (isBalsaCustomProperty(property) && !nextProperties.has(property)) {
      host.style.removeProperty(property);
    }
  }

  for (const property of stackingContextProperties) {
    if (host.style.getPropertyValue(property) !== "") {
      host.style.removeProperty(property);
    }
  }

  return applied;
}

export function createPortalHost(
  ownerDocument: Document,
  parent: HTMLElement,
  scopeId: string,
  initial: PortalPresentationSnapshot,
): PortalHostController {
  assertUsableParent(ownerDocument, parent);

  const host = ownerDocument.createElement("div");
  host.setAttribute("data-balsa", "portal-host");
  host.setAttribute("data-balsa-portal-scope", scopeId);
  applyPresentation(host, initial);
  parent.append(host);

  let owned = true;

  return {
    host,
    update(snapshot: PortalPresentationSnapshot): void {
      if (!owned) return;
      applyPresentation(host, snapshot);
    },
    destroy(): void {
      if (!owned) return;
      owned = false;
      for (const name of presentationAttributes) host.removeAttribute(name);
      for (let index = host.style.length - 1; index >= 0; index -= 1) {
        const property = host.style.item(index);
        if (isBalsaCustomProperty(property)) host.style.removeProperty(property);
      }
      host.removeAttribute("data-balsa");
      host.removeAttribute("data-balsa-portal-scope");
      host.remove();
    },
  };
}
