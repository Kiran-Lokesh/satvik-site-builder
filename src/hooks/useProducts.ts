/**
 * useProducts Hook
 * 
 * Fetches and manages product data from the configured data source (local JSON or Sanity).
 * Provides a unified interface for product data regardless of the source.
 */

import { useState, useEffect, useCallback } from 'react';
import { unifiedDataService } from '@/lib/unifiedDataService';
import { UnifiedProduct } from '@/lib/unifiedDataTypes';
import { getCurrentDataSource } from '@/lib/config';

interface UseProductsOptions {
  brandId?: string;
  categoryId?: string;
  featured?: boolean;
  inStock?: boolean;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

interface UseProductsReturn {
  products: UnifiedProduct[];
  loading: boolean;
  error: string | null;
  dataSource: 'local' | 'sanity';
  totalCount: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useProducts = (options: UseProductsOptions = {}): UseProductsReturn => {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'local' | 'sanity'>('local');
  const [totalCount, setTotalCount] = useState(0);

  const {
    brandId,
    categoryId,
    featured,
    inStock,
    searchQuery,
    limit,
    offset = 0
  } = options;

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentSource = getCurrentDataSource();
      setDataSource(currentSource);
      
      // Get all products from unified data service
      const allProducts = await unifiedDataService.getProducts();
      
      // Apply filters
      let filteredProducts = allProducts;
      
      if (brandId) {
        filteredProducts = filteredProducts.filter(product => product.brand.id === brandId);
      }
      
      if (categoryId) {
        filteredProducts = filteredProducts.filter(product => product.category.id === categoryId);
      }
      
      if (featured !== undefined) {
        filteredProducts = filteredProducts.filter(product => product.featured === featured);
      }
      
      if (inStock !== undefined) {
        filteredProducts = filteredProducts.filter(product => product.inStock === inStock);
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      setTotalCount(filteredProducts.length);
      
      // Apply pagination
      if (limit) {
        filteredProducts = filteredProducts.slice(offset, offset + limit);
      }
      
      setProducts(filteredProducts);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('❌ useProducts error:', err);
    } finally {
      setLoading(false);
    }
  }, [brandId, categoryId, featured, inStock, searchQuery, limit, offset]);

  const refetch = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const hasMore = limit ? (offset + products.length) < totalCount : false;

  return {
    products,
    loading,
    error,
    dataSource,
    totalCount,
    hasMore,
    refetch,
    clearError
  };
};
