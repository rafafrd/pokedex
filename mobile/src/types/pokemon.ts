/** Ordered sprite sources used by the UI, from richer to simpler imagery. */
export interface PokemonSpriteSet {
  animated: string | null;
  showdown: string | null;
  artwork: string | null;
  front: string | null;
}

export interface PokemonStat {
  name: string;
  base: number;
}

export interface PokemonSummary {
  id: number;
  name: string;
  sprites: PokemonSpriteSet;
  /** Type names are ordered by the slot supplied by PokeAPI. */
  types: string[];
}

export interface PokemonDetail extends PokemonSummary {
  height: number;
  weight: number;
  baseExperience: number | null;
  stats: PokemonStat[];
  abilities: string[];
}

/** A page returned by the PokeAPI list endpoint after domain mapping. */
export interface PokemonListPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonSummary[];
}

export type PokemonListResponse = PokemonListPage;

// Kept here as well as in `pokeapi.ts` for consumers that use one type entrypoint.
export type {
  PokeApiAbilitySlot,
  PokeApiListResponse,
  PokeApiNamedResource,
  PokeApiPokemonResponse,
  PokeApiSpriteVariant,
  PokeApiSprites,
  PokeApiStat,
  PokeApiTypeSlot,
} from "./pokeapi";
