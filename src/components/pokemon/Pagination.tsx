import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { PopButton } from "../spell-ui/PopButton";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MAX_VISIBLE_PAGES = 5;

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Janela de até 5 números; ex.: na pág. 8 mostramos 6, 7, 8, 9, 10.
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
      <PopButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Página anterior"
      >
        <ChevronLeft size={18} />
      </PopButton>

      {pageNumbers[0] > 1 && <span className="px-1 text-text-secondary">…</span>}

      {pageNumbers.map((page) => (
        <PopButton
          key={page}
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
          variant={page === currentPage ? "accent" : "surface"}
        >
          {page}
        </PopButton>
      ))}

      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <span className="px-1 text-text-secondary">…</span>
      )}

      <PopButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Próxima página"
      >
        <ChevronRight size={18} />
      </PopButton>
    </nav>
  );
}
