/**
 * useUnifiedData Hook
 * 
 * A comprehensive hook that provides access to all data (products, brands, categories)
 * from the configured data source (local JSON or Sanity). This is the main hook for
 * components that need access to multiple data types.
 */

import { useState, useEffect, useCallback } from 'react';
import { unifiedDataService } from '@/lib/unifiedDataService';
import { UnifiedData, UnifiedProduct, UnifiedBrand, UnifiedCategory } from '@/lib/unifiedDataTypes';
import { getCurrentDataSource } from '@/lib/config';

interface UseUnifiedDataOptions {
  includeMetadata?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseUnifiedDataReturn {
  // Data
  data: UnifiedData | null;
  products: UnifiedProduct[];
  brands: UnifiedBrand[];
  categories: UnifiedCategory[];
  
  // State
  loading: boolean;
  error: string | null;
  dataSource: 'local' | 'sanity' | 'backend';
  
  // Metadata
  metadata: {
    totalProducts: number;
    totalBrands: number;
    totalCategories: number;
    lastUpdated: string;
    dataSource: 'local' | 'sanity' | 'backend';
  } | null;
  
  // Actions
  refetch: () => Promise<void>;
  clearError: () => void;
  clearCache: () => void;
  
  // Utility functions
  getProductById: (id: string) => UnifiedProduct | undefined;
  getBrandById: (id: string) => UnifiedBrand | undefined;
  getCategoryById: (id: string) => UnifiedCategory | undefined;
  getProductsByBrand: (brandId: string) => UnifiedProduct[];
  getProductsByCategory: (categoryId: string) => UnifiedProduct[];
  getFeaturedProducts: () => UnifiedProduct[];
  getInStockProducts: () => UnifiedProduct[];
}

export const useUnifiedData = (options: UseUnifiedDataOptions = {}): UseUnifiedDataReturn => {
  const [data, setData] = useState<UnifiedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'local' | 'sanity' | 'backend'>('local');

  const {
    includeMetadata = true,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentSource = getCurrentDataSource();
      setDataSource(currentSource);
      
      // Get unified data from the service
      const unifiedData = await unifiedDataService.getUnifiedData();
      setData(unifiedData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('❌ useUnifiedData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCache = useCallback(() => {
    unifiedDataService.clearCache();
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Utility functions
  const getProductById = useCallback((id: string): UnifiedProduct | undefined => {
    return data?.products.find(product => product.id === id);
  }, [data]);

  const getBrandById = useCallback((id: string): UnifiedBrand | undefined => {
    return data?.brands.find(brand => brand.id === id);
  }, [data]);

  const getCategoryById = useCallback((id: string): UnifiedCategory | undefined => {
    return data?.categories.find(category => category.id === id);
  }, [data]);

  const getProductsByBrand = useCallback((brandId: string): UnifiedProduct[] => {
    return data?.products.filter(product => product.brand.id === brandId) || [];
  }, [data]);

  const getProductsByCategory = useCallback((categoryId: string): UnifiedProduct[] => {
    return data?.products.filter(product => product.category.id === categoryId) || [];
  }, [data]);

  const getFeaturedProducts = useCallback((): UnifiedProduct[] => {
    return data?.products.filter(product => product.featured) || [];
  }, [data]);

  const getInStockProducts = useCallback((): UnifiedProduct[] => {
    return data?.products.filter(product => product.inStock) || [];
  }, [data]);

  return {
    // Data
    data,
    products: data?.products || [],
    brands: data?.brands || [],
    categories: data?.categories || [],
    
    // State
    loading,
    error,
    dataSource,
    
    // Metadata
    metadata: includeMetadata && data ? {
      totalProducts: data.metadata.totalProducts,
      totalBrands: data.metadata.totalBrands,
      totalCategories: data.metadata.totalCategories,
      lastUpdated: data.metadata.lastUpdated,
      dataSource: data.metadata.dataSource
    } : null,
    
    // Actions
    refetch,
    clearError,
    clearCache,
    
    // Utility functions
    getProductById,
    getBrandById,
    getCategoryById,
    getProductsByBrand,
    getProductsByCategory,
    getFeaturedProducts,
    getInStockProducts
  };
};
