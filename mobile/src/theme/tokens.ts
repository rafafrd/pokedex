import { colors } from "./colors";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { spacing } from "./spacing";
import { typography } from "./typography";

/** Grouped entry point for screens that prefer a single theme import. */
export const tokens = {
  colors,
  spacing,
  radius,
  radii: radius,
  shadows,
  typography,
} as const;

export { colors, radius, shadows, spacing, typography };
export default tokens;
