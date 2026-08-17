import { useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { BalsaThemeContext } from "./theme-context";
import { createThemeScope, type ThemeDefaults, type ThemeInput } from "./theme";

export interface BalsaThemeProviderProps extends HTMLAttributes<HTMLDivElement> {
  theme: ThemeInput;
  defaults?: ThemeDefaults;
  children?: ReactNode;
}

export function BalsaThemeProvider({
  theme,
  defaults,
  children,
  className,
  style,
  ...domProps
}: BalsaThemeProviderProps) {
  const scope = useMemo(
    () => createThemeScope(theme, defaults),
    [theme, defaults],
  );

  return (
    <BalsaThemeContext.Provider value={scope}>
      <div
        {...domProps}
        data-balsa="theme-provider"
        data-theme={scope.presentation.id}
        data-theme-base={scope.presentation.base}
        style={{ ...scope.presentation.style, ...style } as CSSProperties}
        className={["contents", className].filter(Boolean).join(" ")}
      >
        {children}
      </div>
    </BalsaThemeContext.Provider>
  );
}
