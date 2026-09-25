import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";

import {
  formatPokemonType,
  getPokemonTypeColor,
  getPokemonTypeTextColor,
  radius,
  spacing,
  typography,
} from "@/theme";

export interface TypeBadgeProps {
  /** Raw type name returned by the PokéAPI, such as `fire`. */
  type: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/** Selo de tipo reutilizável; ex.: "fire" recebe cor e nome legíveis. */
export function TypeBadge({ type, style, textStyle }: TypeBadgeProps) {
  const label = formatPokemonType(type);

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label} type`}
      style={[
        styles.badge,
        {
          backgroundColor: getPokemonTypeColor(type),
        },
        style,
      ]}
    >
      <Text
        selectable
        style={[
          styles.label,
          {
            color: getPokemonTypeTextColor(type),
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderCurve: "continuous",
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: "700",
  },
});
