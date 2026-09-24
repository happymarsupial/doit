import { useEffect, useMemo } from "react";
import { Route, Routes } from "react-router-dom";
import { ThemeProvider, type Theme as DsTheme } from "@doit/design-system";
import { useActiveThemeId, useSetActiveThemeId, useThemes } from "@doit/core-data";
import { AppShell } from "./shell/AppShell";
import { CalendarPage } from "./routes/CalendarPage";
import { PagesPage } from "./routes/PagesPage";
import { SettingsPage } from "./routes/SettingsPage";
import { moduleManifests } from "./modules.config";
import "./shell/shell.css";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CalendarPage />} />
      <Route path="/pages" element={<PagesPage />} />
      <Route path="/pages/:pageId" element={<PagesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      {moduleManifests.flatMap((mod) =>
        mod.routes.map((route) => (
          <Route key={`${mod.id}-${route.path}`} path={route.path} element={<route.component />} />
        )),
      )}
    </Routes>
  );
}

export default function App() {
  const { data: themes } = useThemes();
  const { data: activeThemeId } = useActiveThemeId();
  const setActiveThemeId = useSetActiveThemeId();

  const activeTheme = useMemo<DsTheme | undefined>(() => {
    if (!themes || themes.length === 0) return undefined;
    const found = activeThemeId ? themes.find((t) => t.id === activeThemeId) : undefined;
    const chosen = found ?? themes.find((t) => !t.isDark) ?? themes[0];
    return {
      id: chosen.id,
      name: chosen.name,
      isDark: chosen.isDark,
      isBuiltin: chosen.isBuiltin,
      tokens: chosen.tokens,
    };
  }, [themes, activeThemeId]);

  useEffect(() => {
    document.title = "doit";
  }, []);

  if (!activeTheme) {
    return null;
  }

  return (
    <ThemeProvider theme={activeTheme} onThemeChange={(theme) => setActiveThemeId.mutate(theme.id)}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </ThemeProvider>
  );
}
