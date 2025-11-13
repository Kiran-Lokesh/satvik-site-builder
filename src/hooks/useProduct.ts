/**
 * useProduct Hook
 * 
 * Fetches and manages a single product by ID from the configured data source (local JSON or Sanity).
 * Provides a unified interface for single product data regardless of the source.
 */

import { useState, useEffect, useCallback } from 'react';
import { unifiedDataService } from '@/lib/unifiedDataService';
import { UnifiedProduct } from '@/lib/unifiedDataTypes';
import { getCurrentDataSource } from '@/lib/config';

interface UseProductOptions {
  includeRelated?: boolean;
  relatedLimit?: number;
}

interface UseProductReturn {
  product: UnifiedProduct | null;
  relatedProducts: UnifiedProduct[];
  loading: boolean;
  error: string | null;
  dataSource: 'local' | 'sanity' | 'backend';
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useProduct = (productId: string, options: UseProductOptions = {}): UseProductReturn => {
  const [product, setProduct] = useState<UnifiedProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'local' | 'sanity' | 'backend'>('local');

  const {
    includeRelated = false,
    relatedLimit = 4
  } = options;

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const currentSource = getCurrentDataSource();
      setDataSource(currentSource);
      
      // Get all products from unified data service
      const allProducts = await unifiedDataService.getProducts();
      
      // Find the specific product
      const foundProduct = allProducts.find(p => p.id === productId);
      
      if (!foundProduct) {
        setError(`Product with ID "${productId}" not found`);
        setProduct(null);
        setRelatedProducts([]);
        return;
      }
      
      setProduct(foundProduct);
      
      // Get related products if requested
      if (includeRelated) {
        const related = allProducts
          .filter(p => 
            p.id !== productId && 
            (p.brand.id === foundProduct.brand.id || p.category.id === foundProduct.category.id)
          )
          .slice(0, relatedLimit);
        
        setRelatedProducts(related);
      } else {
        setRelatedProducts([]);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product';
      setError(errorMessage);
      console.error('❌ useProduct error:', err);
      setProduct(null);
      setRelatedProducts([]);
    } finally {
      setLoading(false);
    }
  }, [productId, includeRelated, relatedLimit]);

  const refetch = useCallback(async () => {
    await fetchProduct();
  }, [fetchProduct]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    relatedProducts,
    loading,
    error,
    dataSource,
    refetch,
    clearError
  };
};
