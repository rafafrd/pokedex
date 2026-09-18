/**
 * Ordered sprite sources exposed by the API mapper.
 *
 * `animated` is the animated Generation V (Black/White) sprite and
 * `showdown` is the animated Showdown sprite when PokeAPI provides one.
 * Consumers should use `getBestPokemonSpriteUrl` from the API module when
 * they need one renderable URL instead of reimplementing this order.
 */
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
  PokeApiBlackWhiteSprites,
  PokeApiShowdownSpriteVariant,
  PokeApiSpriteFrameFields,
  PokeApiSpriteOther,
  PokeApiSpriteVariant,
  PokeApiSprites,
  PokeApiSpriteVersions,
  PokeApiStat,
  PokeApiTypeSlot,
} from "./pokeapi";
