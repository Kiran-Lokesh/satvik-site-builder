/**
 * useCategories Hook
 * 
 * Fetches and manages category data from the configured data source (local JSON or Sanity).
 * Provides a unified interface for category data regardless of the source.
 */

import { useState, useEffect, useCallback } from 'react';
import { unifiedDataService } from '@/lib/unifiedDataService';
import { UnifiedCategory } from '@/lib/unifiedDataTypes';
import { getCurrentDataSource } from '@/lib/config';

interface UseCategoriesOptions {
  brandId?: string;
  activeOnly?: boolean;
  sortBy?: 'name' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
  withProductCount?: boolean;
}

interface UseCategoriesReturn {
  categories: UnifiedCategory[];
  loading: boolean;
  error: string | null;
  dataSource: 'local' | 'sanity';
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useCategories = (options: UseCategoriesOptions = {}): UseCategoriesReturn => {
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'local' | 'sanity'>('local');

  const {
    brandId,
    activeOnly = true,
    sortBy = 'name',
    sortOrder = 'asc',
    withProductCount = false
  } = options;

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentSource = getCurrentDataSource();
      setDataSource(currentSource);
      
      // Get all categories from unified data service
      let allCategories = await unifiedDataService.getCategories();
      
      // Apply filters
      if (activeOnly) {
        allCategories = allCategories.filter(category => category.isActive);
      }
      
      if (brandId) {
        // Filter categories that have products for the specified brand
        const products = await unifiedDataService.getProducts();
        const brandProductCategories = products
          .filter(product => product.brand.id === brandId)
          .map(product => product.category.id);
        
        allCategories = allCategories.filter(category => 
          brandProductCategories.includes(category.id)
        );
      }
      
      // Apply sorting
      allCategories.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;
        
        if (sortBy === 'name') {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else {
          aValue = a.sortOrder ?? 0;
          bValue = b.sortOrder ?? 0;
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
      
      setCategories(allCategories);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('❌ useCategories error:', err);
    } finally {
      setLoading(false);
    }
  }, [brandId, activeOnly, sortBy, sortOrder, withProductCount]);

  const refetch = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    dataSource,
    refetch,
    clearError
  };
};
