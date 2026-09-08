import type { PokeApiPokemonResponse, PokemonSpriteSet } from "../types/pokemon";

/**
 * Static placeholder used only when every sprite source is missing/broken.
 * A tiny inline SVG keeps the app fully self-contained (no extra network hop).
 */
export const SPRITE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='44' fill='none' stroke='%23888' stroke-width='4' stroke-dasharray='6 6'/%3E%3Ctext x='48' y='56' font-size='34' text-anchor='middle' fill='%23888' font-family='sans-serif'%3E%3F%3C/text%3E%3C/svg%3E";

/**
 * Builds the full sprite fallback set for a Pokémon.
 *
 * The PokeAPI stops shipping animated Gen V sprites somewhere past the
 * original ~649 entries, and even within that range a given form can be
 * missing one source or another. Rather than hardcoding an id cutoff (the
 * original `searchPokemon > 649` check), we resolve every known source and
 * let the UI walk the list, falling back gracefully:
 *
 *   1. Animated Gen V (Black/White) sprite - most charming, oldest range only.
 *   2. Showdown animated sprite - broader animated coverage.
 *   3. Official artwork - high-res static, present for virtually every entry.
 *   4. Base front_default - last static resort.
 */
export function extractSprites(data: PokeApiPokemonResponse): PokemonSpriteSet {
  return {
    animated:
      data.sprites.versions?.["generation-v"]?.["black-white"]?.animated
        ?.front_default ?? null,
    showdown: data.sprites.other?.showdown?.front_default ?? null,
    artwork: data.sprites.other?.["official-artwork"]?.front_default ?? null,
    front: data.sprites.front_default ?? null,
  };
}

/** Ordered, de-duplicated candidate list an <img> can cascade through onError. */
export function spriteCandidates(sprites: PokemonSpriteSet): string[] {
  const ordered = [sprites.animated, sprites.showdown, sprites.artwork, sprites.front];
  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const src of ordered) {
    if (src && !seen.has(src)) {
      seen.add(src);
      candidates.push(src);
    }
  }

  candidates.push(SPRITE_PLACEHOLDER);
  return candidates;
}
