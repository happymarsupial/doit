import { createContext, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { applyTokensToRoot, type Theme } from "./tokens";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Controlled provider: the active theme lives in the caller's state (in the
 * app, that's the backend-persisted theme via core-data), not here. This
 * avoids a second source of truth that could drift from what's on disk.
 */
export function ThemeProvider({
  theme,
  onThemeChange,
  children,
}: {
  theme: Theme;
  onThemeChange?: (theme: Theme) => void;
  children: ReactNode;
}) {
  useEffect(() => {
    applyTokensToRoot(theme.tokens, theme.isDark);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (next: Theme) => onThemeChange?.(next),
    }),
    [theme, onThemeChange],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
