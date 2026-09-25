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
      <View style={[styles.resultMark, { backgroundColor: won ? "#3C9B63" : colors.commandRed }]} />
      <Text style={styles.eyebrow}>BATALHA ENCERRADA</Text>
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
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderColor: "rgba(255, 255, 255, 0.82)",
    borderRadius: 24,
    borderWidth: 1,
    elevation: 8,
    gap: spacing.xs,
    maxWidth: 360,
    padding: spacing.lg,
    shadowColor: colors.deepBlueStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    width: "100%",
  },
  resultMark: {
    borderRadius: radius.pill,
    height: 8,
    marginBottom: spacing.xxs,
    width: 38,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 1.1,
  },
  title: {
    ...typography.display,
    color: colors.deepBlue,
    fontSize: 28,
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center",
    marginTop: spacing.sm,
    width: "100%",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.commandRed,
    borderRadius: radius.pill,
    flexGrow: 1,
    minHeight: 46,
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
    minHeight: 46,
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
