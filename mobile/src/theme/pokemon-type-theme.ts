/**
 * Contextual colours for a Pokémon detail view.
 *
 * The small type chips use the compact palette in `type-colors.ts`. Detail
 * screens need a little more room to breathe, so this palette carries both a
 * readable foreground and a pair of deep/surface colours for hero panels and
 * animated backgrounds.
 */

export const POKEMON_TYPE_NAMES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
  "stellar",
] as const;

export type PokemonTypeName = (typeof POKEMON_TYPE_NAMES)[number];
/** Alias for callers that use the shorter domain name. */
export type PokemonType = PokemonTypeName;
export type PokemonTypeKey = PokemonTypeName | "unknown";

export interface PokemonTypeTheme {
  /** Canonical PokeAPI type, or `unknown` when the input is not recognised. */
  readonly type: PokemonTypeKey;
  /** Human-readable label for headings and accessibility copy. */
  readonly label: string;
  /** Dominant type colour used by hero accents and the 3D scene. */
  readonly primary: string;
  /** Secondary colour for rings, buttons, and small highlights. */
  readonly secondary: string;
  /** Soft accent used on chips and selected controls. */
  readonly accent: string;
  /** A bright point-light/highlight colour that remains readable on dark views. */
  readonly highlight: string;
  /** Main detail-view canvas colour. */
  readonly background: string;
  /** Dark stop for gradients and the edge of the hero. */
  readonly backgroundDeep: string;
  /** Low-contrast surfaces that sit above `background`. */
  readonly surface: string;
  readonly surfaceElevated: string;
  /** Aliases shared with the app-level theme contract. */
  readonly surfaceMuted: string;
  /** Border/glow colours used around cards and the 3D treatment. */
  readonly border: string;
  readonly glow: string;
  /** Foreground colours with enough contrast for their intended surfaces. */
  readonly foreground: string;
  readonly mutedForeground: string;
  readonly onPrimary: string;
  readonly text: string;
  readonly mutedText: string;
  readonly accentSoft: string;
  readonly accentContrast: string;
  readonly heroStart: string;
  readonly heroEnd: string;
  readonly backgroundDark: string;
  /** Convenient aliases for consumers that use the app-theme naming. */
  readonly textPrimary: string;
  readonly textSecondary: string;
  /** Three stops make this directly usable by linear/radial hero gradients. */
  readonly gradient: readonly [string, string, string];
}

interface ThemeSeed {
  primary: string;
  secondary: string;
  accent?: string;
  highlight?: string;
  background: string;
  backgroundDeep: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  glow?: string;
  foreground: string;
  mutedForeground: string;
  onPrimary: string;
}

function createTheme(
  type: PokemonTypeKey,
  label: string,
  seed: ThemeSeed,
): PokemonTypeTheme {
  const accent = seed.accent ?? seed.primary;
  const highlight = seed.highlight ?? seed.secondary;
  const glow = seed.glow ?? accent;

  return {
    type,
    label,
    primary: seed.primary,
    secondary: seed.secondary,
    accent,
    highlight,
    background: seed.background,
    backgroundDeep: seed.backgroundDeep,
    surface: seed.surface,
    surfaceElevated: seed.surfaceElevated,
    surfaceMuted: seed.surfaceElevated,
    border: seed.border,
    glow,
    foreground: seed.foreground,
    mutedForeground: seed.mutedForeground,
    onPrimary: seed.onPrimary,
    text: seed.foreground,
    mutedText: seed.mutedForeground,
    accentSoft: seed.secondary,
    accentContrast: seed.onPrimary,
    heroStart: seed.backgroundDeep,
    heroEnd: seed.background,
    backgroundDark: seed.backgroundDeep,
    textPrimary: seed.foreground,
    textSecondary: seed.mutedForeground,
    gradient: [seed.backgroundDeep, seed.background, seed.surfaceElevated],
  };
}

