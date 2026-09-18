import { motion } from "motion/react";
import { useRef } from "react";
import type { PokemonSummary } from "../../types/pokemon";
import { TiltCard } from "../spell-ui/TiltCard";
import { SkeletonCard } from "../common/SkeletonCard";
import { PokemonCard } from "./PokemonCard";

interface PokemonGridProps {
  pokemonList: PokemonSummary[];
  isLoading: boolean;
  itemsPerPage: number;
  /** Current page number — used only to key/direct the entrance animation. */
  page: number;
  onSelect: (pokemon: PokemonSummary) => void;
}

const SLIDE_DISTANCE = 20;

// gap-5/6 (instead of 4) leaves room for the TiltCard's hover scale so a
// lifted card never crowds its neighbours.
const GRID_CLASSES =
  "grid w-full grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4";

export function PokemonGrid({
  pokemonList,
  isLoading,
  itemsPerPage,
  page,
  onSelect,
}: PokemonGridProps) {
  // Tracks the previous page so the grid slides toward the direction the
  // user is paging in (forward → enters from the right, back → from the
  // left), instead of always sliding the same way.
  const prevPageRef = useRef(page);
  const direction = page < prevPageRef.current ? -1 : 1;
  prevPageRef.current = page;

  return (
    <motion.div
      key={page}
      initial={{ opacity: 0, x: direction * SLIDE_DISTANCE }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={GRID_CLASSES}
    >
      {isLoading
        ? Array.from({ length: itemsPerPage }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <SkeletonCard key={index} />
          ))
        : pokemonList.map((pokemon) => (
            <TiltCard key={pokemon.id} className="h-full rounded-2xl">
              <PokemonCard pokemon={pokemon} onSelect={onSelect} />
            </TiltCard>
          ))}
    </motion.div>
  );
}
