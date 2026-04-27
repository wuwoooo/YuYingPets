import { useEffect, useMemo, useState } from 'react';

const DEFAULT_PAGE_SIZE = 10;

export function buildPaginationItems(totalPages: number, currentPage: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'dots-right', totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'dots-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, 'dots-left', currentPage - 1, currentPage, currentPage + 1, 'dots-right', totalPages] as const;
}

export function usePagination<T>(items: T[], resetKey: string, pageSize = DEFAULT_PAGE_SIZE) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / currentPageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  useEffect(() => {
    setCurrentPageSize(pageSize);
  }, [pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentPageSize]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * currentPageSize;
    return items.slice(start, start + currentPageSize);
  }, [currentPage, currentPageSize, items]);

  return {
    currentPage,
    pageSize: currentPageSize,
    totalItems: items.length,
    totalPages,
    pagedItems,
    setCurrentPage,
    setPageSize: setCurrentPageSize,
  };
}
