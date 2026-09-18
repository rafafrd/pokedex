import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PokemonArtwork } from "@/components/pokemon-artwork";
import { TypeBadge } from "@/components/type-badge";
import { colors, radius, spacing } from "@/theme";
import type { PokemonDetail } from "@/types/pokemon";

export interface PokemonDetailScreenProps {
  pokemon: PokemonDetail;
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

const screenColors = {
  background: colors.background,
  surface: colors.card,
  surfaceElevated: colors.cardSurface,
  border: colors.cardBorder,
  text: colors.textPrimary,
  muted: colors.textMuted,
  accent: colors.commandRed,
  accentSoft: colors.cardSurface,
  track: colors.cardBorder,
};

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.metricLabel} selectable>
        {label}
      </Text>
      <Text style={styles.metricValue} selectable>
        {value}
      </Text>
    </View>
  );
}

function StatRow({ name, value }: { name: string; value: number }) {
  const progress = Math.min(1, Math.max(0, value / MAX_STAT_VALUE));
  const label = STAT_LABELS[name] ?? formatName(name);

  return (
    <View
      style={styles.statRow}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={styles.statLabel} selectable numberOfLines={1}>
        {label}
      </Text>
      <View
        style={styles.statTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: MAX_STAT_VALUE,
          now: Math.max(0, value),
        }}
      >
        <View style={[styles.statFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.statValue} selectable>
        {value}
      </Text>
    </View>
  );
}

export function PokemonDetailScreen({
  pokemon,
  onBack,
}: PokemonDetailScreenProps) {
  const artwork =
    pokemon.sprites.artwork ??
    pokemon.sprites.front ??
    pokemon.sprites.showdown ??
    pokemon.sprites.animated;

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {onBack ? (
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a lista de Pokémon"
          hitSlop={8}
        >
          <Text style={styles.backIcon}>
            ‹
          </Text>
          <Text style={styles.backLabel} selectable>
            Voltar
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.hero}>
        <View style={styles.artworkStage}>
          <View style={styles.artworkGlow} />
          <PokemonArtwork
            uri={artwork}
            name={pokemon.name}
            size={232}
            style={styles.artwork}
          />
        </View>

        <View style={styles.identity}>
          <Text style={styles.number} selectable>
            #{String(pokemon.id).padStart(3, "0")}
          </Text>
          <Text style={styles.name} selectable>
            {formatName(pokemon.name)}
          </Text>
          <View style={styles.typeList} accessibilityLabel="Tipos">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </View>
          {!artwork ? (
            <Text style={styles.imageFallback} selectable>
              Ilustração indisponível
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} selectable>
          Informações
        </Text>
        <View style={styles.metricGrid}>
          <Metric label="Altura" value={formatHeight(pokemon.height)} />
          <Metric label="Peso" value={formatWeight(pokemon.weight)} />
          <Metric
            label="Experiência base"
            value={pokemon.baseExperience == null ? "—" : String(pokemon.baseExperience)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle} selectable>
            Estatísticas base
          </Text>
          <Text style={styles.sectionHint} selectable>
            máximo {MAX_STAT_VALUE}
          </Text>
        </View>
        <View style={styles.statsCard}>
          {pokemon.stats.length ? (
            pokemon.stats.map((stat) => (
              <StatRow key={stat.name} name={stat.name} value={stat.base} />
            ))
          ) : (
            <Text style={styles.emptyText} selectable>
              Nenhuma estatística disponível.
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} selectable>
          Habilidades
        </Text>
        {pokemon.abilities.length ? (
          <View style={styles.abilityList}>
            {pokemon.abilities.map((ability) => (
              <View key={ability} style={styles.abilityChip}>
                <View style={styles.abilityDot} />
                <Text style={styles.abilityText} selectable>
                  {formatName(ability)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText} selectable>
            Nenhuma habilidade disponível.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: screenColors.background,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
  },
  backPressed: {
    opacity: 0.65,
    backgroundColor: screenColors.surfaceElevated,
  },
  backIcon: {
    color: screenColors.text,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 28,
  },
  backLabel: {
    color: screenColors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  hero: {
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  artworkStage: {
    width: "100%",
    minHeight: 236,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: screenColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: screenColors.border,
  },
  artworkGlow: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: screenColors.accentSoft,
    opacity: 0.55,
  },
  artwork: {
    width: 232,
    height: 232,
  },
  identity: {
    alignItems: "center",
    gap: spacing.xs,
  },
  number: {
    color: screenColors.muted,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  name: {
    color: screenColors.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  typeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  imageFallback: {
    color: screenColors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionTitle: {
    color: screenColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionHint: {
    color: screenColors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  metricGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    minHeight: 78,
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: screenColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: screenColors.border,
  },
  metricLabel: {
    color: screenColors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    color: screenColors.text,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  statsCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: screenColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: screenColors.border,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 28,
  },
  statLabel: {
    width: 98,
    color: screenColors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  statTrack: {
    flex: 1,
    height: 8,
    overflow: "hidden",
    borderRadius: radius.pill,
    backgroundColor: screenColors.track,
  },
  statFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: screenColors.accent,
  },
  statValue: {
    width: 30,
    color: screenColors.text,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  abilityList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  abilityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: screenColors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: screenColors.border,
  },
  abilityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: screenColors.accent,
  },
  abilityText: {
    color: screenColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    color: screenColors.muted,
    fontSize: 13,
  },
});

export default PokemonDetailScreen;
