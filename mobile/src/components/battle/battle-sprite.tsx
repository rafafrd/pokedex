import { useEffect, useMemo, useState } from "react";
import type { ImageStyle, StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import type { BattleSide, BattleSpriteSet } from "@/battle/contracts";
import { colors, radius, typography } from "@/theme";

export interface BattleSpriteProps {
  name: string;
  sprites: BattleSpriteSet;
  side: BattleSide;
  size?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

function displayName(name: string): string {
  return name
    .trim()
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Pokémon";
}

/** Chooses a side-appropriate sprite and advances when an image URL fails. */
export function BattleSprite({
  name,
  sprites,
  side,
  size = 132,
  style,
  containerStyle,
}: BattleSpriteProps) {
  const candidates = useMemo(() => {
    const urls = side === "opponent"
      ? [sprites.animatedFront, sprites.showdownFront, sprites.staticFront, sprites.officialArtwork]
      : [sprites.animatedBack, sprites.showdownBack, sprites.staticBack, sprites.staticFront, sprites.officialArtwork];
    return urls.filter((url): url is string => Boolean(url));
  }, [side, sprites]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidates]);

  const source = candidates[candidateIndex];
  const safeSize = Math.max(1, size);
  const label = `${displayName(name)} ${side === "player" ? "do jogador" : "do adversário"}`;

  if (!source) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${label}; imagem indisponível`}
        style={[styles.placeholder, { width: safeSize, height: safeSize }, containerStyle]}
      >
        <Text style={styles.placeholderText}>{displayName(name).slice(0, 2).toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.frame, { width: safeSize, height: safeSize }, containerStyle]}>
      <Image
        accessible
        accessibilityRole="image"
        accessibilityLabel={label}
        cachePolicy="memory-disk"
        contentFit="contain"
        onError={() => setCandidateIndex((index) => Math.min(index + 1, candidates.length))}
        source={{ uri: source }}
        style={[styles.image, style]}
        transition={140}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.cardSurface,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: "center",
  },
  placeholderText: {
    ...typography.title,
    color: colors.textMuted,
  },
});
