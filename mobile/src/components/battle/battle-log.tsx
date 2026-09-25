import { ScrollView, StyleSheet, Text, View } from "react-native";

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

export function BattleLog({ items, title = "Registro da batalha", maxHeight = 132 }: BattleLogProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        accessibilityLabel={title}
        nestedScrollEnabled
        style={[styles.scroll, { maxHeight }]}
      >
        {items.length === 0 ? (
          <Text style={styles.empty}>Escolha um golpe para começar.</Text>
        ) : items.map((item, index) => (
          <Text key={`${index}-${typeof item === "string" ? item : item.type}`} style={styles.entry}>
            {formatBattleLogItem(item)}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  title: {
    ...typography.overline,
    color: colors.textSecondary,
  },
  scroll: {
    flexGrow: 0,
  },
  entry: {
    ...typography.caption,
    color: colors.textPrimary,
    paddingVertical: spacing.xxs,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
    paddingVertical: spacing.xxs,
  },
});
