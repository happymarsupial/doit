import type { ComponentType } from "react";

export interface SidebarEntry {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export interface RouteDefinition {
  path: string;
  component: ComponentType;
}

export interface ModuleManifest {
  id: string;
  name: string;
  icon: string;
  version: string;
  dependsOn?: string[];
  sidebarEntries: SidebarEntry[];
  routes: RouteDefinition[];
  requiredPlanFeature?: string;
}