const themes: Record<PokemonTypeKey, PokemonTypeTheme> = {
  normal: createTheme("normal", "Normal", {
    primary: "#8A8B9A",
    secondary: "#D9D9E2",
    highlight: "#FFFFFF",
    background: "#F1F2F5",
    backgroundDeep: "#4B4D5B",
    surface: "#FFFFFF",
    surfaceElevated: "#E7E8EE",
    border: "#C8CAD5",
    foreground: "#252733",
    mutedForeground: "#5B5E70",
    onPrimary: "#FFFFFF",
  }),
  // Keep Fire recognisably red in the detail hero, rather than the orange
  // used by compact official type chips.
  fire: createTheme("fire", "Fire", {
    primary: "#E53935",
    secondary: "#FF8A4C",
    highlight: "#FFD166",
    background: "#FFF0EC",
    backgroundDeep: "#6F1420",
    surface: "#FFF9F6",
    surfaceElevated: "#FFE0D6",
    border: "#F2A18A",
    glow: "#FF5A36",
    foreground: "#3D1115",
    mutedForeground: "#7D4244",
    onPrimary: "#FFFFFF",
  }),
  // Water is deliberately a cool, saturated blue so it reads immediately
  // against the warm red/white Pokéball shells.
  water: createTheme("water", "Water", {
    primary: "#2F80ED",
    secondary: "#56CCF2",
    highlight: "#C7F0FF",
    background: "#EAF7FF",
    backgroundDeep: "#0D3B66",
    surface: "#F8FDFF",
    surfaceElevated: "#D5F0FF",
    border: "#89C9EA",
    glow: "#4EB7FF",
    foreground: "#102A43",
    mutedForeground: "#3E6685",
    onPrimary: "#FFFFFF",
  }),
  electric: createTheme("electric", "Electric", {
    primary: "#E7B700",
    secondary: "#FFE27A",
    highlight: "#FFF7BE",
    background: "#FFFBE8",
    backgroundDeep: "#735B00",
    surface: "#FFFFF7",
    surfaceElevated: "#FFF1AC",
    border: "#E8CF5B",
    glow: "#FFD21F",
    foreground: "#322900",
    mutedForeground: "#6A5A1B",
    onPrimary: "#2B2300",
  }),
  grass: createTheme("grass", "Grass", {
    primary: "#3FAE55",
    secondary: "#8BD450",
    highlight: "#D9FFB8",
    background: "#F0FAEE",
    backgroundDeep: "#1D5B34",
    surface: "#FAFFFA",
    surfaceElevated: "#D9F2D3",
    border: "#9BCC98",
    glow: "#65C85A",
    foreground: "#163622",
    mutedForeground: "#47705A",
    onPrimary: "#FFFFFF",
  }),
  ice: createTheme("ice", "Ice", {
    primary: "#63C9D6",
    secondary: "#B3F1F0",
    highlight: "#FFFFFF",
    background: "#EFFCFF",
    backgroundDeep: "#226078",
    surface: "#FFFFFF",
    surfaceElevated: "#D9F5F7",
    border: "#9ED9DF",
    glow: "#8AE4EE",
    foreground: "#153743",
    mutedForeground: "#4D7780",
    onPrimary: "#10343D",
  }),
  fighting: createTheme("fighting", "Fighting", {
    primary: "#C53632",
    secondary: "#F26B5B",
    highlight: "#FFD0A8",
    background: "#FFF0ED",
    backgroundDeep: "#601B25",
    surface: "#FFF9F7",
    surfaceElevated: "#FFDCD5",
    border: "#E69A8D",
    glow: "#E84D43",
    foreground: "#3F151A",
    mutedForeground: "#7A4747",
    onPrimary: "#FFFFFF",
  }),
  poison: createTheme("poison", "Poison", {
    primary: "#9B4DAB",
    secondary: "#D580C8",
    highlight: "#F7C8F2",
    background: "#F9F0FA",
    backgroundDeep: "#451D56",
    surface: "#FFF9FF",
    surfaceElevated: "#EEDCF1",
    border: "#C89CCE",
    glow: "#BC64CA",
    foreground: "#321B3B",
    mutedForeground: "#684B70",
    onPrimary: "#FFFFFF",
  }),
  ground: createTheme("ground", "Ground", {
    primary: "#B57A3D",
    secondary: "#E2BF65",
    highlight: "#FFE6A1",
    background: "#FCF6EA",
    backgroundDeep: "#63401E",
    surface: "#FFFCF4",
    surfaceElevated: "#F0DFC0",
    border: "#D3B37A",
    glow: "#D99A4D",
    foreground: "#342514",
    mutedForeground: "#6B5133",
    onPrimary: "#FFFFFF",
  }),
  flying: createTheme("flying", "Flying", {
    primary: "#7489D7",
    secondary: "#A9C2F0",
    highlight: "#E6F3FF",
    background: "#F1F7FF",
    backgroundDeep: "#334A80",
    surface: "#FFFFFF",
    surfaceElevated: "#DDEAFF",
    border: "#A9C2E8",
    glow: "#9ABEFF",
    foreground: "#202E52",
    mutedForeground: "#52678E",
    onPrimary: "#FFFFFF",
  }),
  psychic: createTheme("psychic", "Psychic", {
    primary: "#D94F83",
    secondary: "#F29ABB",
    highlight: "#FFD9E7",
    background: "#FFF2F8",
    backgroundDeep: "#6B2451",
    surface: "#FFF9FC",
    surfaceElevated: "#F7D7E7",
    border: "#E3A1C1",
    glow: "#F073A6",
    foreground: "#451B35",
    mutedForeground: "#7A4C67",
    onPrimary: "#FFFFFF",
  }),
  bug: createTheme("bug", "Bug", {
    primary: "#759C20",
    secondary: "#B4D83A",
    highlight: "#E9FFB1",
    background: "#F5FAE9",
    backgroundDeep: "#385719",
    surface: "#FCFFF6",
    surfaceElevated: "#E1F0B8",
    border: "#B7CE78",
    glow: "#A8CF2D",
    foreground: "#263711",
    mutedForeground: "#526C2E",
    onPrimary: "#FFFFFF",
  }),
  rock: createTheme("rock", "Rock", {
    primary: "#9C7B38",
    secondary: "#C5A95E",
    highlight: "#F3DF9B",
    background: "#FAF5E9",
    backgroundDeep: "#54401C",
    surface: "#FFFCF3",
    surfaceElevated: "#E8D8AE",
    border: "#CBB77D",
    glow: "#C6A153",
    foreground: "#302713",
    mutedForeground: "#685635",
    onPrimary: "#FFFFFF",
  }),
  ghost: createTheme("ghost", "Ghost", {
    primary: "#6E5AA6",
    secondary: "#A98DDB",
    highlight: "#E4D7FF",
    background: "#F5F1FF",
    backgroundDeep: "#30234E",
    surface: "#FCFAFF",
    surfaceElevated: "#E3DAF4",
    border: "#B9A7DB",
    glow: "#9D7BDB",
    foreground: "#241A3A",
    mutedForeground: "#5C4D78",
    onPrimary: "#FFFFFF",
  }),
  dragon: createTheme("dragon", "Dragon", {
    primary: "#5F35C9",
    secondary: "#9369F2",
    highlight: "#DCCBFF",
    background: "#F2EEFF",
    backgroundDeep: "#27134F",
    surface: "#FBFAFF",
    surfaceElevated: "#DDD1F6",
    border: "#A58BD7",
    glow: "#855AE8",
    foreground: "#241641",
    mutedForeground: "#5E4A86",
    onPrimary: "#FFFFFF",
  }),
  // Dark uses a deep purple rather than the brown chip colour: this keeps a
  // dark hero atmospheric while preserving a clear white foreground.
  dark: createTheme("dark", "Dark", {
    primary: "#2A1748",
    secondary: "#67418F",
    highlight: "#C9A6FF",
    background: "#160D26",
    backgroundDeep: "#08040F",
    surface: "#211137",
    surfaceElevated: "#321951",
    border: "#5A3C7E",
    glow: "#8A5AC2",
    foreground: "#FFF9FF",
    mutedForeground: "#D7C4E8",
    onPrimary: "#FFFFFF",
  }),
  steel: createTheme("steel", "Steel", {
    primary: "#718096",
    secondary: "#B7C4D7",
    highlight: "#F5FBFF",
    background: "#F1F5F8",
    backgroundDeep: "#334155",
    surface: "#FCFEFF",
    surfaceElevated: "#DCE5EE",
    border: "#AAB8C7",
    glow: "#A7C5DC",
    foreground: "#1D2B39",
    mutedForeground: "#506273",
    onPrimary: "#FFFFFF",
  }),
  // Fairy stays pink and nearly white to match the soft, luminous detail
  // treatment rather than becoming another saturated purple/pink chip.
  fairy: createTheme("fairy", "Fairy", {
    primary: "#EFA6CF",
    secondary: "#FFD9EF",
    highlight: "#FFFFFF",
    background: "#FFF8FD",
    backgroundDeep: "#8A426F",
    surface: "#FFFFFF",
    surfaceElevated: "#FBE5F2",
    border: "#EBC1DA",
    glow: "#F5B9DE",
    foreground: "#3E2036",
    mutedForeground: "#7D5A73",
    onPrimary: "#3E2036",
  }),
  stellar: createTheme("stellar", "Stellar", {
    primary: "#3C8DAB",
    secondary: "#72D6D0",
    highlight: "#D8FFFF",
    background: "#EDFCFC",
    backgroundDeep: "#173D55",
    surface: "#FAFFFF",
    surfaceElevated: "#D7F3F0",
    border: "#8DC9CA",
    glow: "#55C8D2",
    foreground: "#18323C",
    mutedForeground: "#4D6F77",
    onPrimary: "#FFFFFF",
  }),
  unknown: createTheme("unknown", "Unknown", {
    primary: "#667085",
    secondary: "#98A2B3",
    highlight: "#E6EAF0",
    background: "#F3F5F8",
    backgroundDeep: "#344054",
    surface: "#FFFFFF",
    surfaceElevated: "#E7EBF0",
    border: "#C4CAD4",
    glow: "#98A2B3",
    foreground: "#1D2939",
    mutedForeground: "#667085",
    onPrimary: "#FFFFFF",
  }),
};

