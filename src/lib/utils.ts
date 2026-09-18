import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class lists safely (later classes override earlier,
 * conflicting ones instead of just concatenating). Standard helper required
 * by the Spell UI components adapted under `src/components/spell-ui`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
