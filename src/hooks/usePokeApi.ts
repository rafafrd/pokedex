import { useCallback, useState } from "react";
import type {
  PokeApiListResponse,
  PokeApiPokemonResponse,
  PokemonDetail,
} from "../types/pokemon";
import { extractSprites } from "../utils/sprites";

const API_BASE = "https://pokeapi.co/api/v2/pokemon";

function mapToDetail(raw: PokeApiPokemonResponse): PokemonDetail {
  return {
    id: raw.id,
    name: raw.name,
    sprites: extractSprites(raw),
    types: raw.types
      .sort((a, b) => a.slot - b.slot)
      .map((t) => t.type.name),
    height: raw.height,
    weight: raw.weight,
    baseExperience: raw.base_experience,
    stats: raw.stats.map((s) => ({ name: s.stat.name, base: s.base_stat })),
    abilities: raw.abilities.map((a) => a.ability.name),
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * Centralizo fetch + loading/erro aqui p/ App.tsx cuidar da navegação.
 * Lista e busca direta aceitam AbortSignal: se o usuário trocar de página ou
 * continuar digitando, a resposta velha não deve sobrescrever a nova.
 */
export function usePokeApi() {
  const [pokemonList, setPokemonList] = useState<PokemonDetail[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchList = useCallback(
    async (page: number, itemsPerPage: number, signal?: AbortSignal) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const offset = (page - 1) * itemsPerPage;
        const listRes = await fetch(
          `${API_BASE}?limit=${itemsPerPage}&offset=${offset}`,
          { signal },
        );
        if (!listRes.ok) throw new Error("list-error");
        const listData: PokeApiListResponse = await listRes.json();

        // A lista vem com nome/URL; buscamos cada ficha em paralelo p/ ter tipo e sprite.
        const details = await Promise.all(
          listData.results.map(async (entry) => {
            const res = await fetch(entry.url, { signal });
            if (!res.ok) throw new Error("detail-error");
            return mapToDetail(await res.json());
          }),
        );

        setTotalCount(listData.count);
        setPokemonList(details);
      } catch (error) {
        if (isAbortError(error)) return;
        setPokemonList([]);
        setErrorMessage(
          "Não foi possível carregar a lista de Pokémons. Verifique sua conexão e tente novamente.",
        );
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [],
  );

  const fetchByQuery = useCallback(
    async (query: string, signal?: AbortSignal) => {
      // Nome ou nº usam o mesmo endpoint: /pokemon/pikachu ou /pokemon/25.
      const normalized = query.trim().toLowerCase();
      if (!normalized) return;

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch(`${API_BASE}/${normalized}`, { signal });
        if (res.status === 404) {
          setSelectedPokemon(null);
          setErrorMessage("Pokémon não encontrado na Pokédex.");
          return;
        }
        if (!res.ok) throw new Error("fetch-error");

        const raw: PokeApiPokemonResponse = await res.json();
        setSelectedPokemon(mapToDetail(raw));
      } catch (error) {
        if (isAbortError(error)) return;
        setSelectedPokemon(null);
        setErrorMessage(
          "Não foi possível buscar esse Pokémon agora. Tente novamente.",
        );
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedPokemon(null);
    setErrorMessage(null);
  }, []);

  return {
    pokemonList,
    totalCount,
    selectedPokemon,
    isLoading,
    errorMessage,
    fetchList,
    fetchByQuery,
    clearSelection,
    setErrorMessage,
  };
}
