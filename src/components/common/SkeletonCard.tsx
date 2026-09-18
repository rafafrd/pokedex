const SHIMMER =
  "bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.06)_100%)] bg-[length:400px_100%] animate-shimmer";

/**
 * Shimmering placeholder shown in the grid while a page of Pokémon is
 * still loading. The shimmer sweep is defined in `index.css` /
 * `tailwind.config.js` as the `shimmer` keyframe over a gradient background.
 * Padding, sprite size and min-height mirror PokemonCard so swapping the
 * skeleton for real cards doesn't shift the grid.
 */
export function SkeletonCard() {
  return (
    <div
      className="flex h-full min-h-[16rem] flex-col items-center gap-3 rounded-2xl border border-border/40 bg-surface/50 p-5 backdrop-blur-md"
      aria-hidden="true"
    >
      <div className={`h-3 w-10 rounded ${SHIMMER}`} />
      <div className={`h-28 w-28 flex-shrink-0 rounded-full ${SHIMMER}`} />
      <div className={`h-4 w-24 rounded ${SHIMMER}`} />
      <div className="mt-auto flex gap-2 pt-1">
        <div className={`h-5 w-14 rounded-full ${SHIMMER}`} />
        <div className={`h-5 w-14 rounded-full ${SHIMMER}`} />
      </div>
    </div>
  );
}
