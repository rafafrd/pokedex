import { useEffect, useMemo, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import type { BattleCombatant, BattleEvent, BattleMoveState, BattleSide } from "@/battle/contracts";
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

const TYPE_NAMES_PT = {
  normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico", grass: "Grama", ice: "Gelo",
  fighting: "Lutador", poison: "Venenoso", ground: "Terrestre", flying: "Voador", psychic: "Psíquico",
  bug: "Inseto", rock: "Pedra", ghost: "Fantasma", dragon: "Dragão", dark: "Sombrio", steel: "Aço", fairy: "Fada",
} as const;

function pokemonName(name: string): string {
  return name.trim().replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PokemonInfo({ combatant, side }: { combatant: BattleCombatant; side: BattleSide }) {
  const name = pokemonName(combatant.definition.name);
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeading}>
        <Text numberOfLines={1} style={styles.pokemonName}>{name}</Text>
        <Text style={styles.level}>Nív. {combatant.definition.level}</Text>
      </View>
      <View style={styles.typeRow}>
        {combatant.definition.types.map((type) => {
          const visual = getPokemonTypeVisual(type);
          return (
            <View key={`${side}-${type}`} style={[styles.typeBadge, { backgroundColor: visual.background }]}>
              <Text style={[styles.typeText, { color: visual.foreground }]}>{TYPE_NAMES_PT[type]}</Text>
            </View>
          );
        })}
      </View>
      <HealthBar currentHp={combatant.currentHp} maxHp={combatant.maxHp} name={name} />
    </View>
  );
}

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
  const { width, height } = useWindowDimensions();
  const arenaHeight = Math.min(450, Math.max(320, height * 0.44));
  const contentWidth = Math.min(width, 520) - spacing.md * 2;
  const spriteSize = Math.min(216, Math.max(144, Math.min(width * 0.45, arenaHeight * 0.54)));
  const hudWidth = Math.min(250, contentWidth * 0.5);
  const playerShake = useRef(new Animated.Value(0)).current;
  const opponentShake = useRef(new Animated.Value(0)).current;
  const playerDash = useRef(new Animated.Value(0)).current;
  const opponentDash = useRef(new Animated.Value(0)).current;
  const playerFlash = useRef(new Animated.Value(0)).current;
  const opponentFlash = useRef(new Animated.Value(0)).current;
  const lastDamage = useMemo(
    () => [...logItems].reverse().find(
      (event): event is Extract<BattleEvent, { type: "damage" }> =>
        typeof event !== "string" && event.type === "damage",
    ),
    [logItems],
  );

  useEffect(() => {
    if (!hitSequence || !hitSide) return;

    const targetShake = hitSide === "player" ? playerShake : opponentShake;
    const targetFlash = hitSide === "player" ? playerFlash : opponentFlash;
    const attackerDash = lastDamage?.actor === "player" ? playerDash : opponentDash;
    const dashDistance = lastDamage?.actor === "player" ? 19 : -19;
    targetShake.stopAnimation();
    targetFlash.stopAnimation();
    attackerDash.stopAnimation();
    targetShake.setValue(0);
    targetFlash.setValue(0);
    attackerDash.setValue(0);

    const motion = Animated.parallel([
      Animated.sequence([
        Animated.timing(targetShake, { toValue: 5, duration: 42, useNativeDriver: true }),
        Animated.timing(targetShake, { toValue: -5, duration: 48, useNativeDriver: true }),
        Animated.timing(targetShake, { toValue: 2, duration: 42, useNativeDriver: true }),
        Animated.timing(targetShake, { toValue: 0, duration: 48, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(targetFlash, { toValue: 0.36, duration: 46, useNativeDriver: true }),
        Animated.timing(targetFlash, { toValue: 0, duration: 190, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(attackerDash, { toValue: dashDistance, duration: 78, useNativeDriver: true }),
        Animated.timing(attackerDash, { toValue: 0, duration: 112, useNativeDriver: true }),
      ]),
    ]);
    motion.start();
    return () => motion.stop();
  }, [hitSequence, hitSide, lastDamage?.actor, lastDamage?.move.type, opponentDash, opponentFlash, opponentShake, playerDash, playerFlash, playerShake]);

  const hitColor = lastDamage ? getPokemonTypeVisual(lastDamage.move.type).background : colors.commandRed;
  const showResult = outcome !== null && onRematch !== undefined && onBack !== undefined;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
      <LinearGradient
        accessibilityLabel="Campo de batalha"
        colors={["#C8E4F0", "#E9F4EC", "#D5E9D0"]}
        locations={[0, 0.58, 1]}
        style={[styles.arena, { height: arenaHeight }]}
      >
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.sunGlow} />
          <View style={styles.cloudOne} />
          <View style={styles.cloudTwo} />
          <View style={styles.farHill} />
          <View style={styles.field} />
          <View style={styles.opponentPlatform} />
          <View style={styles.playerPlatform} />
        </View>

        <View style={[styles.opponentHud, { width: hudWidth }]}>
          <PokemonInfo combatant={opponent} side="opponent" />
        </View>
        <Animated.View
          style={[
            styles.opponentSprite,
            { width: spriteSize, height: spriteSize },
            { transform: [{ translateX: opponentDash }, { translateX: opponentShake }] },
          ]}
        >
          <Animated.View pointerEvents="none" style={[styles.hitFlash, { backgroundColor: hitColor, opacity: opponentFlash }]} />
          <BattleSprite name={opponent.definition.name} side="opponent" size={spriteSize} sprites={opponent.definition.sprites} />
        </Animated.View>

        <View style={[styles.playerHud, { width: hudWidth }]}>
          <PokemonInfo combatant={player} side="player" />
        </View>
        <Animated.View
          style={[
            styles.playerSprite,
            { width: spriteSize, height: spriteSize },
            { transform: [{ translateX: playerDash }, { translateX: playerShake }] },
          ]}
        >
          <Animated.View pointerEvents="none" style={[styles.hitFlash, { backgroundColor: hitColor, opacity: playerFlash }]} />
          <BattleSprite name={player.definition.name} side="player" size={spriteSize} sprites={player.definition.sprites} />
        </Animated.View>

        {showResult ? (
          <View style={styles.resultOverlay}>
            <BattleResult onBack={onBack} onRematch={onRematch} outcome={outcome} />
          </View>
        ) : null}
      </LinearGradient>

      <BattleLog items={logItems} maxHeight={104} />
      {!showResult ? (
        <View style={styles.controls}>
          <View style={styles.commandHeading}>
            <View style={styles.commandMark} />
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {inputBlocked ? "Aguarde sua vez" : "Qual será o próximo golpe?"}
            </Text>
          </View>
          <View style={styles.moveGrid}>
            {availableMoves.map((moveState) => (
              <View key={`${moveState.kind}-${moveState.move.id}`} style={styles.moveCell}>
                <MoveButton disabled={inputBlocked} moveState={moveState} onPress={onMove} />
              </View>
            ))}
          </View>
        </View>
      ) : null}
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
    gap: spacing.sm,
    maxWidth: 520,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    width: "100%",
  },
  arena: {
    borderColor: "rgba(11, 31, 58, 0.14)",
    borderRadius: 26,
    borderWidth: 1,
    elevation: 5,
    overflow: "hidden",
    position: "relative",
    shadowColor: colors.deepBlueStrong,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 11,
    width: "100%",
  },
  sunGlow: {
    backgroundColor: "rgba(255, 255, 255, 0.42)",
    borderRadius: radius.pill,
    height: 128,
    position: "absolute",
    right: -28,
    top: -38,
    width: 188,
  },
  cloudOne: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: radius.pill,
    height: 18,
    left: "43%",
    position: "absolute",
    top: "17%",
    width: 76,
  },
  cloudTwo: {
    backgroundColor: "rgba(255,255,255,0.38)",
    borderRadius: radius.pill,
    height: 13,
    left: "52%",
    position: "absolute",
    top: "13%",
    width: 56,
  },
  farHill: {
    backgroundColor: "rgba(150, 198, 180, 0.42)",
    borderTopLeftRadius: 240,
    borderTopRightRadius: 240,
    bottom: "21%",
    height: "30%",
    left: "-22%",
    position: "absolute",
    width: "87%",
  },
  field: {
    backgroundColor: "rgba(117, 172, 137, 0.32)",
    borderTopLeftRadius: 240,
    borderTopRightRadius: 240,
    bottom: "-27%",
    height: "58%",
    left: "-15%",
    position: "absolute",
    width: "130%",
  },
  opponentPlatform: {
    backgroundColor: "rgba(73, 127, 129, 0.2)",
    borderRadius: radius.pill,
    height: 19,
    position: "absolute",
    right: "4%",
    top: "49%",
    width: "46%",
  },
  playerPlatform: {
    backgroundColor: "rgba(73, 127, 129, 0.24)",
    borderRadius: radius.pill,
    bottom: "5%",
    height: 24,
    left: "1%",
    position: "absolute",
    width: "55%",
  },
  opponentHud: {
    left: spacing.md,
    maxWidth: "57%",
    position: "absolute",
    top: spacing.md,
    zIndex: 3,
  },
  playerHud: {
    bottom: spacing.md,
    maxWidth: "57%",
    position: "absolute",
    right: spacing.md,
    zIndex: 3,
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderColor: "rgba(11, 31, 58, 0.13)",
    borderRadius: 17,
    borderWidth: 1,
    elevation: 4,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.deepBlueStrong,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    width: "100%",
  },
  infoHeading: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between",
  },
  pokemonName: {
    ...typography.title,
    color: colors.deepBlueStrong,
    flexShrink: 1,
    fontSize: 16,
  },
  level: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxs,
  },
  typeBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  typeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  opponentSprite: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: "0%",
    top: "22%",
    zIndex: 2,
  },
  playerSprite: {
    alignItems: "center",
    bottom: "1%",
    justifyContent: "center",
    left: "0%",
    position: "absolute",
    zIndex: 2,
  },
  hitFlash: {
    borderRadius: radius.pill,
    height: "86%",
    left: "7%",
    position: "absolute",
    top: "7%",
    width: "86%",
  },
  resultOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    backgroundColor: "rgba(11, 31, 58, 0.32)",
    justifyContent: "center",
    padding: spacing.md,
    zIndex: 5,
  },
  controls: {
    gap: spacing.sm,
  },
  commandHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  commandMark: {
    backgroundColor: colors.commandRed,
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.deepBlue,
    fontSize: 17,
  },
  moveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  moveCell: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 136,
  },
});
