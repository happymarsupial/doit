export interface ThemeTokens {
  color: {
    bg: string;
    surface: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
  };
  radius: { sm: number; md: number; lg: number; xl: number };
  blur: { panel: number };
}

export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  isBuiltin: boolean;
  tokens: ThemeTokens;
}

export const LIGHT_TOKENS: ThemeTokens = {
  color: {
    bg: "rgba(244,244,246,0.78)",
    surface: "rgba(255,255,255,0.72)",
    border: "rgba(0,0,0,0.08)",
    text: "#1c1c1e",
    textMuted: "#6b6b70",
    accent: "#4f6df5",
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 24 },
  blur: { panel: 20 },
};

export const DARK_TOKENS: ThemeTokens = {
  color: {
    bg: "rgba(28,28,30,0.78)",
    surface: "rgba(44,44,46,0.72)",
    border: "rgba(255,255,255,0.08)",
    text: "#f5f5f7",
    textMuted: "#a1a1a6",
    accent: "#7c93ff",
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 24 },
  blur: { panel: 20 },
};

export function applyTokensToRoot(tokens: ThemeTokens, isDark: boolean) {
  const root = document.documentElement;
  root.setAttribute("data-theme", isDark ? "dark" : "light");
  root.style.setProperty("--color-bg", tokens.color.bg);
  root.style.setProperty("--color-surface", tokens.color.surface);
  root.style.setProperty("--color-border", tokens.color.border);
  root.style.setProperty("--color-text", tokens.color.text);
  root.style.setProperty("--color-text-muted", tokens.color.textMuted);
  root.style.setProperty("--color-accent", tokens.color.accent);
  root.style.setProperty("--radius-sm", `${tokens.radius.sm}px`);
  root.style.setProperty("--radius-md", `${tokens.radius.md}px`);
  root.style.setProperty("--radius-lg", `${tokens.radius.lg}px`);
  root.style.setProperty("--radius-xl", `${tokens.radius.xl}px`);
  root.style.setProperty("--blur-panel", `${tokens.blur.panel}px`);
}
