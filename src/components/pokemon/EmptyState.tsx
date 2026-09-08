import { Ghost, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  message: string;
  onReset: () => void;
}

/**
 * Dedicated 404 / "no results" view — replaces silently doing nothing
 * (or leaving stale data on screen) when a search misses.
 */
export function EmptyState({ message, onReset }: EmptyStateProps) {
  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border/40 bg-surface/30 px-6 py-14 text-center backdrop-blur-sm animate-floatSlow"
    >
      <Ghost size={56} className="text-accent" strokeWidth={1.5} />
      <div className="space-y-1">
        <p className="text-lg font-bold text-text-primary">
          Pokémon não encontrado na Pokédex
        </p>
        <p className="text-sm text-text-secondary">{message}</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        <RotateCcw size={16} />
        Limpar busca
      </button>
    </div>
  );
}
