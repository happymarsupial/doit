import type { ModuleManifest } from "@doit/module-sdk";
import { financeCoreManifest } from "@doit/finance-core";
import { freelanceManifest } from "@doit/freelance";

/**
 * Registering a business module only means adding an entry here — the
 * shell reads this array to build the sidebar and routes without any
 * change to core code. finance-core (Fase 2) is the first real one;
 * verticals (bakery, retail, freelance) depend on it and register the
 * same way in later phases.
 */
export const moduleManifests: ModuleManifest[] = [financeCoreManifest, freelanceManifest];
