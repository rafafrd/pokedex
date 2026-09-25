import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getPokemon, listPokemon } from "@/api";
import { PokemonArtwork, TypeBadge } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import type { PokemonSummary } from "@/types/pokemon";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

type SelectionSide = "player" | "opponent";

function formatName(name: string): string {
  return name
    .trim()
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Não foi possível carregar os Pokémon. Tente novamente.";
}

function SelectionSlot({
  side,
  pokemon,
  active,
  onPress,
}: {
  side: SelectionSide;
  pokemon: PokemonSummary | null;
  active: boolean;
  onPress: () => void;
}) {
  const label = side === "player" ? "Seu Pokémon" : "Adversário";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}${pokemon ? `: ${formatName(pokemon.name)}` : ", não selecionado"}`}
      accessibilityHint={`Selecionar este lado para escolher o ${side === "player" ? "seu Pokémon" : "Pokémon adversário"}.`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectionSlot,
        active && styles.selectionSlotActive,
        pressed && styles.pressed,
      ]}
    >
      {pokemon ? (
        <PokemonArtwork name={pokemon.name} size={56} uri={pokemon.sprites.artwork ?? pokemon.sprites.front} />
      ) : (
        <View accessibilityElementsHidden style={styles.slotPlaceholder}>
          <Text style={styles.slotPlaceholderMark}>?</Text>
        </View>
      )}
      <View style={styles.slotTextWrap}>
        <Text numberOfLines={1} style={styles.slotLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.slotName}>
          {pokemon ? formatName(pokemon.name) : "Escolha um Pokémon"}
        </Text>
      </View>
    </Pressable>
  );
}

function SelectionCard({
  pokemon,
  side,
  selectedForPlayer,
  selectedForOpponent,
  onPress,
}: {
  pokemon: PokemonSummary;
  side: SelectionSide;
  selectedForPlayer: boolean;
  selectedForOpponent: boolean;
  onPress: () => void;
}) {
  const isSelected = selectedForPlayer || selectedForOpponent;
  const name = formatName(pokemon.name);
  const selectedLabel = [
    selectedForPlayer ? "seu Pokémon" : null,
    selectedForOpponent ? "adversário" : null,
  ].filter(Boolean).join(" e ");
  const selectionSide = side === "player" ? "seu Pokémon" : "Pokémon adversário";

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${name}, número ${pokemon.id}${isSelected ? `, selecionado para ${selectedLabel}` : ""}`}
      accessibilityHint={`Selecionar ${name} como ${selectionSide}.`}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pokemonCard,
        isSelected && styles.pokemonCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.cardTopline}>
        <Text style={styles.pokemonNumber}>#{String(pokemon.id).padStart(3, "0")}</Text>
        <View style={styles.roleBadges}>
          {selectedForPlayer ? <Text style={[styles.roleBadge, styles.playerBadge]}>SEU</Text> : null}
          {selectedForOpponent ? <Text style={[styles.roleBadge, styles.opponentBadge]}>CPU</Text> : null}
        </View>
      </View>
      <PokemonArtwork
        name={pokemon.name}
        size={92}
        uri={pokemon.sprites.artwork ?? pokemon.sprites.front}
      />
      <Text numberOfLines={1} style={styles.pokemonName}>{name}</Text>
      <View style={styles.typeRow}>
        {pokemon.types.map((type) => <TypeBadge key={type} type={type} />)}
      </View>
      <Text style={[styles.cardStatus, isSelected && styles.cardStatusSelected]}>
        {isSelected ? `Selecionado: ${selectedLabel}` : "Toque para selecionar"}
      </Text>
    </Pressable>
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
    <View style={styles.messageState}>
      <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.messageTitle}>{title}</Text>
      <Text style={styles.messageText}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function BattleSelectionScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectionSide, setSelectionSide] = useState<SelectionSide>("player");
  const [playerPokemon, setPlayerPokemon] = useState<PokemonSummary | null>(null);
  const [opponentPokemon, setOpponentPokemon] = useState<PokemonSummary | null>(null);

  const normalizedSearch = search.trim().toLowerCase();
  const isSearching = normalizedSearch.length > 0;

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(normalizedSearch), SEARCH_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [normalizedSearch]);

  const pageQuery = useQuery({
    queryKey: ["pokemon", "page", page],
    enabled: !isSearching,
    queryFn: ({ signal }) => listPokemon({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, signal }),
  });
  const searchQuery = useQuery({
    queryKey: ["pokemon", "search", debouncedSearch],
    enabled: Boolean(debouncedSearch),
    queryFn: ({ signal }) => getPokemon(debouncedSearch, signal),
  });

  const isSearchPending = normalizedSearch !== debouncedSearch;
  const pokemon = useMemo<PokemonSummary[]>(() => {
    if (isSearchPending) return [];
    if (isSearching) return searchQuery.data ? [searchQuery.data] : [];
    return pageQuery.data?.results ?? [];
  }, [isSearchPending, isSearching, pageQuery.data?.results, searchQuery.data]);
  const queryIsLoading = isSearchPending || (isSearching
    ? searchQuery.isPending && !searchQuery.data
    : pageQuery.isPending && !pageQuery.data);
  const queryIsError = !isSearchPending && (isSearching ? searchQuery.isError : pageQuery.isError);
  const queryError = isSearching ? searchQuery.error : pageQuery.error;
  const totalPages = Math.max(1, Math.ceil((pageQuery.data?.count ?? 0) / PAGE_SIZE));
  const columnCount = width < 360 ? 1 : width >= 760 ? 3 : 2;
  const canStart = playerPokemon !== null && opponentPokemon !== null;

  const selectPokemon = (selectedPokemon: PokemonSummary) => {
    if (selectionSide === "player") {
      setPlayerPokemon(selectedPokemon);
      if (playerPokemon === null) setSelectionSide("opponent");
    } else {
      setOpponentPokemon(selectedPokemon);
    }
  };

  const startBattle = () => {
    if (!playerPokemon || !opponentPokemon) return;
    router.push({
      pathname: "/battle/fight",
      params: {
        playerId: String(playerPokemon.id),
        opponentId: String(opponentPokemon.id),
      },
    });
  };

  const renderEmpty = () => {
    if (queryIsLoading) {
      return (
        <View accessibilityRole="progressbar" accessibilityLiveRegion="polite" style={styles.messageState}>
          <ActivityIndicator color={colors.commandRed} size="large" />
          <Text style={styles.messageTitle}>{isSearching ? "Buscando Pokémon…" : "Carregando Pokémon…"}</Text>
          <Text style={styles.messageText}>Preparando o catálogo para a seleção.</Text>
        </View>
      );
    }
    if (queryIsError) {
      return (
        <MessageState
          title="Não foi possível carregar o catálogo"
          message={errorMessage(queryError)}
          actionLabel="Tentar novamente"
          onAction={() => void (isSearching ? searchQuery.refetch() : pageQuery.refetch())}
        />
      );
    }
    if (isSearching && pokemon.length === 0) {
      return (
        <MessageState
          title="Nenhum Pokémon encontrado"
          message={`Não encontramos “${normalizedSearch}”. Tente outro nome ou número.`}
          actionLabel="Limpar busca"
          onAction={() => setSearch("")}
        />
      );
    }
    return null;
  };

  const selectedIds = `${playerPokemon?.id ?? ""}-${opponentPokemon?.id ?? ""}-${selectionSide}`;

  return (
    <SafeAreaView edges={["bottom"]} style={styles.screen}>
    <FlatList
      key={`battle-selection-${columnCount}`}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={pokemon}
      extraData={selectedIds}
      numColumns={columnCount}
      columnWrapperStyle={columnCount > 1 && pokemon.length > 0 ? styles.gridRow : undefined}
      keyExtractor={(item) => String(item.id)}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <SelectionCard
          pokemon={item}
          side={selectionSide}
          selectedForPlayer={playerPokemon?.id === item.id}
          selectedForOpponent={opponentPokemon?.id === item.id}
          onPress={() => selectPokemon(item)}
        />
      )}
      ListHeaderComponent={(
        <View style={styles.headerWrap}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>CENTRO DE BATALHA</Text>
            <Text accessibilityRole="header" style={styles.heroTitle}>Batalha</Text>
            <Text style={styles.heroText}>Escolha um Pokémon para cada lado e prepare-se para lutar.</Text>
          </View>

          <View style={styles.selectionCard}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Combatentes</Text>
            <View style={styles.selectionSlots}>
              <SelectionSlot
                side="player"
                pokemon={playerPokemon}
                active={selectionSide === "player"}
                onPress={() => setSelectionSide("player")}
              />
              <SelectionSlot
                side="opponent"
                pokemon={opponentPokemon}
                active={selectionSide === "opponent"}
                onPress={() => setSelectionSide("opponent")}
              />
            </View>
            <Text style={styles.selectionPrompt}>
              {selectionSide === "player" ? "Agora escolha seu Pokémon" : "Agora escolha o adversário"}
            </Text>
          </View>

          <View style={styles.searchCard}>
            <Text style={styles.searchLabel}>Encontrar Pokémon</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Nome ou número (ex.: pikachu)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Pesquisar Pokémon por nome ou número"
              style={styles.searchInput}
            />
            {search.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpar pesquisa"
                hitSlop={8}
                onPress={() => setSearch("")}
                style={styles.clearSearch}
              >
                <Text style={styles.clearSearchLabel}>Limpar busca</Text>
              </Pressable>
            ) : null}
          </View>

          {!isSearching && !pageQuery.isPending && !pageQuery.isError ? (
            <View style={styles.listMeta}>
              <Text style={styles.listMetaText}>Página {page} de {totalPages}</Text>
              <Text style={styles.listMetaText}>{pageQuery.data?.count ?? 0} Pokémon</Text>
            </View>
          ) : null}

          <Text accessibilityRole="header" style={styles.catalogTitle}>
            {isSearching ? "Resultado da busca" : "Escolha na Pokédex"}
          </Text>
        </View>
      )}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={(
        <View style={styles.footer}>
          {!isSearching && !queryIsLoading && !queryIsError ? (
            <View style={styles.pagination}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Página anterior"
                accessibilityState={{ disabled: page <= 1 }}
                disabled={page <= 1}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
                style={({ pressed }) => [styles.pageButton, page <= 1 && styles.disabledButton, pressed && page > 1 && styles.pressed]}
              >
                <Text style={styles.pageButtonText}>Anterior</Text>
              </Pressable>
              <Text accessibilityLabel={`Página ${page}`} style={styles.pageNumber}>{String(page).padStart(2, "0")}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Próxima página"
                accessibilityState={{ disabled: page >= totalPages }}
                disabled={page >= totalPages}
                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
                style={({ pressed }) => [styles.pageButton, page >= totalPages && styles.disabledButton, pressed && page < totalPages && styles.pressed]}
              >
                <Text style={styles.pageButtonText}>Próxima</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}
    />
    <View style={styles.stickyFooter}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Começar batalha"
        accessibilityHint={canStart ? "Abrir a arena com os Pokémon selecionados." : "Selecione seu Pokémon e um adversário para continuar."}
        accessibilityState={{ disabled: !canStart }}
        disabled={!canStart}
        onPress={startBattle}
        style={({ pressed }) => [styles.startButton, !canStart && styles.disabledButton, pressed && canStart && styles.pressed]}
      >
        <Text style={styles.startButtonLabel}>Começar batalha</Text>
      </Pressable>
      <Text style={styles.startCaption}>
        {canStart
          ? `${formatName(playerPokemon.name)} contra ${formatName(opponentPokemon.name)}`
          : "Escolha seu Pokémon e o adversário para continuar."}
      </Text>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  list: {
    backgroundColor: colors.background,
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerWrap: {
    gap: spacing.md,
  },
  hero: {
    backgroundColor: colors.deepBlue,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    gap: spacing.xs,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    color: "#C5D9F1",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroTitle: {
    ...typography.display,
    color: colors.white,
    marginTop: spacing.xs,
  },
  heroText: {
    ...typography.body,
    color: "#D9E9F9",
    maxWidth: 520,
  },
  selectionCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    boxShadow: shadows.card,
    gap: spacing.sm,
    marginTop: -spacing.lg,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.deepBlue,
  },
  selectionSlots: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  selectionSlot: {
    alignItems: "center",
    backgroundColor: colors.cardSurface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 82,
    padding: spacing.xs,
  },
  selectionSlotActive: {
    borderColor: colors.commandRed,
    borderWidth: 2,
  },
  slotPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  slotPlaceholderMark: {
    color: colors.textMuted,
    fontSize: 22,
    fontWeight: "800",
  },
  slotTextWrap: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  slotLabel: {
    ...typography.overline,
    color: colors.textSecondary,
  },
  slotName: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "800",
  },
  selectionPrompt: {
    ...typography.caption,
    color: colors.commandRed,
    fontWeight: "700",
  },
  searchCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  searchLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "800",
  },
  searchInput: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  clearSearch: {
    alignSelf: "flex-end",
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: spacing.sm,
  },
  clearSearchLabel: {
    color: colors.commandRed,
    fontSize: 13,
    fontWeight: "800",
  },
  listMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listMetaText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  catalogTitle: {
    ...typography.title,
    color: colors.deepBlue,
    marginTop: spacing.xs,
  },
  gridRow: {
    gap: spacing.md,
  },
  pokemonCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    boxShadow: shadows.card,
    flex: 1,
    gap: spacing.xs,
    marginBottom: spacing.md,
    minHeight: 222,
    padding: spacing.sm,
  },
  pokemonCardSelected: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.commandRed,
    borderWidth: 2,
  },
  cardTopline: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 20,
    width: "100%",
  },
  pokemonNumber: {
    ...typography.overline,
    color: colors.commandRed,
  },
  roleBadges: {
    flexDirection: "row",
    gap: spacing.xxs,
  },
  roleBadge: {
    borderRadius: radius.pill,
    fontSize: 9,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  playerBadge: {
    backgroundColor: "#DBEAFE",
    color: colors.deepBlue,
  },
  opponentBadge: {
    backgroundColor: "#FDE2E2",
    color: colors.commandRed,
  },
  pokemonName: {
    ...typography.title,
    color: colors.deepBlue,
    maxWidth: "100%",
    textAlign: "center",
  },
  typeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxs,
    justifyContent: "center",
  },
  cardStatus: {
    ...typography.overline,
    color: colors.textMuted,
    fontSize: 9,
    textAlign: "center",
  },
  cardStatusSelected: {
    color: colors.commandRed,
  },
  messageState: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    justifyContent: "center",
    marginVertical: spacing.sm,
    minHeight: 190,
    padding: spacing.lg,
  },
  messageTitle: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: "center",
  },
  messageText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.cardSurface,
    borderColor: colors.cardBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "800",
  },
  footer: {
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  stickyFooter: {
    backgroundColor: colors.background,
    borderColor: colors.cardBorder,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  pagination: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
  },
  pageButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  pageButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "800",
  },
  pageNumber: {
    ...typography.title,
    color: colors.commandRed,
    minWidth: 34,
    textAlign: "center",
  },
  startButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.commandRed,
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  startButtonLabel: {
    ...typography.body,
    color: colors.white,
    fontWeight: "900",
  },
  startCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
