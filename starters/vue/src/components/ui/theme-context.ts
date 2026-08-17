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
  createThemeScope,
  defaultDesignTheme,
  isDesignTheme,
  resolveComponentTheme,
  resolveThemeValue,
  themePresentation,
  type DesignTheme,
  type ResolvedThemeDefinition,
  type ThemeComponentName,
  type ThemeFamily,
  type ThemeInput,
  type ThemePresentation,
  type ThemeScopeState,
  type ThemeVisualDefaults,
} from "./theme";

export interface BalsaThemeContext {
  input: ComputedRef<ThemeInput>;
  resolved: ComputedRef<ResolvedThemeDefinition>;
}

export const balsaThemeContextKey: InjectionKey<BalsaThemeContext> =
  Symbol("balsa-theme-context");

function toScopeState(context: BalsaThemeContext): ThemeScopeState {
  return createThemeScope(context.input.value);
}

export function provideBalsaTheme(
  input: MaybeRefOrGetter<ThemeInput>,
): BalsaThemeContext {
  const scope = computed(() => createThemeScope(toValue(input)));
  const context: BalsaThemeContext = {
    input: computed(() => scope.value.input),
    resolved: computed(() => scope.value.resolved),
  };
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
  const state = computed(() => resolveComponentTheme({
    component,
    family,
    explicit: toValue(explicitTheme),
    parent: parent ? toScopeState(parent) : undefined,
  }));
  const context: BalsaThemeContext = {
    input: computed(() => state.value.input),
    resolved: computed(() => state.value.resolved),
  };
  provide(balsaThemeContextKey, context);

  return {
    input: context.input,
    resolved: context.resolved,
    presentation: computed(() => state.value.presentation),
    explicitPresentation: computed(() => state.value.explicitPresentation),
    defaults: computed(() => state.value.defaults),
    inheritedFromContext: Boolean(parent),
    presentationForPortal(boundary?: Element | null): ThemePresentation {
      if (toValue(explicitTheme) !== undefined || parent) return state.value.presentation;
      const host = boundary?.parentElement ?? boundary;
      const themedAncestor = host?.closest<HTMLElement>(
        "[data-theme], [data-theme-base]",
      );
      const legacyTheme = themedAncestor?.dataset.themeBase
        ?? themedAncestor?.dataset.theme;
      return isDesignTheme(legacyTheme)
        ? themePresentation(legacyTheme)
        : state.value.presentation;
    },
    resolve<T>(
      key: keyof ThemeVisualDefaults,
      explicitValue: T | undefined,
      fallback: T,
    ): T {
      return resolveThemeValue(state.value, key, explicitValue, fallback);
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
