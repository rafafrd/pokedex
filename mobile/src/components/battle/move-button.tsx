import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BattleMoveState } from "@/battle/contracts";
import { colors, getPokemonTypeTextColor, getPokemonTypeVisual, radius, spacing, typography } from "@/theme";

export interface MoveButtonProps {
  moveState: BattleMoveState;
  disabled?: boolean;
  onPress: (moveState: BattleMoveState) => void;
}

function formatMoveName(name: string): string {
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const TYPE_NAMES_PT = {
  normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico", grass: "Grama", ice: "Gelo",
  fighting: "Lutador", poison: "Venenoso", ground: "Terrestre", flying: "Voador", psychic: "Psíquico",
  bug: "Inseto", rock: "Pedra", ghost: "Fantasma", dragon: "Dragão", dark: "Sombrio", steel: "Aço", fairy: "Fada",
} as const;

export function MoveButton({ moveState, disabled = false, onPress }: MoveButtonProps) {
  const move = moveState.move;
  const noPp = moveState.kind === "regular" && moveState.currentPp <= 0;
  const isDisabled = disabled || noPp;
  const typeVisual = getPokemonTypeVisual(move.type);
  const translatedType = TYPE_NAMES_PT[move.type];
  const ppLabel = moveState.kind === "regular"
    ? `PP ${moveState.currentPp}/${move.maxPp}`
    : "Sem custo de PP";
  const accessibilityLabel = `${formatMoveName(move.name)}, tipo ${translatedType}, poder ${move.power}, ${ppLabel}${isDisabled ? ", indisponível" : ""}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => onPress(moveState)}
      style={({ pressed }) => [styles.button, isDisabled && styles.disabled, pressed && !isDisabled && styles.pressed]}
    >
      <View style={styles.topRow}>
        <Text numberOfLines={1} style={styles.name}>{formatMoveName(move.name)}</Text>
        <Text style={styles.power}>POD {move.power}</Text>
      </View>
      <View style={styles.bottomRow}>
        <View style={[styles.typeBadge, { backgroundColor: typeVisual.background }]}>
          <Text style={[styles.typeText, { color: getPokemonTypeTextColor(move.type) }]}>{translatedType}</Text>
        </View>
        <Text style={styles.pp}>{ppLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 74,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    backgroundColor: colors.cardSurface,
    transform: [{ scale: 0.985 }],
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between",
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
    fontWeight: "700",
  },
  power: {
    ...typography.overline,
    color: colors.textSecondary,
  },
  bottomRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  typeText: {
    ...typography.overline,
    fontSize: 10,
  },
  pp: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
