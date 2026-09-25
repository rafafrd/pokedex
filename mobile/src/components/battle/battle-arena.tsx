import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import type { BattleCombatant, BattleMoveState, BattleSide } from "@/battle/contracts";
import { BattleLog } from "./battle-log";
import type { BattleLogItem } from "./battle-log";
import { BattleResult } from "./battle-result";
import type { BattleOutcome } from "./battle-result";
import { BattleSprite } from "./battle-sprite";
import { HealthBar } from "./health-bar";
import { MoveButton } from "./move-button";
import { colors, getPokemonTypeVisual, radius, spacing, typography } from "@/theme";

export interface BattleArenaProps {
  player: BattleCombatant;
  opponent: BattleCombatant;
  /** Moves currently offered by the controller, including emergency only when allowed. */
  availableMoves: readonly BattleMoveState[];
  onMove: (move: BattleMoveState) => void;
  inputBlocked?: boolean;
  logItems?: readonly BattleLogItem[];
  outcome?: BattleOutcome | null;
  onRematch?: () => void;
  onBack?: () => void;
  /** Increment for each resolved hit to animate the receiving side's sprite. */
  hitSequence?: number;
  hitSide?: BattleSide;
}

function PokemonInfo({ combatant, side }: { combatant: BattleCombatant; side: BattleSide }) {
  const types = combatant.definition.types;
  const name = combatant.definition.name.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeading}>
        <Text numberOfLines={1} style={styles.pokemonName}>{name}</Text>
        <Text style={styles.level}>Nív. {combatant.definition.level}</Text>
      </View>
      <View style={styles.typeRow}>
        {types.map((type) => {
          const visual = getPokemonTypeVisual(type);
          const translatedType = TYPE_NAMES_PT[type];
          return (
            <View key={`${side}-${type}`} style={[styles.typeBadge, { backgroundColor: visual.background }]}>
              <Text style={[styles.typeText, { color: visual.foreground }]}>{translatedType}</Text>
            </View>
          );
        })}
      </View>
      <HealthBar currentHp={combatant.currentHp} maxHp={combatant.maxHp} name={name} />
    </View>
  );
}

const TYPE_NAMES_PT = {
  normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico", grass: "Grama", ice: "Gelo",
  fighting: "Lutador", poison: "Venenoso", ground: "Terrestre", flying: "Voador", psychic: "Psíquico",
  bug: "Inseto", rock: "Pedra", ghost: "Fantasma", dragon: "Dragão", dark: "Sombrio", steel: "Aço", fairy: "Fada",
} as const;

export function BattleArena({
  player,
  opponent,
  availableMoves,
  onMove,
  inputBlocked = false,
  logItems = [],
  outcome = null,
  onRematch,
  onBack,
  hitSequence = 0,
  hitSide,
}: BattleArenaProps) {
  const { width } = useWindowDimensions();
  const spriteSize = Math.max(104, Math.min(164, width * 0.34));
  const playerOffset = useRef(new Animated.Value(0)).current;
  const opponentOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hitSequence || !hitSide) return;
    const target = hitSide === "player" ? playerOffset : opponentOffset;
    target.stopAnimation();
    target.setValue(0);
    Animated.sequence([
      Animated.timing(target, { toValue: 7, duration: 45, useNativeDriver: true }),
      Animated.timing(target, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(target, { toValue: 4, duration: 45, useNativeDriver: true }),
      Animated.timing(target, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [hitSequence, hitSide, opponentOffset, playerOffset]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
      <View style={styles.arena}>
        <View style={styles.enemyLine}>
          <PokemonInfo combatant={opponent} side="opponent" />
          <Animated.View style={{ transform: [{ translateX: opponentOffset }] }}>
            <BattleSprite name={opponent.definition.name} side="opponent" size={spriteSize} sprites={opponent.definition.sprites} />
          </Animated.View>
        </View>
        <View style={styles.ground} />
        <View style={styles.playerLine}>
          <Animated.View style={{ transform: [{ translateX: playerOffset }] }}>
            <BattleSprite name={player.definition.name} side="player" size={spriteSize} sprites={player.definition.sprites} />
          </Animated.View>
          <PokemonInfo combatant={player} side="player" />
        </View>
      </View>

      {outcome && onRematch && onBack ? (
        <BattleResult onBack={onBack} onRematch={onRematch} outcome={outcome} />
      ) : (
        <View style={styles.controls}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Escolha um golpe</Text>
          <View style={styles.moveGrid}>
            {availableMoves.map((moveState) => (
              <View key={`${moveState.kind}-${moveState.move.id}`} style={styles.moveCell}>
                <MoveButton disabled={inputBlocked} moveState={moveState} onPress={onMove} />
              </View>
            ))}
          </View>
        </View>
      )}
      <BattleLog items={logItems} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    alignSelf: "center",
    gap: spacing.md,
    maxWidth: 720,
    padding: spacing.md,
    width: "100%",
  },
  arena: {
    backgroundColor: "#DDEAF4",
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: "space-between",
    minHeight: 350,
    overflow: "hidden",
    padding: spacing.md,
  },
  enemyLine: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 150,
  },
  playerLine: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 150,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    maxWidth: "68%",
    padding: spacing.md,
  },
  infoHeading: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between",
  },
  pokemonName: {
    ...typography.title,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  level: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
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
  ground: {
    alignSelf: "center",
    backgroundColor: "#C2D7E7",
    borderRadius: radius.pill,
    height: 16,
    position: "absolute",
    top: "50%",
    width: "84%",
  },
  controls: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.deepBlue,
  },
  moveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  moveCell: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 140,
  },
});
