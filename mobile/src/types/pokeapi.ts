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

/**
 * URL fields shared by the sprite objects returned by PokeAPI.
 *
 * PokeAPI uses the same shape for the top-level sprites, the `other`
 * variants, and most generation-specific variants.  Keeping the fields
 * optional here reflects the API accurately: older generations and some
 * forms simply omit fields that do not exist for them.
 */
export interface PokeApiSpriteFrameFields {
  back_default?: string | null;
  back_female?: string | null;
  back_shiny?: string | null;
  back_shiny_female?: string | null;
  back_transparent?: string | null;
  front_default?: string | null;
  front_female?: string | null;
  front_shiny?: string | null;
  front_shiny_female?: string | null;
  front_transparent?: string | null;
}

/** A concrete sprite variant, such as `other.showdown`. */
export interface PokeApiSpriteVariant extends PokeApiSpriteFrameFields {
  front_default: string | null;
}

/**
 * Showdown normally exposes its animated GIF as `front_default`.  A few
 * cached/alternate payloads expose an explicit `animated` child instead, so
 * the contract accepts both forms.
 */
export interface PokeApiShowdownSpriteVariant extends PokeApiSpriteVariant {
  animated?: PokeApiSpriteVariant;
}

/** Generation V's Black/White group contains the animated child plus static fields. */
export interface PokeApiBlackWhiteSprites extends PokeApiSpriteFrameFields {
  animated?: PokeApiSpriteVariant;
}

export interface PokeApiSpriteOther {
  dream_world?: PokeApiSpriteVariant;
  home?: PokeApiSpriteVariant;
  showdown?: PokeApiShowdownSpriteVariant;
  "official-artwork"?: PokeApiSpriteVariant;
}

export interface PokeApiSpriteVersions {
  "generation-v"?: {
    "black-white"?: PokeApiBlackWhiteSprites;
  };
}

export interface PokeApiSprites extends PokeApiSpriteFrameFields {
  /** The parser normalizes a missing top-level field to `null`. */
  front_default: string | null;
  other?: PokeApiSpriteOther;
  versions?: PokeApiSpriteVersions;
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
