import {
  AlertTriangle,
  BookOpen,
  Heart,
  Keyboard,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import pokedexLogo from "./assets/pokedex.png";
import { ThreeBackground } from "./components/background/ThreeBackground";
import { ThemeToggle } from "./components/common/ThemeToggle";
import { EmptyState } from "./components/pokemon/EmptyState";
import { Pagination } from "./components/pokemon/Pagination";
import { PokemonDetailView } from "./components/pokemon/PokemonDetailView";
import { PokemonGrid } from "./components/pokemon/PokemonGrid";
import { SearchBar } from "./components/pokemon/SearchBar";
import { FlowButton } from "./components/spell-ui/FlowButton";
import { useDebounce } from "./hooks/useDebounce";
import { usePokeApi } from "./hooks/usePokeApi";
import { useTheme } from "./hooks/useTheme";
import { CompanionView } from "./features/companion/CompanionView";
import type { CompanionPokemon } from "../shared/companion";
import { useTrainer } from "./features/trainer/useTrainer";
import { TrainerView } from "./features/trainer/TrainerView";

const ITEMS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 300;

function App() {
  const { theme, setTheme, toggleTheme, palette, themeError } = useTheme();
  const trainer = useTrainer();
  // Hash simples mantém os módulos navegáveis por URL, ex.: /#companion.
  const readModule = () =>
    window.location.hash === "#companion"
      ? "companion"
      : window.location.hash === "#trainer"
        ? "trainer"
        : "pokedex";
  const [module, setModule] = useState(readModule);
  const [companionCandidate, setCompanionCandidate] =
    useState<CompanionPokemon | null>(null);
  useEffect(() => {
    const syncModule = () => setModule(readModule());
    window.addEventListener("hashchange", syncModule);
    return () => window.removeEventListener("hashchange", syncModule);
  }, []);
  const navigate = (next: "pokedex" | "companion" | "trainer") => {
    window.location.hash = next;
    setModule(next);
  };

  // Lista e busca usam estados separados: página p/ catálogo, texto p/ consulta direta.
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

  // Mudou a página? Cancelo o pedido anterior p/ ele não chegar depois e trocar a lista.
  useEffect(() => {
    if (isSearchMode) return;

    const controller = new AbortController();
    fetchList(currentPage, itemsPerPage, controller.signal);
    return () => controller.abort();
  }, [currentPage, itemsPerPage, isSearchMode, fetchList]);

  // Ex.: digitou "pika" e seguiu p/ "pikachu": só a busca atual deve valer.
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

  // A API traz o total; daqui saem as páginas e a ordem estável dos cartões.
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

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
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
                Olá, {trainer.profile.name} · Tema {palette.label}
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            {module === "pokedex" && (
              <>
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
              </>
            )}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <nav
          aria-label="Módulos"
          className="flex flex-wrap gap-2 border-b border-border/30 pb-4"
        >
          <button
            type="button"
            aria-current={module === "pokedex" ? "page" : undefined}
            onClick={() => navigate("pokedex")}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors ${module === "pokedex" ? "bg-accent text-white" : "text-text-secondary hover:bg-surface/30"}`}
          >
            <BookOpen size={17} /> Pokédex
          </button>
          <button
            type="button"
            aria-current={module === "companion" ? "page" : undefined}
            onClick={() => {
              setCompanionCandidate(null);
              navigate("companion");
            }}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors ${module === "companion" ? "bg-accent text-white" : "text-text-secondary hover:bg-surface/30"}`}
          >
            <Heart size={17} /> Companheiro
          </button>
          <button
            type="button"
            aria-current={module === "trainer" ? "page" : undefined}
            onClick={() => navigate("trainer")}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors ${module === "trainer" ? "bg-accent text-white" : "text-text-secondary hover:bg-surface/30"}`}
          >
            <UserRound size={17} /> Treinador
          </button>
        </nav>

        <main className="flex flex-1 flex-col items-center gap-6">
          {module === "trainer" ? (
            <TrainerView
              trainer={trainer}
              theme={theme}
              onThemeChange={setTheme}
              themeError={themeError}
            />
          ) : module === "companion" ? (
            <CompanionView
              candidate={companionCandidate}
              onBrowse={() => {
                handleReset();
                navigate("pokedex");
              }}
            />
          ) : selectedPokemon ? (
            <PokemonDetailView
              pokemon={selectedPokemon}
              onBack={handleReset}
              onChooseCompanion={() => {
                setCompanionCandidate({
                  id: selectedPokemon.id,
                  name: selectedPokemon.name,
                });
                navigate("companion");
              }}
            />
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
                  <FlowButton
                    size="sm"
                    onClick={() => fetchList(currentPage, itemsPerPage)}
                  >
                    <RotateCcw size={14} />
                    Tentar novamente
                  </FlowButton>
                </div>
              )}

              <PokemonGrid
                pokemonList={sortedPokemonList}
                isLoading={isLoading}
                itemsPerPage={itemsPerPage}
                page={currentPage}
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
