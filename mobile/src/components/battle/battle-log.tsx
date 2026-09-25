import { StyleSheet, Text, View } from "react-native";

import type { BattleEvent } from "@/battle/contracts";
import { colors, radius, spacing, typography } from "@/theme";

export type BattleLogItem = BattleEvent | string;

export interface BattleLogProps {
  items: readonly BattleLogItem[];
  title?: string;
  maxHeight?: number;
}

function prettyName(name: string): string {
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sideName(side: "player" | "opponent"): string {
  return side === "player" ? "Você" : "O adversário";
}

/** Turns domain facts into short, presentational messages for the battle log. */
export function formatBattleLogItem(item: BattleLogItem): string {
  if (typeof item === "string") return item;

  switch (item.type) {
    case "move-used":
      return `${sideName(item.actor)} usou ${prettyName(item.move.name)}.`;
    case "miss":
      return `${sideName(item.actor)} errou o golpe ${prettyName(item.move.name)}.`;
    case "critical-hit":
      return "Acerto crítico!";
    case "damage":
      return `${sideName(item.target)} recebeu ${item.amount} de dano.`;
    case "super-effective":
      return "É super efetivo!";
    case "not-very-effective":
      return "Não é muito efetivo.";
    case "immune":
      return "Não teve efeito.";
    case "fainted":
      return item.side === "player" ? "Seu Pokémon foi derrotado." : "O Pokémon adversário foi derrotado.";
    case "battle-ended":
      return item.winner === "player" ? "Você venceu a batalha!" : "Você perdeu a batalha.";
  }
}

export function BattleLog({ items, title = "Últimas jogadas", maxHeight = 112 }: BattleLogProps) {
  const recentItems = items.slice(-3);
  return (
    <View accessibilityLabel={title} style={[styles.container, { maxHeight }]}>
      <View style={styles.headingRow}>
        <View style={styles.indicator} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.messages}>
        {recentItems.length === 0 ? (
          <Text accessibilityLiveRegion="polite" style={styles.latest}>Escolha um golpe para começar.</Text>
        ) : recentItems.map((item, index) => {
          const isLatest = index === recentItems.length - 1;
          return (
            <Text
              accessibilityLiveRegion={isLatest ? "polite" : undefined}
              key={`${index}-${typeof item === "string" ? item : item.type}`}
              numberOfLines={isLatest ? 2 : 1}
              style={[styles.entry, isLatest ? styles.latest : styles.previous]}
            >
              {formatBattleLogItem(item)}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFDF7",
    borderColor: colors.deepBlue,
    borderRadius: radius.md,
    borderWidth: 2,
    elevation: 2,
    gap: spacing.xs,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.deepBlueStrong,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  headingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  indicator: {
    backgroundColor: colors.commandRed,
    borderRadius: radius.pill,
    height: 7,
    width: 7,
  },
  title: {
    ...typography.overline,
    color: colors.textSecondary,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  messages: {
    gap: 1,
  },
  entry: {
    ...typography.caption,
    paddingVertical: 1,
  },
  previous: {
    color: colors.textSecondary,
    opacity: 0.72,
  },
  latest: {
    ...typography.body,
    color: colors.deepBlueStrong,
    fontWeight: "700",
  },
});
