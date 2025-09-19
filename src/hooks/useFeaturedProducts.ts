/**
 * useFeaturedProducts Hook
 * 
 * Fetches and manages featured product data from the configured data source (local JSON or Sanity).
 * Provides a unified interface for featured products regardless of the source.
 */

import { useState, useEffect, useCallback } from 'react';
import { unifiedDataService } from '@/lib/unifiedDataService';
import { UnifiedProduct } from '@/lib/unifiedDataTypes';
import { getCurrentDataSource } from '@/lib/config';

interface UseFeaturedProductsOptions {
  limit?: number;
  brandId?: string;
  categoryId?: string;
  inStock?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

interface UseFeaturedProductsReturn {
  products: UnifiedProduct[];
  loading: boolean;
  error: string | null;
  dataSource: 'local' | 'sanity';
  totalCount: number;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useFeaturedProducts = (options: UseFeaturedProductsOptions = {}): UseFeaturedProductsReturn => {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'local' | 'sanity'>('local');
  const [totalCount, setTotalCount] = useState(0);

  const {
    limit,
    brandId,
    categoryId,
    inStock,
    sortBy = 'name',
    sortOrder = 'asc'
  } = options;

  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentSource = getCurrentDataSource();
      setDataSource(currentSource);
      
      // Get all products from unified data service
      let allProducts = await unifiedDataService.getProducts();
      
      // Filter for featured products only
      let featuredProducts = allProducts.filter(product => product.featured);
      
      // Apply additional filters
      if (brandId) {
        featuredProducts = featuredProducts.filter(product => product.brand.id === brandId);
      }
      
      if (categoryId) {
        featuredProducts = featuredProducts.filter(product => product.category.id === categoryId);
      }
      
      if (inStock !== undefined) {
        featuredProducts = featuredProducts.filter(product => product.inStock === inStock);
      }
      
      setTotalCount(featuredProducts.length);
      
      // Apply sorting
      featuredProducts.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;
        
        if (sortBy === 'name') {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else if (sortBy === 'createdAt') {
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
        } else if (sortBy === 'updatedAt') {
          aValue = new Date(a.updatedAt || 0).getTime();
          bValue = new Date(b.updatedAt || 0).getTime();
        } else {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
      
      // Apply limit
      if (limit) {
        featuredProducts = featuredProducts.slice(0, limit);
      }
      
      setProducts(featuredProducts);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch featured products';
      setError(errorMessage);
      console.error('❌ useFeaturedProducts error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, brandId, categoryId, inStock, sortBy, sortOrder]);

  const refetch = useCallback(async () => {
    await fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  return {
    products,
    loading,
    error,
    dataSource,
    totalCount,
    refetch,
    clearError
  };
};
