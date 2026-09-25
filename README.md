# Pokédex — React + TypeScript + Three.js

Academic-grade rewrite of the original vanilla `index.html` / `css/style.css` /
`js/server.js` Pokédex into a Vite + React + TypeScript app, with a Three.js
WebGL background and two switchable custom themes (no UI component library
is used anywhere in the project).

## Companion / Companheiro

The web and Expo apps include a Pokémon companion module with nicknames, berries,
care actions, friendship levels, a shared pantry, and local persistence.
See [the companion guide](docs/companion.md) for gameplay, architecture, and validation.

## Stack

- **Vite** + **React 18** + **TypeScript** (strict mode)
- **Tailwind CSS**, configured with CSS-variable-backed color tokens so the
  same utility classes (`bg-surface`, `text-accent`, …) repaint instantly
  when the theme changes — see `tailwind.config.js` and `src/index.css`.
- **Three.js** for the animated Pokéball background (`src/components/background/ThreeBackground.tsx`).
- **lucide-react** for icons.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks (tsc -b) then builds to dist/
npm run preview  # serve the production build locally
```

## Project structure

```
src/
├── assets/                  # pokedex.png (moved from the old images/ folder)
├── components/
│   ├── background/ThreeBackground.tsx   # WebGL Pokéball scene
│   ├── common/ThemeToggle.tsx           # Gengar/Mewtwo switch
│   ├── common/SkeletonCard.tsx          # loading shimmer
│   └── pokemon/                         # grid, card, search, pagination,
│                                         # empty state, detail view, sprite
├── hooks/
│   ├── useDebounce.ts        # generic 300ms debounce
│   ├── usePokeApi.ts         # PokeAPI data layer (list + id/name lookup)
│   └── useTheme.ts           # theme state, persistence, palettes
├── types/pokemon.ts          # domain + raw PokeAPI response types
├── utils/sprites.ts          # animated → showdown → artwork → static fallback
├── utils/typeColors.ts       # Pokémon type badge colors
├── App.tsx
├── main.tsx
└── index.css
```

## Where each required hook is used

- **`useState`** — `App.tsx` (`searchQuery`, `currentPage`, `itemsPerPage`),
  `usePokeApi.ts` (`pokemonList`, `selectedPokemon`, `isLoading`,
  `errorMessage`), `useTheme.ts` (`theme`).
- **`useEffect`** — `App.tsx` fetches the paginated list on page change and
  runs the debounced id/name lookup (both abort in-flight requests on
  cleanup via `AbortController`); `ThreeBackground.tsx` sets up/tears down
  the Three.js scene and the `resize`/`mousemove` listeners; `useTheme.ts`
  syncs `data-theme` + `localStorage`; `useDebounce.ts` implements the
  300 ms debounce timer; `PokemonSprite.tsx` resets the sprite fallback
  index when the Pokémon changes.
- **`useMemo`** — `App.tsx` computes `totalPages` and the in-memory sorted
  list; `useTheme.ts` memoizes the active palette object;
  `Pagination.tsx` computes the visible page-number window;
  `PokemonSprite.tsx` memoizes the ordered sprite candidate list.
- **`useRef`** — `App.tsx` / `SearchBar.tsx` hold the search `<input>` DOM
  node for the `/` keyboard shortcut and quick-search button;
  `ThreeBackground.tsx` holds the Three.js scene, camera, renderer, group,
  lights, floating-ball list and `requestAnimationFrame` id so the render
  loop never triggers React re-renders; `PokemonSprite.tsx` tracks the
  current fallback attempt index.

## Sprite fallback pipeline

`src/utils/sprites.ts` replaces the original hardcoded `searchPokemon > 649`
check with an ordered candidate list, and `PokemonSprite.tsx` walks it at
render time via the `<img onError>` handler:

1. Animated Gen V (Black/White) sprite
2. Showdown animated sprite
3. Official artwork (static, high-res)
4. Base `front_default` (static)
5. Inline SVG placeholder (never fails)

## Themes

Two palettes, defined once in `useTheme.ts` and mirrored as CSS variables in
`src/index.css` (`[data-theme="gengar"]` / `[data-theme="mewtwo"]`):
persisted to `localStorage`, toggled via `ThemeToggle.tsx`, and read by the
Three.js background to retint its lights/fog without rebuilding the scene.
