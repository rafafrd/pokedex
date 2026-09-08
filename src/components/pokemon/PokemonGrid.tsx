import type { PokemonSummary } from "../../types/pokemon";
import { SkeletonCard } from "../common/SkeletonCard";
import { PokemonCard } from "./PokemonCard";

interface PokemonGridProps {
  pokemonList: PokemonSummary[];
  isLoading: boolean;
  itemsPerPage: number;
  onSelect: (pokemon: PokemonSummary) => void;
}

export function PokemonGrid({
  pokemonList,
  isLoading,
  itemsPerPage,
  onSelect,
}: PokemonGridProps) {
  if (isLoading) {
    return (
      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: itemsPerPage }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {pokemonList.map((pokemon) => (
        <PokemonCard key={pokemon.id} pokemon={pokemon} onSelect={onSelect} />
      ))}
    </div>
  );
}
