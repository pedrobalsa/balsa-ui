import type { LucideIcon } from "lucide-react";

export type IconComponent = LucideIcon;
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IconStrokeWidth = 1.5 | 2 | 2.5;

const sizes: Readonly<Record<IconSize, number>> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export interface IconProps {
  icon: IconComponent;
  size?: IconSize;
  strokeWidth?: IconStrokeWidth;
  label?: string;
  className?: string;
}

export function Icon({
  icon: Glyph,
  size = "md",
  strokeWidth = 2,
  label,
  className,
}: IconProps) {
  return (
    <Glyph
      data-balsa="icon"
      size={sizes[size]}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth
      color="currentColor"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable={false}
      className={className}
    />
  );
}
