import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BattleScreen } from "@/screens/battle-screen";
import { colors, radius, spacing, typography } from "@/theme";

function parsePokemonId(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const numericId = Number(value);
  return Number.isSafeInteger(numericId) ? value : null;
}

function InvalidRoute() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.title}>Rota de batalha inválida</Text>
      <Text style={styles.message}>
        Os identificadores do jogador e do adversário precisam ser números inteiros positivos.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar para a seleção de Pokémon"
        onPress={() => router.replace("/battle")}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Text style={styles.backButtonLabel}>Voltar para a seleção</Text>
      </Pressable>
    </SafeAreaView>
  );
}

export default function BattleFightRoute() {
  const { playerId, opponentId } = useLocalSearchParams<{
    playerId?: string | string[];
    opponentId?: string | string[];
  }>();
  const validPlayerId = parsePokemonId(playerId);
  const validOpponentId = parsePokemonId(opponentId);

  if (validPlayerId === null || validOpponentId === null) return <InvalidRoute />;

  return <BattleScreen playerId={validPlayerId} opponentId={validOpponentId} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.deepBlue,
    textAlign: "center",
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 480,
    textAlign: "center",
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.commandRed,
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  backButtonLabel: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.75,
  },
});
