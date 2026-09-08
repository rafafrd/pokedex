import type { PokemonSummary } from "../../types/pokemon";
import { getTypeColor } from "../../utils/typeColors";
import { PokemonSprite } from "./PokemonSprite";

interface PokemonCardProps {
  pokemon: PokemonSummary;
  onSelect: (pokemon: PokemonSummary) => void;
}

export function PokemonCard({ pokemon, onSelect }: PokemonCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pokemon)}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-border/40 bg-surface/30 p-4 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/70 hover:bg-surface/50 hover:shadow-lg hover:shadow-accent/20 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="text-xs font-semibold tracking-wide text-text-secondary">
        #{String(pokemon.id).padStart(3, "0")}
      </span>
      <PokemonSprite
        sprites={pokemon.sprites}
        alt={pokemon.name}
        className="h-24 w-24 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
      />
      <h3 className="text-base font-bold capitalize text-text-primary">
        {pokemon.name}
      </h3>
      <div className="flex flex-wrap justify-center gap-1.5">
        {pokemon.types.map((type) => (
          <span
            key={type}
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize text-white shadow-sm"
            style={{ backgroundColor: getTypeColor(type) }}
          >
            {type}
          </span>
        ))}
      </div>
    </button>
  );
}
