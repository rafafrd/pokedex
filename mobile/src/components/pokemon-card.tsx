import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getBestPokemonSpriteUrl } from "@/api";
import type { PokemonSummary } from "@/types/pokemon";
import {
  colors,
  formatPokemonType,
  radius,
  shadows,
  spacing,
  typography,
} from "@/theme";
import type { AppThemePalette } from "@/theme";

import { PokemonArtwork } from "./pokemon-artwork";
import { TypeBadge } from "./type-badge";

export interface PokemonCardProps {
  pokemon: PokemonSummary;
  onPress: (pokemon: PokemonSummary) => void;
  index?: number;
  style?: StyleProp<ViewStyle>;
  /** The selected global theme for the catalogue surface. */
  theme?: AppThemePalette;
}

function formatName(name: string): string {
  return name
    .trim()
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** A tappable, reusable summary tile for a Pokémon list or grid. */
export function PokemonCard({ pokemon, onPress, index, style, theme }: PokemonCardProps) {
  const displayName = formatName(pokemon.name);
  const artworkUri = getBestPokemonSpriteUrl(pokemon.sprites);
  const typeLabels = pokemon.types?.map(formatPokemonType).join(", ") || "Unknown type";
  const testID = index === undefined ? undefined : `pokemon-card-${index}`;

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, number ${pokemon.id}, ${typeLabels}`}
      accessibilityHint="Opens this Pokémon's details"
      accessibilityState={{ disabled: false }}
      onPress={() => onPress(pokemon)}
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        theme && {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        pressed && styles.cardPressed,
        pressed && theme && { backgroundColor: theme.surfaceMuted, borderColor: theme.accent },
        style,
      ]}
    >
      <View pointerEvents="none" style={styles.header}>
        <Text selectable style={[styles.number, theme && { color: theme.accent }]}>
          #{String(pokemon.id).padStart(3, "0")}
        </Text>
      </View>

      <PokemonArtwork name={pokemon.name} size={128} uri={artworkUri} />

      <Text numberOfLines={1} selectable style={[styles.name, theme && { color: theme.text }]}>
        {displayName}
      </Text>

      <View pointerEvents="none" style={styles.typeRow}>
        {pokemon.types?.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    boxShadow: shadows.card,
    gap: spacing.sm,
    minHeight: 244,
    padding: spacing.lg,
  },
  cardPressed: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.commandRed,
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 18,
    width: "100%",
  },
  number: {
    ...typography.overline,
    color: colors.commandRed,
  },
  name: {
    ...typography.title,
    color: colors.deepBlue,
    maxWidth: "100%",
    textAlign: "center",
  },
  typeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center",
    width: "100%",
  },
});
