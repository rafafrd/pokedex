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
  const accessibilityHint = noPp
    ? "Este golpe está sem PP."
    : disabled
      ? "Aguarde a resolução da jogada."
      : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => onPress(moveState)}
      style={({ pressed }) => [
        styles.button,
        { borderLeftColor: typeVisual.background },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <Text numberOfLines={1} style={styles.name}>{formatMoveName(move.name)}</Text>
        <View style={[styles.typeBadge, { backgroundColor: typeVisual.background }]}>
          <Text style={[styles.typeText, { color: getPokemonTypeTextColor(move.type) }]}>{translatedType}</Text>
        </View>
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.power}>POD {move.power}</Text>
        <Text style={styles.pp}>{ppLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderLeftWidth: 5,
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.xs,
    minHeight: 80,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    shadowColor: colors.deepBlueStrong,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabled: {
    backgroundColor: colors.cardSurface,
    elevation: 0,
    opacity: 0.46,
  },
  pressed: {
    backgroundColor: "#EDF5FA",
    transform: [{ scale: 0.97 }, { translateY: 1 }],
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxs,
    justifyContent: "space-between",
  },
  name: {
    ...typography.caption,
    color: colors.textPrimary,
    flexShrink: 1,
    fontWeight: "700",
  },
  power: {
    ...typography.caption,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  bottomRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  typeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.35,
  },
  pp: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
});
