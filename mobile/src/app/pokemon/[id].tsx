import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { getPokemon } from "@/api";
import { PokemonDetailScreen } from "@/screens/pokemon-detail-screen";
import { colors, radius, spacing } from "@/theme";

function routeId(value: string | string[] | undefined) {
  const id = Array.isArray(value) ? value[0] : value;
  return id && /^\d+$/.test(id) ? id : null;
}

export default function PokemonDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const pokemonId = routeId(id);
  const query = useQuery({
    queryKey: ["pokemon", "detail", pokemonId],
    enabled: Boolean(pokemonId),
    queryFn: ({ signal }) => getPokemon(pokemonId!, signal),
  });

  if (!pokemonId) {
    return <RouteMessage title="Pokémon inválido" message="O endereço informado não é válido." />;
  }

  if (query.isPending) {
    return (
      <View accessibilityRole="progressbar" style={styles.centered}>
        <ActivityIndicator color={colors.commandRed} size="large" />
        <Text selectable style={styles.message}>
          Carregando ficha do Pokémon…
        </Text>
      </View>
    );
  }

  if (query.isError || !query.data) {
    return (
      <RouteMessage
        title="Não foi possível abrir a ficha"
        message={query.error instanceof Error ? query.error.message : "Tente novamente."}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return <PokemonDetailScreen pokemon={query.data} onBack={() => router.back()} />;
}

function RouteMessage({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  const router = useRouter();
  return (
    <View style={styles.centered}>
      <Text selectable style={styles.title}>
        {title}
      </Text>
      <Text selectable style={styles.message}>
        {message}
      </Text>
      <View style={styles.actions}>
        {onRetry ? (
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.primaryButton}>
            <Text selectable style={styles.primaryButtonLabel}>
              Tentar novamente
            </Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryButton}>
          <Text selectable style={styles.secondaryButtonLabel}>
            Voltar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.commandRed,
    borderRadius: radius.pill,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryButtonLabel: {
    color: colors.white,
    fontWeight: "800",
  },
  secondaryButton: {
    borderColor: colors.cardBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryButtonLabel: {
    color: colors.textPrimary,
    fontWeight: "800",
  },
});
