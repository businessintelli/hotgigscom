/**
 * Pagination Helper Types and Utilities
 * 
 * Provides reusable pagination infrastructure for all list queries
 */

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Calculate limit and offset from page and pageSize
 */
export function getPaginationLimitOffset(params: PaginationParams) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  
  const limit = pageSize;
  const offset = (page - 1) * pageSize;
  
  return { limit, offset, page, pageSize };
}

/**
 * Build paginated response with metadata
 */
export function buildPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: PaginationParams): PaginationParams {
  const page = Math.max(1, params.page || 1);
  // If pageSize is explicitly 0 or negative, set to 1. If undefined, use default 20.
  let pageSize = params.pageSize !== undefined ? params.pageSize : 20;
  pageSize = Math.min(100, Math.max(1, pageSize));
  
  return { page, pageSize };
}
