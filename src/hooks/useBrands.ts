/**
 * useBrands Hook
 * 
 * Fetches and manages brand data from the configured data source (local JSON or Sanity).
 * Provides a unified interface for brand data regardless of the source.
 */

import { useState, useEffect, useCallback } from 'react';
import { unifiedDataService } from '@/lib/unifiedDataService';
import { UnifiedBrand } from '@/lib/unifiedDataTypes';
import { getCurrentDataSource } from '@/lib/config';

interface UseBrandsOptions {
  activeOnly?: boolean;
  sortBy?: 'name' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}

interface UseBrandsReturn {
  brands: UnifiedBrand[];
  loading: boolean;
  error: string | null;
  dataSource: 'local' | 'sanity' | 'backend';
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useBrands = (options: UseBrandsOptions = {}): UseBrandsReturn => {
  const [brands, setBrands] = useState<UnifiedBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'local' | 'sanity' | 'backend'>('local');

  const {
    activeOnly = true,
    sortBy = 'name',
    sortOrder = 'asc'
  } = options;

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentSource = getCurrentDataSource();
      setDataSource(currentSource);
      
      // Get all brands from unified data service
      let allBrands = await unifiedDataService.getBrands();
      
      // Apply filters
      if (activeOnly) {
        allBrands = allBrands.filter(brand => brand.isActive);
      }
      
      // Apply sorting
      allBrands.sort((a, b) => {
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
      
      setBrands(allBrands);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch brands';
      setError(errorMessage);
      console.error('❌ useBrands error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOnly, sortBy, sortOrder]);

  const refetch = useCallback(async () => {
    await fetchBrands();
  }, [fetchBrands]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return {
    brands,
    loading,
    error,
    dataSource,
    refetch,
    clearError
  };
};
