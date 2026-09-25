import { useEffect, useMemo, useRef } from "react";
import type { PokemonSpriteSet } from "../../types/pokemon";
import { spriteCandidates } from "../../utils/sprites";

interface PokemonSpriteProps {
  sprites: PokemonSpriteSet;
  alt: string;
  className?: string;
}

/** Imagem caiu em 404? Tento a próxima URL até chegar no placeholder local. */
export function PokemonSprite({ sprites, alt, className }: PokemonSpriteProps) {
  const candidates = useMemo(() => spriteCandidates(sprites), [sprites]);
  const attemptRef = useRef(0);

  // Trocar de Pokémon não desmonta sempre o componente: zeramos o índice do fallback.
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
