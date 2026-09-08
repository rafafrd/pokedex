import { useEffect, useMemo, useRef } from "react";
import type { PokemonSpriteSet } from "../../types/pokemon";
import { spriteCandidates } from "../../utils/sprites";

interface PokemonSpriteProps {
  sprites: PokemonSpriteSet;
  alt: string;
  className?: string;
}

/**
 * `<img>` that walks the sprite fallback pipeline at runtime: if the
 * "best" candidate URL 404s or fails to decode, `onError` advances to the
 * next one, ending on a static inline placeholder that never fails.
 */
export function PokemonSprite({ sprites, alt, className }: PokemonSpriteProps) {
  const candidates = useMemo(() => spriteCandidates(sprites), [sprites]);
  const attemptRef = useRef(0);

  // A parent can swap `sprites` (e.g. selecting a different Pokémon) without
  // unmounting this component, so the fallback index must reset alongside it
  // rather than only on mount.
  useEffect(() => {
    attemptRef.current = 0;
  }, [candidates]);

  return (
    <img
      key={candidates[0]}
      src={candidates[0]}
      alt={alt}
      loading="lazy"
      className={className}
      onError={(event) => {
        attemptRef.current += 1;
        const next = candidates[attemptRef.current];
        if (next) {
          event.currentTarget.src = next;
        }
      }}
    />
  );
}
