import {
  computed,
  inject,
  provide,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  toValue,
} from "vue";
import {
  defaultDesignTheme,
  isDesignTheme,
  resolveTheme,
  themePresentation,
  type DesignTheme,
  type ResolvedThemeDefinition,
  type ThemeComponentName,
  type ThemeFamily,
  type ThemeInput,
  type ThemePresentation,
  type ThemeVisualDefaults,
} from "./theme";

export interface BalsaThemeContext {
  input: ComputedRef<ThemeInput>;
  resolved: ComputedRef<ResolvedThemeDefinition>;
}

export const balsaThemeContextKey: InjectionKey<BalsaThemeContext> =
  Symbol("balsa-theme-context");

function createThemeContext(input: ComputedRef<ThemeInput>): BalsaThemeContext {
  return {
    input,
    resolved: computed(() => resolveTheme(input.value)),
  };
}

export function provideBalsaTheme(
  input: MaybeRefOrGetter<ThemeInput>,
): BalsaThemeContext {
  const context = createThemeContext(computed(() => toValue(input)));
  provide(balsaThemeContextKey, context);
  return context;
}

export function useBalsaThemeContext(): BalsaThemeContext | undefined {
  return inject(balsaThemeContextKey, undefined);
}

export interface ComponentThemeResolver {
  input: ComputedRef<ThemeInput>;
  resolved: ComputedRef<ResolvedThemeDefinition>;
  presentation: ComputedRef<ThemePresentation>;
  explicitPresentation: ComputedRef<ThemePresentation | undefined>;
  defaults: ComputedRef<ThemeVisualDefaults>;
  inheritedFromContext: boolean;
  presentationForPortal(boundary?: Element | null): ThemePresentation;
  resolve<T>(
    key: keyof ThemeVisualDefaults,
    explicitValue: T | undefined,
    fallback: T,
  ): T;
}

export function useComponentTheme(
  component: ThemeComponentName,
  family: ThemeFamily,
  explicitTheme: MaybeRefOrGetter<ThemeInput | undefined>,
): ComponentThemeResolver {
  const parent = useBalsaThemeContext();
  const input = computed<ThemeInput>(() =>
    toValue(explicitTheme) ?? parent?.input.value ?? defaultDesignTheme
  );
  const context = createThemeContext(input);
  provide(balsaThemeContextKey, context);

  const presentation = computed(() => themePresentation(input.value));
  const explicitPresentation = computed(() =>
    toValue(explicitTheme) === undefined ? undefined : presentation.value
  );
  const defaults = computed<ThemeVisualDefaults>(() => ({
    ...context.resolved.value.defaults.families?.[family],
    ...context.resolved.value.defaults.components?.[component],
  }));

  return {
    input,
    resolved: context.resolved,
    presentation,
    explicitPresentation,
    defaults,
    inheritedFromContext: Boolean(parent),
    presentationForPortal(boundary?: Element | null): ThemePresentation {
      if (toValue(explicitTheme) !== undefined || parent) return presentation.value;
      const host = boundary?.parentElement ?? boundary;
      const themedAncestor = host?.closest<HTMLElement>(
        "[data-theme], [data-theme-base]",
      );
      const legacyTheme = themedAncestor?.dataset.themeBase
        ?? themedAncestor?.dataset.theme;
      return isDesignTheme(legacyTheme)
        ? themePresentation(legacyTheme)
        : presentation.value;
    },
    resolve<T>(
      key: keyof ThemeVisualDefaults,
      explicitValue: T | undefined,
      fallback: T,
    ): T {
      if (explicitValue !== undefined) return explicitValue;
      const configured = defaults.value[key];
      return configured === undefined ? fallback : configured as T;
    },
  };
}

export function useResolvedThemeProps<
  P extends { theme?: ThemeInput },
  F extends Partial<Record<keyof ThemeVisualDefaults, unknown>>,
>(
  component: ThemeComponentName,
  family: ThemeFamily,
  rawProps: P,
  fallbacks: F,
): {
  props: { [K in keyof P]: K extends keyof F ? Exclude<P[K], undefined> : P[K] };
  theme: ComponentThemeResolver;
} {
  const theme = useComponentTheme(component, family, () => rawProps.theme);
  const props = new Proxy(rawProps, {
    get(target, property, receiver) {
      const explicit = Reflect.get(target, property, receiver);
      if (explicit !== undefined) return explicit;
      if (typeof property !== "string" || !(property in fallbacks)) return explicit;
      const configured = theme.defaults.value[property as keyof ThemeVisualDefaults];
      return configured ?? fallbacks[property as keyof F];
    },
  }) as { [K in keyof P]: K extends keyof F ? Exclude<P[K], undefined> : P[K] };

  return { props, theme };
}

export function inheritedThemeId(
  context: BalsaThemeContext | undefined,
): DesignTheme {
  const input = context?.input.value;
  if (isDesignTheme(input)) return input;
  return context?.resolved.value.base ?? defaultDesignTheme;
}
