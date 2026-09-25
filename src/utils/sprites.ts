import type { PokeApiPokemonResponse, PokemonSpriteSet } from "../types/pokemon";

/** SVG local: último recurso quando todas as URLs de sprite falham. */
export const SPRITE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='44' fill='none' stroke='%23888' stroke-width='4' stroke-dasharray='6 6'/%3E%3Ctext x='48' y='56' font-size='34' text-anchor='middle' fill='%23888' font-family='sans-serif'%3E%3F%3C/text%3E%3C/svg%3E";

/**
 * Junto todas as fontes sem assumir q um ID sempre tem animação.
 * A ordem é Gen V animado -> Showdown -> arte oficial -> sprite base.
 * Ex.: se a animação de um Pokémon novo não existir, a tela tenta a próxima URL.
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

/** Remove URLs repetidas e deixa o SVG local por último p/ o onError nunca acabar vazio. */
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
