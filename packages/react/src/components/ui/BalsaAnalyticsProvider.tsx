import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  BalsaAnalyticsContext,
  createBalsaAnalytics,
  type AnalyticsAdapter,
  type AnalyticsErrorContext,
  type AnalyticsProperties,
  type AnalyticsTransform,
} from "./analytics";

export interface BalsaAnalyticsProviderProps {
  adapters?: readonly AnalyticsAdapter[];
  enabled?: boolean;
  automatic?: boolean;
  context?: AnalyticsProperties;
  transform?: AnalyticsTransform;
  onError?: (error: unknown, context: AnalyticsErrorContext) => void;
  children?: ReactNode;
}

export function BalsaAnalyticsProvider({
  adapters = [],
  enabled = true,
  automatic = true,
  context = {},
  transform,
  onError,
  children,
}: BalsaAnalyticsProviderProps) {
  const optionsRef = useRef({
    adapters,
    enabled,
    automatic,
    context,
    transform,
    onError,
  });
  optionsRef.current = {
    adapters,
    enabled,
    automatic,
    context,
    transform,
    onError,
  };

  const analytics = useMemo(
    () =>
      createBalsaAnalytics({
        adapters: () => optionsRef.current.adapters,
        enabled: () => optionsRef.current.enabled,
        automatic: () => optionsRef.current.automatic,
        context: () => optionsRef.current.context,
        get transform() {
          return optionsRef.current.transform;
        },
        get onError() {
          return optionsRef.current.onError;
        },
      }),
    [],
  );

  useEffect(() => {
    analytics.start();
    return () => {
      analytics.stop();
    };
  }, [analytics]);

  return (
    <BalsaAnalyticsContext.Provider value={analytics}>
      {children}
    </BalsaAnalyticsContext.Provider>
  );
}
