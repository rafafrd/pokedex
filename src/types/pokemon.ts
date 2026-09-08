/**
 * Shared domain types for the Pokédex.
 *
 * These stay intentionally decoupled from the raw PokeAPI response shape
 * (see `PokeApiResponse` below for that) so the rest of the app only ever
 * talks to a small, predictable contract.
 */

export type ThemeName = "gengar" | "mewtwo";

export interface ThemePalette {
  name: ThemeName;
  label: string;
  /** Three animated background stops used by the CSS gradient + Three.js fog. */
  gradient: [string, string, string];
  surface: string;
  border: string;
  accent: string;
  accentHover: string;
  highlight: string;
  textPrimary: string;
  textSecondary: string;
}

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
  types: string[];
}

export interface PokemonDetail extends PokemonSummary {
  height: number;
  weight: number;
  baseExperience: number;
  stats: PokemonStat[];
  abilities: string[];
}

/** Minimal typing for the subset of the raw PokeAPI payload we actually read. */
export interface PokeApiListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: { name: string; url: string }[];
}

export interface PokeApiPokemonResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: { slot: number; type: { name: string; url: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string } }[];
  sprites: {
    front_default: string | null;
    versions?: {
      "generation-v"?: {
        "black-white"?: {
          animated?: { front_default: string | null };
        };
      };
    };
    other?: {
      showdown?: { front_default: string | null };
      "official-artwork"?: { front_default: string | null };
    };
  };
}
