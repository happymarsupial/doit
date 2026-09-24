export type Plan = "free" | "pro";

/**
 * Stub for Fase 1: no network calls, no cached JWT yet. Every feature is
 * unlocked locally so the core engine and business modules can be built
 * and tested without a licensing backend. Fase 5 replaces this module's
 * internals (Ed25519 JWT cache + background refresh) without changing
 * this public surface, so callers never need to change.
 */
export function getPlan(): Plan {
  return "free";
}

export function hasFeature(_feature: string): boolean {
  return true;
}
