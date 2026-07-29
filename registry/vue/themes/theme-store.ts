import {
  computed,
  reactive,
  readonly,
  type App,
  type ComputedRef,
} from "vue";
import { balsaThemeContextKey } from "../components/ui/theme-context";
import {
  defaultDesignTheme,
  defineTheme,
  designThemes,
  isDesignTheme,
  normalizeThemeDefinition,
  resolveTheme,
  themePresentation,
  type ResolvedThemeDefinition,
  type ThemeDefinition,
  type ThemeInput,
} from "../components/ui/theme";

export const DESIGN_THEME_STORAGE_KEY = "balsa-ui-design-theme";

export interface PersistedDesignThemeState {
  version: 3;
  selectedTheme: string;
}

export interface DesignThemeStoreOptions {
  root?: HTMLElement | null;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
  themes?: readonly ThemeDefinition[];
  /**
   * Website/editor mode. Consumer applications should register source-controlled
   * definitions and leave this disabled so only the selected id is persisted.
   */
  persistDefinitions?: boolean;
}

function defaultState(): PersistedDesignThemeState {
  return { version: 3, selectedTheme: defaultDesignTheme };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizePersistedDesignThemeState(
  value: unknown,
  availableThemeIds: ReadonlySet<string> = new Set(
    designThemes.map(({ id }) => id),
  ),
): PersistedDesignThemeState {
  if (!isRecord(value)) return defaultState();
  const selectedTheme = typeof value.selectedTheme === "string"
    && availableThemeIds.has(value.selectedTheme)
    ? value.selectedTheme
    : defaultDesignTheme;

  return {
    version: 3,
    selectedTheme,
  };
}

function readPersistedValue(
  storage: DesignThemeStoreOptions["storage"],
): unknown {
  if (!storage) return undefined;
  try {
    const value = storage.getItem(DESIGN_THEME_STORAGE_KEY);
    return value ? JSON.parse(value) : undefined;
  } catch {
    return undefined;
  }
}

function persistedDefinitions(value: unknown): ThemeDefinition[] {
  if (!isRecord(value) || !Array.isArray(value.customThemes)) return [];
  const definitions: ThemeDefinition[] = [];
  for (const candidate of value.customThemes) {
    try {
      if (!isRecord(candidate)) continue;
      const definition = normalizeThemeDefinition(
        defineTheme(candidate as unknown as ThemeDefinition),
      );
      if (!isDesignTheme(definition.id)) definitions.push(definition);
    } catch {
      // A malformed authored definition is ignored without invalidating the rest.
    }
  }
  return definitions;
}

export function createDesignThemeStore(options: DesignThemeStoreOptions = {}) {
  const root = options.root === undefined
    ? (typeof document === "undefined" ? null : document.documentElement)
    : options.root;
  const storage = options.storage === undefined
    ? (typeof window === "undefined" ? null : window.localStorage)
    : options.storage;
  const definitions = reactive(new Map<string, ThemeDefinition>());
  const persistedValue = readPersistedValue(storage);

  const initialDefinitions = [
    ...(options.themes ?? []),
    ...(options.persistDefinitions ? persistedDefinitions(persistedValue) : []),
  ];
  for (const definition of initialDefinitions) {
    const normalized = normalizeThemeDefinition(definition);
    if (isDesignTheme(normalized.id)) {
      throw new TypeError(`Custom theme id "${normalized.id}" conflicts with a built-in theme.`);
    }
    definitions.set(normalized.id, normalized);
  }

  const availableThemeIds = new Set<string>([
    ...designThemes.map(({ id }) => id),
    ...definitions.keys(),
  ]);
  const state = reactive(
    normalizePersistedDesignThemeState(persistedValue, availableThemeIds),
  ) as PersistedDesignThemeState;
  const appliedVariables = new Set<string>();

  const activeTheme = computed<ThemeInput>(() =>
    isDesignTheme(state.selectedTheme)
      ? state.selectedTheme
      : definitions.get(state.selectedTheme) ?? defaultDesignTheme
  );
  const activeDefinition = computed<ResolvedThemeDefinition>(() =>
    resolveTheme(activeTheme.value)
  );
  const activeThemeName = computed(() => activeDefinition.value.name);
  const registeredThemes = computed(() => [...definitions.values()]);

  function apply(): void {
    if (!root) return;
    const presentation = themePresentation(activeTheme.value);
    root.dataset.theme = presentation.id;
    if (presentation.base) root.dataset.themeBase = presentation.base;
    else delete root.dataset.themeBase;

    for (const variable of appliedVariables) root.style.removeProperty(variable);
    appliedVariables.clear();
    for (const [variable, value] of Object.entries(presentation.style)) {
      root.style.setProperty(variable, value);
      appliedVariables.add(variable);
    }
  }

  function persist(): void {
    if (!storage) return;
    try {
      storage.setItem(DESIGN_THEME_STORAGE_KEY, JSON.stringify(
        options.persistDefinitions
          ? {
              ...state,
              customThemes: [...definitions.values()],
              appliedTheme: themePresentation(activeTheme.value),
            }
          : state,
      ));
    } catch {
      // Theme selection remains live when persistence is unavailable.
    }
  }

  function commit(): void {
    apply();
    persist();
  }

  function hasTheme(id: string): boolean {
    return isDesignTheme(id) || definitions.has(id);
  }

  function selectTheme(theme: string | ThemeDefinition): void {
    const id = typeof theme === "string" ? theme : theme.id;
    if (typeof theme !== "string" && !definitions.has(theme.id)) {
      registerTheme(theme);
    }
    if (!hasTheme(id)) return;
    state.selectedTheme = id;
    commit();
  }

  function registerTheme(definition: ThemeDefinition): void {
    const normalized = normalizeThemeDefinition(defineTheme(definition));
    if (isDesignTheme(normalized.id)) {
      throw new TypeError(`Custom theme id "${normalized.id}" conflicts with a built-in theme.`);
    }
    definitions.set(normalized.id, normalized);
    if (state.selectedTheme === normalized.id) commit();
    else persist();
  }

  function unregisterTheme(id: string): void {
    if (!definitions.delete(id)) return;
    if (state.selectedTheme === id) {
      state.selectedTheme = defaultDesignTheme;
      commit();
    } else persist();
  }

  function resetTheme(): void {
    state.selectedTheme = defaultDesignTheme;
    if (options.persistDefinitions) {
      commit();
      return;
    }
    try {
      storage?.removeItem(DESIGN_THEME_STORAGE_KEY);
    } catch {
      // The in-memory default remains authoritative for this session.
    }
    apply();
  }

  const contextInput: ComputedRef<ThemeInput> = computed(() => activeTheme.value);
  const contextResolved = computed(() => activeDefinition.value);

  function install(app: App): void {
    app.provide(balsaThemeContextKey, {
      input: contextInput,
      resolved: contextResolved,
    });
  }

  apply();
  persist();

  return {
    state: readonly(state),
    activeTheme: readonly(activeTheme),
    activeDefinition: readonly(activeDefinition),
    activeThemeName: readonly(activeThemeName),
    registeredThemes: readonly(registeredThemes),
    hasTheme,
    selectTheme,
    registerTheme,
    unregisterTheme,
    resetTheme,
    install,
  };
}

let singleton: ReturnType<typeof createDesignThemeStore> | undefined;

export function useDesignThemeStore(options?: DesignThemeStoreOptions) {
  singleton ??= createDesignThemeStore(options);
  return singleton;
}
