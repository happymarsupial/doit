import type { ModuleManifest } from "@doit/module-sdk";
import { CajaPage } from "./routes/CajaPage";
import { DeudoresPage } from "./routes/DeudoresPage";

export const financeCoreManifest: ModuleManifest = {
  id: "finance-core",
  name: "Finanzas",
  icon: "Wallet",
  version: "0.1.0",
  sidebarEntries: [
    { id: "caja", label: "Caja", icon: "Wallet", path: "/finance/caja" },
    { id: "deudores", label: "Deudores", icon: "Users", path: "/finance/deudores" },
  ],
  routes: [
    { path: "/finance/caja", component: CajaPage },
    { path: "/finance/deudores", component: DeudoresPage },
  ],
};
