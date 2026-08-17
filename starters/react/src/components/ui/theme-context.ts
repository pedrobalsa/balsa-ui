import { createContext, useContext, useState } from "react";
import {
  resolveComponentTheme,
  resolveThemeValue,
  type ComponentThemeState,
  type ThemeComponentName,
  type ThemeFamily,
  type ThemeInput,
  type ThemeScopeState,
  type ThemeVisualDefaults,
} from "./theme";

export const BalsaThemeContext = createContext<ThemeScopeState | undefined>(undefined);

export function useBalsaThemeContext(): ThemeScopeState | undefined {
  return useContext(BalsaThemeContext);
}

export function useComponentTheme(
  component: ThemeComponentName,
  family: ThemeFamily,
  explicitTheme?: ThemeInput,
): ComponentThemeState {
  const parent = useBalsaThemeContext();
  return resolveComponentTheme({
    component,
    family,
    explicit: explicitTheme,
    parent,
  });
}

export function resolveComponentThemeValue<
  K extends keyof ThemeVisualDefaults,
  T,
>(
  state: ComponentThemeState,
  key: K,
  explicitValue: T | undefined,
  fallback: T,
): T {
  return resolveThemeValue(state, key, explicitValue, fallback);
}

type ResolvedThemeProps<P, F> = Omit<P, keyof F> & {
  [K in keyof F]-?: K extends keyof P ? Exclude<P[K], undefined> : never;
};

export function useResolvedThemeProps<
  P extends { theme?: ThemeInput },
  F extends Partial<{
    [K in keyof P & keyof ThemeVisualDefaults]: Exclude<P[K], undefined>;
  }>,
>(
  component: ThemeComponentName,
  family: ThemeFamily,
  rawProps: P,
  fallbacks: F,
): {
  props: ResolvedThemeProps<P, F>;
  theme: ComponentThemeState;
} {
  const theme = useComponentTheme(component, family, rawProps.theme);
  const resolvedFallbacks = Object.fromEntries(
    (Object.keys(fallbacks) as Array<keyof F>).map((key) => [
      key,
      resolveThemeValue<keyof ThemeVisualDefaults, unknown>(
        theme,
        key as keyof ThemeVisualDefaults,
        rawProps[key as keyof P],
        fallbacks[key],
      ),
    ]),
  );
  const props = {
    ...rawProps,
    ...resolvedFallbacks,
  } as ResolvedThemeProps<P, F>;

  return { props, theme };
}

export interface ControllableStateOptions<T> {
  value: T | undefined;
  defaultValue: T;
  onChange?: (value: T) => void;
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): readonly [T, (value: T) => void] {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const currentValue = isControlled ? value : uncontrolledValue;

  function setValue(nextValue: T): void {
    if (!isControlled) setUncontrolledValue(nextValue);
    onChange?.(nextValue);
  }

  return [currentValue, setValue] as const;
}
