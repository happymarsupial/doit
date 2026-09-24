import { useEffect, useState } from "react";
import { applyTokensToRoot, useTheme, type ThemeTokens } from "@doit/design-system";
import { useActiveThemeId, useCreateTheme, useSetActiveThemeId, useThemes } from "@doit/core-data";
import { Button, Input, Panel } from "@doit/design-system";
import "./settings.css";

export function SettingsPage() {
  const { theme: activeTheme } = useTheme();
  const { data: themes } = useThemes();
  const { data: activeThemeId } = useActiveThemeId();
  const setActiveThemeId = useSetActiveThemeId();
  const createTheme = useCreateTheme();

  const [draft, setDraft] = useState<ThemeTokens>(activeTheme.tokens);
  const [draftIsDark, setDraftIsDark] = useState(activeTheme.isDark);
  const [name, setName] = useState("Mi tema");

  useEffect(() => {
    setDraft(activeTheme.tokens);
    setDraftIsDark(activeTheme.isDark);
  }, [activeTheme.id]);

  useEffect(() => {
    applyTokensToRoot(draft, draftIsDark);
    return () => applyTokensToRoot(activeTheme.tokens, activeTheme.isDark);
  }, [draft, draftIsDark]);

  function updateDraft(patch: Partial<ThemeTokens>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  async function saveAsNewTheme() {
    const created = await createTheme.mutateAsync({
      name: name.trim() || "Mi tema",
      isDark: draftIsDark,
      tokens: draft,
    });
    setActiveThemeId.mutate(created.id);
  }

  return (
    <div className="settings-page">
      <h1>Ajustes</h1>

      <section>
        <h2>Temas</h2>
        <div className="settings-theme-list">
          {(themes ?? []).map((t) => (
            <button
              key={t.id}
              className={`settings-theme-chip ${t.id === activeThemeId ? "active" : ""}`}
              onClick={() => setActiveThemeId.mutate(t.id)}
              style={{ background: t.tokens.color.accent }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Personalizar</h2>
        <Panel className="settings-editor">
          <label className="ds-field">
            <span>Nombre del tema</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="ds-field">
            <span>Modo</span>
            <div className="settings-mode-toggle">
              <button
                className={!draftIsDark ? "active" : ""}
                onClick={() => setDraftIsDark(false)}
                type="button"
              >
                Claro
              </button>
              <button
                className={draftIsDark ? "active" : ""}
                onClick={() => setDraftIsDark(true)}
                type="button"
              >
                Oscuro
              </button>
            </div>
          </label>

          <label className="ds-field">
            <span>Color de acento</span>
            <input
              type="color"
              value={draft.color.accent}
              onChange={(e) => updateDraft({ color: { ...draft.color, accent: e.target.value } })}
            />
          </label>

          <label className="ds-field">
            <span>Radio de esquinas ({draft.radius.lg}px)</span>
            <input
              type="range"
              min={4}
              max={32}
              value={draft.radius.lg}
              onChange={(e) => {
                const lg = Number(e.target.value);
                updateDraft({ radius: { ...draft.radius, lg, xl: lg + 8 } });
              }}
            />
          </label>

          <label className="ds-field">
            <span>Intensidad de vidrio ({draft.blur.panel}px)</span>
            <input
              type="range"
              min={0}
              max={40}
              value={draft.blur.panel}
              onChange={(e) => updateDraft({ blur: { panel: Number(e.target.value) } })}
            />
          </label>

          <Button onClick={saveAsNewTheme}>Guardar como nuevo tema</Button>
        </Panel>
      </section>
    </div>
  );
}
