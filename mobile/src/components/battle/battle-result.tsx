import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

export type BattleOutcome = "win" | "loss";

export interface BattleResultProps {
  outcome: BattleOutcome;
  onRematch: () => void;
  onBack: () => void;
  title?: string;
}

export function BattleResult({ outcome, onRematch, onBack, title }: BattleResultProps) {
  const won = outcome === "win";
  return (
    <View accessibilityRole="summary" style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{title ?? (won ? "Vitória!" : "Derrota")}</Text>
      <Text style={styles.message}>{won ? "Você venceu a batalha." : "Seus Pokémon lutaram bravamente."}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Começar uma revanche"
          onPress={onRematch}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>Revanche</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar da batalha"
          onPress={onBack}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>Voltar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
    width: "100%",
  },
  title: {
    ...typography.display,
    color: colors.deepBlue,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.xs,
    width: "100%",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.commandRed,
    borderRadius: radius.pill,
    flexGrow: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primaryText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.cardSurface,
    borderColor: colors.cardBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  secondaryText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
});
