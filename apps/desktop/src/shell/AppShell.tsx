import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { CalendarDays, FileText, Settings } from "lucide-react";
import { moduleManifests } from "../modules.config";
import { resolveModuleIcon } from "./icon-registry";
import { TitleBar } from "./TitleBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell-root">
      <TitleBar />
      <div className="shell">
        <nav className="shell-sidebar">
          <NavItem to="/" icon={<CalendarDays size={18} />} label="Calendario" />
          <NavItem to="/pages" icon={<FileText size={18} />} label="Páginas" />
          {moduleManifests.flatMap((mod) =>
            mod.sidebarEntries.map((entry) => {
              const Icon = resolveModuleIcon(entry.icon);
              return (
                <NavItem key={entry.id} to={entry.path} icon={<Icon size={18} />} label={entry.label} />
              );
            }),
          )}
          <div style={{ flex: 1 }} />
          <NavItem to="/settings" icon={<Settings size={18} />} label="Ajustes" />
        </nav>
        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink to={to} className={({ isActive }) => `shell-nav-item ${isActive ? "active" : ""}`}>
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
