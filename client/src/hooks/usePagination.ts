import { useState, useMemo, useEffect } from 'react';

interface UsePaginationProps<T> {
  data: T[] | undefined;
  pageSize?: number;
  dependencies?: any[];
}

interface UsePaginationReturn<T> {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  paginatedData: T[];
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
}

export function usePagination<T>({
  data,
  pageSize = 10,
  dependencies = [],
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = data?.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedData = useMemo(() => {
    return data?.slice(startIndex, endIndex) || [];
  }, [data, startIndex, endIndex]);

  // Reset to page 1 when dependencies change
  useEffect(() => {
    setCurrentPage(1);
  }, dependencies);

  return {
    currentPage,
    setCurrentPage,
    paginatedData,
    totalPages,
    totalItems,
    pageSize,
    startIndex,
    endIndex,
  };
}
