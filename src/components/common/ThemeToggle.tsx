import { Brain, Ghost } from "lucide-react";
import type { ThemeName } from "../../types/pokemon";

interface ThemeToggleProps {
  theme: ThemeName;
  onToggle: () => void;
}

/**
 * Pill switch between the two curriculum themes. Built from scratch (no UI
 * library) so the thumb, icons and colors can bind directly to CSS
 * variables and flip instantly with the rest of the page.
 */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isGengar = theme === "gengar";

  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={isGengar}
      aria-label={`Tema atual: ${isGengar ? "Gengar" : "Mewtwo"}. Clique para alternar.`}
      className="relative h-9 w-16 flex-shrink-0 rounded-full border border-border/60 bg-surface/40 backdrop-blur-sm transition-colors duration-300"
    >
      {/* Track icons sit behind the thumb (declared first = painted first). */}
      <span className="absolute inset-0 flex items-center justify-between px-2 text-text-secondary">
        <Ghost size={14} className={isGengar ? "opacity-0" : "opacity-70"} />
        <Brain size={14} className={isGengar ? "opacity-70" : "opacity-0"} />
      </span>

      {/*
        Anchored at left-1/top-1 (4px inset) so the translate distance is a
        fixed, predictable value: track (64px) - insets (4px x2) - thumb
        (28px) = 28px = translate-x-7. A percentage-based transform here
        would be relative to the thumb's own width, not the track, which is
        what previously pushed the thumb outside the pill on "mewtwo".
      */}
      <span
        className={`absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shadow-md transition-transform duration-300 ease-out ${
          isGengar ? "translate-x-0" : "translate-x-7"
        }`}
      >
        {isGengar ? <Ghost size={16} /> : <Brain size={16} />}
      </span>
    </button>
  );
}
