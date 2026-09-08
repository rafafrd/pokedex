/**
 * Shimmering placeholder shown in the grid while a page of Pokémon is
 * still loading. The shimmer sweep is defined in `index.css` /
 * `tailwind.config.js` as the `shimmer` keyframe over a gradient background.
 */
export function SkeletonCard() {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-surface/30 p-4 backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="h-24 w-24 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.06)_100%)] bg-[length:400px_100%] animate-shimmer" />
      <div className="h-3 w-16 rounded bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.06)_100%)] bg-[length:400px_100%] animate-shimmer" />
      <div className="h-4 w-24 rounded bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.06)_100%)] bg-[length:400px_100%] animate-shimmer" />
      <div className="flex gap-2">
        <div className="h-5 w-14 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.06)_100%)] bg-[length:400px_100%] animate-shimmer" />
        <div className="h-5 w-14 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.06)_100%)] bg-[length:400px_100%] animate-shimmer" />
      </div>
    </div>
  );
}
