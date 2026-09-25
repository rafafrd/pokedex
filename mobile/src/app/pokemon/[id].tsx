import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { getPokemon } from "@/api";
import { usePreferences } from "@/features/preferences";
import { PokemonDetailScreen } from "@/screens/pokemon-detail-screen";
import {
  getAppTheme,
  getPokemonTypeTheme,
  normalizePokemonTypeTheme,
  radius,
  spacing,
} from "@/theme";

function routeId(value: string | string[] | undefined) {
  // URL é entrada externa: aceito só id numérico antes de consultar a API.
  const id = Array.isArray(value) ? value[0] : value;
  return id && /^\d+$/.test(id) ? id : null;
}

export default function PokemonDetailRoute() {
  const router = useRouter();
  const { appTheme } = usePreferences();
  const appPalette = getAppTheme(appTheme);
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const pokemonId = routeId(id);
  const query = useQuery({
    // A ficha tem consulta própria; não depende de o usuário ter vindo da lista.
    queryKey: ["pokemon", "detail", pokemonId],
    enabled: Boolean(pokemonId),
    queryFn: ({ signal }) => getPokemon(pokemonId!, signal),
  });

  if (!pokemonId) {
    return <RouteMessage title="Pokémon inválido" message="O endereço informado não é válido." />;
  }

  if (query.isPending) {
    return (
      <View
        accessibilityRole="progressbar"
        style={[styles.centered, { backgroundColor: appPalette.background }]}
      >
        <ActivityIndicator color={appPalette.accent} size="large" />
        <Text selectable style={[styles.message, { color: appPalette.mutedText }]}>
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

  // O tipo da URL é só dica; a resposta atual da API manda na cor da ficha.
  const primaryType = query.data.types.find((type) => type.trim().length > 0);
  if (!primaryType || normalizePokemonTypeTheme(primaryType) === "unknown") {
    return (
      <RouteMessage
        title="Tipo de Pokémon inválido"
        message="A PokéAPI não forneceu um tipo reconhecido para esta ficha."
      />
    );
  }

  return (
    <PokemonDetailScreen
      pokemon={query.data}
      theme={getPokemonTypeTheme(primaryType)}
      onBack={() => router.back()}
    />
  );
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
  const { appTheme } = usePreferences();
  const palette = getAppTheme(appTheme);
  return (
    <View style={[styles.centered, { backgroundColor: palette.background }]}>
      <Text selectable style={[styles.title, { color: palette.text }]}>
        {title}
      </Text>
      <Text selectable style={[styles.message, { color: palette.mutedText }]}>
        {message}
      </Text>
      <View style={styles.actions}>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={[styles.primaryButton, { backgroundColor: palette.accent }]}
          >
            <Text selectable style={[styles.primaryButtonLabel, { color: palette.accentContrast }]}>
              Tentar novamente
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[styles.secondaryButton, { borderColor: palette.border }]}
        >
          <Text selectable style={[styles.secondaryButtonLabel, { color: palette.text }]}>
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
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
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
    borderRadius: radius.pill,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryButtonLabel: {
    fontWeight: "800",
  },
  secondaryButton: {
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryButtonLabel: {
    fontWeight: "800",
  },
});
