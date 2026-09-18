import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PokemonArtwork } from "@/components/pokemon-artwork";
import { PokeballFlightBackground } from "@/components/pokeball-flight-background";
import { TypeBadge } from "@/components/type-badge";
import { radius, spacing, type PokemonTypeTheme } from "@/theme";
import type { PokemonDetail } from "@/types/pokemon";

export interface PokemonDetailScreenProps {
  pokemon: PokemonDetail;
  /** Derived from the freshly fetched PokeAPI type in the route. */
  theme: PokemonTypeTheme;
  onBack?: () => void;
}

const MAX_STAT_VALUE = 180;

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Ataque",
  defense: "Defesa",
  "special-attack": "Atq. especial",
  "special-defense": "Def. especial",
  speed: "Velocidade",
};

function useReducedMotionPreference(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}

function formatName(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatHeight(decimeters: number): string {
  return `${(decimeters / 10).toFixed(1)} m`;
}

function formatWeight(hectograms: number): string {
  return `${(hectograms / 10).toFixed(1)} kg`;
}

function Metric({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: PokemonTypeTheme;
}) {
  return (
    <View
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <Text selectable style={[styles.metricLabel, { color: theme.mutedForeground }]}>
        {label}
      </Text>
      <Text selectable style={[styles.metricValue, { color: theme.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function StatRow({
  name,
  value,
  theme,
}: {
  name: string;
  value: number;
  theme: PokemonTypeTheme;
}) {
  const progress = Math.min(1, Math.max(0, value / MAX_STAT_VALUE));
  const label = STAT_LABELS[name] ?? formatName(name);

  return (
    <View accessibilityLabel={`${label}: ${value}`} style={styles.statRow}>
      <Text selectable numberOfLines={1} style={[styles.statLabel, { color: theme.mutedForeground }]}>
        {label}
      </Text>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: MAX_STAT_VALUE, now: Math.max(0, value) }}
        style={[styles.statTrack, { backgroundColor: theme.border }]}
      >
        <View style={[styles.statFill, { backgroundColor: theme.primary, width: `${progress * 100}%` }]} />
      </View>
      <Text selectable style={[styles.statValue, { color: theme.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

export function PokemonDetailScreen({
  pokemon,
  theme,
  onBack,
}: PokemonDetailScreenProps) {
  const reducedMotion = useReducedMotionPreference();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <PokeballFlightBackground
        palette={theme}
        reducedMotion={reducedMotion}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {onBack ? (
          <Pressable
            accessibilityLabel="Voltar para a lista de Pokémon"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { backgroundColor: theme.surfaceElevated },
            ]}
          >
            <Text style={[styles.backIcon, { color: theme.foreground }]}>‹</Text>
            <Text selectable style={[styles.backLabel, { color: theme.mutedForeground }]}>Voltar</Text>
          </Pressable>
        ) : null}

        <View style={styles.hero}>
          <View
            style={[
              styles.artworkStage,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={[styles.artworkGlow, { backgroundColor: theme.glow }]} />
            <PokemonArtwork
              name={pokemon.name}
              size={232}
              sprites={pokemon.sprites}
              style={styles.artwork}
              uri={null}
            />
          </View>

          <View style={styles.identity}>
            <Text selectable style={[styles.number, { color: theme.mutedForeground }]}>
              #{String(pokemon.id).padStart(3, "0")}
            </Text>
            <Text selectable style={[styles.name, { color: theme.foreground }]}>
              {formatName(pokemon.name)}
            </Text>
            <View accessibilityLabel="Tipos" style={styles.typeList}>
              {pokemon.types.map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text selectable style={[styles.sectionTitle, { color: theme.foreground }]}>Informações</Text>
          <View style={styles.metricGrid}>
            <Metric label="Altura" theme={theme} value={formatHeight(pokemon.height)} />
            <Metric label="Peso" theme={theme} value={formatWeight(pokemon.weight)} />
            <Metric
              label="Experiência base"
              theme={theme}
              value={pokemon.baseExperience == null ? "—" : String(pokemon.baseExperience)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text selectable style={[styles.sectionTitle, { color: theme.foreground }]}>Estatísticas base</Text>
            <Text selectable style={[styles.sectionHint, { color: theme.mutedForeground }]}>máximo {MAX_STAT_VALUE}</Text>
          </View>
          <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {pokemon.stats.length ? (
              pokemon.stats.map((stat) => (
                <StatRow key={stat.name} name={stat.name} theme={theme} value={stat.base} />
              ))
            ) : (
              <Text selectable style={[styles.emptyText, { color: theme.mutedForeground }]}>
                Nenhuma estatística disponível.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text selectable style={[styles.sectionTitle, { color: theme.foreground }]}>Habilidades</Text>
          {pokemon.abilities.length ? (
            <View style={styles.abilityList}>
              {pokemon.abilities.map((ability) => (
                <View
                  key={ability}
                  style={[
                    styles.abilityChip,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.abilityDot, { backgroundColor: theme.primary }]} />
                  <Text selectable style={[styles.abilityText, { color: theme.foreground }]}>
                    {formatName(ability)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text selectable style={[styles.emptyText, { color: theme.mutedForeground }]}>
              Nenhuma habilidade disponível.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.xs,
  },
  backIcon: { fontSize: 28, fontWeight: "300", lineHeight: 28 },
  backLabel: { fontSize: 14, fontWeight: "700" },
  hero: { alignItems: "center", gap: spacing.md, paddingTop: spacing.xs },
  artworkStage: {
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 236,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  artworkGlow: { borderRadius: 95, height: 190, opacity: 0.22, position: "absolute", width: 190 },
  artwork: { height: 232, width: 232 },
  identity: { alignItems: "center", gap: spacing.xs },
  number: { fontSize: 13, fontVariant: ["tabular-nums"], fontWeight: "800", letterSpacing: 1 },
  name: { fontSize: 34, fontWeight: "900", letterSpacing: -0.6, textAlign: "center" },
  typeList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, justifyContent: "center", marginTop: spacing.xs },
  section: { gap: spacing.sm },
  sectionHeadingRow: { alignItems: "baseline", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  sectionHint: { fontSize: 12, fontWeight: "600" },
  metricGrid: { flexDirection: "row", gap: spacing.sm },
  metric: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 78,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  metricLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  metricValue: { fontSize: 16, fontVariant: ["tabular-nums"], fontWeight: "800" },
  statsCard: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, gap: spacing.sm, padding: spacing.md },
  statRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 28 },
  statLabel: { fontSize: 12, fontWeight: "700", width: 98 },
  statTrack: { borderRadius: radius.pill, flex: 1, height: 8, overflow: "hidden" },
  statFill: { borderRadius: radius.pill, height: "100%" },
  statValue: { fontSize: 13, fontVariant: ["tabular-nums"], fontWeight: "800", textAlign: "right", width: 30 },
  abilityList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  abilityChip: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  abilityDot: { borderRadius: 4, height: 7, width: 7 },
  abilityText: { fontSize: 13, fontWeight: "700" },
  emptyText: { fontSize: 13 },
});

export default PokemonDetailScreen;
