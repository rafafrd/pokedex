/** A named resource returned by PokeAPI list and nested endpoints. */
export interface PokeApiNamedResource {
  name: string;
  url: string;
}

export interface PokeApiListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokeApiNamedResource[];
}

export interface PokeApiTypeSlot {
  slot: number;
  type: PokeApiNamedResource;
}

export interface PokeApiStat {
  base_stat: number;
  effort?: number;
  // The detail mapper only needs the name; some cached payloads omit its URL.
  stat: Pick<PokeApiNamedResource, "name"> & { url?: string };
}

export interface PokeApiAbilitySlot {
  // The detail mapper only needs the name; some cached payloads omit its URL.
  ability: Pick<PokeApiNamedResource, "name"> & { url?: string };
  is_hidden?: boolean;
  slot?: number;
}

export interface PokeApiSpriteVariant {
  front_default: string | null;
  front_shiny?: string | null;
}

export interface PokeApiSprites {
  front_default: string | null;
  front_shiny?: string | null;
  other?: {
    showdown?: PokeApiSpriteVariant;
    "official-artwork"?: PokeApiSpriteVariant;
  };
  versions?: {
    "generation-v"?: {
      "black-white"?: {
        animated?: PokeApiSpriteVariant;
      };
    };
  };
}

/** The subset of a detailed Pokémon response consumed by the mobile app. */
export interface PokeApiPokemonResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  types: PokeApiTypeSlot[];
  stats: PokeApiStat[];
  abilities: PokeApiAbilitySlot[];
  sprites: PokeApiSprites;
}
