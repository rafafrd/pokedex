import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { getPokemon, listPokemon } from "@/api";
import { PokemonCard } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import type { PokemonSummary } from "@/types/pokemon";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

function titleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível carregar a Pokédex. Tente novamente.";
}

function LoadingState() {
  return (
    <View accessibilityRole="progressbar" style={styles.state}>
      <ActivityIndicator color={colors.commandRed} size="large" />
      <Text selectable style={styles.stateTitle}>
        Carregando Pokémon
      </Text>
      <Text selectable style={styles.stateText}>
        Buscando dados na PokéAPI.
      </Text>
    </View>
  );
}

function MessageState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View accessible style={styles.state}>
      <Text selectable style={styles.stateTitle}>
        {title}
      </Text>
      <Text selectable style={styles.stateText}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text selectable style={styles.primaryButtonLabel}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PokedexScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(
      () => setDebouncedSearch(search.trim().toLowerCase()),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timeoutId);
  }, [search]);

  const isSearching = debouncedSearch.length > 0;
  const pageQuery = useQuery({
    queryKey: ["pokemon", "page", page],
    enabled: !isSearching,
    queryFn: ({ signal }) =>
      listPokemon({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        signal,
      }),
  });
  const searchQuery = useQuery({
    queryKey: ["pokemon", "search", debouncedSearch],
    enabled: isSearching,
    queryFn: ({ signal }) => getPokemon(debouncedSearch, signal),
  });
  const activeQuery = isSearching ? searchQuery : pageQuery;

  const filteredPokemon = useMemo(() => {
    if (isSearching) return searchQuery.data ? [searchQuery.data] : [];
    return pageQuery.data?.results ?? [];
  }, [isSearching, pageQuery.data?.results, searchQuery.data]);

  const totalPages = Math.max(1, Math.ceil((pageQuery.data?.count ?? 0) / PAGE_SIZE));
  const columnCount = width >= 720 ? 3 : 2;
  const isInitialLoad = activeQuery.isPending && !activeQuery.data;
  const isEmpty = !isInitialLoad && !activeQuery.isError && filteredPokemon.length === 0;

  const handleSelect = (pokemon: PokemonSummary) => {
    router.push({ pathname: "/pokemon/[id]", params: { id: String(pokemon.id) } });
  };

  const renderEmpty = () => {
    if (isInitialLoad) return <LoadingState />;
    if (activeQuery.isError) {
      return (
        <MessageState
          title="A Pokédex não respondeu"
          message={errorMessage(activeQuery.error)}
          actionLabel="Tentar novamente"
          onAction={() => void activeQuery.refetch()}
        />
      );
    }
    if (isEmpty) {
      return (
        <MessageState
          title="Nenhum Pokémon encontrado"
          message={
            debouncedSearch
              ? `Não há resultado para “${debouncedSearch}” na Pokédex.`
              : "Esta página não possui Pokémon para mostrar."
          }
          actionLabel={debouncedSearch ? "Limpar pesquisa" : undefined}
          onAction={debouncedSearch ? () => setSearch("") : undefined}
        />
      );
    }
    return null;
  };

  return (
    <FlatList
      key={`pokemon-grid-${columnCount}`}
      data={filteredPokemon}
      numColumns={columnCount}
      keyExtractor={(pokemon) => String(pokemon.id)}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={filteredPokemon.length ? styles.column : undefined}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={activeQuery.isRefetching}
          onRefresh={() => void activeQuery.refetch()}
          tintColor={colors.commandRed}
          colors={[colors.commandRed]}
        />
      }
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={[colors.deepBlueStrong, colors.deepBlue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTopline}>
              <View style={styles.pokeballMark} accessibilityLabel="Pokébola">
                <View style={styles.pokeballTop} />
                <View style={styles.pokeballBand} />
                <View style={styles.pokeballCenter} />
              </View>
              <Text selectable style={styles.eyebrow}>
                CATÁLOGO DE CAMPO
              </Text>
            </View>
            <Text selectable style={styles.heroTitle}>
              Pokédex
            </Text>
            <Text selectable style={styles.heroText}>
              Encontre e consulte seus Pokémon favoritos.
            </Text>
          </LinearGradient>

          <View style={styles.searchCard}>
            <Text selectable style={styles.searchLabel}>
              Pesquisar na Pokédex
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Nome ou número"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Pesquisar Pokémon por nome ou número"
                style={styles.searchInput}
              />
              {search ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpar pesquisa"
                  hitSlop={8}
                  onPress={() => setSearch("")}
                  style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}
                >
                  <Text selectable style={styles.clearButtonLabel}>
                    Limpar
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {!activeQuery.isPending && !activeQuery.isError ? (
            <View style={styles.resultMeta}>
              <Text selectable style={styles.resultMetaText}>
                Página {page} de {totalPages}
              </Text>
              <Text selectable style={styles.resultMetaText}>
                {debouncedSearch
                  ? `${filteredPokemon.length} resultado${filteredPokemon.length === 1 ? "" : "s"}`
                  : `${pageQuery.data?.count ?? 0} registros`}
              </Text>
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item, index }) => (
        <PokemonCard
          pokemon={item}
          index={(page - 1) * PAGE_SIZE + index}
          onPress={handleSelect}
          style={styles.card}
        />
      )}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={
        !activeQuery.isPending && !activeQuery.isError && !isSearching ? (
          <View style={styles.pagination}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Página anterior"
              accessibilityState={{ disabled: page === 1 }}
              disabled={page === 1}
              onPress={() => setPage((current) => Math.max(1, current - 1))}
              style={({ pressed }) => [
                styles.paginationButton,
                page === 1 && styles.buttonDisabled,
                pressed && page > 1 && styles.buttonPressed,
              ]}
            >
              <Text selectable style={styles.paginationLabel}>
                Anterior
              </Text>
            </Pressable>
            <Text selectable style={styles.pageNumber}>
              {String(page).padStart(2, "0")}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Próxima página"
              accessibilityState={{ disabled: page === totalPages }}
              disabled={page === totalPages}
              onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
              style={({ pressed }) => [
                styles.paginationButton,
                page === totalPages && styles.buttonDisabled,
                pressed && page < totalPages && styles.buttonPressed,
              ]}
            >
              <Text selectable style={styles.paginationLabel}>
                Próxima
              </Text>
            </Pressable>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    backgroundColor: colors.background,
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  headerWrap: {
    gap: spacing.md,
  },
  hero: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    gap: spacing.xs,
    marginHorizontal: -spacing.md,
    overflow: "hidden",
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  heroTopline: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  pokeballMark: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    overflow: "hidden",
    width: 32,
  },
  pokeballTop: {
    alignSelf: "stretch",
    backgroundColor: colors.commandRed,
    height: 14,
    position: "absolute",
    top: 0,
  },
  pokeballBand: {
    alignSelf: "stretch",
    backgroundColor: colors.deepBlueStrong,
    height: 4,
  },
  pokeballCenter: {
    backgroundColor: colors.white,
    borderColor: colors.deepBlueStrong,
    borderRadius: 7,
    borderWidth: 3,
    height: 14,
    width: 14,
  },
  eyebrow: {
    color: "#C5D9F1",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: spacing.md,
  },
  heroText: {
    color: "#D9E9F9",
    fontSize: 15,
    lineHeight: 22,
  },
  searchCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    boxShadow: shadows.card,
    gap: spacing.xs,
    marginTop: -spacing.lg,
    padding: spacing.md,
  },
  searchLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "800",
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.cardBorder,
    borderCurve: "continuous",
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  clearButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.sm,
  },
  clearButtonLabel: {
    color: colors.commandRed,
    fontSize: 13,
    fontWeight: "800",
  },
  resultMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resultMetaText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  column: {
    gap: spacing.md,
  },
  card: {
    flex: 1,
    marginBottom: spacing.md,
  },
  state: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.lg,
    minHeight: 230,
    padding: spacing.lg,
  },
  stateTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.commandRed,
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  pagination: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
    paddingTop: spacing.sm,
  },
  paginationButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  paginationLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  pageNumber: {
    color: colors.commandRed,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    minWidth: 30,
    textAlign: "center",
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
