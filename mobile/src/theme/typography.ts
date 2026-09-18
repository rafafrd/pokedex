import { StyleSheet } from "react-native";

/**
 * Text roles used by the shared components. System fonts keep the UI native
 * on both iOS and Android and inherit the user's dynamic type settings.
 */
export const typography = StyleSheet.create({
  overline: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  caption: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  body: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  display: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
});
