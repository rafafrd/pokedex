import { colors } from "./colors";

type TypeVisual = {
  background: string;
  foreground: string;
};

const fallbackType: TypeVisual = {
  background: colors.deepBlue,
  foreground: colors.white,
};

/** Official Pokémon type colors, with a readable foreground for each chip. */
export const pokemonTypeVisuals = {
  normal: { background: "#A8A77A", foreground: "#1F2933" },
  fire: { background: "#EE8130", foreground: colors.white },
  water: { background: "#6390F0", foreground: colors.white },
  electric: { background: "#F7D02C", foreground: "#1F2933" },
  grass: { background: "#7AC74C", foreground: "#1F2933" },
  ice: { background: "#96D9D6", foreground: "#1F2933" },
  fighting: { background: "#C22E28", foreground: colors.white },
  poison: { background: "#A33EA1", foreground: colors.white },
  ground: { background: "#E2BF65", foreground: "#1F2933" },
  flying: { background: "#A98FF3", foreground: colors.white },
  psychic: { background: "#F95587", foreground: colors.white },
  bug: { background: "#A6B91A", foreground: "#1F2933" },
  rock: { background: "#B6A136", foreground: colors.white },
  ghost: { background: "#735797", foreground: colors.white },
  dragon: { background: "#6F35FC", foreground: colors.white },
  dark: { background: "#705746", foreground: colors.white },
  steel: { background: "#B7B7CE", foreground: "#1F2933" },
  fairy: { background: "#D685AD", foreground: colors.white },
} as const satisfies Record<string, TypeVisual>;

export type PokemonTypeName = keyof typeof pokemonTypeVisuals;

/** Normalizes API values such as `fire`, `Fire`, or `ice-type`. */
export function normalizePokemonType(type: string | null | undefined): string {
  const normalized = (type ?? "").trim().toLowerCase().replace(/[_\s]+/g, "-");
  return normalized.endsWith("-type") ? normalized.slice(0, -5) : normalized;
}

/** Turns an API type name into a readable label for visual text and a11y. */
export function formatPokemonType(type: string | null | undefined): string {
  const normalized = normalizePokemonType(type);

  if (!normalized) {
    return "Unknown";
  }

  return normalized
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getPokemonTypeVisual(type: string | null | undefined): TypeVisual {
  const normalized = normalizePokemonType(type);
  return pokemonTypeVisuals[normalized as PokemonTypeName] ?? fallbackType;
}

export function getPokemonTypeColor(type: string | null | undefined): string {
  return getPokemonTypeVisual(type).background;
}

export function getPokemonTypeTextColor(type: string | null | undefined): string {
  return getPokemonTypeVisual(type).foreground;
}

// Short aliases are convenient for screen-level formatters and preserve a
// small, discoverable API for consumers that only need the chip color.
export const getTypeColor = getPokemonTypeColor;
export const getTypeTextColor = getPokemonTypeTextColor;
export const formatTypeName = formatPokemonType;