export const pokemonTypeThemes: Readonly<
  Record<PokemonTypeKey, PokemonTypeTheme>
> = themes;

const normalizedAliases: Readonly<Record<string, PokemonTypeKey>> = {
  normal: "normal",
  fire: "fire",
  water: "water",
  electric: "electric",
  grass: "grass",
  ice: "ice",
  fighting: "fighting",
  poison: "poison",
  ground: "ground",
  flying: "flying",
  psychic: "psychic",
  bug: "bug",
  rock: "rock",
  ghost: "ghost",
  dragon: "dragon",
  dark: "dark",
  steel: "steel",
  fairy: "fairy",
  stellar: "stellar",
  unknown: "unknown",
};

/** Normalizes values from PokeAPI and returns `unknown` for an invalid type. */
export function normalizePokemonTypeTheme(
  type: string | null | undefined,
): PokemonTypeKey {
  const normalized = (type ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-type$/, "");

  return normalizedAliases[normalized] ?? "unknown";
}

/**
 * Returns a complete, contrast-aware palette for a detail view.
 *
 * The function intentionally never throws: cached responses and third-party
 * callers can contain an empty or future type, and the neutral fallback keeps
 * the detail screen usable while still making that state visible.
 */
export function getPokemonTypeTheme(
  type: string | null | undefined,
): PokemonTypeTheme {
  return themes[normalizePokemonTypeTheme(type)];
}

export const defaultPokemonTypeTheme = themes.unknown;
