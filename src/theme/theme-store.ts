import {
  computed,
  reactive,
  readonly,
  ref,
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
  type DesignTheme,
  type ThemeOptions,
  type ThemeOverrides,
  type ThemePresentation,
  type ThemeDefinition,
  type ThemeInput,
} from "../components/ui/theme";

export const DESIGN_THEME_STORAGE_KEY = "balsa-ui-design-theme";

/**
 * The single editable theme slot. Built-in presets are never mutated: the first
 * edit copies the selected preset into this slot and selects it, and every later
 * edit overwrites the same slot.
 */
export const CUSTOM_DESIGN_THEME_ID = "balsa-custom";

export interface DesignThemeDraft {
  options?: ThemeOptions;
  overrides?: Pick<ThemeOverrides, "tokens">;
}

export interface CustomDesignTheme {
  /** The built-in preset this custom theme was branched from. */
  base: DesignTheme;
  draft: DesignThemeDraft;
}

export interface PersistedDesignThemeState {
  version: 5;
  selectedTheme: string;
  custom: CustomDesignTheme | null;
  appliedTheme: ThemePresentation;
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
  /**
   * Enables the editable custom-theme slot. Disabled by default so consumer
   * stores remain source-definition driven.
   */
  customTheme?: boolean;
}

function defaultState(): PersistedDesignThemeState {
  return {
    version: 5,
    selectedTheme: defaultDesignTheme,
    custom: null,
    appliedTheme: themePresentation(defaultDesignTheme),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeStoredThemeOptions(value: unknown): ThemeOptions | undefined {
  if (!isRecord(value)) return undefined;
  const border = value.border === "subtle" ? "medium" : value.border;
  return {
    ...value,
    ...(border === undefined ? {} : { border }),
  } as ThemeOptions;
}

export function normalizePersistedDesignThemeState(
  value: unknown,
  availableThemeIds: ReadonlySet<string> = new Set(
    designThemes.map(({ id }) => id),
  ),
): PersistedDesignThemeState {
  if (!isRecord(value) || value.version !== 5) return defaultState();
  const custom = normalizeCustomTheme(value.custom);
  const selectable = new Set<string>([
    ...availableThemeIds,
    ...(custom ? [CUSTOM_DESIGN_THEME_ID] : []),
  ]);
  const selectedTheme = typeof value.selectedTheme === "string"
    && selectable.has(value.selectedTheme)
    ? value.selectedTheme
    : defaultDesignTheme;

  return {
    version: 5,
    selectedTheme,
    custom,
    appliedTheme: themePresentation(
      selectedTheme === CUSTOM_DESIGN_THEME_ID && custom
        ? customThemeDefinition(custom)
        : isDesignTheme(selectedTheme) ? selectedTheme : defaultDesignTheme,
    ),
  };
}

function hasDraft(draft: DesignThemeDraft): boolean {
  return Boolean(
    (draft.options && Object.keys(draft.options).length)
    || (draft.overrides?.tokens && Object.keys(draft.overrides.tokens).length),
  );
}

function customThemeDefinition(custom: CustomDesignTheme): ThemeDefinition {
  return defineTheme({
    id: CUSTOM_DESIGN_THEME_ID,
    name: "Custom",
    extends: custom.base,
    ...custom.draft,
  });
}

function normalizeDraft(value: unknown, base: DesignTheme): DesignThemeDraft {
  if (!isRecord(value)) return {};
  try {
    const normalized = normalizeThemeDefinition({
      id: CUSTOM_DESIGN_THEME_ID,
      name: "Custom",
      extends: base,
      options: normalizeStoredThemeOptions(value.options),
      overrides: isRecord(value.overrides)
        ? value.overrides as ThemeOverrides
        : undefined,
    });
    return {
      ...(normalized.options ? { options: normalized.options } : {}),
      ...(normalized.overrides?.tokens
        ? { overrides: { tokens: normalized.overrides.tokens } }
        : {}),
    };
  } catch {
    return {};
  }
}

function normalizeCustomTheme(value: unknown): CustomDesignTheme | null {
  if (!isRecord(value)) return null;
  const base = isDesignTheme(value.base) ? value.base : defaultDesignTheme;
  const draft = normalizeDraft(value.draft, base);
  return hasDraft(draft) ? { base, draft } : null;
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
  if (!options.customTheme) {
    state.custom = null;
    if (state.selectedTheme === CUSTOM_DESIGN_THEME_ID) {
      state.selectedTheme = defaultDesignTheme;
    }
  }
  const appliedVariables = new Set<string>();
  /**
   * A theme applied to the document without being selected or persisted, for a
   * route that presents themes it does not own. The visitor's own selection
   * returns when the preview is cleared or any editor writes to the store.
   */
  const preview = ref<ThemeInput | null>(null);

  const previewActive = computed(() => preview.value !== null);
  const customTheme = computed<CustomDesignTheme | null>(() => state.custom);
  const customThemeActive = computed(() =>
    state.selectedTheme === CUSTOM_DESIGN_THEME_ID && state.custom !== null
  );
  const activeTheme = computed<ThemeInput>(() => {
    if (preview.value) return preview.value;
    if (customThemeActive.value && state.custom) return customThemeDefinition(state.custom);
    if (isDesignTheme(state.selectedTheme)) return state.selectedTheme;
    return definitions.get(state.selectedTheme) ?? defaultDesignTheme;
  });
  const activeDefinition = computed<ResolvedThemeDefinition>(() =>
    resolveTheme(activeTheme.value)
  );
  const activeThemeName = computed(() => activeDefinition.value.name);
  const registeredThemes = computed(() => [...definitions.values()]);
  /** The draft the editor writes to: the custom slot, or the selected preset's empty starting point. */
  const activeDraft = computed<DesignThemeDraft | null>(() => {
    if (customThemeActive.value && state.custom) return state.custom.draft;
    return isDesignTheme(state.selectedTheme) ? {} : null;
  });
  /** The preset a custom theme was branched from, or the selected preset itself. */
  const activeBase = computed<DesignTheme>(() => {
    if (customThemeActive.value && state.custom) return state.custom.base;
    return isDesignTheme(state.selectedTheme) ? state.selectedTheme : defaultDesignTheme;
  });

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
      state.appliedTheme = themePresentation(activeTheme.value);
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

  /**
   * Editing is an explicit statement about the visitor's own theme, so it
   * always wins over a route preview rather than disappearing beneath one.
   */
  function commit(): void {
    preview.value = null;
    apply();
    persist();
  }

  /** Applies a theme to the document without selecting or persisting it. */
  function setThemePreview(value: ThemeInput | null): void {
    preview.value = value;
    apply();
  }

  function hasTheme(id: string): boolean {
    if (id === CUSTOM_DESIGN_THEME_ID) return state.custom !== null;
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
    preview.value = null;
    state.selectedTheme = defaultDesignTheme;
    state.custom = null;
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

  /**
   * Writes the editable slot. The first edit on a built-in preset branches it
   * into the custom theme and selects that; later edits overwrite the same slot,
   * so presets never accumulate hidden modifications.
   */
  function setCustomDraft(draft: DesignThemeDraft): void {
    if (!options.customTheme) return;
    const base = activeBase.value;
    const normalized = normalizeDraft(draft, base);
    if (!hasDraft(normalized)) {
      clearCustomTheme();
      return;
    }
    state.custom = { base, draft: normalized };
    state.selectedTheme = CUSTOM_DESIGN_THEME_ID;
    commit();
  }

  /** Discards the custom theme and returns to the preset it branched from. */
  function clearCustomTheme(): void {
    if (!options.customTheme || !state.custom) return;
    const base = state.custom.base;
    state.custom = null;
    if (state.selectedTheme === CUSTOM_DESIGN_THEME_ID) state.selectedTheme = base;
    commit();
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
    activeDraft: readonly(activeDraft),
    activeBase: readonly(activeBase),
    customTheme: readonly(customTheme),
    customThemeActive: readonly(customThemeActive),
    registeredThemes: readonly(registeredThemes),
    previewActive: readonly(previewActive),
    setThemePreview,
    hasTheme,
    selectTheme,
    registerTheme,
    unregisterTheme,
    setCustomDraft,
    clearCustomTheme,
    resetTheme,
    install,
  };
}

let singleton: ReturnType<typeof createDesignThemeStore> | undefined;

export function useDesignThemeStore(options?: DesignThemeStoreOptions) {
  singleton ??= createDesignThemeStore(options);
  return singleton;
}
