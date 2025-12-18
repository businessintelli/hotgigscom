import { describe, it, expect } from 'vitest';
import { getPaginationLimitOffset, buildPaginatedResponse, validatePaginationParams } from './paginationHelpers';

describe('Pagination Helpers', () => {
  describe('getPaginationLimitOffset', () => {
    it('should calculate correct limit and offset for page 1', () => {
      const result = getPaginationLimitOffset({ page: 1, pageSize: 10 });
      expect(result).toEqual({
        limit: 10,
        offset: 0,
        page: 1,
        pageSize: 10,
      });
    });

    it('should calculate correct limit and offset for page 2', () => {
      const result = getPaginationLimitOffset({ page: 2, pageSize: 10 });
      expect(result).toEqual({
        limit: 10,
        offset: 10,
        page: 2,
        pageSize: 10,
      });
    });

    it('should calculate correct limit and offset for page 3', () => {
      const result = getPaginationLimitOffset({ page: 3, pageSize: 10 });
      expect(result).toEqual({
        limit: 10,
        offset: 20,
        page: 3,
        pageSize: 10,
      });
    });

    it('should use default values when not provided', () => {
      const result = getPaginationLimitOffset({});
      expect(result).toEqual({
        limit: 20,
        offset: 0,
        page: 1,
        pageSize: 20,
      });
    });

    it('should handle custom page sizes', () => {
      const result = getPaginationLimitOffset({ page: 3, pageSize: 25 });
      expect(result).toEqual({
        limit: 25,
        offset: 50,
        page: 3,
        pageSize: 25,
      });
    });

    it('should handle large page numbers', () => {
      const result = getPaginationLimitOffset({ page: 100, pageSize: 50 });
      expect(result).toEqual({
        limit: 50,
        offset: 4950,
        page: 100,
        pageSize: 50,
      });
    });
  });

  describe('buildPaginatedResponse', () => {
    it('should build correct response for first page', () => {
      const data = [1, 2, 3, 4, 5];
      const result = buildPaginatedResponse(data, 50, { page: 1, pageSize: 10 });
      
      expect(result.data).toEqual(data);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        totalItems: 50,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should build correct response for middle page', () => {
      const data = [11, 12, 13, 14, 15];
      const result = buildPaginatedResponse(data, 50, { page: 3, pageSize: 10 });
      
      expect(result.data).toEqual(data);
      expect(result.pagination).toEqual({
        page: 3,
        pageSize: 10,
        totalItems: 50,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should build correct response for last page', () => {
      const data = [41, 42, 43, 44, 45];
      const result = buildPaginatedResponse(data, 45, { page: 5, pageSize: 10 });
      
      expect(result.data).toEqual(data);
      expect(result.pagination).toEqual({
        page: 5,
        pageSize: 10,
        totalItems: 45,
        totalPages: 5,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('should handle single page of results', () => {
      const data = [1, 2, 3];
      const result = buildPaginatedResponse(data, 3, { page: 1, pageSize: 10 });
      
      expect(result.data).toEqual(data);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        totalItems: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should handle empty results', () => {
      const data: number[] = [];
      const result = buildPaginatedResponse(data, 0, { page: 1, pageSize: 10 });
      
      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should calculate total pages correctly with partial last page', () => {
      const data = [1, 2];
      const result = buildPaginatedResponse(data, 22, { page: 3, pageSize: 10 });
      
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it('should handle different page sizes', () => {
      const data = [1, 2, 3, 4, 5];
      const result = buildPaginatedResponse(data, 100, { page: 1, pageSize: 5 });
      
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 5,
        totalItems: 100,
        totalPages: 20,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });
  });

  describe('validatePaginationParams', () => {
    it('should validate and return correct params', () => {
      const result = validatePaginationParams({ page: 2, pageSize: 10 });
      expect(result).toEqual({ page: 2, pageSize: 10 });
    });

    it('should enforce minimum page of 1', () => {
      const result = validatePaginationParams({ page: 0, pageSize: 10 });
      expect(result.page).toBe(1);
    });

    it('should enforce minimum page for negative values', () => {
      const result = validatePaginationParams({ page: -5, pageSize: 10 });
      expect(result.page).toBe(1);
    });

    it('should enforce maximum pageSize of 100', () => {
      const result = validatePaginationParams({ page: 1, pageSize: 200 });
      expect(result.pageSize).toBe(100);
    });

    it('should enforce minimum pageSize of 1', () => {
      const result = validatePaginationParams({ page: 1, pageSize: 0 });
      expect(result.pageSize).toBe(1);
    });

    it('should use defaults when params are undefined', () => {
      const result = validatePaginationParams({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should handle edge case values', () => {
      const result = validatePaginationParams({ page: 1000, pageSize: 50 });
      expect(result).toEqual({ page: 1000, pageSize: 50 });
    });
  });

  describe('Pagination Math', () => {
    it('should correctly calculate offset for various scenarios', () => {
      // Page 1, size 10: offset 0
      expect(getPaginationLimitOffset({ page: 1, pageSize: 10 }).offset).toBe(0);
      
      // Page 2, size 10: offset 10
      expect(getPaginationLimitOffset({ page: 2, pageSize: 10 }).offset).toBe(10);
      
      // Page 5, size 20: offset 80
      expect(getPaginationLimitOffset({ page: 5, pageSize: 20 }).offset).toBe(80);
      
      // Page 10, size 100: offset 900
      expect(getPaginationLimitOffset({ page: 10, pageSize: 100 }).offset).toBe(900);
    });

    it('should correctly calculate total pages for various scenarios', () => {
      // 100 items, 10 per page = 10 pages
      expect(buildPaginatedResponse([], 100, { page: 1, pageSize: 10 }).pagination.totalPages).toBe(10);
      
      // 95 items, 10 per page = 10 pages
      expect(buildPaginatedResponse([], 95, { page: 1, pageSize: 10 }).pagination.totalPages).toBe(10);
      
      // 91 items, 10 per page = 10 pages
      expect(buildPaginatedResponse([], 91, { page: 1, pageSize: 10 }).pagination.totalPages).toBe(10);
      
      // 90 items, 10 per page = 9 pages
      expect(buildPaginatedResponse([], 90, { page: 1, pageSize: 10 }).pagination.totalPages).toBe(9);
      
      // 1 item, 10 per page = 1 page
      expect(buildPaginatedResponse([], 1, { page: 1, pageSize: 10 }).pagination.totalPages).toBe(1);
      
      // 0 items, 10 per page = 0 pages
      expect(buildPaginatedResponse([], 0, { page: 1, pageSize: 10 }).pagination.totalPages).toBe(0);
    });

    it('should correctly determine hasNextPage', () => {
      // Page 1 of 5 - has next
      expect(buildPaginatedResponse([], 50, { page: 1, pageSize: 10 }).pagination.hasNextPage).toBe(true);
      
      // Page 4 of 5 - has next
      expect(buildPaginatedResponse([], 50, { page: 4, pageSize: 10 }).pagination.hasNextPage).toBe(true);
      
      // Page 5 of 5 - no next
      expect(buildPaginatedResponse([], 50, { page: 5, pageSize: 10 }).pagination.hasNextPage).toBe(false);
      
      // Page 1 of 1 - no next
      expect(buildPaginatedResponse([], 5, { page: 1, pageSize: 10 }).pagination.hasNextPage).toBe(false);
    });

    it('should correctly determine hasPreviousPage', () => {
      // Page 1 - no previous
      expect(buildPaginatedResponse([], 50, { page: 1, pageSize: 10 }).pagination.hasPreviousPage).toBe(false);
      
      // Page 2 - has previous
      expect(buildPaginatedResponse([], 50, { page: 2, pageSize: 10 }).pagination.hasPreviousPage).toBe(true);
      
      // Page 5 - has previous
      expect(buildPaginatedResponse([], 50, { page: 5, pageSize: 10 }).pagination.hasPreviousPage).toBe(true);
    });
  });
});
