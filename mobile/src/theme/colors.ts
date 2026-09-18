/**
 * Core visual palette for the mobile Pokédex.
 *
 * Keeping these values in one place makes the cards and controls feel like
 * one product while still leaving room for screens to compose their own
 * layouts.
 */
export const colors = {
  deepBlue: "#102A43",
  deepBlueStrong: "#0B1F3A",
  commandRed: "#D7263D",
  commandRedDark: "#B51F33",

  background: "#EAF2F9",
  canvas: "#EAF2F9",
  card: "#FFFFFF",
  cardSurface: "#F7FAFC",
  surface: "#FFFFFF",
  surfaceElevated: "#F7FAFC",
  cardBorder: "#D9E2EC",
  border: "#D9E2EC",

  textPrimary: "#102A43",
  text: "#102A43",
  textSecondary: "#486581",
  textMuted: "#829AB1",
  muted: "#829AB1",
  accent: "#D7263D",
  accentSoft: "#FBE7EA",
  track: "#D9E2EC",
  white: "#FFFFFF",
  black: "#102A43",
  transparent: "transparent",
} as const;

export type ColorToken = (typeof colors)[keyof typeof colors];
