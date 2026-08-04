export type ActionColor = "neutral" | "primary" | "secondary" | "accent" | "destructive";
export type StatusColor = "success" | "warning" | "info";
/**
 * Status surfaces communicate state, so they exclude neutral: an action can
 * legitimately carry no emphasis, but a status that means nothing is not a status.
 */
export type SemanticColor = Exclude<ActionColor, "neutral"> | StatusColor;
export type Rounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
export type CardVariant = "surface" | "elevated" | "muted" | "outline" | "soft" | "glass";
export type CardColor = ActionColor;
export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardSize = Exclude<CardPadding, "none">;

interface ActionColorClassSet {
  solid: string[];
  soft: string[];
  outline: string[];
  glass: string[];
  text: string[];
}

interface SemanticColorClassSet {
  solid: string[];
  soft: string[];
  outline: string[];
  glass: string[];
}

export const actionColorClasses: Readonly<Record<ActionColor, ActionColorClassSet>> = {
  // Chrome that should not compete with the content it frames: a filled neutral
  // action uses the inverse pair, and every quieter treatment resolves to the
  // plain foreground rather than a palette accent.
  neutral: {
    solid: ["bg-balsa-inverse", "text-balsa-inverse-foreground", "hover:bg-balsa-inverse/90", "active:bg-balsa-inverse/80"],
    soft: ["bg-balsa-muted", "text-balsa-foreground", "hover:bg-balsa-muted/80", "active:bg-balsa-muted/70"],
    outline: ["border-balsa-border-strong", "text-balsa-foreground", "hover:bg-balsa-muted", "active:bg-balsa-muted/80"],
    glass: ["text-balsa-foreground"],
    text: ["text-balsa-foreground", "decoration-balsa-border-strong", "hover:text-balsa-foreground", "hover:decoration-balsa-foreground"],
  },
  primary: {
    solid: ["bg-balsa-primary", "text-balsa-primary-foreground", "hover:bg-balsa-primary-hover", "active:bg-balsa-primary-active"],
    soft: ["bg-balsa-primary/15", "text-balsa-primary", "hover:bg-balsa-primary/20", "active:bg-balsa-primary/25"],
    outline: ["border-balsa-primary", "text-balsa-primary", "hover:bg-balsa-primary/15", "active:bg-balsa-primary/25"],
    glass: ["text-balsa-primary"],
    text: ["text-balsa-primary", "decoration-balsa-primary", "hover:text-balsa-primary-hover", "hover:decoration-balsa-primary-hover"],
  },
  secondary: {
    solid: ["bg-balsa-secondary", "text-balsa-secondary-foreground", "hover:bg-balsa-secondary-hover", "active:bg-balsa-secondary-active"],
    soft: ["bg-balsa-secondary/15", "text-balsa-secondary", "hover:bg-balsa-secondary/20", "active:bg-balsa-secondary/25"],
    outline: ["border-balsa-secondary", "text-balsa-secondary", "hover:bg-balsa-secondary/15", "active:bg-balsa-secondary/25"],
    glass: ["text-balsa-secondary"],
    text: ["text-balsa-secondary", "decoration-balsa-secondary", "hover:text-balsa-secondary-hover", "hover:decoration-balsa-secondary-hover"],
  },
  accent: {
    solid: ["bg-balsa-accent", "text-balsa-accent-foreground", "hover:bg-balsa-accent-hover", "active:bg-balsa-accent-active"],
    soft: ["bg-balsa-accent/15", "text-balsa-accent", "hover:bg-balsa-accent/20", "active:bg-balsa-accent/25"],
    outline: ["border-balsa-accent", "text-balsa-accent", "hover:bg-balsa-accent/15", "active:bg-balsa-accent/25"],
    glass: ["text-balsa-accent"],
    text: ["text-balsa-accent", "decoration-balsa-accent", "hover:text-balsa-accent-hover", "hover:decoration-balsa-accent-hover"],
  },
  destructive: {
    solid: ["bg-balsa-destructive", "text-balsa-destructive-foreground", "hover:bg-balsa-destructive-hover", "active:bg-balsa-destructive-active"],
    soft: ["bg-balsa-destructive/15", "text-balsa-destructive", "hover:bg-balsa-destructive/20", "active:bg-balsa-destructive/25"],
    outline: ["border-balsa-destructive", "text-balsa-destructive", "hover:bg-balsa-destructive/15", "active:bg-balsa-destructive/25"],
    glass: ["text-balsa-destructive"],
    text: ["text-balsa-destructive", "decoration-balsa-destructive", "hover:text-balsa-destructive-hover", "hover:decoration-balsa-destructive-hover"],
  },
};

export const semanticColorClasses: Readonly<Record<SemanticColor, SemanticColorClassSet>> = {
  primary: {
    solid: ["bg-balsa-primary", "text-balsa-primary-foreground"],
    soft: ["bg-balsa-primary/15", "text-balsa-primary"],
    outline: ["border-balsa-primary", "text-balsa-primary"],
    glass: ["border-balsa-primary/40", "bg-balsa-primary/10", "text-balsa-primary", "backdrop-blur-md"],
  },
  secondary: {
    solid: ["bg-balsa-secondary", "text-balsa-secondary-foreground"],
    soft: ["bg-balsa-secondary/15", "text-balsa-secondary"],
    outline: ["border-balsa-secondary", "text-balsa-secondary"],
    glass: ["border-balsa-secondary/40", "bg-balsa-secondary/10", "text-balsa-secondary", "backdrop-blur-md"],
  },
  accent: {
    solid: ["bg-balsa-accent", "text-balsa-accent-foreground"],
    soft: ["bg-balsa-accent/15", "text-balsa-accent"],
    outline: ["border-balsa-accent", "text-balsa-accent"],
    glass: ["border-balsa-accent/40", "bg-balsa-accent/10", "text-balsa-accent", "backdrop-blur-md"],
  },
  destructive: {
    solid: ["bg-balsa-destructive", "text-balsa-destructive-foreground"],
    soft: ["bg-balsa-destructive/15", "text-balsa-destructive"],
    outline: ["border-balsa-destructive", "text-balsa-destructive"],
    glass: ["border-balsa-destructive/40", "bg-balsa-destructive/10", "text-balsa-destructive", "backdrop-blur-md"],
  },
  success: {
    solid: ["bg-balsa-success", "text-balsa-success-foreground"],
    soft: ["bg-balsa-success/15", "text-balsa-success"],
    outline: ["border-balsa-success", "text-balsa-success"],
    glass: ["border-balsa-success/40", "bg-balsa-success/10", "text-balsa-success", "backdrop-blur-md"],
  },
  warning: {
    solid: ["bg-balsa-warning", "text-balsa-warning-foreground"],
    soft: ["bg-balsa-warning/15", "text-balsa-warning"],
    outline: ["border-balsa-warning", "text-balsa-warning"],
    glass: ["border-balsa-warning/40", "bg-balsa-warning/10", "text-balsa-warning", "backdrop-blur-md"],
  },
  info: {
    solid: ["bg-balsa-info", "text-balsa-info-foreground"],
    soft: ["bg-balsa-info/15", "text-balsa-info"],
    outline: ["border-balsa-info", "text-balsa-info"],
    glass: ["border-balsa-info/40", "bg-balsa-info/10", "text-balsa-info", "backdrop-blur-md"],
  },
};
