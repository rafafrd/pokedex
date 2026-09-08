import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MAX_VISIBLE_PAGES = 5;

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pageNumbers = useMemo(() => {
    if (totalPages <= MAX_VISIBLE_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(MAX_VISIBLE_PAGES / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);
    start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-center gap-2"
      aria-label="Paginação de Pokémons"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Página anterior"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-surface/40 text-text-primary transition-colors hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-surface/40 disabled:hover:text-text-primary"
      >
        <ChevronLeft size={18} />
      </button>

      {pageNumbers[0] > 1 && <span className="px-1 text-text-secondary">…</span>}

      {pageNumbers.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
            page === currentPage
              ? "bg-accent text-white shadow-md shadow-accent/30"
              : "border border-border/50 bg-surface/40 text-text-primary hover:bg-surface/60"
          }`}
        >
          {page}
        </button>
      ))}

      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <span className="px-1 text-text-secondary">…</span>
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Próxima página"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-surface/40 text-text-primary transition-colors hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-surface/40 disabled:hover:text-text-primary"
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
