import {
  Children,
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  capturePortalPresentation,
  createPortalHost,
  resolvePortalParent,
  type PortalHostController,
  type PortalParent,
} from "./portal-core";
import { useBalsaThemeContext } from "./theme-context";

export class BalsaPortalScopeUsageError extends Error {
  readonly code = "BALSA_PORTAL_SCOPE_USAGE" as const;

  constructor(message: string) {
    super(message);
    this.name = "BalsaPortalScopeUsageError";
  }
}

export interface BalsaPortalScopeValue {
  readonly host: HTMLElement;
  readonly scopeId: string;
  readonly disabled: boolean;
}

export const BalsaPortalContext = createContext<BalsaPortalScopeValue | undefined>(undefined);

export function useBalsaPortalScope(): BalsaPortalScopeValue | undefined {
  return useContext(BalsaPortalContext);
}

export interface BalsaPortalScopeProps {
  to?: PortalParent;
  id?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function BalsaPortalScope({
  to,
  id,
  disabled = false,
  children,
}: BalsaPortalScopeProps) {
  const generatedId = useId();
  const scopeId = id ?? generatedId;
  const theme = useBalsaThemeContext();
  const sourceRef = useRef<HTMLDivElement | null>(null);
  const [controller, setController] = useState<PortalHostController | null>(null);

  if (Children.count(children) < 1) {
    throw new BalsaPortalScopeUsageError(
      "BalsaPortalScope must wrap content; self-closing use is invalid.",
    );
  }

  if (typeof document !== "undefined" && !disabled) {
    resolvePortalParent(document, to ?? document.body);
  }

  useLayoutEffect(() => {
    if (disabled || typeof document === "undefined") {
      setController(null);
      return;
    }

    const parent = resolvePortalParent(document, to ?? document.body);
    const source = sourceRef.current;
    if (!source) return;
    const snapshot = capturePortalPresentation(source, theme?.presentation);
    const next = createPortalHost(document, parent, scopeId, snapshot);
    setController(next);

    const observer = new MutationObserver(() => {
      next.update(capturePortalPresentation(source, theme?.presentation));
    });
    observer.observe(source, {
      attributes: true,
      attributeFilter: ["style", "data-theme", "data-theme-base", "data-palette", "data-balsa-adapt"],
    });

    return () => {
      observer.disconnect();
      next.destroy();
      setController(null);
    };
  }, [disabled, to, scopeId, theme]);

  const value = controller
    ? { host: controller.host, scopeId, disabled }
    : undefined;

  return (
    <BalsaPortalContext.Provider value={value}>
      <div ref={sourceRef} data-balsa="portal-scope" className="contents">
        {children}
      </div>
      {controller && !disabled ? createPortal(null, controller.host) : null}
    </BalsaPortalContext.Provider>
  );
}
