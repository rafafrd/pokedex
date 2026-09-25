import { Search, X } from "lucide-react";
import { useEffect, type RefObject } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement>;
}

/** Busca por nome/nº. O ref foca o input com "/" sem mexer no estado React. */
export function SearchBar({ value, onChange, inputRef }: SearchBarProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping) {
        // Não roubo a tecla se o usuário já estiver digitando em outro campo.
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputRef]);

  return (
    <div className="relative w-full max-w-md">
      <Search
        size={18}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por nome ou número (ex: pikachu, 25)"
        aria-label="Buscar Pokémon por nome ou número"
        className="w-full rounded-full border border-border/50 bg-surface/40 py-2.5 pl-10 pr-16 text-sm text-text-primary placeholder:text-text-secondary/70 backdrop-blur-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/40"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-accent"
        >
          <X size={16} />
        </button>
      ) : (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
          /
        </kbd>
      )}
    </div>
  );
}
