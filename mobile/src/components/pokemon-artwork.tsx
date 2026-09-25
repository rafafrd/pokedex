import { useEffect, useState } from "react";
import type { ImageStyle, StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import { getBestPokemonSpriteUrl } from "@/api";
import { colors, radius, typography } from "@/theme";
import type { PokemonSpriteSet } from "@/types/pokemon";

export interface PokemonArtworkProps {
  /** Artwork URL. A missing or failed URL renders an accessible placeholder. */
  uri: string | null | undefined;
  /** Pokémon name used for the image's accessible label. */
  name: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
  /** Optional sprite set fallback for detail views that already have sprites. */
  sprites?: Partial<PokemonSpriteSet>;
}

function formatName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Pokémon";
  }

  return trimmed
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initialsFor(name: string): string {
  const words = formatName(name).split(" ").filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

/** Displays the preferred API sprite while keeping broken/empty remote URLs graceful. */
export function PokemonArtwork({
  uri,
  name,
  size = 120,
  style,
  sprites,
}: PokemonArtworkProps) {
  const [hasError, setHasError] = useState(false);
  const displayName = formatName(name);
  const resolvedUri =
    uri ??
    (sprites
      ? getBestPokemonSpriteUrl({
          animated: sprites.animated ?? null,
          showdown: sprites.showdown ?? null,
          artwork: sprites.artwork ?? null,
          front: sprites.front ?? null,
        })
      : null);
  const artworkSize = Math.max(1, size);

  useEffect(() => {
    setHasError(false);
  }, [resolvedUri]);

  if (!resolvedUri || hasError) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${displayName} artwork unavailable`}
        style={[
          styles.placeholder,
          { width: artworkSize, height: artworkSize },
          style as StyleProp<ViewStyle>,
        ]}
      >
        <Text selectable style={styles.placeholderText}>
          {initialsFor(name)}
        </Text>
      </View>
    );
  }

  return (
    <Image
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${displayName} artwork`}
      cachePolicy="memory-disk"
      contentFit="contain"
      onError={() => setHasError(true)}
      source={{ uri: resolvedUri }}
      style={[styles.image, { width: artworkSize, height: artworkSize }, style]}
      transition={180}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: "center",
  },
  placeholder: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.cardSurface,
    borderColor: colors.cardBorder,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: "center",
  },
  placeholderText: {
    ...typography.title,
    color: colors.textMuted,
  },
});
