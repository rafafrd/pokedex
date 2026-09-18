export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export type RadiusToken = (typeof radius)[keyof typeof radius];
