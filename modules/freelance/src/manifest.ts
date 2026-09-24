import type { ModuleManifest } from "@doit/module-sdk";
import { ClientesPage } from "./routes/ClientesPage";
import { ProyectoPage } from "./routes/ProyectoPage";

export const freelanceManifest: ModuleManifest = {
  id: "freelance",
  name: "Freelance",
  icon: "Briefcase",
  version: "0.1.0",
  dependsOn: ["finance-core"],
  sidebarEntries: [{ id: "clientes", label: "Clientes", icon: "Briefcase", path: "/freelance/clientes" }],
  routes: [
    { path: "/freelance/clientes", component: ClientesPage },
    { path: "/freelance/proyectos/:projectId", component: ProyectoPage },
  ],
};
