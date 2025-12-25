"use client"

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 my-12 not-prose">
      {getPageNumbers().map((page, index) => (
        <span key={index}>
          {typeof page === "number" ? (
            <button
              type="button"
              onClick={() => onPageChange(page)}
              className={`px-2 py-1 text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer font-title ${
                currentPage === page
                  ? "text-black dark:text-white underline decoration-2 underline-offset-4"
                  : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
              }`}
              style={{ 
                fontWeight: currentPage === page ? 700 : 400,
                transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              {page}
            </button>
          ) : (
            <span className="text-gray-400 dark:text-gray-600 text-lg font-title">
              …
            </span>
          )}
        </span>
      ))}
    </div>
  );
}