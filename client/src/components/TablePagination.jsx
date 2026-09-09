import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TablePagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, safeCurrentPage * pageSize);

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
    if (onPageChange) {
      onPageChange(1);
    }
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [1];
    const leftBound = Math.max(2, safeCurrentPage - 1);
    const rightBound = Math.min(totalPages - 1, safeCurrentPage + 1);

    if (leftBound > 2) {
      pages.push('...');
    }

    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    if (rightBound < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="border-t border-zinc-200/80 bg-zinc-50/60 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      {/* Left: Row selector & Item range counter */}
      <div className="flex flex-wrap items-center gap-3.5">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-medium">Rows per page:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-800 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#234c6a] cursor-pointer shadow-2xs transition-colors"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <span className="text-zinc-500">
          Showing <strong className="text-zinc-800 font-semibold">{startIndex}</strong>–
          <strong className="text-zinc-800 font-semibold">{endIndex}</strong> of{' '}
          <strong className="text-zinc-800 font-semibold">{totalItems}</strong> entries
        </span>
      </div>

      {/* Right: Pagination Controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange && onPageChange(safeCurrentPage - 1)}
          className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-35 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-zinc-400 font-bold select-none">
                  …
                </span>
              );
            }

            const isActive = p === safeCurrentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange && onPageChange(p)}
                className={`min-w-[30px] h-7 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#234c6a] text-white shadow-xs'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 shadow-2xs'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Go to page ${p}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={safeCurrentPage >= totalPages || totalItems === 0}
          onClick={() => onPageChange && onPageChange(safeCurrentPage + 1)}
          className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-35 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
