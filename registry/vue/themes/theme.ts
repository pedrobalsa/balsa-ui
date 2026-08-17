import { Blend, Grid3X3, LayoutDashboard } from "@lucide/vue";
import { designThemeCatalog } from "./theme-core";

export {
  defaultDesignTheme,
  defineTheme,
  deriveThemeRecipe,
  isDesignTheme,
  isThemeDefinition,
  normalizeThemeDefinition,
  normalizeThemePresetConfig,
  publicRoundedCoverage,
  publicShadowCoverage,
  publicThemeCoverage,
  resolveTheme,
  resolveComponentTheme,
  resolveThemeValue,
  createThemeScope,
  serializeThemeDefinition,
  serializeThemeTokens,
  themeComponentSizeOptions,
  themeDefaultPropCoverage,
  themeOptionDefinitions,
  themePresentation,
  builtInThemeOptions,
} from "./theme-core";

export type {
  BalsaThemePresetConfig,
  ComponentThemeRequest,
  ComponentThemeState,
  DerivedThemeRecipe,
  DesignTheme,
  ResolvedThemeDefinition,
  ResolvedThemeOptions,
  Rounded,
  Shadow,
  ThemeBorderOption,
  ThemeColorReference,
  ThemeComponentName,
  ThemeDefaults,
  ThemeDefinition,
  ThemeDensityOption,
  ThemeEasing,
  ThemeElevationOption,
  ThemeFamily,
  ThemeFamilyDefault,
  ThemeInput,
  ThemeMaterial,
  ThemeMaterialKey,
  ThemeMaterialOption,
  ThemeMotionOption,
  ThemeOptions,
  ThemeOverrides,
  ThemePaletteRole,
  ThemePresentation,
  ThemeScopeState,
  ThemeShadowLayer,
  ThemeShapeOption,
  ThemeSizeOption,
  ThemeSpacingOption,
  ThemeTokens,
  ThemeTransform,
  ThemeTypographyOption,
  ThemeVisualDefaults,
} from "./theme-core";

const [modernFlat, brutalism, glassmorphism] = designThemeCatalog;

/**
 * Vue public catalog: the same built-in metadata the core owns, plus Lucide
 * icon components for anything that renders a theme picker.
 */
export const designThemes = [
  {
    ...modernFlat,
    icon: LayoutDashboard,
  },
  {
    ...brutalism,
    icon: Grid3X3,
  },
  {
    ...glassmorphism,
    icon: Blend,
  },
] as const;
