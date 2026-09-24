import { Briefcase, Puzzle, Users, Wallet, type LucideIcon } from "lucide-react";

const REGISTRY: Record<string, LucideIcon> = { Wallet, Users, Puzzle, Briefcase };

export function resolveModuleIcon(name: string): LucideIcon {
  return REGISTRY[name] ?? Puzzle;
}
