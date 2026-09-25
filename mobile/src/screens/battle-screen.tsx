import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { BattleEvent, BattleSide } from "@/battle/contracts";
import { useBattle } from "@/battle/use-battle";
import { useBattleData } from "@/battle/use-battle-data";
import { BattleArena } from "@/components/battle/battle-arena";
import { colors, radius, spacing, typography } from "@/theme";

export interface BattleScreenProps {
  playerId: string;
  opponentId: string;
}

function StatePanel({
  title,
  message,
  loading = false,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.statePanel}>
      {loading ? <ActivityIndicator accessibilityLabel={title} color={colors.commandRed} size="large" /> : null}
      <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voltar para a seleção de Pokémon"
      onPress={onPress}
      style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
    >
      <Text style={styles.backButtonLabel}>‹  Voltar</Text>
    </Pressable>
  );
}

function ReadyBattle({
  player,
  opponent,
  typeRelations,
  onBack,
}: {
  player: NonNullable<ReturnType<typeof useBattleData>["player"]>;
  opponent: NonNullable<ReturnType<typeof useBattleData>["opponent"]>;
  typeRelations: ReturnType<typeof useBattleData>["typeRelations"];
  onBack: () => void;
}) {
  const battle = useBattle({ player, opponent, typeRelations });
  const outcome = battle.winner === null
    ? null
    : battle.winner === "player"
      ? "win"
      : "loss";
  const damageEvents = useMemo(
    () => battle.eventHistory.filter((event): event is Extract<BattleEvent, { type: "damage" }> => event.type === "damage"),
    [battle.eventHistory],
  );
  const latestDamage = damageEvents[damageEvents.length - 1];
  const hitSide: BattleSide | undefined = latestDamage?.target;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.readyScreen}>
      <View style={styles.topBar}>
        <BackButton onPress={onBack} />
        <Text accessibilityRole="header" style={styles.screenTitle}>Arena</Text>
        <Text style={styles.turnNumber}>Turno {battle.state.turnNumber}</Text>
      </View>
      {battle.actionError ? (
        <Text accessibilityRole="alert" style={styles.actionError}>{battle.actionError.message}</Text>
      ) : null}
      <BattleArena
        player={battle.player}
        opponent={battle.opponent}
        availableMoves={battle.availableMoves}
        onMove={battle.selectMove}
        inputBlocked={!battle.canSelectMove || battle.isResolving}
        logItems={battle.eventHistory}
        outcome={outcome}
        onRematch={battle.rematch}
        onBack={onBack}
        hitSequence={damageEvents.length}
        hitSide={hitSide}
      />
    </SafeAreaView>
  );
}

export function BattleScreen({ playerId, opponentId }: BattleScreenProps) {
  const router = useRouter();
  const data = useBattleData(playerId, opponentId);
  const goToSelection = () => router.replace("/battle");

  if (data.isReady && data.player !== null && data.opponent !== null) {
    return (
      <ReadyBattle
        player={data.player}
        opponent={data.opponent}
        typeRelations={data.typeRelations}
        onBack={goToSelection}
      />
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.preparationScreen}>
      <View style={styles.topBar}>
        <BackButton onPress={goToSelection} />
        <Text accessibilityRole="header" style={styles.screenTitle}>Preparação</Text>
        <View style={styles.topBarSpacer} />
      </View>
      {data.isError ? (
        <StatePanel
          title="Não foi possível preparar a batalha"
          message={data.error?.message ?? "Confira sua conexão e tente novamente."}
          actionLabel="Tentar novamente"
          onAction={() => void data.retry()}
        />
      ) : (
        <StatePanel
          title="Preparando batalha…"
          message="Carregando os combatentes e os dados necessários para a arena."
          loading
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  preparationScreen: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  readyScreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  screenTitle: {
    ...typography.title,
    color: colors.deepBlue,
  },
  turnNumber: {
    ...typography.caption,
    color: colors.textSecondary,
    minWidth: 70,
    textAlign: "right",
  },
  topBarSpacer: {
    minWidth: 70,
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  backButtonLabel: {
    ...typography.caption,
    color: colors.deepBlue,
    fontWeight: "800",
  },
  statePanel: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    justifyContent: "center",
    maxWidth: 560,
    minHeight: 240,
    padding: spacing.xl,
    width: "100%",
  },
  stateTitle: {
    ...typography.title,
    color: colors.deepBlue,
    textAlign: "center",
  },
  stateMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.commandRed,
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: spacing.xs,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonLabel: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800",
  },
  actionError: {
    ...typography.caption,
    color: colors.commandRed,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
});
