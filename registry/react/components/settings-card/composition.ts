import type { Shadow, ThemeInput } from "../ui/theme";

export interface CompositionSurfaceProps {
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  shadow?: Shadow;
  theme?: ThemeInput;
}

export interface CompositionOption {
  label: string;
  value: string;
  description?: string;
}

export interface CompositionMetric {
  label: string;
  value: string;
  detail?: string;
}

export type CompositionPaletteColor = "primary" | "secondary" | "accent";
