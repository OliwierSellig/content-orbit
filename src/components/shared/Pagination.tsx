import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Komponent paginacji do nawigacji między stronami.
 * Minimalistyczny design z subtelnymi animacjami.
 */
export default function Pagination({ currentPage, totalPages, onPageChange, className = "" }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if we have 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {/* Previous button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="group flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-neutral-400 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        <span className="hidden sm:inline">Poprzednia</span>
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1 mx-4">
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <div className="flex items-center justify-center w-10 h-10">
                <MoreHorizontal className="w-4 h-4 text-neutral-500" />
              </div>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`
                  flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer
                  ${
                    currentPage === page
                      ? "bg-neutral-700 text-white border border-neutral-600"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  }
                `}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="group flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-neutral-400 cursor-pointer"
      >
        <span className="hidden sm:inline">Następna</span>
        <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
