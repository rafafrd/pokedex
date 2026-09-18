/**
 * New Architecture box-shadow values. Components can opt into a level
 * without scattering platform-specific shadow literals through the UI.
 */
export const shadows = {
  card: "0 2px 8px rgba(16, 42, 67, 0.10)",
  raised: "0 6px 18px rgba(16, 42, 67, 0.16)",
} as const;
