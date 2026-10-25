'use client';

/**
 * Accessible pagination control.
 * @param {{
 *   currentPage: number,
 *   totalPages: number,
 *   onPageChange: (page: number) => void
 * }} props
 */
export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const pages = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let p = startPage; p <= endPage; p++) {
    pages.push(p);
  }

  return (
    <nav
      className="flex items-center justify-center gap-1.5 py-6"
      aria-label="Pagination navigation"
    >
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-sm font-medium min-h-[44px] min-w-[44px] transition-colors ${
          currentPage <= 1
            ? 'text-slate-300 cursor-not-allowed'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
        aria-label="Go to previous page"
      >
        ← Prev
      </button>

      {/* First Page button if truncated */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px]"
            aria-label="Go to page 1"
          >
            1
          </button>
          {startPage > 2 && <span className="px-1 text-slate-400 select-none">…</span>}
        </>
      )}

      {/* Visible page number buttons */}
      {pages.map((p) => {
        const isCurrent = p === currentPage;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-sm font-semibold min-h-[44px] min-w-[44px] transition-colors ${
              isCurrent
                ? 'bg-halo-primary text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            aria-current={isCurrent ? 'page' : undefined}
            aria-label={`Page ${p}`}
          >
            {p}
          </button>
        );
      })}

      {/* Last Page button if truncated */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-1 text-slate-400 select-none">…</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px]"
            aria-label={`Go to page ${totalPages}`}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-sm font-medium min-h-[44px] min-w-[44px] transition-colors ${
          currentPage >= totalPages
            ? 'text-slate-300 cursor-not-allowed'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
        aria-label="Go to next page"
      >
        Next →
      </button>
    </nav>
  );
}
