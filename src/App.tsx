import { AlertTriangle, Keyboard, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import pokedexLogo from "./assets/pokedex.png";
import { ThreeBackground } from "./components/background/ThreeBackground";
import { ThemeToggle } from "./components/common/ThemeToggle";
import { EmptyState } from "./components/pokemon/EmptyState";
import { Pagination } from "./components/pokemon/Pagination";
import { PokemonDetailView } from "./components/pokemon/PokemonDetailView";
import { PokemonGrid } from "./components/pokemon/PokemonGrid";
import { SearchBar } from "./components/pokemon/SearchBar";
import { useDebounce } from "./hooks/useDebounce";
import { usePokeApi } from "./hooks/usePokeApi";
import { useTheme } from "./hooks/useTheme";

const ITEMS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 300;

function App() {
  const { theme, toggleTheme, palette } = useTheme();

  // --- useState: primitives driving both browsing and search modes -------
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(ITEMS_PER_PAGE);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);
  const isSearchMode = debouncedQuery.trim().length > 0;

  const {
    pokemonList,
    totalCount,
    selectedPokemon,
    isLoading,
    errorMessage,
    fetchList,
    fetchByQuery,
    clearSelection,
  } = usePokeApi();

  // --- useEffect: paginated grid fetch (Mode A), aborted on fast page flips.
  useEffect(() => {
    if (isSearchMode) return;

    const controller = new AbortController();
    fetchList(currentPage, itemsPerPage, controller.signal);
    return () => controller.abort();
  }, [currentPage, itemsPerPage, isSearchMode, fetchList]);

  // --- useEffect: debounced id/name lookup (Mode B), aborted on retype.
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      clearSelection();
      return;
    }

    const controller = new AbortController();
    fetchByQuery(trimmed, controller.signal);
    return () => controller.abort();
  }, [debouncedQuery, fetchByQuery, clearSelection]);

  // --- useMemo: pagination metrics + in-memory list ordering.
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / itemsPerPage)),
    [totalCount, itemsPerPage],
  );
  const sortedPokemonList = useMemo(
    () => [...pokemonList].sort((a, b) => a.id - b.id),
    [pokemonList],
  );

  const handleReset = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const showEmptyState = isSearchMode && !isLoading && !selectedPokemon;
  const showListError = !isSearchMode && !isLoading && errorMessage;

  return (
    <div className="relative min-h-screen w-full">
      <ThreeBackground theme={palette} />

      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src={pokedexLogo}
              alt="Pokédex"
              className="h-10 w-10 object-contain drop-shadow"
            />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-text-primary sm:text-2xl">
                Pokédex
              </h1>
              <p className="text-xs text-text-secondary">
                Tema {palette.label} · React + TypeScript + Three.js
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              inputRef={searchInputRef}
            />
            <button
              type="button"
              onClick={() => searchInputRef.current?.focus()}
              aria-label="Atalho de busca rápida"
              title="Busca rápida (/)"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border/50 bg-surface/40 text-text-primary transition-colors hover:bg-accent hover:text-white"
            >
              <Keyboard size={18} />
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center gap-6">
          {selectedPokemon ? (
            <PokemonDetailView pokemon={selectedPokemon} onBack={handleReset} />
          ) : showEmptyState ? (
            <EmptyState
              message={errorMessage ?? "Tente outro nome ou número."}
              onReset={handleReset}
            />
          ) : (
            <>
              {showListError && (
                <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm text-text-primary">
                  <span className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-accent" />
                    {errorMessage}
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchList(currentPage, itemsPerPage)}
                    className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
                  >
                    <RotateCcw size={14} />
                    Tentar novamente
                  </button>
                </div>
              )}

              <PokemonGrid
                pokemonList={sortedPokemonList}
                isLoading={isLoading}
                itemsPerPage={itemsPerPage}
                onSelect={(pokemon) => setSearchQuery(pokemon.name)}
              />

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </main>

        <footer className="pb-2 text-center text-[11px] text-text-secondary">
          Dados fornecidos pela{" "}
          <a
            href="https://pokeapi.co/"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted hover:text-accent"
          >
            PokéAPI
          </a>
          .
        </footer>
      </div>
    </div>
  );
}

export default App;
