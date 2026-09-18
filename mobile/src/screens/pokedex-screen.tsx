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
import { usePreferences } from "@/features/preferences";
import {
  getAppTheme,
  normalizePokemonTypeTheme,
  radius,
  shadows,
  spacing,
  typography,
} from "@/theme";
import type { AppThemePalette } from "@/theme";
import type { PokemonSummary } from "@/types/pokemon";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível carregar a Pokédex. Tente novamente.";
}

function primaryPokemonType(types: readonly string[]): string | null {
  const type = types.find((value) => /^[a-z-]+$/i.test(value.trim()))?.trim().toLowerCase();
  return type && normalizePokemonTypeTheme(type) !== "unknown" ? type : null;
}

function LoadingState({ theme }: { theme: AppThemePalette }) {
  return (
    <View
      accessibilityLabel="Carregando Pokémon"
      accessibilityRole="progressbar"
      style={[styles.state, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <ActivityIndicator color={theme.accent} size="large" />
      <Text selectable style={[styles.stateTitle, { color: theme.text }]}>
        Carregando Pokémon
      </Text>
      <Text selectable style={[styles.stateText, { color: theme.mutedText }]}>
        Buscando dados na PokéAPI.
      </Text>
    </View>
  );
}

function MessageState({
  theme,
  title,
  message,
  actionLabel,
  onAction,
}: {
  theme: AppThemePalette;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View
      accessible
      style={[styles.state, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <Text selectable style={[styles.stateTitle, { color: theme.text }]}>
        {title}
      </Text>
      <Text selectable style={[styles.stateText, { color: theme.mutedText }]}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.accent },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text selectable style={[styles.primaryButtonLabel, { color: theme.accentContrast }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PokedexScreen() {
  const router = useRouter();
  const { appTheme, userName } = usePreferences();
  const theme = getAppTheme(appTheme);
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectionError, setSelectionError] = useState<string | null>(null);

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
    // The catalogue already carries the type from PokeAPI. Never open a detail
    // route until this payload has a valid type; the detail route validates the
    // freshly fetched type again before it renders the themed screen.
    const primaryType = primaryPokemonType(pokemon.types);
    if (!primaryType) {
      setSelectionError("Não foi possível identificar o tipo deste Pokémon antes de abrir a ficha.");
      return;
    }

    setSelectionError(null);
    router.push({
      pathname: "/pokemon/[id]",
      params: { id: String(pokemon.id), type: primaryType },
    });
  };

  const renderEmpty = () => {
    if (isInitialLoad) return <LoadingState theme={theme} />;
    if (activeQuery.isError) {
      return (
        <MessageState
          theme={theme}
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
          theme={theme}
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
      style={{ backgroundColor: theme.background }}
      data={filteredPokemon}
      numColumns={columnCount}
      keyExtractor={(pokemon) => String(pokemon.id)}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.listContent, { backgroundColor: theme.background }]}
      columnWrapperStyle={filteredPokemon.length ? styles.column : undefined}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={activeQuery.isRefetching}
          onRefresh={() => void activeQuery.refetch()}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={[theme.heroStart, theme.heroEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTopline}>
              <View style={styles.pokeballMark} accessibilityLabel="Pokébola">
                <View style={[styles.pokeballTop, { backgroundColor: theme.accent }]} />
                <View style={[styles.pokeballBand, { backgroundColor: theme.accentContrast }]} />
                <View
                  style={[styles.pokeballCenter, { borderColor: theme.accentContrast }]}
                />
              </View>
              <Text selectable style={styles.eyebrow}>
                CATÁLOGO DE CAMPO
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Abrir configurações"
                hitSlop={8}
                onPress={() => router.push("/settings")}
                style={({ pressed }) => [styles.settingsButton, pressed && styles.buttonPressed]}
              >
                <Text selectable style={styles.settingsLabel}>
                  Configurar
                </Text>
              </Pressable>
            </View>
            <Text selectable style={styles.heroTitle}>
              Pokédex
            </Text>
            <Text selectable style={styles.welcomeText}>
              Bem-vindo, {userName}
            </Text>
            <Text selectable style={styles.heroText}>
              Encontre e consulte seus Pokémon favoritos.
            </Text>
          </LinearGradient>

          <View
            style={[
              styles.searchCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text selectable style={[styles.searchLabel, { color: theme.mutedText }]}>
              Pesquisar na Pokédex
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Nome ou número"
                placeholderTextColor={theme.mutedText}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Pesquisar Pokémon por nome ou número"
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: theme.surfaceMuted,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />
              {search ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpar pesquisa"
                  hitSlop={8}
                  onPress={() => setSearch("")}
                  style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}
                >
                  <Text selectable style={[styles.clearButtonLabel, { color: theme.accent }]}>
                    Limpar
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {selectionError ? (
            <View
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={[styles.validationMessage, { borderColor: theme.accent }]}
            >
              <Text selectable style={[styles.validationText, { color: theme.text }]}>
                {selectionError}
              </Text>
            </View>
          ) : null}

          {!activeQuery.isPending && !activeQuery.isError ? (
            <View style={styles.resultMeta}>
              <Text selectable style={[styles.resultMetaText, { color: theme.mutedText }]}>
                Página {page} de {totalPages}
              </Text>
              <Text selectable style={[styles.resultMetaText, { color: theme.mutedText }]}>
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
          theme={theme}
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
                { backgroundColor: theme.surface, borderColor: theme.border },
                page === 1 && styles.buttonDisabled,
                pressed && page > 1 && styles.buttonPressed,
              ]}
            >
              <Text selectable style={[styles.paginationLabel, { color: theme.text }]}>
                Anterior
              </Text>
            </Pressable>
            <Text selectable style={[styles.pageNumber, { color: theme.accent }]}>
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
                { backgroundColor: theme.surface, borderColor: theme.border },
                page === totalPages && styles.buttonDisabled,
                pressed && page < totalPages && styles.buttonPressed,
              ]}
            >
              <Text selectable style={[styles.paginationLabel, { color: theme.text }]}>
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
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  headerWrap: { gap: spacing.md },
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
  heroTopline: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  pokeballMark: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    overflow: "hidden",
    width: 32,
  },
  pokeballTop: { alignSelf: "stretch", height: 14, position: "absolute", top: 0 },
  pokeballBand: { alignSelf: "stretch", height: 4 },
  pokeballCenter: {
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    borderWidth: 3,
    height: 14,
    width: 14,
  },
  eyebrow: { color: "#F5EFFF", flex: 1, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  settingsButton: {
    borderColor: "#FFFFFFB3",
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  settingsLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: spacing.md,
  },
  welcomeText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  heroText: { color: "#F3EEFF", fontSize: 15, lineHeight: 22 },
  searchCard: {
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    boxShadow: shadows.card,
    gap: spacing.xs,
    marginTop: -spacing.lg,
    padding: spacing.md,
  },
  searchLabel: { ...typography.caption, fontWeight: "800" },
  searchRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  searchInput: {
    borderCurve: "continuous",
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  clearButton: { alignItems: "center", justifyContent: "center", minHeight: 42, paddingHorizontal: spacing.sm },
  clearButtonLabel: { fontSize: 13, fontWeight: "800" },
  validationMessage: { borderLeftWidth: 3, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  validationText: { fontSize: 13, lineHeight: 19 },
  resultMeta: { flexDirection: "row", justifyContent: "space-between" },
  resultMetaText: { fontSize: 12, fontWeight: "700" },
  column: { gap: spacing.md },
  card: { flex: 1, marginBottom: spacing.md },
  state: {
    alignItems: "center",
    alignSelf: "stretch",
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.lg,
    minHeight: 230,
    padding: spacing.lg,
  },
  stateTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  stateText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  primaryButton: {
    alignItems: "center",
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonLabel: { fontSize: 14, fontWeight: "800" },
  pagination: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "center", paddingTop: spacing.sm },
  paginationButton: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  paginationLabel: { fontSize: 13, fontWeight: "800" },
  pageNumber: { fontSize: 16, fontVariant: ["tabular-nums"], fontWeight: "900", minWidth: 30, textAlign: "center" },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.45 },
});
